import hashlib
import json
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import models
from core.database import get_db
from core.security import get_current_admin, get_current_user
from models_extra import (
    CostoProducto,
    CotizacionKNN,
    PedidoRegistro,
)

router = APIRouter(tags=["Pedidos y métricas"])


class Linea(BaseModel):
    model_config = ConfigDict(extra="forbid")

    producto_id: int = Field(gt=0)
    cantidad: int = Field(ge=1, le=100)


class Entrega(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    telefono: str = Field(min_length=6, max_length=30)
    direccion: str = Field(min_length=5, max_length=250)
    comuna: str = Field(min_length=2, max_length=100)


class PedidoNuevo(BaseModel):
    model_config = ConfigDict(extra="forbid")

    clave: UUID
    items: list[Linea] = Field(min_length=1, max_length=100)
    entrega: Entrega
    cotizacion_id: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def validar_items(self):
        ids = [item.producto_id for item in self.items]

        if len(ids) != len(set(ids)):
            raise ValueError(
                "Agrupa cada producto en una sola línea."
            )

        return self


class CostoEntrada(BaseModel):
    costo_unitario: int = Field(ge=0, le=2000000000)


def resumen(pedido, db):
    registro = db.get(PedidoRegistro, pedido.id)

    if registro:
        partidas = registro.partidas
    else:
        partidas = [
            {
                "producto_id": detalle.producto_id,
                "nombre": (
                    detalle.producto.nombre
                    if detalle.producto
                    else "Producto retirado"
                ),
                "cantidad": detalle.cantidad,
                "precio_unitario": detalle.precio_unitario,
            }
            for detalle in pedido.detalles
        ]

    items = []

    for partida in partidas:
        publico = {
            key: value
            for key, value in partida.items()
            if key != "costo_unitario"
        }
        publico["producto_nombre"] = partida["nombre"]
        items.append(publico)

    return {
        "id": pedido.id,
        "pedido_id_raw": pedido.id,
        "usuario_id": pedido.usuario_id,
        "estado": pedido.estado,
        "monto_total": pedido.monto_total,
        "fecha": (
            pedido.fecha_pedido.isoformat()
            if pedido.fecha_pedido
            else None
        ),
        "cliente": pedido.cliente,
        "email": pedido.email,
        "telefono": pedido.telefono,
        "cantidad_items": sum(
            item["cantidad"] for item in partidas
        ),
        "items": items,
        "entrega": registro.entrega if registro else None,
        "cotizacion_id": (
            registro.cotizacion_id if registro else None
        ),
        "pago": "No procesado por esta aplicación",
    }


@router.post("/pedidos/", status_code=201)
def crear_pedido(
    payload: PedidoNuevo,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    contenido = payload.model_dump(
        mode="json",
        exclude={"clave"},
    )
    contenido["items"] = sorted(
        contenido["items"],
        key=lambda item: item["producto_id"],
    )

    huella = hashlib.sha256(
        json.dumps(contenido, sort_keys=True).encode()
    ).hexdigest()

    db.query(models.Usuario).filter_by(
        id=user.id
    ).with_for_update().one()

    previo = (
        db.query(PedidoRegistro)
        .filter_by(clave=str(payload.clave))
        .first()
    )

    if previo:
        pedido = db.get(models.Pedido, previo.pedido_id)

        if (
            pedido.usuario_id != user.id
            or previo.huella != huella
        ):
            raise HTTPException(
                409,
                "La clave ya fue utilizada con otros datos.",
            )

        return resumen(pedido, db)

    if payload.cotizacion_id:
        cotizacion = db.get(
            models.Cotizacion,
            payload.cotizacion_id,
        )
        detalle = (
            db.query(CotizacionKNN)
            .filter_by(cotizacion_id=payload.cotizacion_id)
            .first()
        )

        if (
            not cotizacion
            or cotizacion.usuario_id != user.id
            or not detalle
        ):
            raise HTTPException(
                404,
                "Cotización propia no encontrada.",
            )

        ids = {item.producto_id for item in payload.items}

        if detalle.resultado["producto_id"] not in ids:
            raise HTTPException(
                422,
                "El pedido debe incluir el kit de la cotización.",
            )

    partidas = []

    try:
        for item in sorted(
            payload.items,
            key=lambda fila: fila.producto_id,
        ):
            producto = (
                db.query(models.Producto)
                .filter_by(id=item.producto_id)
                .with_for_update()
                .first()
            )

            if producto is None:
                raise HTTPException(
                    404,
                    "Un producto ya no existe.",
                )

            if producto.precio <= 0:
                raise HTTPException(
                    422,
                    "Producto sin precio válido.",
                )

            cambio = db.execute(
                update(models.Producto)
                .where(
                    models.Producto.id == producto.id,
                    models.Producto.stock >= item.cantidad,
                )
                .values(
                    stock=models.Producto.stock - item.cantidad
                ),
                execution_options={
                    "synchronize_session": False
                },
            )

            if cambio.rowcount != 1:
                raise HTTPException(
                    409,
                    f"Stock insuficiente para {producto.nombre}.",
                )

            costo = db.get(CostoProducto, producto.id)

            partidas.append({
                "producto_id": producto.id,
                "nombre": producto.nombre,
                "cantidad": item.cantidad,
                "precio_unitario": producto.precio,
                "costo_unitario": (
                    costo.costo_unitario if costo else None
                ),
            })

        total = sum(
            item["cantidad"] * item["precio_unitario"]
            for item in partidas
        )

        if total > 2000000000:
            raise HTTPException(
                422,
                "El pedido supera el monto admitido.",
            )

        pedido = models.Pedido(
            usuario_id=user.id,
            monto_total=total,
            estado="pendiente",
        )

        db.add(pedido)
        db.flush()

        for item in partidas:
            db.add(models.DetallePedido(
                pedido_id=pedido.id,
                producto_id=item["producto_id"],
                cantidad=item["cantidad"],
                precio_unitario=item["precio_unitario"],
            ))

        db.add(PedidoRegistro(
            pedido_id=pedido.id,
            clave=str(payload.clave),
            huella=huella,
            cotizacion_id=payload.cotizacion_id,
            subtotal=total,
            entrega=payload.entrega.model_dump(),
            partidas=partidas,
        ))

        db.commit()

    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            409,
            "Solicitud simultánea. Reintenta con la misma clave.",
        ) from error

    except Exception:
        db.rollback()
        raise

    return resumen(pedido, db)


@router.get("/pedidos/mis-pedidos")
def propios(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    filas = (
        db.query(models.Pedido)
        .filter_by(usuario_id=user.id)
        .order_by(models.Pedido.id.desc())
        .all()
    )

    return [resumen(p, db) for p in filas]


@router.get("/pedidos/")
def todos(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    filas = (
        db.query(models.Pedido)
        .order_by(models.Pedido.id.desc())
        .all()
    )

    return [resumen(p, db) for p in filas]


@router.put("/pedidos/{pedido_id}")
def cambiar_estado(
    pedido_id: int,
    nuevo_estado: Literal[
        "pendiente",
        "confirmado",
        "enviado",
        "entregado",
        "cancelado",
    ],
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    pedido = (
        db.query(models.Pedido)
        .filter_by(id=pedido_id)
        .with_for_update()
        .first()
    )

    if pedido is None:
        raise HTTPException(404, "Pedido no encontrado.")

    registro = db.get(PedidoRegistro, pedido_id)

    if registro is None:
        raise HTTPException(
            409,
            "Pedido anterior sin registro de stock. "
            "Requiere conciliación manual.",
        )

    if pedido.estado == nuevo_estado:
        return resumen(pedido, db)

    permitidos = {
        "pendiente": {"confirmado", "cancelado"},
        "confirmado": {"enviado", "cancelado"},
        "enviado": {"entregado"},
        "entregado": set(),
        "cancelado": set(),
    }

    if nuevo_estado not in permitidos.get(pedido.estado, set()):
        raise HTTPException(
            409,
            "Transición de estado no permitida.",
        )

    if nuevo_estado == "cancelado":
        for item in sorted(
            registro.partidas,
            key=lambda fila: fila["producto_id"],
        ):
            db.execute(
                update(models.Producto)
                .where(
                    models.Producto.id == item["producto_id"]
                )
                .values(
                    stock=models.Producto.stock
                    + item["cantidad"]
                )
            )

    pedido.estado = nuevo_estado
    db.commit()

    return resumen(pedido, db)


@router.put("/costos/{producto_id}")
def guardar_costo(
    producto_id: int,
    payload: CostoEntrada,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if db.get(models.Producto, producto_id) is None:
        raise HTTPException(404, "Producto no encontrado.")

    costo = db.get(CostoProducto, producto_id)

    if costo is None:
        costo = CostoProducto(producto_id=producto_id)
        db.add(costo)

    costo.costo_unitario = payload.costo_unitario
    db.commit()

    return {
        "producto_id": producto_id,
        "costo_unitario": costo.costo_unitario,
    }


@router.get("/pedidos/stats")
def estadisticas(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    pedidos = db.query(models.Pedido).all()
    entregados = [
        pedido
        for pedido in pedidos
        if pedido.estado == "entregado"
    ]

    ingresos = sum(p.monto_total for p in entregados)
    costo_conocido = 0
    faltantes = 0

    for pedido in entregados:
        registro = db.get(PedidoRegistro, pedido.id)

        if registro is None or any(
            item["costo_unitario"] is None
            for item in registro.partidas
        ):
            faltantes += 1
        else:
            costo_conocido += sum(
                item["cantidad"] * item["costo_unitario"]
                for item in registro.partidas
            )

    costos = costo_conocido if faltantes == 0 else None
    margen = ingresos - costos if costos is not None else None

    total_cotizaciones = db.query(models.Cotizacion).count()

    convertidas = (
        db.query(PedidoRegistro.cotizacion_id)
        .join(
            models.Pedido,
            models.Pedido.id == PedidoRegistro.pedido_id,
        )
        .filter(
            PedidoRegistro.cotizacion_id.is_not(None),
            models.Pedido.estado.in_([
                "confirmado",
                "enviado",
                "entregado",
            ]),
        )
        .distinct()
        .count()
    )

    productos = db.query(models.Producto).all()

    return {
        "total_ingresos": ingresos,
        "costos_registrados": costos,
        "margen_bruto": margen,
        "porcentaje_margen": (
            round(100 * margen / ingresos, 2)
            if margen is not None and ingresos
            else None
        ),
        "pedidos_sin_costo": faltantes,
        "total_pedidos": len(pedidos),
        "pedidos_entregados": len(entregados),
        "total_cotizaciones": total_cotizaciones,
        "cotizaciones_convertidas": convertidas,
        "tasa_conversion": (
            round(100 * convertidas / total_cotizaciones, 2)
            if total_cotizaciones
            else 0
        ),
        "ticket_promedio": (
            round(ingresos / len(entregados))
            if entregados
            else 0
        ),
        "valor_inventario": sum(
            producto.precio * producto.stock
            for producto in productos
        ),
        "total_unidades_stock": sum(
            producto.stock for producto in productos
        ),
        "total_productos": len(productos),
        "total_categorias": db.query(models.Categoria).count(),
        "criterio": (
            "Pedidos entregados; no confirma cobros. "
            "Margen bruto de productos, sin instalación, "
            "despacho, impuestos ni gastos operativos."
        ),
    }