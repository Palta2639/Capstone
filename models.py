from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, TIMESTAMP, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Rol(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)

    usuarios = relationship("Usuario", back_populates="rol")

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    telefono = Column(String(20))
    rol_id = Column(Integer, ForeignKey("roles.id"), default=2)
    creado_en = Column(TIMESTAMP, server_default=func.now())

    rol = relationship("Rol", back_populates="usuarios")
    pedidos = relationship("Pedido", back_populates="usuario")
    cotizaciones = relationship("Cotizacion", back_populates="usuario")

class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)

    productos = relationship("Producto", back_populates="categoria")

class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text)
    precio = Column(Integer, nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    potencia_watts = Column(Integer)
    categoria_id = Column(Integer, ForeignKey("categorias.id"))
    imagen_url = Column(Text)
    creado_en = Column(TIMESTAMP, server_default=func.now())
    es_kit = Column(Boolean, default=False)

    categoria = relationship("Categoria", back_populates="productos")
    detalles = relationship("DetallePedido", back_populates="producto")

class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"))
    monto_total = Column(Integer, nullable=False)
    estado = Column(String(50), default="pendiente")
    fecha_pedido = Column(TIMESTAMP, server_default=func.now())

    usuario = relationship("Usuario", back_populates="pedidos")
    detalles = relationship("DetallePedido", back_populates="pedido")
    agendas = relationship("Agenda", back_populates="pedido")

class DetallePedido(Base):
    __tablename__ = "detalle_pedidos"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"))
    producto_id = Column(Integer, ForeignKey("productos.id", ondelete="RESTRICT"))
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Integer, nullable=False)

    pedido = relationship("Pedido", back_populates="detalles")
    producto = relationship("Producto", back_populates="detalles")

class Cotizacion(Base):
    __tablename__ = "cotizaciones"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"))
    consumo_kwh_mensual = Column(Numeric(10, 2), nullable=False)
    comuna = Column(String(100))
    presupuesto_estimado = Column(Integer)
    estado = Column(String(50), default="pendiente")
    fecha_solicitud = Column(TIMESTAMP, server_default=func.now())

    usuario = relationship("Usuario", back_populates="cotizaciones")

class Agenda(Base):
    __tablename__ = "agenda"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"))
    fecha_instalacion = Column(TIMESTAMP)
    estado_agenda = Column(String)

    pedido = relationship("Pedido", back_populates="agendas")