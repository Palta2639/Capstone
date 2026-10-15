"use client";

import { useState } from "react";
import { 
  FiMapPin, 
  FiZap, 
  FiSun, 
  FiBatteryCharging, 
  FiCheck, 
  FiArrowRight, 
  FiArrowLeft, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCpu, 
  FiTrendingUp, 
  FiShield, 
  FiRotateCcw,
  FiShoppingBag
} from "react-icons/fi";
import { useCart } from "@/src/context/CartContext";
import { formatearMoneda } from "@/src/utils/formatters";
import { buscarComunasChile, COMUNAS_CHILE } from "@/src/utils/chileData";
import { cotizacionService } from "@/src/services/api";
import { 
  sanitizeName, 
  sanitizeEmail, 
  sanitizePhone, 
  sanitizeComuna, 
  validateCotizacionField 
} from "@/src/utils/validations";

// Comunas chilenas frecuentes para sugerencias rápidas
const COMUNAS_DESTACADAS = [
  "Santiago", "Las Condes", "Colina", "Chicureo", "Lampa", 
  "Rancagua", "Viña del Mar", "Valparaíso", "La Serena", 
  "Antofagasta", "Concepción", "Temuco", "Talca", "Curicó"
];

const TIPOS_PROPIEDAD = [
  { id: "casa", titulo: "Casa Residencial", desc: "Vivienda particular urbana o suburbana" },
  { id: "parcela", titulo: "Parcela / Campo", desc: "Zonas rurales o con amplio terreno" },
  { id: "comercial", titulo: "Comercio / Taller", desc: "Locales comerciales, oficinas o pymes" },
  { id: "industrial", titulo: "Agro / Industrial", desc: "Bodegas, galpones o faenas productivas" }
];

const TIPOS_TECHO = [
  { id: "zinc", titulo: "Zinc o Chapa Metálica", desc: "Instalación rápida con estructura coplanar" },
  { id: "teja", titulo: "Teja Colonial / Asfáltica", desc: "Fijaciones especiales para evitar filtraciones" },
  { id: "losa", titulo: "Losa Plana de Hormigón", desc: "Estructuras trianguladas con inclinación óptima" },
  { id: "suelo", titulo: "Sobre Suelo / Terreno", desc: "Estructuras montadas en tierra libre de sombras" }
];

const OBJETIVOS_SISTEMA = [
  { 
    id: "ahorro_red", 
    titulo: "On-Grid (Reducir Factura)", 
    desc: "Conectado a la red de distribución. Ahorras de día y vendes excedentes (Ley Net Billing 20.571).",
    icono: FiSun
  },
  { 
    id: "hibrido", 
    titulo: "Híbrido (Ahorro + Baterías)", 
    desc: "Ahorro continuo en la cuenta y respaldo automático de energía ante cortes de luz.",
    icono: FiBatteryCharging
  },
  { 
    id: "off_grid", 
    titulo: "Off-Grid (100% Aislado)", 
    desc: "Para sitios sin tendido eléctrico. Opera con banco de baterías y opcional grupo electrógeno.",
    icono: FiZap
  }
];

export default function CotizadorIA() {
  const { agregarAlCarrito } = useCart();
  const [kitAgregado, setKitAgregado] = useState(false);
  const [paso, setPaso] = useState(1);
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState(null);

  // Datos del formulario estructurados para el backend
  const [formData, setFormData] = useState({
    // Paso 1: Ubicacion e Inmueble
    comuna: "",
    region: "",
    tipo_propiedad: "casa",
    tipo_techo: "zinc",
    // Paso 2: Consumo
    gasto_mensual_clp: 75000,
    consumo_kwh_mensual: 350,
    tipo_red: "monofasico", // monofasico | trifasico
    // Paso 3: Sistema
    objetivo_sistema: "ahorro_red", // ahorro_red | hibrido | off_grid
    presupuesto_estimado: "estandar", // economico | estandar | premium | por_definir
    // Paso 4: Contacto
    nombre: "",
    email: "",
    telefono: ""
  });

  const [busquedaComuna, setBusquedaComuna] = useState("");
  const [sugerenciasComunas, setSugerenciasComunas] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const [errores, setErrores] = useState({});

  // Manejar cambio en el input de comuna predictivo con sanitizacion anti-inyeccion
  const handleComunaInputChange = (e) => {
    const valor = sanitizeComuna(e.target.value);
    setBusquedaComuna(valor);
    setFormData(prev => ({ ...prev, comuna: valor, region: "" }));

    if (valor.trim().length >= 1) {
      const resultados = buscarComunasChile(valor, 6);
      setSugerenciasComunas(resultados);
      setMostrarSugerencias(true);
    } else {
      setSugerenciasComunas([]);
      setMostrarSugerencias(false);
    }

    if (errores.comuna) {
      setErrores(prev => ({ ...prev, comuna: validateCotizacionField("comuna", valor) }));
    }
  };

  const handleComunaBlur = () => {
    setTimeout(() => {
      setMostrarSugerencias(false);
      const error = validateCotizacionField("comuna", formData.comuna);
      setErrores(prev => ({ ...prev, comuna: error }));
    }, 200);
  };

  // Manejar cambios en campos de contacto con sanitizacion en tiempo real
  const handleContactChange = (field, rawValue) => {
    let sanitizedValue = rawValue;
    if (field === "nombre") sanitizedValue = sanitizeName(rawValue);
    if (field === "email") sanitizedValue = sanitizeEmail(rawValue);
    if (field === "telefono") sanitizedValue = sanitizePhone(rawValue);

    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));

    if (errores[field]) {
      setErrores(prev => ({ ...prev, [field]: validateCotizacionField(field, sanitizedValue) }));
    }
  };

  const handleContactBlur = (field) => {
    const error = validateCotizacionField(field, formData[field]);
    setErrores(prev => ({ ...prev, [field]: error }));
  };

  // Clases dinamicas de feedback visual estilo useAuthForm
  const getFieldClasses = (field) => {
    if (errores[field]) {
      return "border-red-500 focus:border-red-500 focus:ring-red-500";
    }
    if (formData[field] && !errores[field]) {
      return "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500";
    }
    return "border-gray-200 focus:border-[#00fc82] focus:ring-[#00fc82]";
  };

  // Seleccionar comuna sugerida
  const seleccionarComuna = (item) => {
    setFormData(prev => ({
      ...prev,
      comuna: sanitizeComuna(item.comuna),
      region: sanitizeComuna(item.region)
    }));
    setBusquedaComuna(item.comuna);
    setMostrarSugerencias(false);
    setErrores(prev => ({ ...prev, comuna: "" }));
  };

  // Seleccionar comuna rapida de botones frecuentes
  const seleccionarComunaRapida = (nombreComuna) => {
    const comunaLimpia = sanitizeComuna(nombreComuna);
    const encontrada = COMUNAS_CHILE.find(
      c => c.comuna.toLowerCase() === comunaLimpia.toLowerCase()
    );
    if (encontrada) {
      seleccionarComuna(encontrada);
    } else {
      setFormData(prev => ({ ...prev, comuna: comunaLimpia }));
      setBusquedaComuna(comunaLimpia);
      setErrores(prev => ({ ...prev, comuna: "" }));
    }
  };

  // Sincronizar consumo kWh aproximado al mover el gasto en CLP
  const handleGastoChange = (clp) => {
    const valorNum = Math.max(0, Math.min(20000000, Number(clp) || 0));
    const kwhCalculado = Math.round(valorNum / 190);
    setFormData(prev => ({
      ...prev,
      gasto_mensual_clp: valorNum,
      consumo_kwh_mensual: kwhCalculado
    }));
  };

  const validarPaso = (numeroPaso) => {
    const errs = {};
    if (numeroPaso === 1) {
      const comunaErr = validateCotizacionField("comuna", formData.comuna);
      if (comunaErr) errs.comuna = comunaErr;
    }
    if (numeroPaso === 4) {
      const nombreErr = validateCotizacionField("nombre", formData.nombre);
      const emailErr = validateCotizacionField("email", formData.email);
      const telefonoErr = validateCotizacionField("telefono", formData.telefono);
      if (nombreErr) errs.nombre = nombreErr;
      if (emailErr) errs.email = emailErr;
      if (telefonoErr) errs.telefono = telefonoErr;
    }
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const siguientePaso = () => {
    if (validarPaso(paso)) {
      setPaso(p => Math.min(4, p + 1));
    }
  };

  const anteriorPaso = () => {
    setPaso(p => Math.max(1, p - 1));
  };

  const calcularCotizacionIA = async (e) => {
    e.preventDefault();
    if (!validarPaso(4)) return;

    setAnalizando(true);

    // Lista blanca estricta de opciones para neutralizar manipulacion de parametros
    const VALID_PROPIEDADES = ["casa", "parcela", "comercial", "industrial"];
    const VALID_TECHOS = ["zinc", "teja", "losa", "suelo"];
    const VALID_REDES = ["monofasico", "trifasico"];
    const VALID_OBJETIVOS = ["ahorro_red", "hibrido", "off_grid"];
    const VALID_PRESUPUESTOS = ["economico", "estandar", "premium", "por_definir"];

    // Estructura de carga util preparada y sanitizada para el backend
    const payloadParaBackend = {
      comuna: sanitizeComuna(formData.comuna),
      region: sanitizeComuna(formData.region),
      tipo_propiedad: VALID_PROPIEDADES.includes(formData.tipo_propiedad) ? formData.tipo_propiedad : "casa",
      tipo_techo: VALID_TECHOS.includes(formData.tipo_techo) ? formData.tipo_techo : "zinc",
      consumo_kwh_mensual: Math.max(1, Math.min(50000, Number(formData.consumo_kwh_mensual) || 350)),
      gasto_mensual_clp: Math.max(10000, Math.min(20000000, Number(formData.gasto_mensual_clp) || 75000)),
      tipo_red: VALID_REDES.includes(formData.tipo_red) ? formData.tipo_red : "monofasico",
      objetivo_sistema: VALID_OBJETIVOS.includes(formData.objetivo_sistema) ? formData.objetivo_sistema : "ahorro_red",
      presupuesto_estimado: VALID_PRESUPUESTOS.includes(formData.presupuesto_estimado) ? formData.presupuesto_estimado : "estandar",
      contacto: {
        nombre: sanitizeName(formData.nombre),
        email: sanitizeEmail(formData.email),
        telefono: sanitizePhone(formData.telefono)
      }
    };

    console.log("PAYLOAD ENVIADO A BACKEND API:", JSON.stringify(payloadParaBackend, null, 2));

    try {
      // 1. Intento de comunicacion con el endpoint del Backend
      const respuestaBackend = await cotizacionService.solicitarCotizacionIA(payloadParaBackend);
      if (respuestaBackend && respuestaBackend.potenciaRealKwp) {
        setResultado(respuestaBackend);
        setAnalizando(false);
        setPaso(5);
        return;
      }
    } catch (error) {
      console.warn("Backend no disponible o en preparacion, usando calculo preliminar en cliente:", error?.message);
    }

    // 2. Fallback de calculo de ingenieria preliminar si el backend esta desconectado
    setTimeout(() => {
      // Horas de Sol Pico promedio en Chile central: 4.8 HSP
      const hsp = 4.8;
      const factorRendimiento = 0.80; // 80% rendimiento global del sistema
      const consumoDiarioKwh = formData.consumo_kwh_mensual / 30;
      const potenciaKwRequerida = Number((consumoDiarioKwh / (hsp * factorRendimiento)).toFixed(1));
      
      // Paneles de 550W
      const wattsPorPanel = 550;
      const cantidadPaneles = Math.max(4, Math.ceil((potenciaKwRequerida * 1000) / wattsPorPanel));
      const potenciaRealKwp = Number(((cantidadPaneles * wattsPorPanel) / 1000).toFixed(2));
      
      // Ahorro mensual estimado (hasta 85% en on-grid)
      const porcentajeAhorro = formData.objetivo_sistema === "off_grid" ? 100 : 85;
      const ahorroMensualClp = Math.round(formData.gasto_mensual_clp * (porcentajeAhorro / 100));
      const ahorroAnualClp = ahorroMensualClp * 12;

      // Inversor sugerido
      let inversorSugerido = `${Math.ceil(potenciaKwRequerida)} kW On-Grid ${formData.tipo_red === "trifasico" ? "Trifásico" : "Monofásico"}`;
      if (formData.objetivo_sistema === "hibrido") {
        inversorSugerido = `${Math.ceil(potenciaKwRequerida)} kW Híbrido con respaldo`;
      } else if (formData.objetivo_sistema === "off_grid") {
        inversorSugerido = `${Math.ceil(potenciaKwRequerida)} kW Off-Grid Aislado`;
      }

      // Espacio requerido (aprox 2.3 m2 por panel de 550W)
      const superficieTechoRequerida = Math.round(cantidadPaneles * 2.3);

      setResultado({
        potenciaKwRequerida,
        potenciaRealKwp,
        cantidadPaneles,
        superficieTechoRequerida,
        inversorSugerido,
        bateriaSugerida: formData.objetivo_sistema !== "ahorro_red" ? "Batería Litio 5.12 kWh LiFePO4" : null,
        ahorroMensualClp,
        ahorroAnualClp,
        retornoInversionAnios: 3.8,
        co2EvitadoToneladas: Number((potenciaRealKwp * 0.95).toFixed(1))
      });

      setAnalizando(false);
      setPaso(5);
    }, 1200);
  };

  const reiniciarCotizador = () => {
    setPaso(1);
    setResultado(null);
  };

  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      
      {/* Encabezado */}
      <div className="text-center mb-10">
        <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-[#0F2547] bg-[#00fc82]/25 px-3 py-1 rounded-full mb-3">
          Dimensionamiento Inteligente
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold text-[#0F2547] tracking-tight">
          Cotizador Solar con Inteligencia Artificial
        </h1>
        <p className="text-gray-600 mt-3 max-w-2xl mx-auto text-sm md:text-base">
          Ingresa los parámetros de tu propiedad y consumo eléctrico. Nuestra IA calcula la radiación de tu zona y dimensiona el kit solar exacto para maximizar tu ahorro.
        </p>
      </div>

      {/* Barra de Pasos (1 a 4) */}
      {paso <= 4 && (
        <div className="mb-10">
          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1, label: "Ubicación" },
              { num: 2, label: "Consumo" },
              { num: 3, label: "Sistema" },
              { num: 4, label: "Contacto" }
            ].map((p) => {
              const completado = paso > p.num;
              const actual = paso === p.num;
              return (
                <div key={p.num} className="flex flex-col items-center text-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    actual 
                      ? "bg-[#0F2547] text-white ring-4 ring-[#00fc82]/30" 
                      : completado 
                      ? "bg-[#00fc82] text-[#0F2547]" 
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    {completado ? <FiCheck size={16} /> : p.num}
                  </div>
                  <span className={`text-[11px] font-bold mt-1.5 transition-colors ${
                    actual ? "text-[#0F2547]" : "text-gray-400"
                  }`}>
                    {p.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="w-full bg-gray-200 h-1.5 rounded-full mt-4 overflow-hidden">
            <div 
              className="bg-[#00fc82] h-full transition-all duration-300" 
              style={{ width: `${((paso - 1) / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Contenedor del Formulario */}
      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-gray-100">
        
        {/* ================= PASO 1: UBICACION E INMUEBLE ================= */}
        {paso === 1 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#0F2547]">
                ¿Dónde se instalará el sistema solar?
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Tu comuna nos permite saber cuánto sol recibe tu zona al día para calcular con precisión la energía que generarán tus paneles.
              </p>
            </div>

            {/* Input Comuna Predictivo */}
            <div className="relative">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 block mb-2">
                Comuna o Ciudad de Instalación
              </label>
              <div className="relative">
                <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Escribe tu comuna (ej. Colina, Las Condes, Chillán, Rancagua...)"
                  value={busquedaComuna}
                  maxLength={60}
                  onChange={handleComunaInputChange}
                  onFocus={() => {
                    if (busquedaComuna.trim().length >= 1) {
                      setMostrarSugerencias(true);
                    }
                  }}
                  onBlur={handleComunaBlur}
                  autoComplete="off"
                  className={`w-full pl-11 pr-4 py-3 bg-gray-50 text-gray-900 placeholder:text-gray-400 rounded-2xl border text-sm outline-none transition-all ${getFieldClasses("comuna")}`}
                />
              </div>

              {/* Menu desplegable predictivo estilo Google Places */}
              {mostrarSugerencias && sugerenciasComunas.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
                  {sugerenciasComunas.map((item) => (
                    <button
                      key={`${item.comuna}-${item.region}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        seleccionarComuna(item);
                      }}
                      className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#00fc82]/20 flex items-center justify-center text-[#0F2547]">
                          <FiMapPin size={16} />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-[#0F2547] block">
                            {item.comuna}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.region}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                        Chile
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Indicador de Comuna y Region confirmada */}
              {formData.comuna && formData.region && (
                <div className="mt-2.5 flex items-center gap-2 text-xs text-gray-600 bg-emerald-50/70 py-1.5 px-3 rounded-xl border border-emerald-200 w-fit">
                  <FiCheck className="text-emerald-700 font-bold" />
                  <span>Comuna: <strong className="text-[#0F2547]">{formData.comuna}</strong></span>
                  <span className="text-gray-300">|</span>
                  <span>Región: <strong className="text-[#0F2547]">{formData.region}</strong></span>
                </div>
              )}

              {errores.comuna && (
                <p className="text-red-500 text-xs font-bold mt-1.5">{errores.comuna}</p>
              )}

              {/* Sugerencias rapidas de comunas */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="text-[11px] text-gray-400 self-center mr-1">Frecuentes:</span>
                {COMUNAS_DESTACADAS.slice(0, 7).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => seleccionarComunaRapida(c)}
                    className="text-[11px] font-semibold px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de Inmueble */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 block mb-3">
                Tipo de Propiedad
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TIPOS_PROPIEDAD.map((t) => {
                  const seleccionado = formData.tipo_propiedad === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, tipo_propiedad: t.id })}
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        seleccionado
                          ? "bg-[#0F2547] text-white border-[#0F2547] shadow-md"
                          : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <h3 className="font-bold text-sm">{t.titulo}</h3>
                      <p className={`text-xs mt-1 leading-relaxed ${seleccionado ? "text-gray-300" : "text-gray-500"}`}>
                        {t.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tipo de Techo */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 block mb-3">
                Superficie / Tipo de Techo
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TIPOS_TECHO.map((tech) => {
                  const seleccionado = formData.tipo_techo === tech.id;
                  return (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, tipo_techo: tech.id })}
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        seleccionado
                          ? "bg-[#0F2547] text-white border-[#0F2547] shadow-md"
                          : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <h3 className="font-bold text-sm">{tech.titulo}</h3>
                      <p className={`text-xs mt-1 leading-relaxed ${seleccionado ? "text-gray-300" : "text-gray-500"}`}>
                        {tech.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={siguientePaso}
                className="btn bg-[#0F2547] text-white hover:bg-[#00fc82] hover:text-[#0F2547] border-none font-bold rounded-xl px-8 shadow-lg cursor-pointer"
              >
                Siguiente Paso <FiArrowRight className="ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* ================= PASO 2: CONSUMO ELECTRICO ================= */}
        {paso === 2 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#0F2547]">
                ¿Cuánto consumes de energía eléctrica?
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Con tu gasto mensual la IA dimensiona los Watts necesarios para reemplazar la compra a la distribuidora.
              </p>
            </div>

            {/* Slider de Gasto en CLP */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Gasto Promedio Mensual en Boleta
                </span>
                <span className="text-2xl font-extrabold text-[#0F2547]">
                  {formatearMoneda(formData.gasto_mensual_clp)}
                </span>
              </div>

              <input
                type="range"
                min="20000"
                max="500000"
                step="5000"
                value={formData.gasto_mensual_clp}
                onChange={(e) => handleGastoChange(e.target.value)}
                className="range range-success w-full"
              />

              <div className="flex justify-between text-xs text-gray-400 font-semibold mt-2">
                <span>$20.000 CLP</span>
                <span>$250.000 CLP</span>
                <span>$500.000+ CLP</span>
              </div>

              {/* Equivalente estimado en kWh */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-600">
                <span>Consumo mensual equivalente aproximado:</span>
                <span className="font-bold text-[#0F2547] text-sm bg-white px-3 py-1 rounded-lg border border-gray-200">
                  ~{formData.consumo_kwh_mensual} kWh / mes
                </span>
              </div>
            </div>

            {/* Tipo de Red Eléctrica */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 block mb-3">
                Tipo de Conexión Eléctrica del Inmueble
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo_red: "monofasico" })}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    formData.tipo_red === "monofasico"
                      ? "bg-[#0F2547] text-white border-[#0F2547] shadow-md"
                      : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <h3 className="font-bold text-sm">Monofásica (220V)</h3>
                  <p className={`text-xs mt-1 ${formData.tipo_red === "monofasico" ? "text-gray-300" : "text-gray-500"}`}>
                    La conexión estándar de la inmensa mayoría de casas y departamentos en Chile.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo_red: "trifasico" })}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    formData.tipo_red === "trifasico"
                      ? "bg-[#0F2547] text-white border-[#0F2547] shadow-md"
                      : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <h3 className="font-bold text-sm">Trifásica (380V)</h3>
                  <p className={`text-xs mt-1 ${formData.tipo_red === "trifasico" ? "text-gray-300" : "text-gray-500"}`}>
                    Común en parcelas con bombas de riego, talleres, galpones y locales comerciales.
                  </p>
                </button>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={anteriorPaso}
                className="btn btn-ghost text-gray-600 font-bold hover:bg-gray-100 rounded-xl px-6 cursor-pointer"
              >
                <FiArrowLeft className="mr-2" /> Atrás
              </button>
              <button
                type="button"
                onClick={siguientePaso}
                className="btn bg-[#0F2547] text-white hover:bg-[#00fc82] hover:text-[#0F2547] border-none font-bold rounded-xl px-8 shadow-lg cursor-pointer"
              >
                Siguiente Paso <FiArrowRight className="ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* ================= PASO 3: OBJETIVO DEL SISTEMA ================= */}
        {paso === 3 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#0F2547]">
                ¿Cuál es tu objetivo con la energía solar?
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Esto determina si requieres inversores de inyección a red, inversores híbridos o bancos de baterías de litio.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {OBJETIVOS_SISTEMA.map((obj) => {
                const seleccionado = formData.objetivo_sistema === obj.id;
                const Icono = obj.icono;
                return (
                  <button
                    key={obj.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, objetivo_sistema: obj.id })}
                    className={`text-left p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                      seleccionado
                        ? "bg-[#0F2547] text-white border-[#0F2547] shadow-lg"
                        : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <div className={`p-3 rounded-xl mt-0.5 ${
                      seleccionado ? "bg-[#00fc82] text-[#0F2547]" : "bg-white text-[#0F2547] border border-gray-200"
                    }`}>
                      <Icono size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{obj.titulo}</h3>
                      <p className={`text-xs mt-1 leading-relaxed ${seleccionado ? "text-gray-300" : "text-gray-500"}`}>
                        {obj.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Rango de Presupuesto */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600 block mb-3">
                Rango de Inversión Esperado (Opcional)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "economico", label: "Menos de $3.5M" },
                  { id: "estandar", label: "$3.5M a $6.5M" },
                  { id: "premium", label: "Más de $6.5M" },
                  { id: "por_definir", label: "Por Definir" }
                ].map((pre) => (
                  <button
                    key={pre.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, presupuesto_estimado: pre.id })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      formData.presupuesto_estimado === pre.id
                        ? "bg-[#0F2547] text-white border-[#0F2547]"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {pre.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={anteriorPaso}
                className="btn btn-ghost text-gray-600 font-bold hover:bg-gray-100 rounded-xl px-6 cursor-pointer"
              >
                <FiArrowLeft className="mr-2" /> Atrás
              </button>
              <button
                type="button"
                onClick={siguientePaso}
                className="btn bg-[#0F2547] text-white hover:bg-[#00fc82] hover:text-[#0F2547] border-none font-bold rounded-xl px-8 shadow-lg cursor-pointer"
              >
                Siguiente Paso <FiArrowRight className="ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* ================= PASO 4: DATOS DE CONTACTO ================= */}
        {paso === 4 && (
          <form onSubmit={calcularCotizacionIA} noValidate className="space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#0F2547]">
                ¿A dónde enviamos tu propuesta técnica?
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                La IA procesará tus respuestas y generará el informe detallado en pantalla de inmediato.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 block mb-1.5">
                  Nombre Completo
                </label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ej. Andrés Silva"
                    value={formData.nombre}
                    maxLength={60}
                    onChange={(e) => handleContactChange("nombre", e.target.value)}
                    onBlur={() => handleContactBlur("nombre")}
                    autoComplete="name"
                    className={`w-full pl-11 pr-4 py-3 bg-gray-50 text-gray-900 placeholder:text-gray-400 rounded-2xl border text-sm outline-none transition-all ${getFieldClasses("nombre")}`}
                  />
                </div>
                {errores.nombre && <p className="text-red-500 text-xs font-bold mt-1.5">{errores.nombre}</p>}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 block mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Ej. andres@empresa.cl"
                    value={formData.email}
                    maxLength={80}
                    onChange={(e) => handleContactChange("email", e.target.value)}
                    onBlur={() => handleContactBlur("email")}
                    autoComplete="email"
                    className={`w-full pl-11 pr-4 py-3 bg-gray-50 text-gray-900 placeholder:text-gray-400 rounded-2xl border text-sm outline-none transition-all ${getFieldClasses("email")}`}
                  />
                </div>
                {errores.email && <p className="text-red-500 text-xs font-bold mt-1.5">{errores.email}</p>}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 block mb-1.5">
                  Teléfono / WhatsApp
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="Ej. +56 9 8765 4321"
                    value={formData.telefono}
                    maxLength={16}
                    onChange={(e) => handleContactChange("telefono", e.target.value)}
                    onBlur={() => handleContactBlur("telefono")}
                    autoComplete="tel"
                    className={`w-full pl-11 pr-4 py-3 bg-gray-50 text-gray-900 placeholder:text-gray-400 rounded-2xl border text-sm outline-none transition-all ${getFieldClasses("telefono")}`}
                  />
                </div>
                {errores.telefono && <p className="text-red-500 text-xs font-bold mt-1.5">{errores.telefono}</p>}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex items-center gap-3">
              <FiShield className="text-[#0F2547] shrink-0" size={20} />
              <p className="text-[11px] text-gray-500 leading-snug">
                Tus datos están protegidos. Solo serán utilizados para entregarte la propuesta solar técnica y no serán compartidos con terceros.
              </p>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={anteriorPaso}
                disabled={analizando}
                className="btn btn-ghost text-gray-600 font-bold hover:bg-gray-100 rounded-xl px-6 cursor-pointer"
              >
                <FiArrowLeft className="mr-2" /> Atrás
              </button>
              <button
                type="submit"
                disabled={analizando}
                className="btn bg-[#00fc82] text-[#0F2547] hover:bg-[#00fc82]/80 border-none font-extrabold rounded-xl px-8 shadow-lg shadow-[#00fc82]/30 cursor-pointer"
              >
                {analizando ? (
                  <span className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-xs"></span>
                    Dimensionando con IA...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FiCpu /> Calcular con Inteligencia Artificial
                  </span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ================= PASO 5: RESULTADOS DE LA IA ================= */}
        {paso === 5 && resultado && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Cabecera del Resultado */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-100">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#00fc82] bg-[#0F2547] px-3 py-1 rounded-full">
                  Propuesta Técnica Preliminar IA
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#0F2547] mt-2">
                  Kit Solar Óptimo para {formData.comuna}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Generado para {formData.nombre} ({formData.email}) en base a un gasto de {formatearMoneda(formData.gasto_mensual_clp)}/mes.
                </p>
              </div>

              <button
                onClick={reiniciarCotizador}
                className="btn btn-sm btn-ghost text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-xs"
              >
                <FiRotateCcw className="mr-1" /> Nueva Simulación
              </button>
            </div>

            {/* Metricas Clave */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Potencia Sugerida</span>
                <span className="text-2xl md:text-3xl font-extrabold text-[#0F2547]">{resultado.potenciaRealKwp} kWp</span>
                <span className="text-[10px] text-gray-500 block mt-1">Potencia instalada pico</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Paneles Solares</span>
                <span className="text-2xl md:text-3xl font-extrabold text-[#0F2547]">{resultado.cantidadPaneles} uds.</span>
                <span className="text-[10px] text-gray-500 block mt-1">Paneles 550W Tier-1</span>
              </div>

              <div className="bg-green-50/50 p-4 rounded-2xl border border-green-200 text-center">
                <span className="text-[11px] font-bold text-green-700 uppercase tracking-wider block mb-1">Ahorro Estimado</span>
                <span className="text-2xl md:text-3xl font-extrabold text-green-700">{formatearMoneda(resultado.ahorroAnualClp)}</span>
                <span className="text-[10px] text-green-700 block mt-1">Por año en tu boleta</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Retorno de Inversión</span>
                <span className="text-2xl md:text-3xl font-extrabold text-[#0F2547]">~{resultado.retornoInversionAnios} años</span>
                <span className="text-[10px] text-gray-500 block mt-1">Payback proyectado</span>
              </div>
            </div>

            {/* Desglose de Equipamiento Sugerido */}
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 space-y-4">
              <h3 className="font-extrabold text-base text-[#0F2547]">
                Equipamiento Principal Recomendado por el Algoritmo
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0F2547]/5 flex items-center justify-center text-[#0F2547]">
                      <FiSun size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-800">Módulos Fotovoltaicos</h4>
                      <p className="text-xs text-gray-500">{resultado.cantidadPaneles}x Paneles Monocristalinos 550W de Alta Eficiencia</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0F2547] bg-gray-100 px-2.5 py-1 rounded-md">
                    {resultado.superficieTechoRequerida} m² de techo
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0F2547]/5 flex items-center justify-center text-[#0F2547]">
                      <FiZap size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-800">Inversor Solar Central</h4>
                      <p className="text-xs text-gray-500">{resultado.inversorSugerido}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0F2547] bg-gray-100 px-2.5 py-1 rounded-md">
                    Certificado SEC
                  </span>
                </div>

                {resultado.bateriaSugerida && (
                  <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0F2547]/5 flex items-center justify-center text-[#0F2547]">
                        <FiBatteryCharging size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-800">Almacenamiento en Batería</h4>
                        <p className="text-xs text-gray-500">{resultado.bateriaSugerida}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-md">
                      Autonomía Nocturna
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Impacto Ambiental */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
              <FiTrendingUp className="text-emerald-700 shrink-0" size={24} />
              <p className="text-xs text-emerald-800 font-medium">
                Con este sistema evitarás la emisión de aproximadamente <strong className="font-extrabold">{resultado.co2EvitadoToneladas} toneladas de CO2 al año</strong>, equivalente a plantar más de 45 árboles.
              </p>
            </div>

            {/* Botones de Accion */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 items-stretch sm:items-center">
              <button
                type="button"
                onClick={reiniciarCotizador}
                className="btn btn-ghost text-gray-600 font-bold hover:bg-gray-100 rounded-xl order-3 sm:order-1"
              >
                Volver a Modificar Datos
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const kitPrecioEstimado = Math.max(1290000, Math.round(resultado.potenciaRealKwp * 850000));
                  agregarAlCarrito({
                    id: `kit-ia-${Math.round(resultado.potenciaRealKwp * 10)}`,
                    nombre: `Kit Solar Fotovoltaico ${resultado.potenciaRealKwp} kWp (${resultado.cantidadPaneles} Paneles)`,
                    descripcion: `Sistema dimensionado por IA para ${formData.comuna}: ${resultado.inversorSugerido}${resultado.bateriaSugerida ? ' + ' + resultado.bateriaSugerida : ''}`,
                    precio: kitPrecioEstimado,
                    es_kit: true,
                    stock: 5,
                    imagen_url: ""
                  }, 1);
                  setKitAgregado(true);
                  setTimeout(() => setKitAgregado(false), 3000);
                }}
                className="btn bg-[#00fc82] text-[#0F2547] hover:bg-[#00e074] border-none font-black rounded-xl shadow-lg px-6 gap-2 order-1 sm:order-2"
              >
                <FiShoppingBag className="w-4 h-4" />
                <span>{kitAgregado ? "¡Kit Añadido al Carrito!" : "Añadir Kit Sugerido al Carrito"}</span>
              </button>

              <a
                href={`https://wa.me/56912345678?text=Hola,%20acabo%20de%20realizar%20la%20cotizaci%C3%B3n%20IA%20para%20${encodeURIComponent(formData.comuna)}%20con%20potencia%20estimada%20de%20${resultado.potenciaRealKwp}kWp.`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-[#0F2547] text-white hover:bg-[#1a3865] border-none font-bold rounded-xl shadow-lg px-6 order-2 sm:order-3"
              >
                Hablar con un Ingeniero
              </a>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
