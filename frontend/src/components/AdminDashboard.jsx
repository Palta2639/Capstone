"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  FiTrendingUp, 
  FiDollarSign, 
  FiPercent, 
  FiCpu, 
  FiBarChart2, 
  FiRefreshCw, 
  FiSearch, 
  FiSliders, 
  FiPackage, 
  FiCheckCircle,
  FiShoppingBag,
  FiFileText
} from "react-icons/fi";
import { formatearMoneda } from "@/src/utils/formatters";
import { sanitizeSearch } from "@/src/utils/validations";
import { orderService, productService, categoryService, cotizacionService } from "@/src/services/api";

export default function AdminDashboard() {
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [errorBackend, setErrorBackend] = useState(null);

  // Estados con datos directos del backend
  const [metricas, setMetricas] = useState({
    total_ingresos: 0,
    costos_estimados: 0,
    margen_neto: 0,
    porcentaje_margen: 0,
    total_pedidos: 0,
    total_cotizaciones: 0,
    ticket_promedio: 0,
    tasa_conversion: 0,
    valor_inventario: 0,
    total_unidades_stock: 0,
    total_productos: 0,
    total_categorias: 0
  });

  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);

  // Filtros de tabla
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Simulador de margen (almacenado como texto para permitir escritura directa desde teclado)
  const [simPrecioVenta, setSimPrecioVenta] = useState("3500000");
  const [simCostoEquipos, setSimCostoEquipos] = useState("2300000");
  const [simCostoInstalacion, setSimCostoInstalacion] = useState("400000");

  const handleSimInput = (setter) => (e) => {
    // Permite escribir, borrar con Backspace y usar teclado numérico en móvil o físico
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    setter(rawVal);
  };

  // Función para refrescar manualmente
  const refrescarDatos = async () => {
    setActualizando(true);
    setErrorBackend(null);
    try {
      const [resStats, resPedidos, resProductos, resCategorias, resCotizaciones] = await Promise.allSettled([
        orderService.getStats(),
        orderService.getAll(),
        productService.getAll(),
        categoryService.getAll(),
        cotizacionService.getAll()
      ]);

      if (resStats.status === "fulfilled" && resStats.value) setMetricas(resStats.value);
      if (resPedidos.status === "fulfilled" && Array.isArray(resPedidos.value)) setPedidos(resPedidos.value);
      if (resProductos.status === "fulfilled" && Array.isArray(resProductos.value)) setProductos(resProductos.value);
      if (resCategorias.status === "fulfilled" && Array.isArray(resCategorias.value)) setCategorias(resCategorias.value);
      if (resCotizaciones.status === "fulfilled" && Array.isArray(resCotizaciones.value)) setCotizaciones(resCotizaciones.value);
    } catch (err) {
      console.error("Error refrescando métricas:", err);
      setErrorBackend("No fue posible sincronizar los datos con el servidor.");
    } finally {
      setActualizando(false);
    }
  };

  // Carga inicial en montaje
  useEffect(() => {
    let activo = true;

    async function cargarInicial() {
      try {
        const [resStats, resPedidos, resProductos, resCategorias, resCotizaciones] = await Promise.allSettled([
          orderService.getStats(),
          orderService.getAll(),
          productService.getAll(),
          categoryService.getAll(),
          cotizacionService.getAll()
        ]);

        if (!activo) return;
        if (resStats.status === "fulfilled" && resStats.value) setMetricas(resStats.value);
        if (resPedidos.status === "fulfilled" && Array.isArray(resPedidos.value)) setPedidos(resPedidos.value);
        if (resProductos.status === "fulfilled" && Array.isArray(resProductos.value)) setProductos(resProductos.value);
        if (resCategorias.status === "fulfilled" && Array.isArray(resCategorias.value)) setCategorias(resCategorias.value);
        if (resCotizaciones.status === "fulfilled" && Array.isArray(resCotizaciones.value)) setCotizaciones(resCotizaciones.value);
      } catch (err) {
        if (!activo) return;
        console.error("Error en carga inicial:", err);
        setErrorBackend("No fue posible conectar con el servidor.");
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarInicial();

    return () => {
      activo = false;
    };
  }, []);

  // Cálculo en tiempo real del simulador
  const calculoSimulador = useMemo(() => {
    const pVenta = Number(simPrecioVenta) || 0;
    const cEquipos = Number(simCostoEquipos) || 0;
    const cInstalacion = Number(simCostoInstalacion) || 0;
    const costoTotal = cEquipos + cInstalacion;
    const gananciaNeta = pVenta - costoTotal;
    const porcentaje = pVenta > 0 ? (gananciaNeta / pVenta) * 100 : 0;
    return {
      costoTotal,
      gananciaNeta,
      porcentaje: Number(porcentaje.toFixed(2))
    };
  }, [simPrecioVenta, simCostoEquipos, simCostoInstalacion]);

  // Filtrado de pedidos según búsqueda y estado
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      const busquedaLimpia = filtroBusqueda.toLowerCase().trim();
      const coincide = 
        !busquedaLimpia ||
        (p.cliente && p.cliente.toLowerCase().includes(busquedaLimpia)) ||
        (p.id && String(p.id).toLowerCase().includes(busquedaLimpia)) ||
        (p.email && p.email.toLowerCase().includes(busquedaLimpia));

      if (!coincide) return false;
      if (filtroEstado !== "todos" && p.estado !== filtroEstado) return false;
      return true;
    });
  }, [pedidos, filtroBusqueda, filtroEstado]);

  // Desglose de productos por categoría según datos reales de BD
  const distribucionCategorias = useMemo(() => {
    if (!categorias.length || !productos.length) return [];
    
    return categorias.map((cat) => {
      const prodsEnCat = productos.filter((prod) => prod.categoria_id === cat.id);
      const stockTotal = prodsEnCat.reduce((acc, curr) => acc + (curr.stock || 0), 0);
      const valorInventario = prodsEnCat.reduce((acc, curr) => acc + ((curr.precio || 0) * (curr.stock || 0)), 0);

      return {
        id: cat.id,
        nombre: cat.nombre,
        cantidadProductos: prodsEnCat.length,
        stockTotal,
        valorInventario
      };
    });
  }, [categorias, productos]);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12 w-full">
      
      {/* CABECERA RESPONSIVA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0F2547] tracking-tight">
            Panel Analítico y Rendimiento de Ventas
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Monitoreo en tiempo real de facturación, márgenes y estado de inventario.
          </p>
        </div>

        <button
          onClick={refrescarDatos}
          disabled={actualizando}
          className="btn btn-sm w-full sm:w-auto bg-[#0F2547] hover:bg-[#1a3865] text-white rounded-xl border-none shadow-sm gap-2 justify-center"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${actualizando ? "animate-spin" : ""}`} />
          <span>{actualizando ? "Actualizando..." : "Sincronizar"}</span>
        </button>
      </div>

      {errorBackend && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs font-semibold">
          {errorBackend}
        </div>
      )}

      {/* TARJETAS KPI DE RENDIMIENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        
        {/* KPI 1: Facturación Bruta */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-600">
              Facturación Total
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FiDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0F2547] mt-2 sm:mt-3 wrap-break-word">
            {cargando ? "---" : formatearMoneda(metricas.total_ingresos)}
          </div>
          <div className="mt-2 sm:mt-3 flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <span>{metricas.total_pedidos} pedido(s) completado(s)</span>
          </div>
        </div>

        {/* KPI 2: Costos Operativos */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-600">
              Costos de Equipos (COGS)
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FiBarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0F2547] mt-2 sm:mt-3 wrap-break-word">
            {cargando ? "---" : formatearMoneda(metricas.costos_estimados)}
          </div>
          <div className="mt-2 sm:mt-3 flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <span>Costo estimado según volumen</span>
          </div>
        </div>

        {/* KPI 3: Margen Neto Calculado */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-[#00fc82]"></div>
          <div className="flex justify-between items-start">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-600">
              Margen Neto Calculado
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#00fc82]/10 text-emerald-700 flex items-center justify-center shrink-0">
              <FiPercent className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0F2547] mt-2 sm:mt-3 wrap-break-word">
            {cargando ? "---" : formatearMoneda(metricas.margen_neto)}
          </div>
          <div className="mt-2 sm:mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
            <FiTrendingUp className="w-3.5 h-3.5" />
            <span>{metricas.porcentaje_margen}% de rentabilidad</span>
          </div>
        </div>

        {/* KPI 4: Conversión y Cotizaciones */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-600">
              Cotizaciones vs Ventas
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <FiFileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0F2547] mt-2 sm:mt-3 wrap-break-word">
            {cargando ? "---" : `${metricas.tasa_conversion}%`}
          </div>
          <div className="mt-2 sm:mt-3 flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <span>{cotizaciones.length} cotizaciones registradas</span>
          </div>
        </div>

      </div>

      {/* RESUMEN DE INVENTARIO Y STOCK EN BODEGA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Inventario Físico en Bodega */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <FiPackage className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#0F2547] text-sm">Valor de Inventario Físico</h3>
              <p className="text-[11px] text-gray-500">Capital acumulado en bodega</p>
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-[#0F2547] mt-2">
            {cargando ? "---" : formatearMoneda(metricas.valor_inventario)}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-gray-100">
            <div className="bg-gray-50 p-3 rounded-xl sm:rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-gray-600 block">Total Unidades</span>
              <span className="text-base sm:text-lg font-black text-[#0F2547]">{metricas.total_unidades_stock} un.</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl sm:rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-gray-600 block">Productos Activos</span>
              <span className="text-base sm:text-lg font-black text-[#0F2547]">{metricas.total_productos}</span>
            </div>
          </div>
        </div>

        {/* Distribución de Categorías en Base de Datos */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div>
              <h3 className="font-extrabold text-[#0F2547] text-sm">Categorías del Catálogo</h3>
              <p className="text-[11px] text-gray-500">Distribución de stock y valor por categoría en base de datos</p>
            </div>
            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {categorias.length} Categorías
            </span>
          </div>

          {distribucionCategorias.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-600">
              Cargando información de categorías...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mt-2">
              {distribucionCategorias.map((cat) => (
                <div key={cat.id} className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-100 bg-gray-50/50 flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-[#0F2547] truncate">{cat.nombre}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {cat.cantidadProductos} productos · {cat.stockTotal} un.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-[#0F2547]">
                      {formatearMoneda(cat.valorInventario)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* MÓDULO DE RECOMENDACIONES FINANCIERAS IA (TEXTO BLANCO ESTÁNDAR) */}
      <div className="bg-linear-to-br from-[#0F2547] to-[#1a3865] text-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 sm:pb-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/10 text-[#00fc82] backdrop-blur-sm shrink-0">
              <FiCpu className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-white">
                  Recomendaciones Financieras Inteligentes
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 text-white">
                  IA Financiera
                </span>
              </div>
              <p className="text-xs text-white/90 mt-1 max-w-2xl">
                Módulo diseñado para sugerencias automatizadas de optimización de precios, elasticidad y rotación de stock.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl text-xs font-medium text-white self-start sm:self-auto shrink-0">
            <FiCheckCircle className="w-4 h-4 text-white" />
            <span>Interfaz preparada para integración backend</span>
          </div>
        </div>

        {/* Estado del servicio de IA en blanco estándar */}
        <div className="mt-5 sm:mt-6 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Estado: En espera de conexión con motor de IA
              </span>
            </div>
            <p className="text-xs text-white/90 leading-relaxed">
              El diseño de este módulo está listo. Cuando el equipo de backend vincule los algoritmos de predicción financiera, las recomendaciones de optimización se desplegarán aquí en tiempo real.
            </p>
          </div>
        </div>
      </div>

      {/* TABLA DE PEDIDOS Y VENTAS (RESPONSIVA) */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#0F2547]">
              Registro de Ventas y Pedidos
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Historial de órdenes consultadas directamente desde la base de datos de Anglo Electric.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            {/* Buscador sanitizado */}
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(sanitizeSearch(e.target.value))}
                placeholder="Buscar cliente, orden..."
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
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        {/* Tabla con scroll horizontal suave en móvil */}
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="table w-full min-w-137.5 text-left text-xs">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-600 uppercase text-[10px] tracking-wider font-extrabold">
                <th className="py-3 px-4">Orden</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4 text-right">Monto Total</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-gray-600">
                    Consultando pedidos en la base de datos...
                  </td>
                </tr>
              ) : pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 sm:py-12 text-center text-gray-600">
                    <div className="flex flex-col items-center justify-center gap-2 px-4">
                      <FiShoppingBag className="w-8 h-8 text-gray-300" />
                      <span className="font-bold text-gray-600 text-sm">
                        No hay pedidos registrados en la base de datos
                      </span>
                      <span className="text-xs text-gray-600 max-w-sm">
                        Los nuevos pedidos generados por clientes en la tienda aparecerán aquí automáticamente calculando sus montos y estado.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0F2547]">
                      {p.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-800">
                      {p.cliente}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      <div>{p.email}</div>
                      <div className="text-[10px] text-gray-400">{p.telefono}</div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      {p.fecha}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-[#0F2547] whitespace-nowrap">
                      {formatearMoneda(p.monto_total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        p.estado === "completado"
                          ? "bg-emerald-100 text-emerald-800"
                          : p.estado === "cancelado"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {p.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* SIMULADOR RÁPIDO DE MÁRGENES (CON ESCRITURA DIRECTA DE TECLADO Y VISTA PREVIA) */}
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl sm:rounded-2xl shrink-0">
            <FiSliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#0F2547] text-sm sm:text-base">
              Simulador Automatizado de Márgenes
            </h3>
            <p className="text-xs text-gray-500">
              Ingresa los valores numéricos directamente con tu teclado para calcular al instante la rentabilidad.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Precio de Venta */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
              Precio de Venta (CLP)
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={simPrecioVenta}
              onChange={handleSimInput(setSimPrecioVenta)}
              placeholder="0"
              className="input input-sm sm:input-md bg-gray-50 border-gray-200 text-gray-900 font-bold w-full rounded-xl focus:border-[#0F2547] text-sm"
            />
            <span className="text-[11px] text-gray-400 mt-1 block font-medium">
              {simPrecioVenta ? formatearMoneda(Number(simPrecioVenta)) : "$0 CLP"}
            </span>
          </div>

          {/* Costo de Equipos */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
              Costo de Equipos (CLP)
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={simCostoEquipos}
              onChange={handleSimInput(setSimCostoEquipos)}
              placeholder="0"
              className="input input-sm sm:input-md bg-gray-50 border-gray-200 text-gray-900 font-bold w-full rounded-xl focus:border-[#0F2547] text-sm"
            />
            <span className="text-[11px] text-gray-400 mt-1 block font-medium">
              {simCostoEquipos ? formatearMoneda(Number(simCostoEquipos)) : "$0 CLP"}
            </span>
          </div>

          {/* Instalación / Mano de Obra */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
              Instalación / Mano de Obra (CLP)
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={simCostoInstalacion}
              onChange={handleSimInput(setSimCostoInstalacion)}
              placeholder="0"
              className="input input-sm sm:input-md bg-gray-50 border-gray-200 text-gray-900 font-bold w-full rounded-xl focus:border-[#0F2547] text-sm"
            />
            <span className="text-[11px] text-gray-400 mt-1 block font-medium">
              {simCostoInstalacion ? formatearMoneda(Number(simCostoInstalacion)) : "$0 CLP"}
            </span>
          </div>

          {/* Resultado Ganancia Neta */}
          <div className="bg-emerald-50/70 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-200 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Ganancia Neta Calculada
            </span>
            <div className="text-lg sm:text-xl font-black text-emerald-700 mt-0.5">
              {formatearMoneda(calculoSimulador.gananciaNeta)}
            </div>
            <div className="text-xs font-bold text-[#0F2547] mt-0.5">
              Margen: {calculoSimulador.porcentaje}%
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
