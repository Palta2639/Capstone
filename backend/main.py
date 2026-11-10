import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from core.config import CORS_ORIGINS
from core.database import engine
from modelo_knn import cargar_modelo
from routers import (
    agenda,
    auth,
    categorias,
    cotizaciones,
    ia,
    pedidos,
    productos,
    usuarios,
)

app = FastAPI(
    title="Anglo Electric API",
    version="0.2.0",
    root_path=os.getenv("ROOT_PATH", ""),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

for router in [
    auth.router,
    usuarios.router,
    productos.router,
    categorias.router,
    cotizaciones.router,
    pedidos.router,
    agenda.router,
    ia.router,
]:
    app.include_router(router)


@app.get("/")
def inicio():
    return {
        "servicio": "Anglo Electric",
        "documentacion": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/ready")
def ready():
    cargar_modelo()

    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {"status": "ready"}