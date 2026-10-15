from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from core.database import get_db
from core.security import get_password_hash, get_current_user

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.post("/", response_model=schemas.UsuarioResponse)
def crear_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    contrasena_encriptada = get_password_hash(usuario.password)
    
    nuevo_usuario = models.Usuario(
        nombre=usuario.nombre,
        email=usuario.email,
        password_hash=contrasena_encriptada, 
        telefono=usuario.telefono,
        rol_id=usuario.rol_id
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

@router.get("/me", response_model=schemas.UsuarioResponse)
def obtener_perfil_actual(usuario_actual: models.Usuario = Depends(get_current_user)):
    """
    Retorna el perfil del usuario autenticado.
    """
    return usuario_actual

@router.put("/me", response_model=schemas.UsuarioResponse)
def actualizar_perfil_actual(
    datos: schemas.UsuarioUpdate, 
    usuario_actual: models.Usuario = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Permite al usuario autenticado actualizar sus datos de contacto (nombre y teléfono).
    """
    if datos.nombre is not None:
        usuario_actual.nombre = datos.nombre.strip()
    if datos.telefono is not None:
        usuario_actual.telefono = datos.telefono.strip()
        
    db.commit()
    db.refresh(usuario_actual)
    return usuario_actual
