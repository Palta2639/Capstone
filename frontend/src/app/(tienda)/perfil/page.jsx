"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiShoppingBag, 
  FiCheckCircle, 
  FiSave,
  FiLock,
  FiLogIn,
  FiHome
} from "react-icons/fi";
import { userService, orderService } from "@/src/services/api";
import { formatearMoneda } from "@/src/utils/formatters";
import { sanitizeName, sanitizePhone } from "@/src/utils/validations";

export default function PerfilPage() {
  const [tabActiva, setTabActiva] = useState("contacto"); // 'contacto' | 'pedidos'
  const [cargando, setCargando] = useState(true);
  const [noAutorizado, setNoAutorizado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  const [usuario, setUsuario] = useState({
    id: null,
    nombre: "",
    email: "",
    telefono: "",
    rol_id: 2,
    creado_en: null,
  });

  const [misPedidos, setMisPedidos] = useState([]);

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
        const [perfilRes, pedidosRes] = await Promise.allSettled([
          userService.getProfile(),
          orderService.getMyOrders(),
        ]);

        if (!activo) return;

        if (perfilRes.status === "fulfilled" && perfilRes.value) {
          setUsuario({
            id: perfilRes.value.id,
            nombre: perfilRes.value.nombre || "",
            email: perfilRes.value.email || "",
            telefono: perfilRes.value.telefono || "",
            rol_id: perfilRes.value.rol_id,
            creado_en: perfilRes.value.creado_en,
          });
        } else if (perfilRes.status === "rejected" && perfilRes.reason?.response?.status === 401) {
          setNoAutorizado(true);
          return;
        }

        if (pedidosRes.status === "fulfilled" && Array.isArray(pedidosRes.value)) {
          setMisPedidos(pedidosRes.value);
        }
      } catch (err) {
        if (!activo) return;
        if (err.response && err.response.status === 401) {
          setNoAutorizado(true);
        } else {
          setMensajeError("No fue posible cargar la información de tu perfil.");
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

  const handleGuardarCambios = async (e) => {
    e.preventDefault();
    setMensajeExito("");
    setMensajeError("");

    const nombreLimpio = sanitizeName(usuario.nombre);
    const telefonoLimpio = sanitizePhone(usuario.telefono);

    if (!nombreLimpio || nombreLimpio.length < 2) {
      setMensajeError("Por favor ingresa un nombre válido (mínimo 2 caracteres).");
      return;
    }

    setGuardando(true);
    try {
      const actualizado = await userService.updateProfile({
        nombre: nombreLimpio,
        telefono: telefonoLimpio,
      });

      setUsuario((prev) => ({
        ...prev,
        nombre: actualizado.nombre,
        telefono: actualizado.telefono,
      }));

      setMensajeExito("Datos de contacto actualizados correctamente.");
      setTimeout(() => setMensajeExito(""), 4000);
    } catch (err) {
      console.error("Error actualizando perfil:", err);
      setMensajeError("No se pudieron guardar los cambios. Intenta nuevamente.");
    } finally {
      setGuardando(false);
    }
  };

  // Estado si no está autenticado o la sesión expiró
  if (noAutorizado) {
    return (
      <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm">
            <FiLock className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-[#0F2547]">
            Inicia Sesión para Ver tu Perfil
          </h2>

          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
            Tu sesión ha expirado o necesitas identificarte para consultar y actualizar tus datos de contacto.
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

  if (cargando) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 text-gray-700">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0F2547] mb-4"></div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* CABECERA DE PERFIL */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#0F2547] text-[#00fc82] flex items-center justify-center font-black text-2xl sm:text-3xl border-2 border-[#00fc82]/30 shadow-md">
              {usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#0F2547]">
                  {usuario.nombre || "Usuario"}
                </h1>
                <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full ${
                  usuario.rol_id === 1 ? "bg-purple-100 text-purple-800" : "bg-emerald-100 text-emerald-800"
                }`}>
                  {usuario.rol_id === 1 ? "Administrador" : "Cliente"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{usuario.email}</p>
              {usuario.creado_en && (
                <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                  <span>Miembro desde {new Date(usuario.creado_en).toLocaleDateString("es-CL")}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
            {usuario.rol_id === 1 && (
              <Link
                href="/admin"
                className="btn btn-sm bg-[#0F2547] hover:bg-[#1a3865] text-white rounded-xl border-none shadow-sm text-xs justify-center flex-1 sm:flex-none"
              >
                Panel Admin
              </Link>
            )}
            <Link
              href="/catalogo"
              className="btn btn-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl border-none text-xs justify-center flex-1 sm:flex-none"
            >
              Ir a Tienda
            </Link>
          </div>
        </div>

        {/* PESTAÑAS NAVEGABLES */}
        <div className="flex border-b border-gray-200 gap-6 text-sm font-bold">
          <button
            onClick={() => setTabActiva("contacto")}
            className={`pb-3 px-1 transition-colors relative ${
              tabActiva === "contacto"
                ? "text-[#0F2547] border-b-2 border-[#00fc82]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Datos de Contacto
          </button>
          <button
            onClick={() => setTabActiva("pedidos")}
            className={`pb-3 px-1 transition-colors relative flex items-center gap-2 ${
              tabActiva === "pedidos"
                ? "text-[#0F2547] border-b-2 border-[#00fc82]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <span>Mis Pedidos</span>
            <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-black">
              {misPedidos.length}
            </span>
          </button>
        </div>

        {/* MENSAJES DE ESTADO */}
        {mensajeExito && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {mensajeError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl text-xs font-semibold">
            {mensajeError}
          </div>
        )}

        {/* CONTENIDO PESTAÑA: DATOS DE CONTACTO */}
        {tabActiva === "contacto" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="mb-6">
              <h2 className="text-base sm:text-lg font-black text-[#0F2547]">
                Información Personal y de Contacto
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Mantén tus datos actualizados para agilizar la entrega de tus kits y componentes solares.
              </p>
            </div>

            <form onSubmit={handleGuardarCambios} noValidate className="space-y-5">
              
              {/* Nombre */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1.5">
                  Nombre Completo
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={usuario.nombre}
                    onChange={(e) => setUsuario({ ...usuario, nombre: e.target.value })}
                    className="input input-sm sm:input-md w-full pl-10 bg-gray-50 border-gray-200 text-gray-900 rounded-xl focus:border-[#0F2547] text-xs sm:text-sm font-medium"
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>
              </div>

              {/* Email (Solo Lectura) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                    Correo Electrónico
                  </label>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                    <FiLock className="w-3 h-3" /> Identificador principal
                  </span>
                </div>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={usuario.email}
                    disabled
                    className="input input-sm sm:input-md w-full pl-10 bg-gray-100 border-gray-200 text-gray-500 rounded-xl cursor-not-allowed text-xs sm:text-sm font-medium"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1.5">
                  Teléfono de Contacto
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={usuario.telefono}
                    onChange={(e) => setUsuario({ ...usuario, telefono: e.target.value })}
                    className="input input-sm sm:input-md w-full pl-10 bg-gray-50 border-gray-200 text-gray-900 rounded-xl focus:border-[#0F2547] text-xs sm:text-sm font-medium"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Utilizado para coordinar la entrega o instalación técnica de proyectos solares.
                </span>
              </div>

              {/* Botón Guardar */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={guardando}
                  className="btn bg-[#0F2547] hover:bg-[#1a3865] text-white font-bold rounded-xl border-none shadow-sm gap-2 text-xs sm:text-sm px-6"
                >
                  <FiSave className="w-4 h-4 text-[#00fc82]" />
                  <span>{guardando ? "Guardando..." : "Guardar Cambios"}</span>
                </button>
              </div>

            </form>
          </div>
        )}

        {/* CONTENIDO PESTAÑA: MIS PEDIDOS */}
        {tabActiva === "pedidos" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="mb-6">
              <h2 className="text-base sm:text-lg font-black text-[#0F2547]">
                Historial de Compras y Pedidos
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Revisa el estado de tus compras de equipamiento y kits solares.
              </p>
            </div>

            {misPedidos.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-gray-50 text-gray-300 flex items-center justify-center mb-4">
                  <FiShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-1">
                  Aún no tienes pedidos registrados
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                  Explora nuestro catálogo con kits fotovoltaicos listos para instalar y componentes de alta eficiencia.
                </p>
                <Link
                  href="/catalogo"
                  className="btn btn-sm bg-[#0F2547] hover:bg-[#1a3865] text-white rounded-xl border-none text-xs px-5 shadow-sm"
                >
                  Ver Catálogo de Productos
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {misPedidos.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 sm:p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
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
                        <span className="text-[11px] text-gray-400 mt-0.5 block">
                          Fecha: {p.fecha} · {p.cantidad_items} ítem(s)
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase text-gray-500 font-bold block">
                          Total Pagado
                        </span>
                        <span className="text-base font-black text-[#0F2547]">
                          {formatearMoneda(p.monto_total)}
                        </span>
                      </div>
                    </div>

                    {/* Detalle de ítems si existen */}
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
        )}

      </div>
    </div>
  );
}
