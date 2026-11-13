"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NotFound from '@/src/app/not-found';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      queueMicrotask(() => setIsDenied(true));
      return;
    }
    
    try {
      // Decodificamos el Payload del JWT en el navegador
      const base64Url = token.split('.')[1];
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      const payload = JSON.parse(window.atob(base64));
      
      if (payload.rol_id !== 1) {
        queueMicrotask(() => setIsDenied(true));
      } else {
        queueMicrotask(() => setIsAuthorized(true));
      }
    } catch (e) {
      console.error("Error validando token:", e);
      queueMicrotask(() => setIsDenied(true));
    }
  }, [router]);

  if (isDenied) {
    return <NotFound />;
  }

  if (!isAuthorized) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0F2547] text-[#00fc82]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00fc82] mb-4"></div>
        <p className="font-bold tracking-widest text-xs sm:text-sm">VERIFICANDO CREDENCIALES...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-100 text-gray-900">
      
      {/* BARRA SUPERIOR PARA MÓVILES */}
      <header className="md:hidden bg-[#0F2547] text-white px-4 py-3 flex items-center justify-between border-b border-white/10 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-anglo.png"
            alt="Anglo Electric"
            width={120}
            height={32}
            className="h-7 w-auto object-contain"
            priority
          />
          <span className="text-[10px] font-bold text-[#00fc82] tracking-wider uppercase bg-white/10 px-2 py-0.5 rounded">
            Admin
          </span>
        </div>

        <button
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none"
          aria-label="Abrir menú"
        >
          {menuAbierto ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* OVERLAY OSCURO EN MÓVIL CUANDO EL MENÚ ESTÁ ABIERTO */}
      {menuAbierto && (
        <div
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* BARRA LATERAL (SIDEBAR ESCRITORIO + DRAWER MÓVIL) */}
      <aside
        className={`
          fixed md:static top-0 bottom-0 left-0 w-64 bg-[#0F2547] text-white flex flex-col justify-between shadow-2xl md:shadow-xl z-50 md:z-20
          transition-transform duration-300 ease-in-out
          ${menuAbierto ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div>
          <div className="p-6 border-b border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Image
                src="/logo-anglo.png"
                alt="Anglo Electric"
                width={150}
                height={40}
                className="h-8 object-contain"
                style={{ width: "auto" }}
                priority
              />
              <button
                onClick={() => setMenuAbierto(false)}
                className="md:hidden text-gray-400 hover:text-white p-1"
                aria-label="Cerrar menú"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <span className="text-xs font-bold text-[#00fc82] tracking-widest uppercase">
              Panel de Administrador
            </span>
          </div>

          <nav className="p-4 space-y-2 mt-2">
            <Link
              href="/admin"
              onClick={() => setMenuAbierto(false)}
              className="block px-4 py-3 rounded-xl font-medium hover:bg-[#00fc82] hover:text-[#0F2547] transition-all"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/crud"
              onClick={() => setMenuAbierto(false)}
              className="block px-4 py-3 rounded-xl font-medium hover:bg-[#00fc82] hover:text-[#0F2547] transition-all"
            >
              Inventario (CRUD)
            </Link>
            <Link
              href="/admin/cotizaciones"
              onClick={() => setMenuAbierto(false)}
              className="block px-4 py-3 rounded-xl font-medium hover:bg-[#00fc82] hover:text-[#0F2547] transition-all"
            >
              Cotizaciones
            </Link>
          </nav>
        </div>
        
        <div className="p-4 mb-4">
          <Link
            href="/"
            onClick={() => setMenuAbierto(false)}
            className="flex px-4 py-3 rounded-xl text-red-300 hover:bg-red-500 hover:text-white font-medium transition-all shadow-sm justify-between items-center group"
          >
            <span>Salir a Tienda</span>
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
          </Link>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

    </div>
  );
}
