"use client";

import { AlertProvider } from '@/src/context/AlertContext';
import { CartProvider } from '@/src/context/CartContext';

// Este componente agrupa todos los Providers que necesitan ser Client Components
export function AppProviders({ children }) {
  return (
    <AlertProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AlertProvider>
  );
}
