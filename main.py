from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
from fastapi import status # Para los códigos de error HTTP

import models, schemas
from database import engine, SessionLocal

# Esto asegura que las tablas existan (si no existen)
models.Base.metadata.create_all(bind=engine)

# Iniciamos la aplicación UNA sola vez con su título
app = FastAPI(
    title="Anglo Electric API",
    description="Backend para el e-commerce y recomendador de kits solares"
)

# Configuramos el "guardia de seguridad" (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite cualquier frontend
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# Configuración de seguridad para contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str):
    return pwd_context.hash(password)

# --- CONFIGURACIÓN DE SEGURIDAD JWT ---
SECRET_KEY = "clave_secreta_para_anglo_electric" # En producción, esto se esconde
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # El token durará 1 hora

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Herramienta clave: Abre una conexión a la base de datos y luego la cierra.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Ruta principal para verificar que todo funciona
@app.get("/")
def read_root():
    return {"estado": "¡El servidor está funcionando y conectado a la nube Neon!"}

# --- RUTAS DE PRODUCTOS ---
@app.post("/productos/", response_model=schemas.ProductoResponse)
def crear_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    nuevo_producto = models.Producto(**producto.model_dump())
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return nuevo_producto

@app.get("/productos/", response_model=List[schemas.ProductoResponse])
def obtener_productos(db: Session = Depends(get_db)):
    productos = db.query(models.Producto).all()
    return productos

@app.get("/productos/{producto_id}", response_model=schemas.ProductoResponse)
def obtener_producto_individual(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto

# --- RUTAS DE USUARIOS ---
@app.post("/usuarios/", response_model=schemas.UsuarioResponse)
def crear_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    # 1. Encriptamos la contraseña original antes de tocar la base de datos
    contrasena_encriptada = get_password_hash(usuario.password)
    
    # 2. Guardamos el usuario pasando el hash seguro a 'password_hash'
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

@app.post("/login/", response_model=schemas.Token)
def login(usuario: schemas.UsuarioLogin, db: Session = Depends(get_db)):
    # 1. Buscamos si el correo existe en Neon
    db_user = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    
    # 2. Si no existe o la contraseña no coincide con el hash, rechazamos
    if not db_user or not verify_password(usuario.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos"
        )
    
    # 3. Si todo está correcto, le creamos su Token (pasaporte digital)
    access_token = create_access_token(data={"sub": db_user.email, "rol_id": db_user.rol_id})
    
    return {"access_token": access_token, "token_type": "bearer"}

# --- RUTAS DE PEDIDOS ---
@app.post("/pedidos/", response_model=schemas.PedidoResponse)
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

# --- RUTAS DE AGENDA ---
@app.post("/agenda/", response_model=schemas.AgendaResponse)
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

# --- RUTAS DE CATEGORIAS ---
@app.post("/categorias/", response_model=schemas.CategoriaResponse)
def crear_categoria(categoria: schemas.CategoriaCreate, db: Session = Depends(get_db)):
    nueva_categoria = models.Categoria(
        nombre=categoria.nombre,
        descripcion=categoria.descripcion
    )
    db.add(nueva_categoria)
    db.commit()
    db.refresh(nueva_categoria)
    return nueva_categoria

@app.get("/categorias/", response_model=List[schemas.CategoriaResponse])
def obtener_categorias(db: Session = Depends(get_db)):
    categorias = db.query(models.Categoria).all()
    return categorias

# --- RUTAS DE COTIZACIONES ---
@app.post("/cotizaciones/", response_model=schemas.CotizacionResponse)
def crear_cotizacion(cotizacion: schemas.CotizacionCreate, db: Session = Depends(get_db)):
    # Verificamos que el usuario que pide la cotización realmente exista
    usuario = db.query(models.Usuario).filter(models.Usuario.id == cotizacion.usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="El usuario no existe")

    nueva_cotizacion = models.Cotizacion(
        usuario_id=cotizacion.usuario_id,
        consumo_kwh_mensual=cotizacion.consumo_kwh_mensual,
        comuna=cotizacion.comuna,
        presupuesto_estimado=cotizacion.presupuesto_estimado,
        estado="pendiente"
    )
    db.add(nueva_cotizacion)
    db.commit()
    db.refresh(nueva_cotizacion)
    return nueva_cotizacion

@app.get("/cotizaciones/", response_model=List[schemas.CotizacionResponse])
def obtener_cotizaciones(db: Session = Depends(get_db)):
    cotizaciones = db.query(models.Cotizacion).all()
    return cotizaciones

# --- RUTAS DE ACTUALIZACIÓN Y BORRADO ---

# 1. ACTUALIZAR (PUT): Cambiar el estado de una cotización
@app.put("/cotizaciones/{cotizacion_id}", response_model=schemas.CotizacionResponse)
def actualizar_estado_cotizacion(cotizacion_id: int, nuevo_estado: str, db: Session = Depends(get_db)):
    # Buscamos la cotización
    cotizacion = db.query(models.Cotizacion).filter(models.Cotizacion.id == cotizacion_id).first()
    
    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    
    # Actualizamos el estado y guardamos
    cotizacion.estado = nuevo_estado
    db.commit()
    db.refresh(cotizacion)
    return cotizacion

# 2. ELIMINAR (DELETE): Borrar un producto del catálogo
@app.delete("/productos/{producto_id}")
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    db.delete(producto)
    db.commit()
    return {"mensaje": f"El producto {producto.nombre} ha sido eliminado exitosamente"}