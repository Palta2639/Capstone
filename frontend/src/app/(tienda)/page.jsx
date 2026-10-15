"use client";

import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/src/components/ProductCard";
import { useState, useEffect } from "react";
import { productService } from "@/src/services/api";

const TRABAJOS_REALIZADOS = [
  { id: "slide1", src: "/trabajo-1.jpg", alt: "Instalación de paneles solares 1" },
  { id: "slide2", src: "/trabajo-2.jpg", alt: "Instalación de paneles solares 2" },
  { id: "slide3", src: "/trabajo-3.jpg", alt: "Instalación de paneles solares 3" },
];

// Mock data de trabajos realizados para el carrusel (esto sí lo dejamos por ahora)

export default function Inicio() {
  const [slideActual, setSlideActual] = useState(0);
  const [productosDestacados, setProductosDestacados] = useState([]);

  useEffect(() => {
    // 1. Carrusel automático
    const intervalo = setInterval(() => {
      setSlideActual((prev) => {
        const siguiente = (prev + 1) % TRABAJOS_REALIZADOS.length;
        const carousel = document.getElementById("carousel-proyectos");
        const elemento = document.getElementById(TRABAJOS_REALIZADOS[siguiente].id);
        
        if (carousel && elemento) {
          carousel.scrollTo({ left: elemento.offsetLeft, behavior: 'smooth' });
        }
        return siguiente;
      });
    }, 4000);

    // 2. Cargar productos desde la base de datos de forma centralizada
    let cancelado = false;
    productService.getAll()
      .then((data) => {
        if (!cancelado && Array.isArray(data)) {
          setProductosDestacados(data.slice(0, 3));
        }
      })
      .catch((err) => {
        console.warn("Backend no disponible temporalmente para productos destacados:", err?.message);
      });

    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <section className="flex flex-col md:flex-row items-stretch gap-6 md:gap-8 mb-24 min-h-112.5 md:min-h-125">
        
        {/* Resumen - Estilo Futurista */}
        <div className="order-2 md:order-1 flex-1 flex flex-col justify-center p-8 md:p-12 rounded-3xl transition-all duration-500 bg-white/40 backdrop-blur-xl border border-gray-200/50 hover:border-[#00fc82]/80 hover:shadow-[0_0_40px_rgba(0,252,130,0.25)] text-[#0F2547] group relative overflow-hidden shadow-lg">
          {/* Fondo animado futurista al hacer hover */}
          <div className="absolute inset-0 bg-linear-to-br from-[#09203F] to-[#00B4D8] opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10"></div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 group-hover:text-white transition-colors duration-500 drop-shadow-sm">
            Energía Inteligente para tu <span className="text-[#0F2547] group-hover:text-[#00fc82] transition-colors duration-500">Futuro</span>
          </h1>
          <p className="text-lg md:text-xl font-medium mb-8 group-hover:text-gray-100 text-gray-700 leading-relaxed transition-colors duration-500">
            Especialistas en soluciones solares de alto rendimiento. Diseñamos, implementamos y garantizamos sistemas fotovoltaicos que transforman la energía de tu empresa u hogar.
          </p>
          <div className="flex gap-4">
            <Link href="/catalogo" className="btn bg-[#0F2547] text-white hover:bg-[#00fc82]/10 hover:text-[#00fc82] hover:border-[#00fc82] border border-transparent font-bold rounded-xl px-6 transition-all shadow-[0_4px_14px_0_rgba(15,37,71,0.39)] group-hover:shadow-[0_0_20px_rgba(0,252,130,0.5)]">
              Ver Catálogo
            </Link>
            <Link href="/cotizador" className="btn btn-outline border-[#0F2547] text-[#0F2547] group-hover:border-[#00fc82] group-hover:text-[#00fc82] rounded-xl px-6 hover:bg-[#00fc82]/10 transition-colors backdrop-blur-sm">
              Cotizador IA
            </Link>
          </div>
        </div>
        
        {/* Carrusel del mismo tamaño exacto */}
        <div className="order-1 md:order-2 flex-1 relative rounded-3xl overflow-hidden shadow-2xl group h-80 md:h-auto border border-gray-200/50 hover:border-[#00B4D8]/80 hover:shadow-[0_0_40px_rgba(0,180,216,0.25)] transition-all duration-500">
          <div className="absolute top-0 left-0 w-full p-6 bg-linear-to-b from-[#09203F]/80 to-transparent z-10 pointer-events-none">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-lg tracking-wide">
              Proyectos Recientes
            </h2>
          </div>
          
          <div id="carousel-proyectos" className="carousel absolute inset-0 w-full h-full">
            {TRABAJOS_REALIZADOS.map((trabajo) => (
              <div key={trabajo.id} id={trabajo.id} className="carousel-item w-full h-full relative">
                <div className="absolute inset-0 bg-[#09203F]/10 group-hover:bg-transparent transition-colors duration-700 z-10 pointer-events-none"></div> 
                <Image
                  src={trabajo.src}
                  alt={trabajo.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            ))}
          </div>
          
          <div className="absolute bottom-6 left-0 w-full flex justify-center gap-3 z-10 pointer-events-none">
            {TRABAJOS_REALIZADOS.map((trabajo, index) => (
              <button 
                key={`btn-${trabajo.id}`} 
                onClick={(e) => {
                  e.preventDefault();
                  setSlideActual(index);
                  const carousel = document.getElementById("carousel-proyectos");
                  const target = document.getElementById(trabajo.id);
                  if (carousel && target) {
                    carousel.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
                  }
                }}
                className={`btn btn-sm btn-circle backdrop-blur-md border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all pointer-events-auto ${slideActual === index ? "bg-[#00fc82] text-[#0F2547]" : "bg-black/40 text-white hover:bg-[#00fc82] hover:text-[#0F2547]"}`}
                aria-label={`Ver proyecto ${index + 1}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </section>
      {/* Sección: Cómo funciona la IA */}
      <section className="mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F2547] mb-4">Descubre el Cotizador Inteligente</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Nuestra Inteligencia Artificial diseña el sistema solar perfecto para tus necesidades en solo 3 pasos, de manera futurista y precisa.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Paso 1 */}
          <div className="bg-linear-to-br from-[#09203F] to-[#00B4D8] p-8 rounded-3xl shadow-xl hover:-translate-y-2 transition-all duration-300 text-center relative overflow-hidden group border border-[#09203F]/50">
            <div className="absolute inset-0 bg-linear-to-tr from-[#00fc82]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-16 h-16 bg-white/10 text-[#00fc82] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg backdrop-blur-md border border-white/10 group-hover:border-[#00fc82]/50 transition-colors relative z-10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 relative z-10">1. Cuéntale a la IA</h3>
            <p className="text-gray-200 relative z-10">
              Explica en tus propias palabras qué necesitas alimentar (electrodomésticos, motores, tu casa entera).
            </p>
          </div>
          
          {/* Paso 2 */}
          <div className="bg-linear-to-br from-[#09203F] to-[#00B4D8] p-8 rounded-3xl shadow-xl hover:-translate-y-2 transition-all duration-300 text-center relative overflow-hidden group border border-[#09203F]/50">
            <div className="absolute inset-0 bg-linear-to-tr from-[#00fc82]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-16 h-16 bg-white/10 text-[#00fc82] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg backdrop-blur-md border border-white/10 group-hover:border-[#00fc82]/50 transition-colors relative z-10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 relative z-10">2. Análisis en Tiempo Real</h3>
            <p className="text-gray-200 relative z-10">
              El motor IA calcula potencias, horas de sol y dimensiona los equipos exactos sin que debas ser un experto.
            </p>
          </div>
          
          {/* Paso 3 */}
          <div className="bg-linear-to-br from-[#09203F] to-[#00B4D8] p-8 rounded-3xl shadow-xl hover:-translate-y-2 transition-all duration-300 text-center relative overflow-hidden group border border-[#09203F]/50">
            <div className="absolute inset-0 bg-linear-to-tr from-[#00fc82]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-16 h-16 bg-white/10 text-[#00fc82] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg backdrop-blur-md border border-white/10 group-hover:border-[#00fc82]/50 transition-colors relative z-10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 relative z-10">3. Recibe tu Kit</h3>
            <p className="text-gray-200 relative z-10">
              Obtén una propuesta completa con los paneles, inversores y baterías 100% compatibles, lista para comprar.
            </p>
          </div>
        </div>
        
        <div className="flex justify-center mt-12">
          <Link href="/cotizador" className="btn bg-[#0F2547] text-white hover:bg-[#00fc82] hover:text-[#0F2547] border-none font-bold rounded-full px-10 py-3 shadow-[0_4px_14px_0_rgba(15,37,71,0.39)] hover:shadow-[0_0_25px_rgba(0,252,130,0.6)] transition-all h-auto">
            <span className="flex items-center gap-2">
              Probar Cotizador IA
              
            </span>
          </Link>
        </div>
      </section>


      <section className="mb-24">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F2547] mb-4">Productos Destacados</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Equipos de alta eficiencia seleccionados para brindarte el mejor rendimiento en tu instalación solar.
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {productosDestacados.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>
        
        <div className="flex justify-center mt-12">
          <Link href="/catalogo" className="btn bg-[#0F2547] text-white hover:bg-[#00fc82] hover:text-[#0F2547] border-none font-bold px-10 py-3 rounded-full shadow-[0_4px_14px_0_rgba(15,37,71,0.39)] hover:shadow-[0_0_25px_rgba(0,252,130,0.6)] transition-all h-auto">
            Ver todo el catálogo →
          </Link>
        </div>
      </section>
      
    </main>
  );
}