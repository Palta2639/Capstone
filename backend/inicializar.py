from core.database import Base, SessionLocal, engine
import models
import models_extra


if __name__ == "__main__":
    # Crea tablas faltantes. No borra datos.
    # No modifica columnas de tablas existentes.
    Base.metadata.create_all(engine)

    with SessionLocal() as db:
        for identificador, nombre in [
            (1, "Administrador"),
            (2, "Cliente"),
        ]:
            if db.get(models.Rol, identificador) is None:
                db.add(models.Rol(
                    id=identificador,
                    nombre=nombre,
                ))

        db.commit()

    print("Tablas verificadas. Datos existentes conservados.")