"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/src/context/CartContext";
import { formatearMoneda } from "@/src/utils/formatters";

export default function ProductCard({ producto }) {
  const [cantidad, setCantidad] = useState(1);
  const { agregarAlCarrito } = useCart();

  const incrementar = () => setCantidad(prev => prev + 1);
  const decrementar = () => setCantidad(prev => (prev > 1 ? prev - 1 : 1));

  const handleAgregar = () => {
    agregarAlCarrito(producto, cantidad);
    setCantidad(1); // Reset después de agregar
  };

  const CATEGORIAS = {
    1: "Paneles Solares",
    2: "Inversores",
    3: "Baterías",
    4: "Kits Completos",
    5: "Kits Off-Grid"
  };

  const nombreCategoria = producto.categoria_nombre || CATEGORIAS[producto.categoria_id] || (producto.es_kit ? "Kit Solar" : "Equipo");
  const imagenSegura = producto.imagen_url || "/panel-solar.png";

  return (
    <div className="card bg-white shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full rounded-2xl overflow-hidden group/card">
      <Link href={`/producto/${producto.id}`} className="block relative aspect-4/3 w-full bg-slate-50 shrink-0 overflow-hidden">
        <Image 
          src={imagenSegura} 
          alt={producto.nombre} 
          fill 
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover/card:scale-105 transition-transform duration-300"
        />
      </Link>
      <div className="card-body p-3 md:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start mb-1.5">
            <div className="badge badge-xs md:badge-sm bg-[#00fc82]/20 text-[#0F2547] border-none font-semibold px-2">{nombreCategoria}</div>
          </div>
          <Link href={`/producto/${producto.id}`}>
            <h3 className="card-title text-sm md:text-base font-bold text-[#0F2547] leading-snug mb-1 line-clamp-2 hover:text-[#00fc82] transition-colors">{producto.nombre}</h3>
          </Link>
          <p className="text-lg md:text-2xl font-extrabold text-gray-800 tracking-tight">{formatearMoneda(producto.precio)}</p>
        </div>
        <div className="card-actions mt-3 w-full flex-row flex-nowrap items-center justify-between gap-2">
          <div className="flex items-center justify-between bg-gray-100 rounded-lg overflow-hidden flex-1 border border-gray-200 h-10 md:h-11">
            <button 
              onClick={decrementar}
              aria-label="Disminuir cantidad"
              className="btn btn-xs h-full bg-transparent border-none hover:bg-gray-200 text-[#0F2547] text-xl font-bold w-10 md:w-12 px-0"
            >
              -
            </button>
            <span className="font-bold text-[#0F2547] text-sm md:text-base" aria-live="polite">{cantidad}</span>
            <button 
              onClick={incrementar}
              aria-label="Aumentar cantidad"
              className="btn btn-xs h-full bg-transparent border-none hover:bg-gray-200 text-[#0F2547] text-xl font-bold w-10 md:w-12 px-0"
            >
              +
            </button>
          </div>
          <button 
            onClick={handleAgregar}
            aria-label={`Añadir ${cantidad} ${producto.nombre} al carrito`}
            className="btn btn-sm h-10 md:h-11 w-12 md:w-14 bg-[#0F2547] text-white hover:bg-[#00fc82] hover:text-[#0F2547] border-none shadow-sm transition-colors px-0 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

