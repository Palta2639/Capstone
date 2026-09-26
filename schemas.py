from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# --- ROLES ---
class RolResponse(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True

# --- USUARIOS ---
class UsuarioCreate(BaseModel):
    nombre: str
    email: str
    password: str
    telefono: Optional[str] = None
    rol_id: Optional[int] = 2

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: str
    telefono: Optional[str]
    rol_id: int
    creado_en: datetime

    class Config:
        from_attributes = True

# --- CATEGORIAS ---
class CategoriaCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class CategoriaResponse(CategoriaCreate):
    id: int

    class Config:
        from_attributes = True

# --- PRODUCTOS ---
class ProductoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: int
    stock: int = 0
    potencia_watts: Optional[int] = None
    categoria_id: Optional[int] = None
    imagen_url: Optional[str] = None
    es_kit: bool = False

class ProductoResponse(ProductoCreate):
    id: int
    creado_en: datetime

    class Config:
        from_attributes = True

# --- PEDIDOS ---
class PedidoCreate(BaseModel):
    usuario_id: int
    monto_total: int

class PedidoResponse(PedidoCreate):
    id: int
    estado: str
    fecha_pedido: datetime

    class Config:
        from_attributes = True

# --- DETALLE PEDIDOS ---
class DetallePedidoCreate(BaseModel):
    pedido_id: int
    producto_id: int
    cantidad: int
    precio_unitario: int

class DetallePedidoResponse(DetallePedidoCreate):
    id: int

    class Config:
        from_attributes = True

# --- COTIZACIONES ---
class CotizacionCreate(BaseModel):
    usuario_id: int
    consumo_kwh_mensual: float
    comuna: Optional[str] = None
    presupuesto_estimado: Optional[int] = None

class CotizacionResponse(CotizacionCreate):
    id: int
    estado: str
    fecha_solicitud: datetime

    class Config:
        from_attributes = True

# --- AGENDA ---
class AgendaCreate(BaseModel):
    pedido_id: int
    fecha_instalacion: datetime

class AgendaResponse(AgendaCreate):
    id: int
    estado_agenda: Optional[str] = None

    class Config:
        from_attributes = True