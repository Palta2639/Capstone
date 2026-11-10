import hashlib
import json
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import models
from core.database import get_db
from core.security import get_current_admin, get_current_user
from modelo_knn import DatosRecomendacion, recomendar_kit
from models_extra import CotizacionKNN

router = APIRouter(
    prefix="/cotizaciones",
    tags=["Cotizaciones"],
)


class GuardarCotizacion(BaseModel):
    clave: UUID
    datos: DatosRecomendacion


def ejecutar(datos, db):
    productos = (
        db.query(models.Producto)
        .filter(models.Producto.es_kit.is_(True))
        .all()
    )

    try:
        return recomendar_kit(datos, productos)
    except (RuntimeError, FileNotFoundError) as error:
        raise HTTPException(503, str(error)) from error
    except ValueError as error:
        raise HTTPException(422, str(error)) from error


def representar(cotizacion, db):
    detalle = (
        db.query(CotizacionKNN)
        .filter_by(cotizacion_id=cotizacion.id)
        .first()
    )

    return {
        "id": cotizacion.id,
        "usuario_id": cotizacion.usuario_id,
        "estado": cotizacion.estado,
        "consumo_kwh_mensual": float(
            cotizacion.consumo_kwh_mensual
        ),
        "comuna": cotizacion.comuna,
        "presupuesto_estimado": cotizacion.presupuesto_estimado,
        "fecha_solicitud": cotizacion.fecha_solicitud,
        "resultado": detalle.resultado if detalle else None,
        "entrada": detalle.entrada if detalle else None,
    }


@router.post("/knn")
def recomendar(
    datos: DatosRecomendacion,
    db: Session = Depends(get_db),
):
    return ejecutar(datos, db)


@router.post("/ia", include_in_schema=False)
def recomendar_alias(
    datos: DatosRecomendacion,
    db: Session = Depends(get_db),
):
    return ejecutar(datos, db)


@router.post("/guardar", status_code=201)
def guardar(
    payload: GuardarCotizacion,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    entrada = payload.datos.model_dump(mode="json")

    huella = hashlib.sha256(
        json.dumps(entrada, sort_keys=True).encode()
    ).hexdigest()

    db.query(models.Usuario).filter_by(
        id=user.id
    ).with_for_update().one()

    previo = (
        db.query(CotizacionKNN)
        .filter_by(clave=str(payload.clave))
        .first()
    )

    if previo:
        cotizacion = db.get(
            models.Cotizacion,
            previo.cotizacion_id,
        )

        if (
            cotizacion.usuario_id != user.id
            or previo.huella != huella
        ):
            raise HTTPException(
                409,
                "La clave ya fue utilizada con otros datos.",
            )

        return representar(cotizacion, db)

    resultado = ejecutar(payload.datos, db)

    cotizacion = models.Cotizacion(
        usuario_id=user.id,
        consumo_kwh_mensual=payload.datos.consumo_kwh_mensual,
        comuna=payload.datos.comuna,
        presupuesto_estimado=payload.datos.presupuesto_max_clp,
        estado="pendiente",
    )

    try:
        db.add(cotizacion)
        db.flush()

        db.add(CotizacionKNN(
            cotizacion_id=cotizacion.id,
            clave=str(payload.clave),
            huella=huella,
            entrada=entrada,
            resultado=resultado,
        ))

        db.commit()

    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            409,
            "Solicitud simultánea. Reintenta con la misma clave.",
        ) from error

    return representar(cotizacion, db)


@router.get("/mis-cotizaciones")
def propias(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    filas = (
        db.query(models.Cotizacion)
        .filter_by(usuario_id=user.id)
        .order_by(models.Cotizacion.id.desc())
        .all()
    )

    return [representar(c, db) for c in filas]


@router.get("/")
def todas(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    filas = (
        db.query(models.Cotizacion)
        .order_by(models.Cotizacion.id.desc())
        .all()
    )

    return [representar(c, db) for c in filas]


@router.put("/{cotizacion_id}")
def cambiar_estado(
    cotizacion_id: int,
    nuevo_estado: Literal[
        "pendiente",
        "contactado",
        "aprobada",
        "rechazada",
    ],
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    cotizacion = db.get(models.Cotizacion, cotizacion_id)

    if cotizacion is None:
        raise HTTPException(404, "Cotización no encontrada.")

    cotizacion.estado = nuevo_estado
    db.commit()

    return representar(cotizacion, db)