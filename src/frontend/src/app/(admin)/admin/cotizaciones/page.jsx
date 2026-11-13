"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  FiFileText, 
  FiSearch, 
  FiRefreshCw, 
  FiCheckCircle, 
  FiClock, 
  FiMapPin, 
  FiZap 
} from "react-icons/fi";
import { cotizacionService } from "@/src/services/api";
import { formatearMoneda } from "@/src/utils/formatters";
import { sanitizeSearch } from "@/src/utils/validations";

export default function AdminCotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [mensajeExito, setMensajeExito] = useState("");

  const cargarCotizaciones = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setActualizando(true);

    try {
      const data = await cotizacionService.getAll();
      if (Array.isArray(data)) {
        setCotizaciones(data);
      }
    } catch (err) {
      console.error("Error cargando cotizaciones:", err);
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    cargarCotizaciones();
  }, [cargarCotizaciones]);

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await cotizacionService.updateEstado(id, nuevoEstado);
      setCotizaciones((prev) =>
        prev.map((c) => (c.id === id ? { ...c, estado: nuevoEstado } : c))
      );
      setMensajeExito(`Estado de la cotización COT-${id} actualizado a "${nuevoEstado}".`);
      setTimeout(() => setMensajeExito(""), 3500);
    } catch (err) {
      console.error("Error actualizando estado de cotización:", err);
    }
  };

  const cotizacionesFiltradas = useMemo(() => {
    return cotizaciones.filter((c) => {
      const busquedaLimpia = filtroBusqueda.toLowerCase().trim();
      const coincide =
        !busquedaLimpia ||
        (c.comuna && c.comuna.toLowerCase().includes(busquedaLimpia)) ||
        String(c.id).includes(busquedaLimpia);

      if (!coincide) return false;
      if (filtroEstado !== "todos" && c.estado !== filtroEstado) return false;
      return true;
    });
  }, [cotizaciones, filtroBusqueda, filtroEstado]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 w-full">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0F2547] tracking-tight">
            Gestión de Solicitudes y Cotizaciones
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Monitorea los proyectos fotovoltaicos dimensionados por los clientes en el cotizador.
          </p>
        </div>

        <button
          onClick={() => cargarCotizaciones(true)}
          disabled={actualizando}
          className="btn btn-sm w-full sm:w-auto bg-[#0F2547] hover:bg-[#1a3865] text-white rounded-xl border-none shadow-sm gap-2 justify-center"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${actualizando ? "animate-spin" : ""}`} />
          <span>{actualizando ? "Actualizando..." : "Sincronizar"}</span>
        </button>
      </div>

      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Tabla con Buscador y Filtros */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#0F2547]">
              Cotizaciones Registradas ({cotizaciones.length})
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Haz clic en el selector de cada orden para cambiar su estado comercial.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            {/* Buscador */}
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(sanitizeSearch(e.target.value))}
                placeholder="Buscar por comuna o ID..."
                className="input input-sm w-full pl-9 bg-gray-50 border-gray-200 text-xs rounded-xl focus:border-[#0F2547]"
              />
            </div>

            {/* Filtro por estado */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="select select-sm bg-gray-50 border-gray-200 text-xs rounded-xl font-medium w-full sm:w-auto"
            >
              <option value="todos">Todos los Estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="contactado">Contactado</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="table w-full min-w-[650px] text-left text-xs">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-600 uppercase text-[10px] tracking-wider font-extrabold">
                <th className="py-3 px-4">ID Cotización</th>
                <th className="py-3 px-4">Comuna</th>
                <th className="py-3 px-4">Consumo Mensual</th>
                <th className="py-3 px-4">Presupuesto</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4 text-center">Estado Comercial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-gray-600">
                    Cargando cotizaciones desde el servidor...
                  </td>
                </tr>
              ) : cotizacionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-600">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FiFileText className="w-8 h-8 text-gray-300" />
                      <span className="font-bold text-gray-700 text-sm">
                        No hay cotizaciones registradas
                      </span>
                      <span className="text-xs text-gray-400 max-w-sm">
                        Las cotizaciones generadas por usuarios en el cotizador IA aparecerán aquí de forma inmediata.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                cotizacionesFiltradas.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0F2547]">
                      COT-{c.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-800">
                      <div className="flex items-center gap-1.5">
                        <FiMapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{c.comuna || "No especificada"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <FiZap className="w-3.5 h-3.5 text-amber-500" />
                        <span>{c.consumo_kwh_mensual ? `${c.consumo_kwh_mensual} kWh/mes` : "No indicado"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 font-bold">
                      {c.presupuesto_estimado ? formatearMoneda(c.presupuesto_estimado) : "A convenir"}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      {c.fecha_solicitud ? new Date(c.fecha_solicitud).toLocaleDateString("es-CL") : "Reciente"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={c.estado || "pendiente"}
                        onChange={(e) => handleCambiarEstado(c.id, e.target.value)}
                        className={`select select-xs rounded-lg font-bold text-[10px] uppercase tracking-wider border ${
                          c.estado === "aprobada"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : c.estado === "contactado"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : c.estado === "rechazada"
                            ? "bg-red-50 text-red-800 border-red-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="contactado">Contactado</option>
                        <option value="aprobada">Aprobada</option>
                        <option value="rechazada">Rechazada</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}

