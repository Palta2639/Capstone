from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from core.database import get_db
from core.security import get_current_admin

router = APIRouter(prefix="/productos", tags=["Productos"])

@router.post("/", response_model=schemas.ProductoResponse)
def crear_producto(
    producto: schemas.ProductoCreate, 
    db: Session = Depends(get_db), 
    admin_email: str = Depends(get_current_admin)
):
    nuevo_producto = models.Producto(**producto.model_dump())
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return nuevo_producto

@router.get("/", response_model=List[schemas.ProductoResponse])
def obtener_productos(
    db: Session = Depends(get_db),
    categoria_id: Optional[int] = None,
    es_kit: Optional[bool] = None,
    en_stock: Optional[bool] = None,
    potencia_min: Optional[int] = None,
    potencia_max: Optional[int] = None,
    precio_min: Optional[int] = None,
    precio_max: Optional[int] = None,
    search: Optional[str] = None
):
    query = db.query(models.Producto)
    
    if categoria_id is not None:
        query = query.filter(models.Producto.categoria_id == categoria_id)
    if es_kit is not None:
        query = query.filter(models.Producto.es_kit == es_kit)
    if en_stock is True:
        query = query.filter(models.Producto.stock > 0)
    if potencia_min is not None:
        query = query.filter(models.Producto.potencia_watts >= potencia_min)
    if potencia_max is not None:
        query = query.filter(models.Producto.potencia_watts <= potencia_max)
    if precio_min is not None:
        query = query.filter(models.Producto.precio >= precio_min)
    if precio_max is not None:
        query = query.filter(models.Producto.precio <= precio_max)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models.Producto.nombre.ilike(search_filter)) |
            (models.Producto.descripcion.ilike(search_filter))
        )
        
    return query.all()

@router.get("/{producto_id}", response_model=schemas.ProductoResponse)
def obtener_producto_individual(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto

@router.put("/{producto_id}", response_model=schemas.ProductoResponse)
def actualizar_producto(
    producto_id: int, 
    producto_actualizado: schemas.ProductoCreate, 
    db: Session = Depends(get_db), 
    admin_email: str = Depends(get_current_admin)
):
    producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    for key, value in producto_actualizado.model_dump().items():
        setattr(producto, key, value)
        
    db.commit()
    db.refresh(producto)
    return producto

@router.delete("/{producto_id}")
def eliminar_producto(
    producto_id: int, 
    db: Session = Depends(get_db), 
    admin_email: str = Depends(get_current_admin)
):
    producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    db.delete(producto)
    db.commit()
    return {"mensaje": f"El producto {producto.nombre} ha sido eliminado exitosamente"}

