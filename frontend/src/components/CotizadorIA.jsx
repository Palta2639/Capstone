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
  FiRotateCcw,
  FiShoppingBag,
} from "react-icons/fi";

import api from "@/src/services/api";
import { useCart } from "@/src/context/CartContext";
import { formatearMoneda } from "@/src/utils/formatters";
import {
  buscarComunasChile,
  COMUNAS_CHILE,
} from "@/src/utils/chileData";
import {
  sanitizeName,
  sanitizeEmail,
  sanitizePhone,
  sanitizeComuna,
  validateCotizacionField,
} from "@/src/utils/validations";

const COMUNAS_DESTACADAS = [
  "Quilpué",
  "Viña del Mar",
  "Valparaíso",
  "Santiago",
  "Colina",
  "Rancagua",
  "La Serena",
];

const TIPOS_PROPIEDAD = [
  {
    id: "casa",
    titulo: "Casa residencial",
    descripcion: "Vivienda particular urbana o suburbana.",
  },
  {
    id: "parcela",
    titulo: "Parcela / Campo",
    descripcion: "Zonas rurales o terrenos amplios.",
  },
  {
    id: "comercial",
    titulo: "Comercio / Taller",
    descripcion: "Locales comerciales, oficinas o pymes.",
  },
  {
    id: "industrial",
    titulo: "Agro / Industrial",
    descripcion: "Bodegas, galpones o instalaciones productivas.",
  },
];

const TIPOS_TECHO = [
  {
    id: "zinc",
    titulo: "Zinc o chapa metálica",
    descripcion: "Cubierta metálica.",
  },
  {
    id: "teja",
    titulo: "Teja",
    descripcion: "Cubierta de tejas.",
  },
  {
    id: "losa",
    titulo: "Losa de hormigón",
    descripcion: "Superficie de hormigón.",
  },
  {
    id: "suelo",
    titulo: "Sobre suelo",
    descripcion: "Instalación proyectada en terreno.",
  },
];

const OBJETIVOS_SISTEMA = [
  {
    id: "ahorro_red",
    titulo: "On-Grid",
    descripcion:
      "Sistema conectado a la red. El ahorro requiere una evaluación adicional.",
    icono: FiSun,
  },
  {
    id: "hibrido",
    titulo: "Híbrido",
    descripcion:
      "Sistema con almacenamiento. La autonomía requiere validación técnica.",
    icono: FiBatteryCharging,
  },
  {
    id: "off_grid",
    titulo: "Off-Grid",
    descripcion:
      "Sistema aislado. El balance mensual no garantiza autonomía.",
    icono: FiZap,
  },
];

const PASOS = [
  { numero: 1, nombre: "Ubicación" },
  { numero: 2, nombre: "Consumo" },
  { numero: 3, nombre: "Sistema" },
  { numero: 4, nombre: "Contacto" },
];

const DATOS_INICIALES = {
  comuna: "",
  region: "",
  tipo_propiedad: "casa",
  tipo_techo: "zinc",
  gasto_mensual_clp: 75000,
  consumo_kwh_mensual: 350,
  tipo_red: "monofasico",
  objetivo_sistema: "ahorro_red",
  presupuesto_max_clp: "",
  superficie_disponible_m2: "",
  nombre: "",
  email: "",
  telefono: "",
};

const CLASE_INPUT =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 " +
  "text-gray-900 outline-none focus:border-emerald-500";

const CLASE_PRIMARIO =
  "inline-flex items-center justify-center gap-2 rounded-xl " +
  "bg-[#0F2547] px-6 py-3 font-bold text-white " +
  "hover:bg-[#18385f] disabled:opacity-50";

const CLASE_SECUNDARIO =
  "inline-flex items-center justify-center gap-2 rounded-xl " +
  "border border-gray-300 px-6 py-3 font-semibold text-gray-700 " +
  "hover:bg-gray-100 disabled:opacity-50";

function Opciones({ opciones, seleccionado, onSeleccionar }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {opciones.map((opcion) => {
        const activo = seleccionado === opcion.id;

        return (
          <button
            key={opcion.id}
            type="button"
            aria-pressed={activo}
            onClick={() => onSeleccionar(opcion.id)}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              activo
                ? "border-[#0F2547] bg-[#0F2547] text-white"
                : "border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100"
            }`}
          >
            <span className="block font-bold">{opcion.titulo}</span>

            <span
              className={`mt-1 block text-xs ${
                activo ? "text-gray-300" : "text-gray-500"
              }`}
            >
              {opcion.descripcion}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ErrorCampo({ mensaje }) {
  if (!mensaje) return null;

  return (
    <p role="alert" className="mt-2 text-sm text-red-600">
      {mensaje}
    </p>
  );
}

export default function CotizadorIA() {
  const { agregarAlCarrito } = useCart();

  const [paso, setPaso] = useState(1);
  const [formData, setFormData] = useState(DATOS_INICIALES);
  const [errores, setErrores] = useState({});
  const [errorKNN, setErrorKNN] = useState("");
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [kitAgregado, setKitAgregado] = useState(false);

  const [sugerenciasComunas, setSugerenciasComunas] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const actualizarCampo = (campo, valor) => {
    setFormData((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    setErrores((anteriores) => ({
      ...anteriores,
      [campo]: "",
    }));

    setErrorKNN("");
  };

  const buscarComuna = (valorIngresado) => {
    const valor = sanitizeComuna(valorIngresado);

    setFormData((anterior) => ({
      ...anterior,
      comuna: valor,
      region: "",
    }));

    setErrores((anteriores) => ({
      ...anteriores,
      comuna: "",
    }));

    setSugerenciasComunas(
      valor.trim() ? buscarComunasChile(valor, 6) : []
    );

    setMostrarSugerencias(Boolean(valor.trim()));
  };

  const seleccionarComuna = (item) => {
    setFormData((anterior) => ({
      ...anterior,
      comuna: sanitizeComuna(item.comuna),
      region: sanitizeComuna(item.region || ""),
    }));

    setMostrarSugerencias(false);
    setSugerenciasComunas([]);

    setErrores((anteriores) => ({
      ...anteriores,
      comuna: "",
    }));
  };

  const seleccionarComunaRapida = (nombre) => {
    const encontrada = COMUNAS_CHILE.find(
      (item) => item.comuna.toLowerCase() === nombre.toLowerCase()
    );

    seleccionarComuna(
      encontrada || {
        comuna: nombre,
        region: "",
      }
    );
  };

  const cambiarGasto = (valor) => {
    const gasto = Number(valor);

    // Aproximación de demostración, no una tarifa verificada.
    const consumoEstimado = Math.round(gasto / 190);

    setFormData((anterior) => ({
      ...anterior,
      gasto_mensual_clp: gasto,
      consumo_kwh_mensual: consumoEstimado,
    }));

    setErrores((anteriores) => ({
      ...anteriores,
      consumo_kwh_mensual: "",
    }));

    setErrorKNN("");
  };

  const cambiarContacto = (campo, valor) => {
    let limpio = valor;

    if (campo === "nombre") limpio = sanitizeName(valor);
    if (campo === "email") limpio = sanitizeEmail(valor);
    if (campo === "telefono") limpio = sanitizePhone(valor);

    actualizarCampo(campo, limpio);
  };

  const obtenerErroresPaso = (numeroPaso) => {
    const nuevosErrores = {};

    if (numeroPaso === 1) {
      const error = validateCotizacionField("comuna", formData.comuna);

      if (error) nuevosErrores.comuna = error;
    }

    if (numeroPaso === 2) {
      const consumo = Number(formData.consumo_kwh_mensual);

      if (!Number.isFinite(consumo) || consumo < 30 || consumo > 1500) {
        nuevosErrores.consumo_kwh_mensual =
          "Ingresa un consumo de 30 a 1500 kWh al mes.";
      }

      if (formData.tipo_red === "trifasico") {
        nuevosErrores.tipo_red =
          "Este catálogo no tiene compatibilidad trifásica validada. " +
          "Se necesita evaluación técnica.";
      }
    }

    if (numeroPaso === 3) {
      if (String(formData.presupuesto_max_clp).trim() !== "") {
        const presupuesto = Number(formData.presupuesto_max_clp);

        if (!Number.isSafeInteger(presupuesto) || presupuesto <= 0) {
          nuevosErrores.presupuesto_max_clp =
            "Ingresa un presupuesto positivo en pesos enteros.";
        }
      }

      if (String(formData.superficie_disponible_m2).trim() !== "") {
        const superficie = Number(formData.superficie_disponible_m2);

        if (!Number.isFinite(superficie) || superficie <= 0) {
          nuevosErrores.superficie_disponible_m2 =
            "Ingresa una superficie mayor que cero.";
        }
      }
    }

    if (numeroPaso === 4) {
      // Contacto opcional: solo se valida si tiene contenido.
      for (const campo of ["nombre", "email", "telefono"]) {
        if (formData[campo].trim()) {
          const error = validateCotizacionField(campo, formData[campo]);

          if (error) nuevosErrores[campo] = error;
        }
      }
    }

    return nuevosErrores;
  };

  const siguientePaso = () => {
    const nuevosErrores = obtenerErroresPaso(paso);

    setErrores(nuevosErrores);
    setErrorKNN("");

    if (Object.keys(nuevosErrores).length === 0) {
      setPaso((actual) => Math.min(actual + 1, 4));
    }
  };

  const anteriorPaso = () => {
    setErrorKNN("");
    setErrores({});
    setPaso((actual) => Math.max(actual - 1, 1));
  };

  const calcularCotizacionIA = async (event) => {
    event.preventDefault();

    if (analizando) return;

    setErrorKNN("");
    setResultado(null);
    setKitAgregado(false);

    for (let numeroPaso = 1; numeroPaso <= 4; numeroPaso += 1) {
      const nuevosErrores = obtenerErroresPaso(numeroPaso);

      if (Object.keys(nuevosErrores).length > 0) {
        setErrores(nuevosErrores);
        setPaso(numeroPaso);
        return;
      }
    }

    setErrores({});
    setAnalizando(true);

    const payload = {
      consumo_kwh_mensual: Number(formData.consumo_kwh_mensual),
      objetivo_sistema: formData.objetivo_sistema,
      tipo_red: formData.tipo_red,

      // Supuestos del prototipo; no se calculan desde la comuna.
      hsp: 4.8,
      cobertura_objetivo: 1,

      presupuesto_max_clp:
        String(formData.presupuesto_max_clp).trim() === ""
          ? null
          : Number(formData.presupuesto_max_clp),

      superficie_disponible_m2:
        String(formData.superficie_disponible_m2).trim() === ""
          ? null
          : Number(formData.superficie_disponible_m2),
    };

    try {
      const { data } = await api.post("/cotizaciones/knn", payload);

      const camposNumericos = [
        "precio_clp",
        "stock",
        "potencia_kwp",
        "cantidad_paneles",
        "superficie_estimada_m2",
        "energia_mensual_estimada_kwh",
      ];

      const respuestaValida =
        Number.isInteger(data?.producto_id) &&
        data.producto_id > 0 &&
        typeof data.nombre === "string" &&
        data.nombre.trim() !== "" &&
        camposNumericos.every((campo) => Number.isFinite(data[campo])) &&
        data.precio_clp > 0 &&
        data.stock > 0 &&
        data.potencia_kwp > 0;

      if (!respuestaValida) {
        throw new Error(
          "La API no devolvió un kit válido. Revisa /cotizaciones/knn."
        );
      }

      setResultado(data);
      setPaso(5);
    } catch (error) {
      const detalle = error.response?.data?.detail;

      if (error.response?.status === 404) {
        setErrorKNN(
          "No se encontró /cotizaciones/knn. Agrega la ruta del modelo " +
            "en el backend y reinicia el servidor."
        );
      } else if (typeof detalle === "string") {
        setErrorKNN(detalle);
      } else if (Array.isArray(detalle)) {
        setErrorKNN(
          detalle
            .map(
              (item) =>
                `${item.loc?.slice(1).join(".") || "Datos"}: ${item.msg}`
            )
            .join(" | ")
        );
      } else if (error.response) {
        setErrorKNN(
          "El servidor no pudo completar la recomendación. " +
            "Revisa la terminal del backend."
        );
      } else if (error.request) {
        setErrorKNN(
          "No se pudo contactar con el backend. Revisa que esté " +
            "funcionando y que la URL de la API sea correcta."
        );
      } else {
        setErrorKNN(error.message || "No se pudo obtener la recomendación.");
      }
    } finally {
      setAnalizando(false);
    }
  };

  const reiniciarCotizador = () => {
    setPaso(1);
    setResultado(null);
    setErrorKNN("");
    setErrores({});
    setKitAgregado(false);
  };

  const agregarKitAlCarrito = () => {
    if (!resultado || kitAgregado) return;

    agregarAlCarrito(
      {
        id: resultado.producto_id,
        nombre: resultado.nombre,
        descripcion:
          "Kit de prueba recomendado por KNN. Requiere validación técnica.",
        precio: resultado.precio_clp,
        stock: resultado.stock,
        potencia_watts: Math.round(resultado.potencia_kwp * 1000),
        es_kit: true,
        imagen_url: resultado.imagen_url || "",
      },
      1
    );

    setKitAgregado(true);
  };

  return (
    <div className="mx-auto my-8 max-w-4xl px-4">
      <header className="mb-8 text-center">
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-800">
          Recomendador solar KNN
        </span>

        <h1 className="mt-4 text-3xl font-extrabold text-[#0F2547] md:text-4xl">
          Cotizador de kits solares
        </h1>

        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
          Prototipo entrenado con perfiles simulados. Utiliza tu consumo
          eléctrico y el tipo de sistema para recomendar un kit del catálogo.
        </p>
      </header>

      {errorKNN && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
        >
          {errorKNN}
        </div>
      )}

      {paso <= 4 && (
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-2">
            {PASOS.map((item) => {
              const completado = paso > item.numero;
              const activo = paso === item.numero;

              return (
                <div
                  key={item.numero}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                      activo
                        ? "bg-[#0F2547] text-white"
                        : completado
                          ? "bg-[#00fc82] text-[#0F2547]"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {completado ? <FiCheck /> : item.numero}
                  </div>

                  <span className="mt-2 text-xs font-semibold text-gray-600">
                    {item.nombre}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-[#00fc82] transition-all"
              style={{ width: `${((paso - 1) / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl md:p-10">
        {/* PASO 1: UBICACIÓN */}
        {paso === 1 && (
          <div className="space-y-7">
            <div>
              <h2 className="text-2xl font-bold text-[#0F2547]">
                ¿Dónde se instalará el sistema?
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                La ubicación y las características del inmueble se conservan
                como referencia en pantalla. Esta versión no las utiliza para
                calcular radiación ni dimensionar la estructura.
              </p>
            </div>

            <div className="relative">
              <label
                htmlFor="comuna-knn"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Comuna
              </label>

              <div className="relative">
                <FiMapPin className="absolute left-3 top-4 text-gray-400" />

                <input
                  id="comuna-knn"
                  type="text"
                  value={formData.comuna}
                  maxLength={60}
                  autoComplete="off"
                  placeholder="Ej. Quilpué"
                  onChange={(event) => buscarComuna(event.target.value)}
                  onFocus={() => {
                    if (formData.comuna.trim()) {
                      setSugerenciasComunas(
                        buscarComunasChile(formData.comuna, 6)
                      );
                      setMostrarSugerencias(true);
                    }
                  }}
                  onBlur={() => setMostrarSugerencias(false)}
                  className={`${CLASE_INPUT} pl-10`}
                />
              </div>

              {mostrarSugerencias && sugerenciasComunas.length > 0 && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {sugerenciasComunas.map((item) => (
                    <button
                      key={`${item.comuna}-${item.region}`}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => seleccionarComuna(item)}
                      className="block w-full px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <span className="block font-semibold text-gray-900">
                        {item.comuna}
                      </span>

                      <span className="text-xs text-gray-500">
                        {item.region}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <ErrorCampo mensaje={errores.comuna} />

              {formData.region && (
                <p className="mt-2 text-xs text-emerald-700">
                  Región: {formData.region}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {COMUNAS_DESTACADAS.map((nombre) => (
                  <button
                    key={nombre}
                    type="button"
                    onClick={() => seleccionarComunaRapida(nombre)}
                    className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    {nombre}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-gray-700">
                Tipo de propiedad
              </h3>

              <Opciones
                opciones={TIPOS_PROPIEDAD}
                seleccionado={formData.tipo_propiedad}
                onSeleccionar={(valor) =>
                  actualizarCampo("tipo_propiedad", valor)
                }
              />
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-gray-700">
                Tipo de techo o superficie
              </h3>

              <Opciones
                opciones={TIPOS_TECHO}
                seleccionado={formData.tipo_techo}
                onSeleccionar={(valor) =>
                  actualizarCampo("tipo_techo", valor)
                }
              />
            </div>

            <div className="flex justify-end border-t pt-5">
              <button
                type="button"
                onClick={siguientePaso}
                className={CLASE_PRIMARIO}
              >
                Siguiente <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: CONSUMO */}
        {paso === 2 && (
          <div className="space-y-7">
            <div>
              <h2 className="text-2xl font-bold text-[#0F2547]">
                ¿Cuánta electricidad consumes?
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Usa preferentemente el consumo en kWh de tu boleta.
                El gasto monetario solo permite una aproximación.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <label
                htmlFor="gasto-knn"
                className="block font-semibold text-gray-700"
              >
                Gasto mensual aproximado
              </label>

              <p className="mt-2 text-2xl font-bold text-[#0F2547]">
                {formatearMoneda(formData.gasto_mensual_clp)}
              </p>

              <input
                id="gasto-knn"
                type="range"
                min="20000"
                max="500000"
                step="5000"
                value={formData.gasto_mensual_clp}
                onChange={(event) => cambiarGasto(event.target.value)}
                className="mt-4 w-full accent-emerald-500"
              />

              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>$20.000</span>
                <span>$500.000</span>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Al mover el deslizador se aproxima el consumo usando
                190 CLP/kWh como supuesto, no como tarifa verificada.
                Puedes corregir el consumo debajo.
              </p>
            </div>

            <div>
              <label
                htmlFor="consumo-knn"
                className="mb-2 block font-semibold text-gray-700"
              >
                Consumo mensual de tu boleta (kWh)
              </label>

              <input
                id="consumo-knn"
                type="number"
                min="30"
                max="1500"
                step="any"
                value={formData.consumo_kwh_mensual}
                onChange={(event) =>
                  actualizarCampo("consumo_kwh_mensual", event.target.value)
                }
                className={CLASE_INPUT}
              />

              <p className="mt-2 text-xs text-gray-500">
                Este prototipo admite entre 30 y 1500 kWh al mes.
              </p>

              <ErrorCampo mensaje={errores.consumo_kwh_mensual} />
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-gray-700">
                Tipo de conexión eléctrica
              </h3>

              <Opciones
                opciones={[
                  {
                    id: "monofasico",
                    titulo: "Monofásica",
                    descripcion: "Escenario admitido por el prototipo.",
                  },
                  {
                    id: "trifasico",
                    titulo: "Trifásica",
                    descripcion:
                      "Requiere evaluación técnica; no está validada en este catálogo.",
                  },
                ]}
                seleccionado={formData.tipo_red}
                onSeleccionar={(valor) =>
                  actualizarCampo("tipo_red", valor)
                }
              />

              <ErrorCampo mensaje={errores.tipo_red} />
            </div>

            <div className="flex justify-between gap-3 border-t pt-5">
              <button
                type="button"
                onClick={anteriorPaso}
                className={CLASE_SECUNDARIO}
              >
                <FiArrowLeft /> Atrás
              </button>

              <button
                type="button"
                onClick={siguientePaso}
                className={CLASE_PRIMARIO}
              >
                Siguiente <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: SISTEMA */}
        {paso === 3 && (
          <div className="space-y-7">
            <div>
              <h2 className="text-2xl font-bold text-[#0F2547]">
                ¿Qué sistema necesitas?
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Se filtran los kits según el sistema elegido.
                El modelo no dimensiona inversores, baterías ni autonomía.
              </p>
            </div>

            <div className="space-y-3">
              {OBJETIVOS_SISTEMA.map((opcion) => {
                const activo = formData.objetivo_sistema === opcion.id;
                const Icono = opcion.icono;

                return (
                  <button
                    key={opcion.id}
                    type="button"
                    aria-pressed={activo}
                    onClick={() =>
                      actualizarCampo("objetivo_sistema", opcion.id)
                    }
                    className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left ${
                      activo
                        ? "border-[#0F2547] bg-[#0F2547] text-white"
                        : "border-gray-200 bg-gray-50 text-gray-800"
                    }`}
                  >
                    <Icono size={24} className="mt-1 shrink-0" />

                    <span>
                      <span className="block font-bold">
                        {opcion.titulo}
                      </span>

                      <span
                        className={`mt-1 block text-sm ${
                          activo ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {opcion.descripcion}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div>
              <label
                htmlFor="presupuesto-knn"
                className="mb-2 block font-semibold text-gray-700"
              >
                Presupuesto máximo para el kit (CLP, opcional)
              </label>

              <input
                id="presupuesto-knn"
                type="number"
                min="1"
                step="1"
                placeholder="Ej. 3000000"
                value={formData.presupuesto_max_clp}
                onChange={(event) =>
                  actualizarCampo("presupuesto_max_clp", event.target.value)
                }
                className={CLASE_INPUT}
              />

              <p className="mt-2 text-xs text-gray-500">
                Déjalo vacío para no aplicar un límite de precio.
              </p>

              <ErrorCampo mensaje={errores.presupuesto_max_clp} />
            </div>

            <div>
              <label
                htmlFor="superficie-knn"
                className="mb-2 block font-semibold text-gray-700"
              >
                Superficie disponible (m², opcional)
              </label>

              <input
                id="superficie-knn"
                type="number"
                min="0.1"
                step="any"
                placeholder="Ej. 25"
                value={formData.superficie_disponible_m2}
                onChange={(event) =>
                  actualizarCampo(
                    "superficie_disponible_m2",
                    event.target.value
                  )
                }
                className={CLASE_INPUT}
              />

              <ErrorCampo mensaje={errores.superficie_disponible_m2} />
            </div>

            <p className="text-sm text-gray-600">
              Se asumen 4,8 horas solares pico, rendimiento del 80 % y
              cobertura objetivo del 100 %. La comuna no modifica estos
              supuestos. La superficie del kit es una aproximación.
            </p>

            <div className="flex justify-between gap-3 border-t pt-5">
              <button
                type="button"
                onClick={anteriorPaso}
                className={CLASE_SECUNDARIO}
              >
                <FiArrowLeft /> Atrás
              </button>

              <button
                type="button"
                onClick={siguientePaso}
                className={CLASE_PRIMARIO}
              >
                Siguiente <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: CONTACTO Y ENVÍO */}
        {paso === 4 && (
          <form onSubmit={calcularCotizacionIA} noValidate>
            <fieldset disabled={analizando} className="space-y-7">
              <div>
                <h2 className="text-2xl font-bold text-[#0F2547]">
                  Datos de contacto opcionales
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Puedes dejar estos campos vacíos. Esta consulta no guarda
                  tus datos de contacto ni envía correos. El resultado se
                  mostrará aquí.
                </p>
              </div>

              {[
                {
                  campo: "nombre",
                  titulo: "Nombre",
                  tipo: "text",
                  placeholder: "Tu nombre",
                  maxLength: 60,
                  autoComplete: "name",
                  icono: FiUser,
                },
                {
                  campo: "email",
                  titulo: "Correo electrónico",
                  tipo: "email",
                  placeholder: "nombre@correo.cl",
                  maxLength: 80,
                  autoComplete: "email",
                  icono: FiMail,
                },
                {
                  campo: "telefono",
                  titulo: "Teléfono",
                  tipo: "tel",
                  placeholder: "+56 9 1234 5678",
                  maxLength: 16,
                  autoComplete: "tel",
                  icono: FiPhone,
                },
              ].map((item) => {
                const Icono = item.icono;

                return (
                  <div key={item.campo}>
                    <label
                      htmlFor={`contacto-${item.campo}`}
                      className="mb-2 block font-semibold text-gray-700"
                    >
                      {item.titulo}
                    </label>

                    <div className="relative">
                      <Icono className="absolute left-3 top-4 text-gray-400" />

                      <input
                        id={`contacto-${item.campo}`}
                        type={item.tipo}
                        placeholder={item.placeholder}
                        maxLength={item.maxLength}
                        autoComplete={item.autoComplete}
                        value={formData[item.campo]}
                        onChange={(event) =>
                          cambiarContacto(item.campo, event.target.value)
                        }
                        className={`${CLASE_INPUT} pl-10`}
                      />
                    </div>

                    <ErrorCampo mensaje={errores[item.campo]} />
                  </div>
                );
              })}

              <div className="border-t border-gray-200 pt-5">
                <h3 className="font-bold text-[#0F2547]">
                  Resumen de la solicitud
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  Consumo: {formData.consumo_kwh_mensual} kWh/mes.
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Sistema:{" "}
                  {
                    OBJETIVOS_SISTEMA.find(
                      (opcion) => opcion.id === formData.objetivo_sistema
                    )?.titulo
                  }
                  .
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Presupuesto máximo:{" "}
                  {formData.presupuesto_max_clp
                    ? formatearMoneda(Number(formData.presupuesto_max_clp))
                    : "Sin límite indicado"}
                  .
                </p>
              </div>

              <div className="flex flex-wrap justify-between gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={anteriorPaso}
                  className={CLASE_SECUNDARIO}
                >
                  <FiArrowLeft /> Atrás
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00fc82] px-6 py-3 font-bold text-[#0F2547] disabled:opacity-50"
                >
                  <FiCpu />
                  {analizando ? "Consultando KNN..." : "Recomendar kit"}
                </button>
              </div>
            </fieldset>
          </form>
        )}

        {/* PASO 5: RESULTADO DEL MODELO */}
        {paso === 5 && resultado && (
          <div className="space-y-7" aria-live="polite">
            <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-5 sm:flex-row">
              <div>
                <span className="text-xs font-bold uppercase text-emerald-700">
                  Resultado KNN · Prototipo
                </span>

                <h2 className="mt-2 text-2xl font-bold text-[#0F2547]">
                  {resultado.nombre}
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  Consumo considerado: {formData.consumo_kwh_mensual} kWh/mes.
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Ubicación de referencia: {formData.comuna}.
                  No se calculó radiación local.
                </p>
              </div>

              <button
                type="button"
                onClick={reiniciarCotizador}
                className={CLASE_SECUNDARIO}
              >
                <FiRotateCcw /> Modificar
              </button>
            </div>

            <div>
              <p className="text-3xl font-bold text-[#0F2547]">
                {formatearMoneda(resultado.precio_clp)}
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Precio del catálogo de prueba. No es una cotización
                definitiva de instalación.
              </p>
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {[
                ["Potencia del kit", `${resultado.potencia_kwp} kWp`],
                ["Paneles de 550 W", resultado.cantidad_paneles],
                [
                  "Energía mensual estimada",
                  `${resultado.energia_mensual_estimada_kwh} kWh`,
                ],
                [
                  "Superficie aproximada",
                  `${resultado.superficie_estimada_m2} m²`,
                ],
                ["Stock consultado", resultado.stock],
                ["ID del producto", resultado.producto_id],
              ].map(([titulo, valor]) => (
                <div
                  key={titulo}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >
                  <dt className="text-xs text-gray-600">{titulo}</dt>

                  <dd className="mt-2 text-xl font-bold text-[#0F2547]">
                    {valor}
                  </dd>
                </div>
              ))}
            </dl>

            {resultado.ajustado_por_restricciones && (
              <p className="text-sm text-gray-600">
                La selección se ajustó según los kits disponibles y las
                restricciones aplicadas por el servidor.
              </p>
            )}

            <div>
              <h3 className="font-bold text-[#0F2547]">
                Alcance de la recomendación
              </h3>

              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
                {(Array.isArray(resultado.advertencias)
                  ? resultado.advertencias
                  : []
                ).map((texto, indice) => (
                  <li key={indice}>{texto}</li>
                ))}
              </ul>

              <p className="mt-3 text-sm text-gray-600">
                No se estiman ahorro económico, retorno de inversión ni
                emisiones evitadas. La disponibilidad consultada no
                constituye una reserva de stock.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={reiniciarCotizador}
                className={CLASE_SECUNDARIO}
              >
                <FiRotateCcw /> Nueva recomendación
              </button>

              <button
                type="button"
                onClick={agregarKitAlCarrito}
                disabled={kitAgregado}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00fc82] px-6 py-3 font-bold text-[#0F2547] disabled:opacity-50"
              >
                <FiShoppingBag />

                {kitAgregado
                  ? "Kit añadido al carrito"
                  : "Añadir kit de prueba al carrito"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
