import unicodedata
from functools import lru_cache

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

import models
from core.database import get_db

router = APIRouter(
    prefix="/ia",
    tags=["Asistente solar"],
)


class Mensaje(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[dict] = Field(
        default_factory=list,
        max_length=30,
    )


FAQ = [
    (
        "hola ayuda que puedes hacer",
        "Puedo explicar los sistemas solares, consultar productos "
        "y ayudarte a abrir la agenda técnica.",
        "/cotizador",
        "Abrir cotizador",
    ),
    (
        "agendar reservar visita tecnica cita horario",
        "Abre la agenda, selecciona un horario e inicia sesión "
        "para confirmar. El chat por sí solo no reserva.",
        "/agenda",
        "Reservar visita",
    ),
    (
        "cancelar reprogramar cambiar cita visita",
        "Puedes cancelar o reprogramar tus citas futuras "
        "desde la agenda.",
        "/agenda",
        "Mis visitas",
    ),
    (
        "on grid conectado red ahorro factura",
        "On-Grid funciona conectado a la red. El ahorro depende "
        "del consumo y la generación. No garantiza respaldo "
        "durante cortes de electricidad.",
        "/cotizador",
        "Cotizar",
    ),
    (
        "hibrido bateria baterias respaldo cortes",
        "Un sistema híbrido combina generación solar, red "
        "y almacenamiento. La autonomía requiere revisar "
        "las cargas y la capacidad útil de las baterías.",
        "/cotizador",
        "Cotizar",
    ),
    (
        "off grid aislado sin red autonomia",
        "Un sistema aislado necesita dimensionamiento de "
        "generación, baterías y cargas. La estimación mensual "
        "del prototipo no demuestra autonomía.",
        "/agenda",
        "Solicitar revisión",
    ),
    (
        "consumo kwh boleta recomendar kit paneles dimensionar",
        "Utiliza los kWh mensuales de tu boleta. El KNN "
        "es un prototipo entrenado con perfiles simulados.",
        "/cotizador",
        "Abrir cotizador",
    ),
    (
        "pedido compra estado despacho entrega seguimiento",
        "Consulta Mis pedidos con tu sesión iniciada. "
        "Registrar el pedido no realiza un cobro.",
        "/mis-pedidos",
        "Mis pedidos",
    ),
    (
        "garantia certificacion sec plazo instalacion",
        "No tengo información verificada para confirmar "
        "garantías, certificaciones o plazos. Solicita "
        "una evaluación con la empresa.",
        "/agenda",
        "Agenda técnica",
    ),
]


def normalizar(texto):
    return "".join(
        caracter
        for caracter in unicodedata.normalize(
            "NFKD",
            texto.lower(),
        )
        if not unicodedata.combining(caracter)
    )


@lru_cache(maxsize=1)
def indice():
    vectorizador = TfidfVectorizer(
        preprocessor=normalizar,
        ngram_range=(1, 2),
        sublinear_tf=True,
    )
    matriz = vectorizador.fit_transform(
        [fila[0] for fila in FAQ]
    )

    return vectorizador, matriz


@router.post("/chat")
def chat(
    payload: Mensaje,
    db: Session = Depends(get_db),
):
    texto = normalizar(payload.message)

    consulta_catalogo = (
        any(
            palabra in texto
            for palabra in [
                "precio", "stock", "catalogo", "disponible"
            ]
        )
        and any(
            palabra in texto
            for palabra in [
                "kit", "panel", "producto", "inversor", "bateria"
            ]
        )
    )

    if consulta_catalogo:
        query = db.query(models.Producto).filter(
            models.Producto.stock > 0
        )

        if "kit" in texto:
            query = query.filter(
                models.Producto.es_kit.is_(True)
            )
        elif "panel" in texto:
            query = query.filter(
                models.Producto.nombre.ilike("%panel%")
            )
        elif "inversor" in texto:
            query = query.filter(
                models.Producto.nombre.ilike("%inversor%")
            )
        elif "bateria" in texto:
            query = query.filter(
                models.Producto.nombre.ilike("%bater%")
            )

        productos = (
            query.order_by(models.Producto.precio)
            .limit(3)
            .all()
        )

        if not productos:
            return {
                "reply": "No encontré productos con stock.",
                "actions": [{
                    "label": "Ver catálogo",
                    "url": "/catalogo",
                }],
            }

        lineas = []

        for producto in productos:
            precio = format(
                producto.precio,
                ",",
            ).replace(",", ".")

            lineas.append(
                f"{producto.nombre}: ${precio} CLP. "
                f"Stock: {producto.stock}."
            )

        return {
            "reply": "\n".join(lineas),
            "actions": [
                {
                    "label": producto.nombre[:50],
                    "url": f"/producto/{producto.id}",
                }
                for producto in productos
            ],
        }

    vectorizador, matriz = indice()

    puntajes = cosine_similarity(
        vectorizador.transform([payload.message]),
        matriz,
    )[0]

    posicion = int(puntajes.argmax())

    if puntajes[posicion] < 0.16:
        return {
            "reply": (
                "No tengo una respuesta verificada. "
                "Puedes preguntar por kits, consumo, "
                "pedidos o visitas técnicas."
            ),
            "actions": [{
                "label": "Agenda técnica",
                "url": "/agenda",
            }],
        }

    _, respuesta, url, etiqueta = FAQ[posicion]

    return {
        "reply": respuesta,
        "actions": [{
            "label": etiqueta,
            "url": url,
        }],
    }