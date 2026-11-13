"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useCart } from "@/src/context/CartContext";
import { productService } from "@/src/services/api";
import { formatearMoneda } from "@/src/utils/formatters";

const CATEGORIAS = {
  1: "Paneles Solares",
  2: "Inversores",
  3: "Baterías",
  4: "Kits Completos",
  5: "Kits Off-Grid"
};

export default function ProductDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { id } = params;
  
  const { agregarAlCarrito } = useCart();
  const [cantidad, setCantidad] = useState(1);
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const data = await productService.getById(id);
        setProducto({
          ...data,
          imagen: data.imagen_url || "/panel-solar.png",
          categoriaNombre: CATEGORIAS[data.categoria_id] || "Producto"
        });
      } catch (error) {
        console.error("Error al cargar producto", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducto();
  }, [id]);

  const incrementar = () => setCantidad(prev => prev + 1);
  const decrementar = () => setCantidad(prev => (prev > 1 ? prev - 1 : 1));

  if (loading) return <div className="text-center py-20">Cargando producto...</div>;
  if (!producto) return <div className="text-center py-20 text-red-500">Producto no encontrado</div>;

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl bg-white">
      <div className="text-sm breadcrumbs mb-6 text-[#0F2547] font-medium">
        <ul>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/catalogo">Categorías</Link></li>
          <li><Link href="/catalogo">{producto.categoriaNombre}</Link></li>
          <li className="text-gray-500 font-normal">{producto.nombre}</li>
        </ul>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Columna Izquierda: Imagen Única */}
        <div className="w-full md:w-1/2 flex">
          <div className="flex-1 relative min-h-100 border border-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
            <Image 
              src={producto.imagen}
              alt={producto.nombre}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-8 transition-opacity duration-300"
              priority
            />
            <div className="absolute bottom-4 text-center w-full text-xs text-gray-400 italic">
              Imagen referencial
            </div>
          </div>
        </div>

        {/* Columna Derecha: Detalles */}
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="flex gap-2 mb-3">
            <span className="bg-[#00fc82]/20 text-[#0F2547] text-xs font-bold px-2 py-1 rounded-sm uppercase">{producto.categoriaNombre}</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F2547] leading-tight mb-2">
            {producto.nombre}
          </h1>
          
          <p className="text-xs text-gray-400 mb-4">SKU: AE-00000{producto.id}</p>
          
          <p className="text-sm font-semibold text-[#00fc82] mb-6 uppercase">ANGLO ELECTRIC</p>

          {/* Caja de precios limpia (sin ofertas falsas) */}
          <div className="w-full max-w-sm flex flex-col gap-2 mb-8">
            <div className="flex flex-col">
              <span className="text-gray-500 text-sm">Precio Final</span>
              <span className="text-4xl font-black text-[#0F2547] tracking-tight">{formatearMoneda(producto.precio)}</span>
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Impuestos incluidos (IVA).
            </div>
          </div>

          {/* Selector de cantidad y Botones */}
          <div className="flex flex-col gap-4 max-w-sm mb-8">
            {/* Selector de cantidad simple */}
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 h-12 w-full rounded-md px-2">
              <span className="text-gray-500 text-sm font-medium ml-2">Cantidad:</span>
              <div className="flex items-center gap-3">
                <button aria-label="Disminuir" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-[#0F2547] font-bold" onClick={decrementar}>-</button>
                <span className="font-bold text-[#0F2547] w-4 text-center">{cantidad}</span>
                <button aria-label="Aumentar" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-[#0F2547] font-bold" onClick={incrementar}>+</button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  agregarAlCarrito(producto, cantidad);
                  setCantidad(1);
                }}
                className="btn w-full bg-[#0F2547] text-white hover:bg-[#00fc82] hover:text-[#0F2547] border-none rounded-md font-bold text-base h-12 transition-colors"
              >
                Agregar al carro
              </button>
              <button className="btn w-full bg-[#0F2547] text-white hover:bg-[#00fc82] hover:text-[#0F2547] border-none shadow-md rounded-md font-bold text-base h-12 transition-colors">
                Comprar ahora
              </button>
            </div>
          </div>
          


        </div>
      </div>
      
      {/* Descripción inferior (para simular el scroll) */}
      <div className="mt-16 pt-8 border-t border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Descripción del producto</h3>
        <p className="text-gray-600 max-w-3xl leading-relaxed">{producto.descripcion}</p>
      </div>
    </main>
  );
}
