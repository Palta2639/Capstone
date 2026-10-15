from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import models, schemas
from core.database import get_db
from core.security import get_current_admin

router = APIRouter(prefix="/categorias", tags=["Categorías"])

@router.post("/", response_model=schemas.CategoriaResponse)
def crear_categoria(
    categoria: schemas.CategoriaCreate, 
    db: Session = Depends(get_db), 
    admin_email: str = Depends(get_current_admin)
):
    nueva_categoria = models.Categoria(
        nombre=categoria.nombre,
        descripcion=categoria.descripcion
    )
    db.add(nueva_categoria)
    db.commit()
    db.refresh(nueva_categoria)
    return nueva_categoria

@router.get("/", response_model=List[schemas.CategoriaResponse])
def obtener_categorias(db: Session = Depends(get_db)):
    return db.query(models.Categoria).all()

