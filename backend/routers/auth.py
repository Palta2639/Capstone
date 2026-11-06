from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
import models, schemas
from core.database import get_db
from core.security import verify_password, create_access_token

router = APIRouter(tags=["Autenticación"])

@router.post("/login/")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Swagger mapea el campo 'username' del formulario al email
    email = form_data.username
    password = form_data.password
    
    # 1. Buscar el usuario en la base de datos
    db_user = db.query(models.Usuario).filter(models.Usuario.email == email).first()

    # 2. Verificar que el usuario exista y la contraseña sea correcta
    if not db_user or not verify_password(password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos"
        )
        
    # 3. Crear el token incluyendo el rol_id para que el frontend sepa si es admin
    access_token = create_access_token(data={"sub": db_user.email, "rol_id": db_user.rol_id})
    return {"access_token": access_token, "token_type": "bearer"}