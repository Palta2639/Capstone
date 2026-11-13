"use client";

import { useCart } from "@/src/context/CartContext";
import { formatearMoneda } from "@/src/utils/formatters";
import Image from "next/image";
import Link from "next/link";
import { FiTrash2 } from "react-icons/fi";

export default function CartSidebar({ isOpen, onClose }) {
  const { carrito, eliminarDelCarrito, vaciarCarrito, totalItems, montado } = useCart();

  // Calcular el total a pagar
  const totalPagar = carrito.reduce((sum, item) => {
    const precioNumerico = typeof item.precio === 'string'
      ? parseInt(item.precio.replace(/\D/g, ''), 10)
      : parseInt(item.precio, 10);
    return sum + (isNaN(precioNumerico) ? 0 : precioNumerico * item.cantidad);
  }, 0);

  return (
    <>
      {/* Fondo oscuro semi-transparente (Backdrop) */}
      <div 
        className={`fixed inset-0 bg-black/40 z-60 transition-opacity duration-300 backdrop-blur-sm ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      ></div>

      {/* Panel lateral del carrito */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-96 md:w-112.5 bg-white z-70 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Cabecera del Sidebar */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-extrabold text-[#0F2547] flex items-center gap-2">
            Tu Carrito
            <span className="bg-[#00fc82] text-[#0F2547] text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {montado ? totalItems : 0}
            </span>
          </h2>
          <div className="flex items-center gap-2">
            {carrito.length > 0 && (
              <button 
                onClick={vaciarCarrito}
                className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50 flex items-center gap-1.5 border border-gray-200 cursor-pointer"
                title="Limpiar todos los productos del carrito"
              >
                <FiTrash2 className="text-sm text-red-500" />
                <span>Limpiar carrito</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle text-gray-500 hover:bg-gray-100"
              aria-label="Cerrar carrito"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Lista de Productos (Con Scroll) */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-gray-50/50">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <p className="text-lg font-medium">Tu carrito está vacío</p>
              <Link 
                href="/catalogo"
                onClick={onClose} 
                className="btn bg-[#0F2547] text-white hover:bg-[#00fc82] hover:text-[#0F2547] border-none mt-2"
              >
                Explorar Productos
              </Link>
            </div>
          ) : (
            carrito.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex gap-4 relative group">
                <div className="w-20 h-20 bg-slate-50 rounded-xl relative shrink-0 border border-gray-100 overflow-hidden flex items-center justify-center">
                  {item.imagen ? (
                    <Image src={item.imagen} alt={item.nombre} fill sizes="80px" className="object-contain p-2" />
                  ) : (
                    <span className="text-xs text-gray-400">Sin foto</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-bold text-[#0F2547] text-sm line-clamp-2 leading-tight">{item.nombre}</h3>
                    <p className="text-xs text-gray-400 mt-1">Cant: {item.cantidad}</p>
                  </div>
                  <div className="font-extrabold text-[#0F2547]">{formatearMoneda(item.precio)}</div>
                </div>
                <button 
                  onClick={() => eliminarDelCarrito(item.id)}
                  className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors p-1"
                  aria-label="Eliminar producto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer del Sidebar (Total y Botón de Pago) */}
        {carrito.length > 0 && (
          <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-500 font-medium">Subtotal</span>
              <span className="text-2xl font-black text-[#0F2547]">{formatearMoneda(totalPagar)}</span>
            </div>
            <Link 
              href="/checkout"
              onClick={onClose}
              className="btn w-full bg-[#00fc82] text-[#0F2547] hover:bg-[#00e074] border-none shadow-md font-bold text-lg h-14 rounded-xl"
            >
              Proceder al Pago
            </Link>
            <button
              onClick={vaciarCarrito}
              className="w-full mt-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FiTrash2 className="text-xs" />
              <span>Limpiar todo el carrito</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
