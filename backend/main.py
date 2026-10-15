from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import engine
import models
from routers import auth, usuarios, productos, categorias, cotizaciones, pedidos, ia

# Crear tablas en la base de datos si no existen
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Anglo Electric API",
    description="Backend modular para e-commerce y recomendador de kits solares"
)

# Configuracion de CORS flexible para desarrollo y produccion
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers modulares
app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(productos.router)
app.include_router(categorias.router)
app.include_router(cotizaciones.router)
app.include_router(pedidos.router)
app.include_router(ia.router)

@app.get("/")
def read_root():
    return {"estado": "El servidor está funcionando y conectado a la nube Neon!"}