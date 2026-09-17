from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    rol = Column(String, default="cliente") # Puede ser "cliente" o "admin"
    
    # Relación: Un usuario puede tener muchos pedidos
    pedidos = relationship("Pedido", back_populates="propietario")


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    descripcion = Column(String)
    precio = Column(Float)
    stock = Column(Integer, default=0)
    
    # Clave para la IA de tu compañero David: diferenciar kits de componentes sueltos
    es_kit = Column(Boolean, default=False) 
    
    # Aquí guardaremos la ruta de la foto que el cliente suba
    imagen_url = Column(String, nullable=True) 


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    
    # Estados para el flujo manual: "Pago_Recibido", "Pendiente_Stock", "Confirmado"
    estado_pedido = Column(String, default="Pendiente_Stock") 
    total = Column(Float)
    fecha_creacion = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relaciones
    propietario = relationship("Usuario", back_populates="pedidos")
    agenda = relationship("Agenda", back_populates="pedido", uselist=False)


class Agenda(Base):
    __tablename__ = "agenda"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"))
    fecha_instalacion = Column(DateTime)
    
    # Estados: "Por_Confirmar", "Agendado", "Completado"
    estado_agenda = Column(String, default="Por_Confirmar")
    
    # Relación inversa
    pedido = relationship("Pedido", back_populates="agenda")