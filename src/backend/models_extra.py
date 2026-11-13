from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    text,
)

from core.database import Base


class CotizacionKNN(Base):
    __tablename__ = "cotizaciones_knn_detalle"

    id = Column(Integer, primary_key=True)
    cotizacion_id = Column(
        Integer,
        ForeignKey("cotizaciones.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    clave = Column(String(36), unique=True, nullable=False)
    huella = Column(String(64), nullable=False)
    entrada = Column(JSON, nullable=False)
    resultado = Column(JSON, nullable=False)
    creado_en = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class CostoProducto(Base):
    __tablename__ = "costos_productos"

    producto_id = Column(
        Integer,
        ForeignKey("productos.id", ondelete="CASCADE"),
        primary_key=True,
    )
    costo_unitario = Column(Integer, nullable=False)

    __table_args__ = (
        CheckConstraint("costo_unitario >= 0"),
    )


class PedidoRegistro(Base):
    __tablename__ = "pedidos_registro"

    pedido_id = Column(
        Integer,
        ForeignKey("pedidos.id", ondelete="CASCADE"),
        primary_key=True,
    )
    clave = Column(String(36), unique=True, nullable=False)
    huella = Column(String(64), nullable=False)
    cotizacion_id = Column(
        Integer,
        ForeignKey("cotizaciones.id", ondelete="SET NULL"),
        nullable=True,
    )
    subtotal = Column(Integer, nullable=False)
    entrega = Column(JSON, nullable=False)
    partidas = Column(JSON, nullable=False)


class TurnoVisita(Base):
    __tablename__ = "turnos_visita"

    id = Column(Integer, primary_key=True)
    inicio = Column(
        DateTime(timezone=True),
        unique=True,
        nullable=False,
    )


class CitaVisita(Base):
    __tablename__ = "citas_visita"

    id = Column(Integer, primary_key=True)
    turno_id = Column(
        Integer,
        ForeignKey("turnos_visita.id"),
        nullable=False,
    )
    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id"),
        nullable=False,
    )
    direccion = Column(String(250), nullable=False)
    comuna = Column(String(100), nullable=False)
    telefono = Column(String(30), nullable=False)
    estado = Column(
        String(20),
        default="confirmada",
        nullable=False,
    )

    __table_args__ = (
        CheckConstraint(
            "estado IN ('confirmada', 'cancelada')"
        ),
        Index(
            "uq_turno_confirmado",
            "turno_id",
            unique=True,
            postgresql_where=text("estado = 'confirmada'"),
            sqlite_where=text("estado = 'confirmada'"),
        ),
    )
