from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_admin, get_current_user
from models_extra import CitaVisita, TurnoVisita

router = APIRouter(
    prefix="/agenda",
    tags=["Visitas técnicas"],
)


def utc(value):
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


class TurnoEntrada(BaseModel):
    inicio: datetime

    @field_validator("inicio")
    @classmethod
    def validar(cls, value):
        if value.tzinfo is None:
            raise ValueError(
                "Envía una fecha con zona horaria."
            )

        value = value.astimezone(timezone.utc)
        ahora = datetime.now(timezone.utc)

        if value.minute or value.second or value.microsecond:
            raise ValueError(
                "Los turnos empiezan a una hora exacta."
            )

        if not ahora < value <= ahora + timedelta(days=180):
            raise ValueError(
                "El turno debe estar dentro de los próximos 180 días."
            )

        return value


class CitaEntrada(BaseModel):
    turno_id: int = Field(gt=0)
    direccion: str = Field(min_length=5, max_length=250)
    comuna: str = Field(min_length=2, max_length=100)
    telefono: str = Field(min_length=6, max_length=30)


class Reprogramar(BaseModel):
    turno_id: int = Field(gt=0)


def representar(cita, db):
    turno = db.get(TurnoVisita, cita.turno_id)

    return {
        "id": cita.id,
        "turno_id": cita.turno_id,
        "usuario_id": cita.usuario_id,
        "inicio": utc(turno.inicio),
        "fin": utc(turno.inicio) + timedelta(hours=1),
        "estado": cita.estado,
        "direccion": cita.direccion,
        "comuna": cita.comuna,
        "telefono": cita.telefono,
    }


@router.get("/disponibles")
def disponibles(db: Session = Depends(get_db)):
    ocupados = (
        db.query(CitaVisita.turno_id)
        .filter_by(estado="confirmada")
    )

    turnos = (
        db.query(TurnoVisita)
        .filter(
            TurnoVisita.inicio > datetime.now(timezone.utc),
            ~TurnoVisita.id.in_(ocupados),
        )
        .order_by(TurnoVisita.inicio)
        .limit(200)
        .all()
    )

    return [
        {
            "id": turno.id,
            "inicio": utc(turno.inicio),
            "fin": utc(turno.inicio) + timedelta(hours=1),
        }
        for turno in turnos
    ]


@router.post("/turnos", status_code=201)
def crear_turno(
    payload: TurnoEntrada,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    turno = TurnoVisita(inicio=payload.inicio)

    try:
        db.add(turno)
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            409,
            "Ya existe ese turno.",
        ) from error

    return {
        "id": turno.id,
        "inicio": utc(turno.inicio),
    }


@router.get("/mis-citas")
def propias(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    citas = (
        db.query(CitaVisita)
        .filter_by(usuario_id=user.id)
        .order_by(CitaVisita.id.desc())
        .all()
    )

    return [representar(cita, db) for cita in citas]


@router.get("/")
def todas(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    citas = (
        db.query(CitaVisita)
        .order_by(CitaVisita.id.desc())
        .all()
    )

    return [representar(cita, db) for cita in citas]


@router.post("/", status_code=201)
def reservar(
    payload: CitaEntrada,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    turno = (
        db.query(TurnoVisita)
        .filter_by(id=payload.turno_id)
        .with_for_update()
        .first()
    )

    if (
        not turno
        or utc(turno.inicio) <= datetime.now(timezone.utc)
    ):
        raise HTTPException(
            422,
            "Turno inexistente o pasado.",
        )

    existente = (
        db.query(CitaVisita)
        .filter_by(
            turno_id=turno.id,
            estado="confirmada",
        )
        .first()
    )

    if existente:
        if existente.usuario_id == user.id:
            return representar(existente, db)

        raise HTTPException(
            409,
            "El horario ya fue reservado.",
        )

    cita = CitaVisita(
        usuario_id=user.id,
        **payload.model_dump(),
    )

    try:
        db.add(cita)
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            409,
            "El horario acaba de ocuparse. Elige otro.",
        ) from error

    return representar(cita, db)


@router.put("/{cita_id}/cancelar")
def cancelar(
    cita_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    cita = (
        db.query(CitaVisita)
        .filter_by(id=cita_id)
        .with_for_update()
        .first()
    )

    if not cita or (
        cita.usuario_id != user.id and user.rol_id != 1
    ):
        raise HTTPException(404, "Cita no encontrada.")

    if cita.estado == "cancelada":
        return representar(cita, db)

    turno = db.get(TurnoVisita, cita.turno_id)

    if utc(turno.inicio) <= datetime.now(timezone.utc):
        raise HTTPException(
            409,
            "No se modifica una cita pasada.",
        )

    cita.estado = "cancelada"
    db.commit()

    return representar(cita, db)


@router.put("/{cita_id}/reprogramar")
def reprogramar(
    cita_id: int,
    payload: Reprogramar,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    cita = (
        db.query(CitaVisita)
        .filter_by(id=cita_id)
        .with_for_update()
        .first()
    )

    if not cita or (
        cita.usuario_id != user.id and user.rol_id != 1
    ):
        raise HTTPException(404, "Cita no encontrada.")

    anterior = db.get(TurnoVisita, cita.turno_id)

    if (
        cita.estado != "confirmada"
        or utc(anterior.inicio) <= datetime.now(timezone.utc)
    ):
        raise HTTPException(
            409,
            "Solo se reprograman citas futuras confirmadas.",
        )

    if cita.turno_id == payload.turno_id:
        return representar(cita, db)

    nuevo = (
        db.query(TurnoVisita)
        .filter_by(id=payload.turno_id)
        .with_for_update()
        .first()
    )

    if (
        not nuevo
        or utc(nuevo.inicio) <= datetime.now(timezone.utc)
    ):
        raise HTTPException(
            422,
            "Turno inexistente o pasado.",
        )

    ocupada = (
        db.query(CitaVisita)
        .filter_by(
            turno_id=nuevo.id,
            estado="confirmada",
        )
        .first()
    )

    if ocupada:
        raise HTTPException(
            409,
            "El horario ya fue reservado.",
        )

    cita.turno_id = nuevo.id

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            409,
            "El horario se ocupó. Tu cita original se conserva.",
        ) from error

    return representar(cita, db)