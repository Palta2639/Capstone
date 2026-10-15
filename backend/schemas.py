from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import html

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

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)

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
    nombre: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=500)
    precio: int = Field(..., ge=0)
    stock: int = Field(0, ge=0)
    potencia_watts: Optional[int] = Field(None, ge=0)
    categoria_id: Optional[int] = None
    imagen_url: Optional[str] = Field(None, max_length=255)
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

class ContactoInfo(BaseModel):
    nombre: Optional[str] = Field(None, max_length=60)
    email: Optional[str] = Field(None, max_length=80)
    telefono: Optional[str] = Field(None, max_length=16)

class CotizacionIACalculate(BaseModel):
    comuna: str = Field(..., min_length=2, max_length=60)
    region: Optional[str] = Field(None, max_length=60)
    tipo_propiedad: str = Field("casa", max_length=30)
    tipo_techo: str = Field("zinc", max_length=30)
    consumo_kwh_mensual: float = Field(..., ge=1, le=50000)
    gasto_mensual_clp: int = Field(..., ge=10000, le=20000000)
    tipo_red: str = Field("monofasico", max_length=30)
    objetivo_sistema: str = Field("ahorro_red", max_length=30)
    presupuesto_estimado: Optional[str] = Field("estandar", max_length=30)
    contacto: Optional[ContactoInfo] = None

class CotizacionIAResponse(BaseModel):
    potenciaKwRequerida: float
    potenciaRealKwp: float
    cantidadPaneles: int
    superficieTechoRequerida: int
    inversorSugerido: str
    bateriaSugerida: Optional[str] = None
    ahorroMensualClp: int
    ahorroAnualClp: int
    retornoInversionAnios: float
    co2EvitadoToneladas: float
    observacion_ia: Optional[str] = None

# --- AGENDA ---
class AgendaCreate(BaseModel):
    pedido_id: int
    fecha_instalacion: datetime

class AgendaResponse(AgendaCreate):
    id: int
    estado_agenda: Optional[str] = None

    class Config:
        from_attributes = True

# --- LOGIN Y TOKENS ---
class UsuarioLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# --- CHATBOT IA ---
class ChatMessage(BaseModel):
    role: str = Field(..., max_length=20)
    content: str = Field(..., max_length=1000)

    @field_validator('content')
    @classmethod
    def sanitize_content(cls, v: str) -> str:
        cleaned = v.replace('\x00', '').strip()
        return html.escape(cleaned)

class ChatAction(BaseModel):
    label: str = Field(..., max_length=50)
    url: str = Field(..., max_length=200)

    @field_validator('url')
    @classmethod
    def validate_url(cls, v: str) -> str:
        # Prevenir inyeccion de URLs maliciosas (e.g. javascript: o data:)
        cleaned = v.strip()
        if not cleaned.startswith(('/', 'https://', 'http://')):
            raise ValueError('URL no permitida.')
        return cleaned

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    history: Optional[List[ChatMessage]] = Field(default=[], max_length=20)

    @field_validator('message')
    @classmethod
    def sanitize_message(cls, v: str) -> str:
        # Mitigacion de inyecciones, XSS y caracteres de control
        cleaned = v.replace('\x00', '').strip()
        # Escapado estricto contra inyeccion de scripts / tags HTML
        cleaned = html.escape(cleaned)
        if not cleaned:
            raise ValueError('El mensaje no puede estar vacío.')
        return cleaned

class ChatResponse(BaseModel):
    reply: str = Field(..., max_length=2000)
    actions: Optional[List[ChatAction]] = []