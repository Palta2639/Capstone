"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiShoppingBag, FiArrowLeft, FiLock, FiLogIn, FiHome } from "react-icons/fi";
import { orderService } from "@/src/services/api";
import { formatearMoneda } from "@/src/utils/formatters";

export default function MisPedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [noAutorizado, setNoAutorizado] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarInicial() {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        if (activo) {
          setNoAutorizado(true);
          setCargando(false);
        }
        return;
      }

      try {
        const datos = await orderService.getMyOrders();
        if (activo && Array.isArray(datos)) {
          setPedidos(datos);
        }
      } catch (err) {
        if (!activo) return;
        if (err.response && err.response.status === 401) {
          setNoAutorizado(true);
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarInicial();

    const handleAuthChange = () => {
      cargarInicial();
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => {
      activo = false;
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  // Si no está autenticado o expiró la sesión
  if (noAutorizado) {
    return (
      <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm">
            <FiLock className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-[#0F2547]">
            Inicia Sesión para Ver tus Pedidos
          </h2>

          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
            Tu sesión ha expirado o necesitas identificarte para consultar el historial de tus compras y pedidos solares.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => window.dispatchEvent(new Event("open-auth-modal"))}
              className="btn bg-[#0F2547] hover:bg-[#1a3865] text-white font-bold rounded-xl border-none shadow-sm flex-1 text-xs sm:text-sm justify-center gap-2"
            >
              <FiLogIn className="w-4 h-4 text-[#00fc82]" />
              <span>Iniciar Sesión</span>
            </button>

            <Link
              href="/"
              className="btn bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl border-none shadow-sm flex-1 text-xs sm:text-sm justify-center gap-2"
            >
              <FiHome className="w-4 h-4" />
              <span>Inicio</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/perfil" className="text-xs font-bold text-gray-500 hover:text-[#0F2547] flex items-center gap-1">
                <FiArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Mi Perfil</span>
              </Link>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0F2547]">
              Mis Pedidos y Compras
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Historial detallado de tus transacciones y compras de equipos solares.
            </p>
          </div>

          <Link
            href="/catalogo"
            className="btn btn-sm bg-[#0F2547] hover:bg-[#1a3865] text-white rounded-xl border-none text-xs px-5 shadow-sm"
          >
            Nueva Compra
          </Link>
        </div>

        {/* Lista de pedidos */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
          {cargando ? (
            <div className="py-12 text-center text-xs font-bold uppercase tracking-widest text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0F2547] mx-auto mb-3"></div>
              Cargando historial de compras...
            </div>
          ) : pedidos.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gray-50 text-gray-300 flex items-center justify-center mb-4">
                <FiShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">
                No tienes compras registradas aún
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                Cuando realices una compra de paneles, inversores o kits solares, podrás monitorear aquí su estado.
              </p>
              <Link
                href="/catalogo"
                className="btn btn-sm bg-[#0F2547] hover:bg-[#1a3865] text-white rounded-xl border-none text-xs px-6 shadow-sm"
              >
                Explorar Catálogo
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {pedidos.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-200/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-[#0F2547]">
                          {p.id}
                        </span>
                        <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${
                          p.estado === "completado"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.estado === "cancelado"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {p.estado}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1 block">
                        Fecha: {p.fecha} · {p.cantidad_items} ítem(s)
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase text-gray-500 font-bold block">
                        Monto Total
                      </span>
                      <span className="text-lg font-black text-[#0F2547]">
                        {formatearMoneda(p.monto_total)}
                      </span>
                    </div>
                  </div>

                  {p.items && p.items.length > 0 && (
                    <div className="mt-3 pt-2 text-xs text-gray-600 space-y-1">
                      {p.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px]">
                          <span>{item.cantidad}x {item.producto_nombre}</span>
                          <span className="font-bold">{formatearMoneda(item.precio_unitario * item.cantidad)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
