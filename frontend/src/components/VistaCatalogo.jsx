"use client";

import { useState, useEffect, useMemo } from "react";
import ProductCard from "./ProductCard";
import { productService, categoryService } from "@/src/services/api";
import { FiSearch, FiRotateCcw, FiLayers, FiCheckCircle } from "react-icons/fi";
import { sanitizeSearch } from "@/src/utils/validations";

const ITEMS_POR_PAGINA = 8;

export default function VistaCatalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorConexion, setErrorConexion] = useState(false);

  // Estados de filtros adaptados a las columnas reales del backend
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [tipoSeleccionado, setTipoSeleccionado] = useState("todos"); // "todos" | "individuales" | "kits"
  const [soloStock, setSoloStock] = useState(false);
  const [potenciaMin, setPotenciaMin] = useState(0);
  const [orden, setOrden] = useState("relevancia"); // "relevancia" | "precio-asc" | "precio-desc" | "potencia-desc"
  const [paginaActual, setPaginaActual] = useState(1);

  // Cargar productos y categorías desde FastAPI / Neon DB
  useEffect(() => {
    let cancelado = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorConexion(false);
        const [prodsData, catsData] = await Promise.all([
          productService.getAll().catch((err) => {
            console.warn("Backend FastAPI no disponible o reconectando:", err.message);
            return null;
          }),
          categoryService.getAll().catch(() => []) // Fallback si aún no hay categorías creadas
        ]);

        if (cancelado) return;

        if (prodsData && Array.isArray(prodsData)) {
          setProductos(prodsData);
          setErrorConexion(false);
        } else {
          setErrorConexion(true);
        }
        
        // Si la BD devuelve categorías, usarlas; de lo contrario usar lista base
        if (catsData && catsData.length > 0) {
          setCategorias(catsData);
        } else {
          setCategorias([
            { id: 1, nombre: "Paneles Solares" },
            { id: 2, nombre: "Inversores" },
            { id: 3, nombre: "Baterías" },
            { id: 4, nombre: "Kits Completos" },
            { id: 5, nombre: "Kits Off-Grid" }
          ]);
        }
      } catch (error) {
        console.error("Error al cargar datos del catálogo:", error);
        if (!cancelado) setErrorConexion(true);
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelado = true; };
  }, []);

  // Resetear a la página 1 cuando cambia cualquier filtro
  const resetearPagina = () => setPaginaActual(1);

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoriaSeleccionada("");
    setTipoSeleccionado("todos");
    setSoloStock(false);
    setPotenciaMin(0);
    setOrden("relevancia");
    setPaginaActual(1);
  };

  // Contar productos disponibles por categoría
  const conteoPorCategoria = useMemo(() => {
    const conteo = {};
    productos.forEach(p => {
      if (p.categoria_id) {
        conteo[p.categoria_id] = (conteo[p.categoria_id] || 0) + 1;
      }
    });
    return conteo;
  }, [productos]);

  // Lógica de filtrado en tiempo real con datos del backend
  const productosFiltrados = useMemo(() => {
    return productos
      .filter((producto) => {
        // 1. Filtro por Búsqueda (nombre y descripción)
        if (busqueda.trim()) {
          const termino = busqueda.toLowerCase().trim();
          const coincideNombre = producto.nombre?.toLowerCase().includes(termino);
          const coincideDesc = producto.descripcion?.toLowerCase().includes(termino);
          if (!coincideNombre && !coincideDesc) return false;
        }

        // 2. Filtro por Categoría (categoria_id)
        if (categoriaSeleccionada !== "") {
          if (producto.categoria_id !== Number(categoriaSeleccionada)) {
            return false;
          }
        }

        // 3. Filtro por Tipo de Producto (es_kit: True / False)
        if (tipoSeleccionado === "kits" && !producto.es_kit) return false;
        if (tipoSeleccionado === "individuales" && producto.es_kit) return false;

        // 4. Filtro por Disponibilidad de Stock (stock > 0)
        if (soloStock && (producto.stock || 0) <= 0) return false;

        // 5. Filtro por Potencia en Watts (potencia_watts)
        if (potenciaMin > 0) {
          if (!producto.potencia_watts || producto.potencia_watts < potenciaMin) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (orden === "precio-asc") return a.precio - b.precio;
        if (orden === "precio-desc") return b.precio - a.precio;
        if (orden === "potencia-desc") return (b.potencia_watts || 0) - (a.potencia_watts || 0);
        return 0; // Orden original por ID
      });
  }, [productos, busqueda, categoriaSeleccionada, tipoSeleccionado, soloStock, potenciaMin, orden]);

  // Paginación
  const totalPaginas = Math.ceil(productosFiltrados.length / ITEMS_POR_PAGINA) || 1;
  const productosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    return productosFiltrados.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [productosFiltrados, paginaActual]);

  const hayFiltrosActivos = 
    busqueda.trim() !== "" || 
    categoriaSeleccionada !== "" || 
    tipoSeleccionado !== "todos" || 
    soloStock || 
    potenciaMin > 0 || 
    orden !== "relevancia";

  return (
    <div className="flex flex-col lg:flex-row gap-8 mt-6">
      
      {/* ================= BARRA DE FILTROS MÓVIL ================= */}
      <div className="lg:hidden flex flex-col gap-3">
        {/* Buscador Móvil */}
        <div className="relative w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={busqueda}
            maxLength={80}
            onChange={(e) => {
              setBusqueda(sanitizeSearch(e.target.value));
              resetearPagina();
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 text-gray-900 placeholder:text-gray-400 rounded-xl border border-gray-200 text-sm focus:border-[#00fc82] focus:ring-1 focus:ring-[#00fc82] outline-none"
          />
        </div>

        {/* Chips horizontales */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide items-center">
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="btn btn-xs px-3 bg-red-50 text-red-600 border border-red-200 rounded-full shrink-0 hover:bg-red-100 font-semibold"
            >
              <FiRotateCcw className="mr-1" /> Limpiar
            </button>
          )}

          {/* Selector de Categorías Móvil */}
          <select
            className={`select select-xs px-3 rounded-full shrink-0 border ${
              categoriaSeleccionada ? "bg-[#0F2547] text-white border-[#0F2547]" : "bg-white border-gray-300 text-gray-700"
            }`}
            value={categoriaSeleccionada}
            onChange={(e) => {
              setCategoriaSeleccionada(e.target.value);
              resetearPagina();
            }}
          >
            <option value="">Todas las Categorías</option>
            {categorias.map((cat) => (
              <option key={`m-cat-${cat.id}`} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          {/* Selector de Tipo (Kits / Individual) */}
          <select
            className={`select select-xs px-3 rounded-full shrink-0 border ${
              tipoSeleccionado !== "todos" ? "bg-[#0F2547] text-white border-[#0F2547]" : "bg-white border-gray-300 text-gray-700"
            }`}
            value={tipoSeleccionado}
            onChange={(e) => {
              setTipoSeleccionado(e.target.value);
              resetearPagina();
            }}
          >
            <option value="todos">Todos los Tipos</option>
            <option value="individuales">Equipos Individuales</option>
            <option value="kits">Kits Solares</option>
          </select>

          {/* Toggle de Stock Móvil */}
          <button
            onClick={() => {
              setSoloStock(!soloStock);
              resetearPagina();
            }}
            className={`btn btn-xs px-3 rounded-full shrink-0 border transition-all ${
              soloStock
                ? "bg-[#00fc82] border-[#00fc82] text-[#0F2547] font-bold shadow-xs"
                : "bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200 font-semibold"
            }`}
          >
            {soloStock && <FiCheckCircle className="text-[#0F2547] mr-1" />}
            En Stock
          </button>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-500 px-1">
          <span>{productosFiltrados.length} productos encontrados</span>
          <select 
            value={orden} 
            onChange={(e) => setOrden(e.target.value)}
            className="select select-ghost select-xs text-xs font-semibold text-gray-700 focus:outline-none"
          >
            <option value="relevancia">Relevancia</option>
            <option value="precio-asc">Precio: Menor a Mayor</option>
            <option value="precio-desc">Precio: Mayor a Menor</option>
            <option value="potencia-desc">Mayor Potencia</option>
          </select>
        </div>
      </div>

      {/* ================= PANEL LATERAL DESKTOP ================= */}
      <aside className="hidden lg:block w-72 shrink-0 space-y-6">
        
        {/* Cabecera de Filtros */}
        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
          <h2 className="text-xl font-bold flex items-center gap-2 text-[#0F2547]">
            <FiLayers className="text-[#00fc82]" /> Filtros
          </h2>
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <FiRotateCcw size={12} /> Limpiar todo
            </button>
          )}
        </div>

        {/* 1. Buscador */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
            Buscar Producto
          </label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Ej. Inversor, Kit, 5000W..."
              value={busqueda}
              maxLength={80}
              onChange={(e) => {
                setBusqueda(sanitizeSearch(e.target.value));
                resetearPagina();
              }}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 text-gray-900 placeholder:text-gray-400 rounded-xl border border-gray-200 text-sm focus:border-[#00fc82] focus:ring-1 focus:ring-[#00fc82] outline-none transition-all"
            />
          </div>
        </div>

        {/* 2. Categorías (desde backend/models.py -> Categoria) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Categoría
            </label>
            {categoriaSeleccionada !== "" && (
              <button 
                onClick={() => { setCategoriaSeleccionada(""); resetearPagina(); }} 
                className="text-[11px] text-[#00fc82] font-semibold hover:underline"
              >
                Todas
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => { setCategoriaSeleccionada(""); resetearPagina(); }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex justify-between items-center transition-all ${
                categoriaSeleccionada === ""
                  ? "bg-[#0F2547] text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>Todas las Categorías</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${categoriaSeleccionada === "" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
                {productos.length}
              </span>
            </button>

            {categorias.map((cat) => {
              const estaActivo = categoriaSeleccionada === String(cat.id);
              const cantidad = conteoPorCategoria[cat.id] || 0;
              return (
                <button
                  key={`cat-${cat.id}`}
                  onClick={() => {
                    setCategoriaSeleccionada(estaActivo ? "" : String(cat.id));
                    resetearPagina();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex justify-between items-center transition-all ${
                    estaActivo
                      ? "bg-[#0F2547] text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="truncate">{cat.nombre}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${estaActivo ? "bg-[#00fc82] text-[#0F2547] font-bold" : "bg-gray-100 text-gray-500"}`}>
                    {cantidad}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Tipo: Kits vs Equipos Individuales (backend -> es_kit) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 block">
            Tipo de Formato
          </label>
          <div className="grid grid-cols-3 gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => { setTipoSeleccionado("todos"); resetearPagina(); }}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tipoSeleccionado === "todos"
                  ? "bg-[#0F2547] text-white shadow-sm"
                  : "text-gray-600 hover:text-[#0F2547]"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => { setTipoSeleccionado("individuales"); resetearPagina(); }}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tipoSeleccionado === "individuales"
                  ? "bg-[#0F2547] text-white shadow-sm"
                  : "text-gray-600 hover:text-[#0F2547]"
              }`}
            >
              Equipos
            </button>
            <button
              onClick={() => { setTipoSeleccionado("kits"); resetearPagina(); }}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tipoSeleccionado === "kits"
                  ? "bg-[#0F2547] text-white shadow-sm"
                  : "text-gray-600 hover:text-[#0F2547]"
              }`}
            >
              Kits
            </button>
          </div>
        </div>

        {/* 4. Disponibilidad: Solo en Stock (backend -> stock > 0) */}
        <div 
          onClick={() => {
            setSoloStock(!soloStock);
            resetearPagina();
          }}
          className={`rounded-2xl p-4 border flex justify-between items-center cursor-pointer transition-all ${
            soloStock
              ? "bg-[#00fc82]/15 border-[#00fc82] shadow-sm"
              : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
          }`}
        >
          <div>
            <h3 className="font-bold text-sm text-[#0F2547]">En Stock Inmediato</h3>
            <p className="text-[11px] text-gray-500">Ocultar productos agotados</p>
          </div>
          <input
            type="checkbox"
            checked={soloStock}
            onChange={(e) => {
              setSoloStock(e.target.checked);
              resetearPagina();
            }}
            className="toggle toggle-sm toggle-success bg-gray-300 border-gray-400"
          />
        </div>

        {/* 5. Potencia en Watts (backend -> potencia_watts) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Potencia Mínima
            </label>
            <span className="text-xs font-bold text-[#0F2547]">
              {potenciaMin === 0 ? "Cualquiera" : `${potenciaMin}W (${potenciaMin >= 1000 ? `${potenciaMin / 1000}kW` : ""})`}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="6000"
            step="500"
            value={potenciaMin}
            onChange={(e) => {
              setPotenciaMin(Number(e.target.value));
              resetearPagina();
            }}
            className="range range-xs range-success w-full"
          />
          <div className="flex justify-between text-[10px] text-gray-400 font-semibold mt-1">
            <span>0W</span>
            <span>2000W</span>
            <span>4000W</span>
            <span>6000W+</span>
          </div>

          {/* Botones rápidos de potencia */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {[0, 1000, 2000, 5000].map((watts) => (
              <button
                key={`p-btn-${watts}`}
                onClick={() => { setPotenciaMin(watts); resetearPagina(); }}
                className={`btn btn-xs rounded-lg text-[10px] font-bold ${
                  potenciaMin === watts
                    ? "bg-[#0F2547] text-white border-none"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-none"
                }`}
              >
                {watts === 0 ? "Todas" : `${watts}W+`}
              </button>
            ))}
          </div>
        </div>

      </aside>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Barra superior de ordenamiento y conteo (Desktop) */}
        <div className="hidden lg:flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-600">
            Mostrando <span className="font-extrabold text-[#0F2547]">{productosFiltrados.length}</span> de <span className="font-extrabold text-[#0F2547]">{productos.length}</span> productos
          </p>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500 uppercase">Ordenar por:</span>
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="select select-sm bg-gray-50 border-gray-200 focus:border-[#00fc82] focus:ring-[#00fc82] rounded-xl text-xs font-bold text-gray-700"
            >
              <option value="relevancia">Relevancia / Novedades</option>
              <option value="precio-asc">Precio: Menor a Mayor</option>
              <option value="precio-desc">Precio: Mayor a Menor</option>
              <option value="potencia-desc">Mayor Potencia (Watts)</option>
            </select>
          </div>
        </div>

        {/* Banner de Reconexión Backend si no hay conexión */}
        {errorConexion && productos.length === 0 && !loading && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900">
            <span className="text-xs font-semibold">
              No se pudo conectar con el servidor backend en el puerto 8000. Revisa que FastAPI esté iniciado.
            </span>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-xs bg-[#0F2547] text-white hover:bg-[#00fc82] hover:text-[#0F2547] border-none font-bold rounded-lg px-4"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Estado de Carga */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
            {[1, 2, 3, 4].map((n) => (
              <div key={`skel-${n}`} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse flex flex-col gap-4">
                <div className="aspect-4/3 bg-gray-200 rounded-xl w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mt-auto"></div>
              </div>
            ))}
          </div>
        ) : productosFiltrados.length === 0 ? (
          /* Estado Vacío cuando ningún producto coincide */
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 my-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <FiSearch size={28} />
            </div>
            <h3 className="text-xl font-bold text-[#0F2547] mb-2">No encontramos coincidencias</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              No hay productos en el catálogo que coincidan con los filtros seleccionados.
            </p>
            <button
              onClick={limpiarFiltros}
              className="btn bg-[#00fc82] text-[#0F2547] hover:bg-[#00fc82]/80 border-none font-bold rounded-xl shadow-md px-6"
            >
              <FiRotateCcw className="mr-2" /> Restablecer Filtros
            </button>
          </div>
        ) : (
          /* Cuadrícula de Productos */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {productosPaginados.map((producto) => (
                <ProductCard key={`prod-${producto.id}`} producto={producto} />
              ))}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="join shadow-sm bg-white rounded-2xl border border-gray-200 p-1">
                  <button
                    className="join-item btn btn-sm bg-transparent border-none text-gray-600 hover:bg-gray-100"
                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                  >
                    «
                  </button>
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pag) => (
                    <button
                      key={`pag-${pag}`}
                      onClick={() => setPaginaActual(pag)}
                      className={`join-item btn btn-sm rounded-xl font-bold ${
                        paginaActual === pag
                          ? "bg-[#0F2547] text-white hover:bg-[#0F2547]"
                          : "bg-transparent border-none text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {pag}
                    </button>
                  ))}
                  <button
                    className="join-item btn btn-sm bg-transparent border-none text-gray-600 hover:bg-gray-100"
                    onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>

    </div>
  );
}
