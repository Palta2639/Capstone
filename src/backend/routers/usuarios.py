from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import models
import schemas
from core.database import get_db
from core.security import (
    get_current_user,
    get_password_hash,
)

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"],
)


@router.post("/", response_model=schemas.UsuarioResponse)
def crear_usuario(
    usuario: schemas.UsuarioCreate,
    db: Session = Depends(get_db),
):
    existente = (
        db.query(models.Usuario)
        .filter(models.Usuario.email == usuario.email)
        .first()
    )

    if existente:
        raise HTTPException(
            409,
            "El correo ya está registrado.",
        )

    nuevo = models.Usuario(
        nombre=usuario.nombre,
        email=usuario.email,
        password_hash=get_password_hash(usuario.password),
        telefono=usuario.telefono,
        rol_id=2,
    )

    try:
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            409,
            "El correo ya está registrado.",
        ) from error

    return nuevo


@router.get("/me", response_model=schemas.UsuarioResponse)
def obtener_perfil(
    usuario=Depends(get_current_user),
):
    return usuario


@router.put("/me", response_model=schemas.UsuarioResponse)
def actualizar_perfil(
    datos: schemas.UsuarioUpdate,
    usuario=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if datos.nombre is not None:
        usuario.nombre = datos.nombre.strip()

    if datos.telefono is not None:
        usuario.telefono = datos.telefono.strip()

    db.commit()
    db.refresh(usuario)

    return usuario