"use client";

import Link from "next/link";
import { FiXCircle, FiHome, FiRefreshCw, FiHelpCircle } from "react-icons/fi";

export default function PagoFalloPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl w-full bg-white p-6 sm:p-10 rounded-3xl border border-gray-100 shadow-xl text-center space-y-6">
        
        {/* Icono de fallo */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shadow-sm">
          <FiXCircle className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-red-700 bg-red-50 px-3 py-1 rounded-full">
            Transacción No Completada
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F2547] mt-3 tracking-tight">
            El Pago No Pudo Ser Procesado
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
            No se realizó ningún cobro en tu cuenta o tarjeta bancaria. La orden ha quedado en estado pendiente.
          </p>
        </div>

        {/* Explicación de motivos habituales */}
        <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100 text-left space-y-2.5 text-xs">
          <span className="font-bold text-gray-700 block text-xs uppercase tracking-wider">
            Posibles motivos del rechazo:
          </span>
          <ul className="space-y-1.5 text-gray-600 list-disc list-inside">
            <li>Fondos o cupo disponible insuficiente en la tarjeta.</li>
            <li>Rechazo de seguridad preventiva por parte de tu banco emisor.</li>
            <li>Tiempo de espera (timeout) excedido en la pasarela de pagos.</li>
            <li>Cancelación voluntaria del proceso de pago.</li>
          </ul>
        </div>

        {/* Soporte */}
        <div className="text-xs text-gray-500 flex items-center justify-center gap-2">
          <FiHelpCircle className="w-4 h-4 text-gray-400" />
          <span>Si el problema persiste, puedes contactar al soporte de Anglo Electric.</span>
        </div>

        {/* Botones de acción (ambos redirigen/ofrecen salida al usuario) */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/"
            className="btn bg-[#0F2547] hover:bg-[#1a3865] text-white font-bold rounded-xl border-none shadow-sm flex-1 text-xs sm:text-sm justify-center"
          >
            <FiHome className="w-4 h-4 text-[#00fc82]" />
            <span>Volver al Inicio</span>
          </Link>

          <Link
            href="/catalogo"
            className="btn bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl border-none shadow-sm flex-1 text-xs sm:text-sm justify-center"
          >
            <FiRefreshCw className="w-4 h-4 text-[#0F2547]" />
            <span>Reintentar en Catálogo</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
