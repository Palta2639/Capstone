from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from core.database import get_db
from core.security import get_current_admin

router = APIRouter(prefix="/cotizaciones", tags=["Cotizaciones"])

@router.post("/", response_model=schemas.CotizacionResponse)
def crear_cotizacion(cotizacion: schemas.CotizacionCreate, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == cotizacion.usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="El usuario no existe")

    nueva_cotizacion = models.Cotizacion(
        usuario_id=cotizacion.usuario_id,
        consumo_kwh_mensual=cotizacion.consumo_kwh_mensual,
        comuna=cotizacion.comuna,
        presupuesto_estimado=cotizacion.presupuesto_estimado,
        estado="pendiente"
    )
    db.add(nueva_cotizacion)
    db.commit()
    db.refresh(nueva_cotizacion)
    return nueva_cotizacion

@router.post("/ia", response_model=schemas.CotizacionIAResponse)
def calcular_cotizacion_ia(datos: schemas.CotizacionIACalculate, db: Session = Depends(get_db)):
    """
    Endpoint de dimensionamiento preliminar con IA.
    Recibe la comuna, radiacion estimada, tipo de propiedad y consumo electrico.
    Listo para ser ampliado con modelos de lenguaje o APIs solares por el equipo backend.
    """
    # Radiacion promedio segun latitud (Horas de Sol Pico - HSP en Chile central)
    hsp = 4.8
    factor_rendimiento = 0.80
    consumo_diario_kwh = datos.consumo_kwh_mensual / 30.0
    potencia_kw_requerida = round(consumo_diario_kwh / (hsp * factor_rendimiento), 2)

    # Calculo de modulos solares de 550W
    watts_por_panel = 550
    cantidad_paneles = max(4, int(-(- (potencia_kw_requerida * 1000) // watts_por_panel)))
    potencia_real_kwp = round((cantidad_paneles * watts_por_panel) / 1000.0, 2)

    # Ahorro proyectado segun objetivo
    porcentaje_ahorro = 100 if datos.objetivo_sistema == "off_grid" else 85
    ahorro_mensual_clp = int(datos.gasto_mensual_clp * (porcentaje_ahorro / 100.0))
    ahorro_anual_clp = ahorro_mensual_clp * 12

    # Inversor
    if datos.objetivo_sistema == "hibrido":
        inversor_sugerido = f"{int(potencia_kw_requerida + 0.99)} kW Híbrido con respaldo de baterías"
        bateria_sugerida = "Batería de Litio LiFePO4 5.12 kWh 48V"
    elif datos.objetivo_sistema == "off_grid":
        inversor_sugerido = f"{int(potencia_kw_requerida + 0.99)} kW Off-Grid Aislado"
        bateria_sugerida = "Banco de Baterías Litio 10.24 kWh LiFePO4"
    else:
        tipo_conexion = "Trifásico" if datos.tipo_red == "trifasico" else "Monofásico"
        inversor_sugerido = f"{int(potencia_kw_requerida + 0.99)} kW On-Grid Inyección {tipo_conexion}"
        bateria_sugerida = None

    superficie_techo_m2 = int(cantidad_paneles * 2.3)
    co2_evitado = round(potencia_real_kwp * 0.95, 1)

    return {
        "potenciaKwRequerida": potencia_kw_requerida,
        "potenciaRealKwp": potencia_real_kwp,
        "cantidadPaneles": cantidad_paneles,
        "superficieTechoRequerida": superficie_techo_m2,
        "inversorSugerido": inversor_sugerido,
        "bateriaSugerida": bateria_sugerida,
        "ahorroMensualClp": ahorro_mensual_clp,
        "ahorroAnualClp": ahorro_anual_clp,
        "retornoInversionAnios": 3.8,
        "co2EvitadoToneladas": co2_evitado,
        "observacion_ia": f"Dimensionamiento preliminar para {datos.comuna}, {datos.region or 'Chile'}. Sistema óptimo estimado con paneles monocristalinos Tier-1."
    }

@router.get("/", response_model=List[schemas.CotizacionResponse])
def obtener_cotizaciones(db: Session = Depends(get_db)):
    return db.query(models.Cotizacion).all()

@router.put("/{cotizacion_id}", response_model=schemas.CotizacionResponse)
def actualizar_estado_cotizacion(
    cotizacion_id: int, 
    nuevo_estado: str, 
    db: Session = Depends(get_db), 
    admin_email: str = Depends(get_current_admin)
):
    cotizacion = db.query(models.Cotizacion).filter(models.Cotizacion.id == cotizacion_id).first()
    
    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    
    cotizacion.estado = nuevo_estado
    db.commit()
    db.refresh(cotizacion)
    return cotizacion

