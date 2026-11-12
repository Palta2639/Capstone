from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from transbank.webpay.webpay_plus.transaction import Transaction
from transbank.common.options import WebpayOptions
from transbank.common.integration_commerce_codes import IntegrationCommerceCodes
from transbank.common.integration_api_keys import IntegrationApiKeys
from transbank.common.integration_type import IntegrationType

router = APIRouter(prefix="/pagos", tags=["Pagos"])

# Declaramos explícitamente que usaremos el entorno de pruebas (TEST)
opciones = WebpayOptions(
    commerce_code=IntegrationCommerceCodes.WEBPAY_PLUS,
    api_key=IntegrationApiKeys.WEBPAY,
    integration_type=IntegrationType.TEST
)

@router.post("/crear")
def crear_pago(monto: int, orden_compra: str, session_id: str = "sesion_1"):
    # Le pasamos las opciones obligatorias a la transacción
    tx = Transaction(options=opciones)
    
    # URL donde Transbank redirigirá al usuario tras intentar pagar
    return_url = "http://localhost:8000/pagos/confirmar"
    
    # Creamos la intención de pago en Transbank
    respuesta = tx.create(
        buy_order=orden_compra,
        session_id=session_id,
        amount=monto,
        return_url=return_url
    )
    
    # Retornamos los datos usando formato de diccionario (corchetes)
    return {"url": respuesta["url"], "token": respuesta["token"]}

@router.get("/confirmar")
def confirmar_pago(token_ws: str):
    # Transbank envía el token_ws en la URL de retorno
    tx = Transaction(options=opciones)
    
    # Confirmamos la transacción con el token
    respuesta = tx.commit(token=token_ws)
    
    # Validamos si el pago fue exitoso
    if respuesta["status"] == "AUTHORIZED":
        orden_compra = respuesta["buy_order"]
        
        # Redirección automática al frontend de Next.js con la orden aprobada
        frontend_url = f"http://localhost:3000/pago/exito?orden={orden_compra}"
        return RedirectResponse(url=frontend_url, status_code=303)
    else:
        # Si el pago es rechazado, podemos redirigir a una vista de error o fallo
        return {
            "mensaje": "Pago Rechazado", 
            "estado": respuesta.get("status", "Desconocido")
        }