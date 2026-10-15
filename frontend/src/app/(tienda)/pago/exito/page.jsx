"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  FiCheckCircle, 
  FiHome, 
  FiShoppingBag, 
  FiFileText, 
  FiShield, 
  FiMail 
} from "react-icons/fi";

function ExitoContent() {
  const searchParams = useSearchParams();
  const ordenParam = searchParams.get("orden") || searchParams.get("id");

  const numeroOrden = useMemo(() => {
    if (ordenParam) {
      return ordenParam.startsWith("ORD-") ? ordenParam : `ORD-${ordenParam}`;
    }
    return "ORD-CONFIRMADA";
  }, [ordenParam]);

  const fechaActual = useMemo(() => {
    return new Date().toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  return (
    <div className="max-w-2xl w-full bg-white p-6 sm:p-10 rounded-3xl border border-gray-100 shadow-xl text-center space-y-6">
      
      {/* Icono de éxito */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm">
        <FiCheckCircle className="w-8 h-8 sm:w-10 sm:h-10" />
      </div>

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
          Transacción Aprobada
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0F2547] mt-3 tracking-tight">
          ¡Pago Procesado con Éxito!
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
          Hemos recibido tu orden correctamente. Nuestro equipo técnico comenzará la preparación de tus componentes solares.
        </p>
      </div>

      {/* Tarjeta de comprobante y slots para backend */}
      <div className="bg-gray-50/70 p-5 sm:p-6 rounded-2xl border border-gray-100 text-left space-y-3.5 text-xs">
        
        <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
          <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">
            Número de Orden
          </span>
          <span className="font-mono font-black text-sm text-[#0F2547]">
            {numeroOrden}
          </span>
        </div>

        <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
          <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">
            Fecha y Hora
          </span>
          <span className="font-medium text-gray-800">
            {fechaActual || "Hoy"}
          </span>
        </div>

        {/* Slot preparado para factura / boleta por el equipo backend */}
        <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
          <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
            <FiFileText className="w-3.5 h-3.5 text-[#00fc82]" />
            <span>Factura / Boleta Electrónica</span>
          </span>
          <span className="text-[11px] font-semibold text-gray-400 bg-gray-200/60 px-2 py-0.5 rounded">
            En emisión por backend
          </span>
        </div>

        <div className="flex justify-between items-center pt-1">
          <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
            <FiShield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Garantía Técnica</span>
          </span>
          <span className="font-bold text-emerald-700">
            Anglo Electric Certificada
          </span>
        </div>

      </div>

      {/* Mensaje de despacho */}
      <div className="text-xs text-gray-500 bg-blue-50/50 border border-blue-100/60 p-4 rounded-2xl text-left flex items-start gap-3">
        <FiMail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#0F2547] block mb-0.5">Notificación de Despacho</span>
          <span>Te enviaremos los detalles de seguimiento y confirmación al correo registrado en tu cuenta.</span>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          href="/"
          className="btn bg-[#0F2547] hover:bg-[#1a3865] text-white font-bold rounded-xl border-none shadow-sm flex-1 text-xs sm:text-sm justify-center"
        >
          <FiHome className="w-4 h-4 text-[#00fc82]" />
          <span>Volver al Inicio</span>
        </Link>

        <Link
          href="/mis-pedidos"
          className="btn bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl border-none shadow-sm flex-1 text-xs sm:text-sm justify-center"
        >
          <FiShoppingBag className="w-4 h-4" />
          <span>Ver Mis Pedidos</span>
        </Link>
      </div>

    </div>
  );
}

export default function PagoExitoPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Suspense fallback={
        <div className="text-center text-xs text-gray-500 font-bold">
          Cargando comprobante de pago...
        </div>
      }>
        <ExitoContent />
      </Suspense>
    </div>
  );
}
