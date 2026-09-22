from fastapi import FastAPI, Depends, HTTPException
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import models, schemas
from database import engine, SessionLocal
from fastapi import FastAPI, Depends
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # 1. Agregamos esta importación

app = FastAPI()

# 2. Configuramos el "guardia de seguridad" (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # El "*" permite que cualquier frontend se conecte en etapa de desarrollo
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos (GET para leer, POST para guardar, etc.)
    allow_headers=["*"],  # Permite todo tipo de encabezados
)

# ... (Acá abajo se queda todo tu código tal cual lo tenías) ...
@app.get("/")
def read_root():
    return {"estado": "¡El servidor está funcionando a la perfección!"}

# Esto asegura que las tablas existan
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Anglo Electric API",
    description="Backend para el e-commerce y recomendador de kits solares"
)

# Herramienta clave: Abre una conexión a la base de datos solo cuando alguien la pide, y luego la cierra.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Tu ruta de prueba original
@app.get("/")
def read_root():
    return {"estado": "¡El servidor está funcionando a la perfección!"}

# NUEVA RUTA: Para guardar un producto en PostgreSQL
@app.post("/productos/", response_model=schemas.ProductoResponse)
def crear_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    # 1. Tomamos los datos que llegan de la web y los preparamos para PostgreSQL
    nuevo_producto = models.Producto(**producto.model_dump())
    
    # 2. Lo insertamos y guardamos (commit)
    db.add(nuevo_producto)
    db.commit()
    
    # 3. Refrescamos para obtener el ID automático que le dio la base de datos
    db.refresh(nuevo_producto)
    
    return nuevo_producto

# NUEVA RUTA: Registrar un usuario
@app.post("/usuarios/", response_model=schemas.UsuarioResponse)
def crear_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    # En una etapa posterior agregaremos encriptación (hash) a la contraseña
    nuevo_usuario = models.Usuario(
        nombre=usuario.nombre,
        email=usuario.email,
        password_hash=usuario.password, 
        rol="cliente"
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

@app.get("/productos/", response_model=List[schemas.ProductoResponse])
def obtener_productos(db: Session = Depends(get_db)):
    # Le pedimos a PostgreSQL que traiga todos los registros de la tabla
    productos = db.query(models.Producto).all()
    return productos

# NUEVA RUTA: Para obtener un solo producto por su ID
@app.get("/productos/{producto_id}", response_model=schemas.ProductoResponse)
def obtener_producto_individual(producto_id: int, db: Session = Depends(get_db)):
    # Buscamos el producto específico filtrando por ID
    producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    
    # Si no existe, devolvemos un error 404 (Not Found)
    if producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return producto

# NUEVA RUTA: Crear un pedido
@app.post("/pedidos/", response_model=schemas.PedidoResponse)
def crear_pedido(pedido: schemas.PedidoCreate, db: Session = Depends(get_db)):
    # 1. Verificamos que el usuario_id corresponda a un cliente real
    usuario = db.query(models.Usuario).filter(models.Usuario.id == pedido.usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="El usuario no existe")

    # 2. Creamos el pedido
    nuevo_pedido = models.Pedido(
        usuario_id=pedido.usuario_id,
        total=pedido.total
        # estado_pedido y fecha_creacion se llenan solos por defecto
    )
    db.add(nuevo_pedido)
    db.commit()
    db.refresh(nuevo_pedido)
    return nuevo_pedido

# NUEVA RUTA: Agendar una instalación
@app.post("/agenda/", response_model=schemas.AgendaResponse)
def crear_agenda(agenda: schemas.AgendaCreate, db: Session = Depends(get_db)):
    # 1. Verificamos que el pedido_id corresponda a una compra real
    pedido = db.query(models.Pedido).filter(models.Pedido.id == agenda.pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="El pedido no existe")

    # 2. Creamos la cita en la agenda
    nueva_agenda = models.Agenda(
        pedido_id=agenda.pedido_id,
        fecha_instalacion=agenda.fecha_instalacion
        # El estado_agenda se llena automáticamente como "Por_Confirmar"
    )
    db.add(nueva_agenda)
    db.commit()
    db.refresh(nueva_agenda)
    return nueva_agenda