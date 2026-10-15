from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas
from core.database import get_db
from core.security import verify_password, create_access_token

router = APIRouter(tags=["Autenticación"])

@router.post("/login/", response_model=schemas.Token)
def login(usuario: schemas.UsuarioLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    
    if not db_user or not verify_password(usuario.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos"
        )
    
    access_token = create_access_token(data={"sub": db_user.email, "rol_id": db_user.rol_id})
    return {"access_token": access_token, "token_type": "bearer"}

