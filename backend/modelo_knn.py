from functools import lru_cache
from pathlib import Path
from typing import Literal
import json
import math

import joblib
import numpy as np
import sklearn
from pydantic import BaseModel, ConfigDict, Field
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import (
    GridSearchCV,
    StratifiedKFold,
    train_test_split,
)
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ARCHIVO_MODELO = Path(__file__).with_name(
    "modelo_solar.joblib"
)

POTENCIAS = np.array([2200, 3300, 4400, 5500, 6600])

TIPOS = {
    "ahorro_red": "On-Grid",
    "hibrido": "Híbrido",
    "off_grid": "Off-Grid",
}


class DatosRecomendacion(BaseModel):
    model_config = ConfigDict(
        allow_inf_nan=False,
        extra="forbid",
    )

    consumo_kwh_mensual: float = Field(ge=30, le=1500)
    objetivo_sistema: Literal[
        "ahorro_red", "hibrido", "off_grid"
    ] = "ahorro_red"
    tipo_red: Literal[
        "monofasico", "trifasico"
    ] = "monofasico"
    comuna: str = Field(default="", max_length=100)
    hsp: float = Field(default=4.8, ge=2, le=7)
    cobertura_objetivo: float = Field(
        default=1,
        ge=0.5,
        le=1,
    )
    presupuesto_max_clp: int | None = Field(
        default=None,
        gt=0,
    )
    superficie_disponible_m2: float | None = Field(
        default=None,
        gt=0,
    )


@lru_cache(maxsize=1)
def cargar_modelo():
    if not ARCHIVO_MODELO.exists():
        raise FileNotFoundError(
            "Ejecuta python modelo_knn.py y reinicia el backend."
        )

    bundle = joblib.load(ARCHIVO_MODELO)

    if (
        not isinstance(bundle, dict)
        or bundle.get("version") != 2
        or bundle.get("sklearn_version") != sklearn.__version__
    ):
        raise RuntimeError(
            "Modelo antiguo o incompatible. "
            "Ejecuta python modelo_knn.py."
        )

    return bundle["pipeline"]


def entrenar():
    rng = np.random.default_rng(42)
    datos = []
    etiquetas = []

    for i, potencia in enumerate(POTENCIAS):
        minimo = (
            100
            if i == 0
            else POTENCIAS[i - 1] + 0.001
        )

        for _ in range(1000):
            hsp = rng.uniform(2, 7)
            cobertura = rng.uniform(0.5, 1)
            requerida = rng.uniform(minimo, potencia)

            consumo = (
                requerida
                / 1000
                * 30
                * hsp
                * 0.8
                / cobertura
            )

            if 30 <= consumo <= 1500:
                datos.append([consumo, hsp, cobertura])
                etiquetas.append(int(potencia))

    Xtr, Xte, ytr, yte = train_test_split(
        np.array(datos),
        np.array(etiquetas),
        test_size=0.2,
        stratify=etiquetas,
        random_state=42,
    )

    pipeline = Pipeline([
        ("escala", StandardScaler()),
        ("knn", KNeighborsClassifier()),
    ])

    busqueda = GridSearchCV(
        pipeline,
        {
            "knn__n_neighbors": [3, 5, 7, 11, 15],
            "knn__weights": ["uniform", "distance"],
        },
        cv=StratifiedKFold(
            5,
            shuffle=True,
            random_state=42,
        ),
        scoring="f1_macro",
        n_jobs=1,
    )

    busqueda.fit(Xtr, ytr)
    prediccion = busqueda.predict(Xte)

    joblib.dump(
        {
            "version": 2,
            "sklearn_version": sklearn.__version__,
            "pipeline": busqueda.best_estimator_,
        },
        ARCHIVO_MODELO,
    )

    reporte = {
        "origen": "simulado",
        "perfiles": len(datos),
        "parametros": busqueda.best_params_,
        "accuracy_test_sintetico": float(
            accuracy_score(yte, prediccion)
        ),
        "f1_macro_test_sintetico": float(
            f1_score(yte, prediccion, average="macro")
        ),
        "advertencia": (
            "Mide concordancia con etiquetas de una fórmula, "
            "no precisión con clientes reales."
        ),
    }

    ARCHIVO_MODELO.with_suffix(".json").write_text(
        json.dumps(reporte, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    cargar_modelo.cache_clear()

    print("Modelo guardado:", ARCHIVO_MODELO)
    print(json.dumps(reporte, ensure_ascii=False, indent=2))


def recomendar_kit(datos, productos):
    if datos.tipo_red != "monofasico":
        raise ValueError(
            "El catálogo de prueba no tiene "
            "compatibilidad trifásica validada."
        )

    if (
        datos.objetivo_sistema == "off_grid"
        and datos.cobertura_objetivo < 1
    ):
        raise ValueError(
            "Para el escenario aislado utiliza cobertura 1 "
            "y solicita revisión técnica."
        )

    modelo = cargar_modelo()

    x = np.array([[
        datos.consumo_kwh_mensual,
        datos.hsp,
        datos.cobertura_objetivo,
    ]])

    prediccion = int(modelo.predict(x)[0])

    votos = dict(zip(
        map(int, modelo.classes_),
        map(float, modelo.predict_proba(x)[0]),
    ))

    requerida = (
        datos.consumo_kwh_mensual
        * datos.cobertura_objetivo
        / (30 * datos.hsp * 0.8)
        * 1000
    )

    # Metadatos del catálogo simulado trabajado previamente.
    # Los productos, precios, IDs y stock vienen de Neon.
    conocidos = {
        (
            f"Kit solar genérico "
            f"{TIPOS[datos.objetivo_sistema]} "
            f"{watts / 1000:.1f} kWp"
        ): int(watts)
        for watts in POTENCIAS
    }

    candidatos = []

    for producto in productos:
        watts = conocidos.get(producto.nombre)

        if (
            watts is None
            or not producto.es_kit
            or producto.potencia_watts != watts
            or producto.stock <= 0
            or producto.precio <= 0
        ):
            continue

        superficie = math.ceil((watts // 550) * 2.3)

        if watts < requerida:
            continue

        if (
            datos.presupuesto_max_clp is not None
            and producto.precio > datos.presupuesto_max_clp
        ):
            continue

        if (
            datos.superficie_disponible_m2 is not None
            and superficie > datos.superficie_disponible_m2
        ):
            continue

        candidatos.append((producto, watts, superficie))

    if not candidatos:
        raise ValueError(
            "No hay un kit conocido con stock que cumpla "
            "las restricciones. Revisa los nombres y potencias "
            "del catálogo o solicita evaluación técnica."
        )

    candidatos.sort(
        key=lambda item: (
            -votos.get(item[1], 0),
            abs(item[1] - prediccion),
            item[0].precio,
            item[0].id,
        )
    )

    producto, watts, superficie = candidatos[0]
    paneles = watts // 550

    bateria = (
        0
        if datos.objetivo_sistema == "ahorro_red"
        else {
            4: 5.12,
            6: 5.12,
            8: 10.24,
            10: 10.24,
            12: 15.36,
        }[paneles]
    )

    return {
        "producto_id": producto.id,
        "nombre": producto.nombre,
        "precio_clp": producto.precio,
        "stock": producto.stock,
        "imagen_url": producto.imagen_url,
        "potencia_kwp": watts / 1000,
        "potencia_predicha_knn_watts": prediccion,
        "cantidad_paneles": paneles,
        "bateria_kwh": bateria,
        "superficie_estimada_m2": superficie,
        "energia_mensual_estimada_kwh": round(
            watts / 1000 * datos.hsp * 30 * 0.8,
            1,
        ),
        "hsp_utilizada": datos.hsp,
        "comuna": datos.comuna,
        "origen_entrenamiento": "simulado",
        "advertencias": [
            "Prototipo con datos simulados; requiere revisión técnica.",
            "HSP es un supuesto, no radiación calculada desde la comuna.",
            "No valida sombras, autonomía ni compatibilidad eléctrica.",
            "Precio y stock corresponden al catálogo actual.",
        ],
    }


if __name__ == "__main__":
    entrenar()