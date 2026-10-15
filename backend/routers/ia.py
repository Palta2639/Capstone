from fastapi import APIRouter
import schemas

router = APIRouter(prefix="/ia", tags=["Inteligencia Artificial y Asistente"])

@router.post("/chat", response_model=schemas.ChatResponse)
def responder_chat_solar(payload: schemas.ChatRequest):
    """
    Endpoint base para el Asistente Virtual.
    La interfaz de usuario y estructura de conexion quedan listas.
    El procesamiento del modelo de IA e informacion especializada sera integrado por el ingeniero de IA.
    """
    return {
        "reply": "Mensaje recibido. La integracion del modelo de lenguaje y procesamiento de informacion tecnica sera realizada por el ingeniero de IA.",
        "actions": []
    }
