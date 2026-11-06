from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from core.database import get_db
# Añadimos la importación de get_current_admin
from core.security import get_current_user, get_current_admin

router = APIRouter(tags=["Pedidos y Agenda"])

@router.get("/pedidos/mis-pedidos")
def obtener_mis_pedidos(
    usuario_actual: models.Usuario = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    pedidos = (
        db.query(models.Pedido)
        .filter(models.Pedido.usuario_id == usuario_actual.id)
        .order_by(models.Pedido.fecha_pedido.desc())
        .all()
    )
    resultado = []
    for p in pedidos:
        resultado.append({
            "id": p.id,
            "pedido_id_raw": p.id,
            "monto_total": p.monto_total,
            "estado": p.estado or "pendiente",
            "fecha": p.fecha_pedido.strftime("%Y-%m-%d") if p.fecha_pedido else "Reciente",
            "cantidad_items": len(p.detalles) if p.detalles else 0,
            "items": [
                {
                    "producto_id": d.producto_id,
                    "producto_nombre": d.producto.nombre if d.producto else "Producto Anglo Electric",
                    "cantidad": d.cantidad,
                    "precio_unitario": d.precio_unitario
                }
                for d in p.detalles
            ] if p.detalles else []
        })
    return resultado

# ¡AHORA ESTÁ PROTEGIDO CON get_current_admin!
@router.get("/pedidos/stats", response_model=schemas.EstadisticasDashboard)
def obtener_estadisticas_dashboard(
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin)
):
    pedidos = db.query(models.Pedido).all()
    cotizaciones = db.query(models.Cotizacion).all()
    productos = db.query(models.Producto).all()
    categorias = db.query(models.Categoria).all()
    
    total_ingresos = sum(p.monto_total for p in pedidos)
    total_pedidos = len(pedidos)
    total_cotizaciones = len(cotizaciones)
    
    costos_estimados = int(total_ingresos * 0.68)
    margen_neto = total_ingresos - costos_estimados
    porcentaje_margen = round((margen_neto / total_ingresos * 100), 2) if total_ingresos > 0 else 0.0
    ticket_promedio = int(total_ingresos / total_pedidos) if total_pedidos > 0 else 0
    tasa_conversion = round((total_pedidos / total_cotizaciones * 100), 2) if total_cotizaciones > 0 else 0.0
    
    valor_inventario = sum(p.precio * p.stock for p in productos)
    total_unidades_stock = sum(p.stock for p in productos)
    
    return schemas.EstadisticasDashboard(
        total_ingresos=total_ingresos,
        costos_estimados=costos_estimados,
        margen_neto=margen_neto,
        porcentaje_margen=porcentaje_margen,
        total_pedidos=total_pedidos,
        total_cotizaciones=total_cotizaciones,
        ticket_promedio=ticket_promedio,
        tasa_conversion=tasa_conversion,
        valor_inventario=valor_inventario,
        total_unidades_stock=total_unidades_stock,
        total_productos=len(productos),
        total_categorias=len(categorias)
    )

# ¡AHORA ESTÁ PROTEGIDO CON get_current_admin!
@router.get("/pedidos/", response_model=List[schemas.PedidoAdminResponse])
def obtener_pedidos(
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin)
):
    pedidos = db.query(models.Pedido).order_by(models.Pedido.fecha_pedido.desc()).all()
    return pedidos

# ¡NUEVA RUTA! Para que el administrador pueda cambiar el estado de los pedidos
@router.put("/pedidos/{pedido_id}", response_model=schemas.PedidoResponse)
def actualizar_estado_pedido(
    pedido_id: int, 
    nuevo_estado: str, 
    db: Session = Depends(get_db), 
    admin: str = Depends(get_current_admin)
):
    pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    pedido.estado = nuevo_estado
    db.commit()
    db.refresh(pedido)
    return pedido

@router.post("/pedidos/", response_model=schemas.PedidoResponse)
def crear_pedido(pedido: schemas.PedidoCreate, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == pedido.usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="El usuario no existe")

    nuevo_pedido = models.Pedido(
        usuario_id=pedido.usuario_id,
        monto_total=pedido.monto_total
    )
    db.add(nuevo_pedido)
    db.commit()
    db.refresh(nuevo_pedido)
    return nuevo_pedido

@router.post("/agenda/", response_model=schemas.AgendaResponse)
def crear_agenda(agenda: schemas.AgendaCreate, db: Session = Depends(get_db)):
    pedido = db.query(models.Pedido).filter(models.Pedido.id == agenda.pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="El pedido no existe")

    nueva_agenda = models.Agenda(
        pedido_id=agenda.pedido_id,
        fecha_instalacion=agenda.fecha_instalacion,
        estado_agenda="pendiente"
    )
    db.add(nueva_agenda)
    db.commit()
    db.refresh(nueva_agenda)
    return nueva_agenda