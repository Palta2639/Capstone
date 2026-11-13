"use client";

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAlert } from './AlertContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [carrito, setCarrito] = useState([]);
  const [montado, setMontado] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { mostrarAlerta } = useAlert();

  const abrirCarrito = useCallback(() => setIsCartOpen(true), []);
  const cerrarCarrito = useCallback(() => setIsCartOpen(false), []);

  // Cargar del localStorage en el cliente después de montar para sincronía perfecta con SSR
  useEffect(() => {
    try {
      const carritoGuardado = localStorage.getItem('carrito-anglo');
      if (carritoGuardado) {
        setCarrito(JSON.parse(carritoGuardado));
      }
    } catch (error) {
      console.error('Error cargando carrito:', error);
    }
    setMontado(true);
  }, []);

  // Guardar en localStorage cada vez que cambia el carrito (solo tras el montaje inicial)
  useEffect(() => {
    if (montado) {
      localStorage.setItem('carrito-anglo', JSON.stringify(carrito));
    }
  }, [carrito, montado]);

  const agregarAlCarrito = useCallback((producto, cantidad = 1) => {
    setCarrito((prev) => {
      const index = prev.findIndex((item) => item.id === producto.id);
      if (index !== -1) {
        // Si ya existe, sumamos la cantidad
        const nuevoCarrito = [...prev];
        nuevoCarrito[index].cantidad += cantidad;
        return nuevoCarrito;
      }
      // Si es nuevo, lo añadimos
      return [...prev, { ...producto, cantidad }];
    });
    
    mostrarAlerta(`${cantidad} x ${producto.nombre} añadido al carrito`, 'success');
  }, [mostrarAlerta]);

  const eliminarDelCarrito = useCallback((idProducto) => {
    setCarrito((prev) => prev.filter((item) => item.id !== idProducto));
    mostrarAlerta('Producto eliminado del carrito', 'error'); // error rojo por probar
  }, [mostrarAlerta]);

  const vaciarCarrito = useCallback(() => {
    setCarrito([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem('carrito-anglo');
    }
  }, []);

  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <CartContext.Provider value={{ 
      carrito, 
      agregarAlCarrito, 
      eliminarDelCarrito, 
      vaciarCarrito, 
      totalItems,
      isCartOpen,
      setIsCartOpen,
      abrirCarrito,
      cerrarCarrito,
      montado
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Hook personalizado
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};
