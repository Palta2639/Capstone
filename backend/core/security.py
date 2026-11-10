from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from core.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    SECRET_KEY,
)
from core.database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login/")


def get_password_hash(password: str) -> str:
    if len(password.encode("utf-8")) > 72:
        raise HTTPException(
            422,
            "La contraseña admite como máximo 72 bytes UTF-8.",
        )

    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def verify_password(plain_password, hashed_password):
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


def create_access_token(data):
    now = datetime.now(timezone.utc)

    payload = {
        **data,
        "iat": now,
        "exp": now + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    import models

    invalid = HTTPException(
        status_code=401,
        detail="Sesión inválida o expirada.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"require": ["exp", "sub"]},
        )

        if not isinstance(payload["sub"], str):
            raise invalid

    except jwt.PyJWTError:
        raise invalid

    user = (
        db.query(models.Usuario)
        .filter(models.Usuario.email == payload["sub"])
        .first()
    )

    if user is None:
        raise invalid

    return user


def get_current_admin(
    user=Depends(get_current_user),
):
    if user.rol_id != 1:
        raise HTTPException(
            403,
            "Se requiere rol administrador.",
        )

    return user.email