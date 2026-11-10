import numpy as np
from modelo_knn import cargar_modelo

modelo = cargar_modelo()

# Orden: consumo mensual en kWh, horas solares pico, cobertura.
entrada = np.array([[
    350,
    4.8,
    1.0,
]])

potencia = int(modelo.predict(entrada)[0])

print("Consumo mensual: 350 kWh")
print("Horas solares pico asumidas: 4.8")
print("Cobertura objetivo: 100 %")
print(f"Potencia de kit predicha: {potencia} Wp")
print(f"Equivalente: {potencia / 1000} kWp")