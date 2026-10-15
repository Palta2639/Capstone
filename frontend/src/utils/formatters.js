// Utilidad para formatear números a moneda (Pesos Chilenos)
export const formatearMoneda = (valor) => {
  if (valor === undefined || valor === null) return "$0";
  
  // Si ya viene como string con "$", limpiamos todo menos los números
  const numerico = typeof valor === 'string' 
    ? parseInt(valor.replace(/\D/g, ''), 10) 
    : parseInt(valor, 10);
    
  if (isNaN(numerico)) return valor; // Fallback si no es un número
  
  return `$${numerico.toLocaleString('es-CL')}`;
};

// Utilidad para calcular un precio con descuento
export const calcularDescuento = (precioBase, porcentajeDescuento) => {
  const numerico = typeof precioBase === 'string' 
    ? parseInt(precioBase.replace(/\D/g, ''), 10) 
    : parseInt(precioBase, 10);
    
  if (isNaN(numerico)) return 0;
  
  const montoDescuento = numerico * (porcentajeDescuento / 100);
  return numerico - montoDescuento;
};
