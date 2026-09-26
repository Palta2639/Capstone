"use client";

import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/src/components/ProductCard";

const TRABAJOS_REALIZADOS = [
  { id: "slide1", src: "/trabajo-1.jpg", alt: "Instalación de paneles solares 1" },
  { id: "slide2", src: "/trabajo-2.jpg", alt: "Instalación de paneles solares 2" },
  { id: "slide3", src: "/trabajo-3.jpg", alt: "Instalación de paneles solares 3" },
];

const PRODUCTOS_DESTACADOS = [
  { id: 1, nombre: "Panel Solar 500W Monocristalino", precio: "$120.000", categoria: "Paneles", imagen: "/panel-solar.png" },
  { id: 2, nombre: "Inversor Híbrido 5kW", precio: "$850.000", categoria: "Inversores", imagen: "/inversor-must.png" },
  { id: 3, nombre: "Batería Litio 48V 100Ah", precio: "$1.200.000", categoria: "Baterías", imagen: "/bateria-felicity.png" },
];

export default function Inicio() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <section className="flex flex-col md:flex-row items-stretch gap-6 md:gap-8 mb-24 h-auto md:h-125">
        
        <div className="order-2 md:order-1 flex-1 flex flex-col justify-center p-8 md:p-12 rounded-3xl transition-all duration-500 bg-white text-[#0F2547] shadow-xl hover:bg-[#0F2547]/85 hover:text-white hover:backdrop-blur-sm group border border-gray-100 hover:border-[#00fc82]/50 hover:shadow-2xl hover:shadow-[#0F2547]/40 cursor-default">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 group-hover:text-[#00fc82] transition-colors duration-500">
            Energía Inteligente para tu Futuro
          </h1>
          <p className="text-lg md:text-xl font-medium mb-8 opacity-90 leading-relaxed">
            Especialistas en soluciones solares de alto rendimiento. Diseñamos, implementamos y garantizamos sistemas fotovoltaicos que transforman la energía de tu empresa u hogar.
          </p>
          <div className="flex gap-4">
            <Link href="/catalogo" className="btn bg-[#0F2547] text-white hover:opacity-80 border-none font-bold rounded-xl px-6 transition-all group-hover:bg-[#00fc82] group-hover:text-[#0F2547] group-hover:-translate-y-1 shadow-lg shadow-[#0F2547]/20 group-hover:shadow-[#00fc82]/40">
              Ver Catálogo
            </Link>
            <button className="btn btn-outline border-[#0F2547] text-[#0F2547] hover:bg-white hover:text-[#0F2547] rounded-xl px-6 group-hover:border-white group-hover:text-white transition-colors">
              Cotizar Kit con IA
            </button>
          </div>
        </div>
        
        <div className="order-1 md:order-2 flex flex-col w-full md:w-1/2 shrink-0">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4 md:mb-6 text-[#0F2547] text-center md:text-left">
            Nuestros Proyectos Recientes
          </h2>

          <div className="relative flex-none md:flex-1 w-full rounded-3xl overflow-hidden shadow-xl group h-75 md:h-auto bg-gray-100">
            <div className="carousel absolute inset-0 w-full h-full">
              {TRABAJOS_REALIZADOS.map((trabajo) => (
                <div key={trabajo.id} id={trabajo.id} className="carousel-item w-full h-full relative">
                  <div className="absolute inset-0 bg-[#0F2547]/5"></div> 
                  <Image
                    src={trabajo.src}
                    alt={trabajo.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </div>
              ))}
            </div>
            
            <div className="absolute bottom-4 left-0 w-full flex justify-center gap-3 z-10 pointer-events-none">
              {TRABAJOS_REALIZADOS.map((trabajo, index) => (
                <button 
                  key={`btn-${trabajo.id}`} 
                  onClick={(e) => {
                    e.preventDefault();
                    const target = document.getElementById(trabajo.id);
                    if (target) {
                      target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
                    }
                  }}
                  className="btn btn-sm btn-circle bg-white text-[#0F2547] hover:bg-[#00fc82]! hover:text-[#0F2547]! border-none shadow-xl transition-colors font-bold pointer-events-auto"
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
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
          {PRODUCTOS_DESTACADOS.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>
        
        <div className="flex justify-center mt-12">
          <Link href="/catalogo" className="btn btn-outline border-[#0F2547] text-[#0F2547] hover:bg-[#0F2547] hover:text-white px-8 rounded-full">
            Ver todo el catálogo →
          </Link>
        </div>
      </section>
      
    </main>
  );
}