from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# 1. Este modelo define lo que el Frontend nos debe ENVIAR para crear un producto
class ProductoCreate(BaseModel):
    nombre: str
    descripcion: str
    precio: float
    stock: int = 0
    es_kit: bool = False
    imagen_url: Optional[str] = None

# 2. Este modelo define lo que el Backend le RESPONDE al Frontend
class ProductoResponse(ProductoCreate):
    id: int

    class Config:
        from_attributes = True  # Esto permite que Pydantic lea la base de datos sin problemas

class UsuarioCreate(BaseModel):
    nombre: str
    email: str
    password: str

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: str
    rol: str

    class Config:
        from_attributes = True

class PedidoCreate(BaseModel):
    usuario_id: int
    total: float

class PedidoResponse(BaseModel):
    id: int
    usuario_id: int
    estado_pedido: str
    total: float
    fecha_creacion: datetime

    class Config:
        from_attributes = True

class AgendaCreate(BaseModel):
    pedido_id: int
    fecha_instalacion: datetime

class AgendaResponse(BaseModel):
    id: int
    pedido_id: int
    fecha_instalacion: datetime
    estado_agenda: str

    class Config:
        from_attributes = True