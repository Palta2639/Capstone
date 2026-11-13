# Pruebas unitarias - Backend Anglo Electric
# Rama: Cristopher-Documentacion by Kevin PEÑA (QA)
# Para ejecutar: pytest test_backend.py -v

import random
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models

cliente = TestClient(app, raise_server_exceptions=False)


# Crea un correo distinto cada vez para que no choquen las pruebas
def correo_nuevo():
    numero = random.randint(1000, 99999)
    return "prueba" + str(numero) + "@test.cl"


# BE-01: Registrar un usuario y revisar que la clave quede encriptada
def test_registro_usuario():
    correo = correo_nuevo()
    datos = {"nombre": "Usuario Prueba", "email": correo, "password": "Clave123"}
    respuesta = cliente.post("/usuarios/", json=datos)
    assert respuesta.status_code == 200

    # Revisamos en la base de datos que la clave no este en texto plano
    db = SessionLocal()
    usuario = db.query(models.Usuario).filter(models.Usuario.email == correo).first()
    db.close()
    assert usuario.password_hash != "Clave123"
    assert usuario.password_hash.startswith("$2b$")


# BE-02: No se debe poder registrar dos veces el mismo correo
def test_correo_duplicado():
    correo = correo_nuevo()
    datos = {"nombre": "Usuario Prueba", "email": correo, "password": "Clave123"}
    cliente.post("/usuarios/", json=datos)
    respuesta = cliente.post("/usuarios/", json=datos)
    assert respuesta.status_code == 400


# BE-03: Login con datos correctos entrega un token
def test_login_correcto():
    correo = correo_nuevo()
    cliente.post("/usuarios/", json={"nombre": "Usuario Prueba", "email": correo, "password": "Clave123"})
    respuesta = cliente.post("/login/", json={"email": correo, "password": "Clave123"})
    assert respuesta.status_code == 200
    assert "access_token" in respuesta.json()


# BE-04: Login con clave incorrecta debe ser rechazado
def test_login_incorrecto():
    correo = correo_nuevo()
    cliente.post("/usuarios/", json={"nombre": "Usuario Prueba", "email": correo, "password": "Clave123"})
    respuesta = cliente.post("/login/", json={"email": correo, "password": "ClaveMala"})
    assert respuesta.status_code == 401


# BE-05: Eliminar un producto sin token debe ser rechazado
def test_eliminar_sin_token():
    respuesta = cliente.delete("/productos/999999")
    assert respuesta.status_code == 401


# BE-06: La API responde y se conecta a la base de datos
def test_conexion_base_datos():
    respuesta = cliente.get("/productos/")
    assert respuesta.status_code == 200


# BE-07: Un usuario no deberia poder registrarse como administrador (rol 1)
def test_registro_como_admin():
    datos = {"nombre": "Usuario Prueba", "email": correo_nuevo(), "password": "Clave123", "rol_id": 1}
    respuesta = cliente.post("/usuarios/", json=datos)
    assert respuesta.status_code != 200 or respuesta.json()["rol_id"] != 1
