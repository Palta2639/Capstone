"use client";

import { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [alertas, setAlertas] = useState([]);

  // Lógica compleja para agregar alertas temporales (Toasts)
  const mostrarAlerta = useCallback((mensaje, tipo = 'success') => {
    const id = Date.now();
    setAlertas((prev) => [...prev, { id, mensaje, tipo }]);

    // Auto-eliminar la alerta después de 3 segundos
    setTimeout(() => {
      setAlertas((prev) => prev.filter((alerta) => alerta.id !== id));
    }, 3000);
  }, []);

  return (
    <AlertContext.Provider value={{ alertas, mostrarAlerta }}>
      {children}
      {/* Renderizado de las alertas globales */}
      <div className="toast toast-bottom toast-center z-50">
        {alertas.map((alerta) => (
          <div 
            key={alerta.id} 
            className={`alert text-white shadow-lg ${
              alerta.tipo === 'success' ? 'bg-[#00fc82] text-[#0F2547] border-none font-bold' 
              : 'bg-red-500'
            }`}
          >
            <span>{alerta.mensaje}</span>
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
}

// Hook personalizado para consumir las alertas
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert debe ser usado dentro de un AlertProvider');
  }
  return context;
};
