"use client";
import ProductCard from "./ProductCard";
import { useState } from "react";

const PRODUCTOS_MOCK = [
  { id: 1, nombre: "Panel Solar 500W Monocristalino", precio: "$120.000", categoria: "Paneles", imagen: "/panel-solar.png" },
  { id: 2, nombre: "Inversor Híbrido 5kW", precio: "$850.000", categoria: "Inversores", imagen: "/inversor-must.png" },
  { id: 3, nombre: "Batería Litio 48V 100Ah", precio: "$1.200.000", categoria: "Baterías", imagen: "/bateria-felicity.png" },
  { id: 4, nombre: "Kit Solar Residencial 3kW", precio: "$2.500.000", categoria: "Kits", imagen: "/panel-solar.png" },
  { id: 5, nombre: "Inversor On-Grid 10kW", precio: "$1.100.000", categoria: "Inversores", imagen: "/inversor-must.png" },
  { id: 6, nombre: "Panel Bifacial 550W", precio: "$145.000", categoria: "Paneles", imagen: "/panel-solar.png" },
];

export default function VistaCatalogo() {
  const [stock, setStock] = useState(true);
  const [potencia, setPotencia] = useState(15);
  const [tecno, setTecno] = useState({ mono: true, bifacial: true, micro: false, bat: true });
  const [voltaje, setVoltaje] = useState("220v");
  const [marca, setMarca] = useState("Huawei");
  const [paginaActual, setPaginaActual] = useState(1);
  const totalPaginas = 8; 

  const limpiarFiltros = () => {
    setStock(false);
    setPotencia(30);
    setTecno({ mono: false, bifacial: false, micro: false, bat: false });
    setVoltaje("");
    setMarca("");
    setPaginaActual(1);
  };

  const handleTecnoToggle = (key) => setTecno(prev => ({ ...prev, [key]: !prev[key] }));
  const marcasLista = ["LONGi", "Huawei", "Enphase", "Victron", "Pylontech", "Tier 1 Glob"];

  return (
    <div className="flex flex-col lg:flex-row gap-8 mt-6">
      <div className="lg:hidden flex flex-col gap-3">
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide items-center w-full">
          <button onClick={limpiarFiltros} className="btn btn-xs px-3 bg-white border-gray-300 rounded-full shrink-0 text-gray-700 hover:bg-gray-100 shadow-sm font-normal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Filtros
          </button>

          <select 
            className={`select select-xs px-3 rounded-full shrink-0 shadow-sm focus:outline-none focus:ring-0 min-w-24 font-normal ${marca ? "bg-[#0F2547] text-white border-[#0F2547]" : "bg-white border-gray-300 text-gray-700"}`}
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
          >
            <option value="">Marca</option>
            {marcasLista.map(m => (
              <option key={`opt-${m}`} value={m}>{m}</option>
            ))}
          </select>

          <select 
            className={`select select-xs px-3 rounded-full shrink-0 shadow-sm focus:outline-none focus:ring-0 min-w-28 font-normal ${voltaje ? "bg-[#0F2547] text-white border-[#0F2547]" : "bg-white border-gray-300 text-gray-700"}`}
            value={voltaje}
            onChange={(e) => setVoltaje(e.target.value)}
          >
            <option value="">Voltaje</option>
            <option value="110v">110V Monofásico</option>
            <option value="220v">220V Bifásico</option>
            <option value="440v">440V Trifásico</option>
          </select>

          <button onClick={() => setStock(!stock)} className={`btn btn-xs px-3 rounded-full shrink-0 shadow-sm transition-colors font-normal ${stock ? "bg-white border-[#00fc82] text-[#0F2547]" : "bg-white border-gray-300 text-gray-700"}`}>
            {stock && <svg className="h-3 w-3 text-[#00fc82] mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
            Stock Inmediato
          </button>
        </div>
        <div className="text-sm font-medium text-gray-500 mb-2">+{PRODUCTOS_MOCK.length} resultados</div>
      </div>

      <aside className="hidden lg:block w-80 shrink-0 space-y-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold flex items-center gap-2 text-[#0F2547]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            Filtros Técnicos
          </h2>
          <button onClick={limpiarFiltros} className="text-sm text-[#00fc82] hover:underline font-semibold cursor-pointer">Limpiar filtros</button>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 flex justify-between items-center border border-gray-100 transition-colors">
          <div><h3 className="font-bold text-gray-800">En Stock Inmediato</h3><p className="text-xs text-gray-500">Entrega en 24-48 hrs</p></div>
          <input type="checkbox" className="toggle toggle-success bg-gray-300 border-gray-300" checked={stock} onChange={(e) => setStock(e.target.checked)} />
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-800">Rango de Potencia</h3><span className="text-xs font-semibold text-[#0F2547]">300W - 30kW</span></div>
          <input type="range" min="0" max="30" value={potencia} onChange={(e) => setPotencia(e.target.value)} className="range range-xs range-success" />
          <div className="flex justify-between text-xs text-gray-500 mt-2"><span>300 Wp</span><span>{potencia} kW</span><span>30+ kW</span></div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Tipo de Tecnología</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3"><input type="checkbox" className="checkbox checkbox-sm checkbox-success rounded" checked={tecno.mono} onChange={() => handleTecnoToggle('mono')} /><span className="text-sm text-gray-700">Monocristalino N-Type</span></div>
              <span className="text-xs text-gray-400">124</span>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3"><input type="checkbox" className="checkbox checkbox-sm checkbox-success rounded" checked={tecno.bifacial} onChange={() => handleTecnoToggle('bifacial')} /><span className="text-sm text-gray-700">Bifacial Doble Vidrio</span></div>
              <span className="text-xs text-gray-400">86</span>
            </label>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Marcas Homologadas</h3>
          <div className="grid grid-cols-2 gap-2">
            {marcasLista.map(m => (
              <button key={m} onClick={() => setMarca(m)} className={`btn btn-sm transition-colors ${marca === m ? "bg-[#0F2547] text-white border-none hover:bg-[#0F2547]/90" : "bg-white border-gray-200 text-gray-600 hover:border-[#00fc82]"}`}>{m}</button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {PRODUCTOS_MOCK.map((producto) => (
            <ProductCard key={`prod-${producto.id}`} producto={producto} />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <div className="join shadow-md">
            <button className="join-item btn bg-white border-gray-200 text-gray-600 hover:bg-gray-50" onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1}>« Ant</button>
            {[1, 2, 3].map(pag => (
              <button key={`pag-${pag}`} onClick={() => setPaginaActual(pag)} className={`join-item btn ${paginaActual === pag ? "bg-[#0F2547] text-white border-[#0F2547]" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{pag}</button>
            ))}
            <button className="join-item btn bg-white border-gray-200 text-gray-600 hover:bg-gray-50" onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas}>Sig »</button>
          </div>
        </div>
      </div>

    </div>
  );
}
