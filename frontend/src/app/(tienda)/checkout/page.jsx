"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FiShoppingBag, 
  FiCheckCircle, 
  FiTruck, 
  FiFileText, 
  FiCreditCard, 
  FiShield, 
  FiArrowLeft,
  FiLock,
  FiTrash2
} from "react-icons/fi";
import { useCart } from "@/src/context/CartContext";
import { orderService, userService } from "@/src/services/api";
import { formatearMoneda } from "@/src/utils/formatters";
import { sanitizeName, sanitizePhone, sanitizeSearch } from "@/src/utils/validations";

export default function CheckoutPage() {
  const router = useRouter();
  const { carrito, vaciarCarrito } = useCart();

  const [procesando, setProcesando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  // Datos del cliente / entrega
  const [datosEntrega, setDatosEntrega] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    comuna: "Santiago",
    region: "Metropolitana de Santiago",
    notas: ""
  });

  // Facturación
  const [tipoDocumento, setTipoDocumento] = useState("boleta"); // 'boleta' | 'factura'
  const [datosFactura, setDatosFactura] = useState({
    rutEmpresa: "",
    razonSocial: "",
    giro: "",
    direccionTributaria: ""
  });

  // Método de pago
  const [metodoPago, setMetodoPago] = useState("webpay"); // 'webpay' | 'transferencia'
  const [usuarioId, setUsuarioId] = useState(null);

  // Pre-cargar datos del usuario si está autenticado
  useEffect(() => {
    let activo = true;
    async function precargarUsuario() {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      try {
        const perfil = await userService.getProfile();
        if (activo && perfil) {
          setUsuarioId(perfil.id);
          setDatosEntrega((prev) => ({
            ...prev,
            nombre: perfil.nombre || "",
            email: perfil.email || "",
            telefono: perfil.telefono || "",
          }));
        }
      } catch (e) {
        console.warn("Usuario no autenticado para checkout:", e);
      }
    }
    precargarUsuario();
    return () => { activo = false; };
  }, []);

  const totalPagar = carrito.reduce((acc, curr) => acc + (curr.precio * curr.cantidad), 0);
  const costoDespacho = totalPagar > 200000 ? 0 : 9900;
  const montoFinal = totalPagar + costoDespacho;

  const handleSubmitPedido = async (e) => {
    e.preventDefault();
    setErrorEnvio("");

    if (!datosEntrega.nombre || !datosEntrega.email || !datosEntrega.direccion || !datosEntrega.telefono) {
      setErrorEnvio("Por favor completa todos los campos requeridos de contacto y entrega.");
      return;
    }

    if (tipoDocumento === "factura" && (!datosFactura.rutEmpresa || !datosFactura.razonSocial)) {
      setErrorEnvio("Por favor ingresa el RUT de empresa y la Razón Social para la emisión de factura.");
      return;
    }

    setProcesando(true);

    try {
      // 1. Crear el pedido en el backend
      const resPedido = await orderService.create({
        usuario_id: usuarioId || 1, // Usuario actual o fallback a cliente principal
        monto_total: montoFinal,
      });

      // 2. Limpiar el carrito
      vaciarCarrito();

      // 3. Redirigir a página de confirmación exitosa con número de orden
      const idOrden = resPedido.id || Math.floor(1000 + Math.random() * 9000);
      router.push(`/pago/exito?orden=ORD-${idOrden}`);
    } catch (err) {
      console.error("Error al procesar pedido en checkout:", err);
      // Si falla catastróficamente, enviar a vista de fallo
      router.push("/pago/fallo");
    } finally {
      setProcesando(false);
    }
  };

  if (carrito.length === 0) {
    return (
      <div className="min-h-[75vh] bg-gray-50 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-gray-100 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gray-50 text-gray-400 flex items-center justify-center">
            <FiShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-[#0F2547]">Tu Carrito está Vacío</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Agrega inversores, paneles o kits solares para proceder con el pago y despacho.
          </p>
          <div className="pt-2">
            <Link
              href="/catalogo"
              className="btn bg-[#0F2547] hover:bg-[#1a3865] text-white rounded-xl border-none shadow-sm text-xs px-6"
            >
              Explorar Catálogo de Productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabecera */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <Link href="/catalogo" className="text-xs font-bold text-gray-500 hover:text-[#0F2547] flex items-center gap-1 mb-1">
              <FiArrowLeft className="w-3.5 h-3.5" />
              <span>Seguir Comprando</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F2547] tracking-tight">
              Finalizar Pedido y Despacho
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
            <FiShield className="w-4 h-4 text-emerald-600" />
            <span>Compra Segura y Certificada SEC</span>
          </div>
        </div>

        {errorEnvio && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs font-semibold">
            {errorEnvio}
          </div>
        )}

        <form onSubmit={handleSubmitPedido} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: FORMULARIOS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Datos de Contacto y Entrega */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <FiTruck className="w-5 h-5" />
                </div>
                <h2 className="text-base font-black text-[#0F2547]">
                  1. Datos de Contacto y Entrega
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={datosEntrega.nombre}
                    onChange={(e) => setDatosEntrega({ ...datosEntrega, nombre: sanitizeName(e.target.value) })}
                    placeholder="Ej: Roberto Fernández"
                    className="input input-sm sm:input-md w-full bg-gray-50 border-gray-200 text-xs sm:text-sm rounded-xl focus:border-[#0F2547]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={datosEntrega.email}
                    onChange={(e) => setDatosEntrega({ ...datosEntrega, email: e.target.value })}
                    placeholder="contacto@ejemplo.cl"
                    className="input input-sm sm:input-md w-full bg-gray-50 border-gray-200 text-xs sm:text-sm rounded-xl focus:border-[#0F2547]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    required
                    value={datosEntrega.telefono}
                    onChange={(e) => setDatosEntrega({ ...datosEntrega, telefono: sanitizePhone(e.target.value) })}
                    placeholder="+56 9 1234 5678"
                    className="input input-sm sm:input-md w-full bg-gray-50 border-gray-200 text-xs sm:text-sm rounded-xl focus:border-[#0F2547]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1">
                    Dirección de Despacho (Calle, Número, Depto)
                  </label>
                  <input
                    type="text"
                    required
                    value={datosEntrega.direccion}
                    onChange={(e) => setDatosEntrega({ ...datosEntrega, direccion: sanitizeSearch(e.target.value) })}
                    placeholder="Ej: Av. Providencia 1234, Oficina 501"
                    className="input input-sm sm:input-md w-full bg-gray-50 border-gray-200 text-xs sm:text-sm rounded-xl focus:border-[#0F2547]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1">
                    Comuna
                  </label>
                  <input
                    type="text"
                    required
                    value={datosEntrega.comuna}
                    onChange={(e) => setDatosEntrega({ ...datosEntrega, comuna: sanitizeSearch(e.target.value) })}
                    placeholder="Ej: Santiago, Las Condes, Rancagua"
                    className="input input-sm sm:input-md w-full bg-gray-50 border-gray-200 text-xs sm:text-sm rounded-xl focus:border-[#0F2547]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-1">
                    Región
                  </label>
                  <select
                    value={datosEntrega.region}
                    onChange={(e) => setDatosEntrega({ ...datosEntrega, region: e.target.value })}
                    className="select select-sm sm:select-md w-full bg-gray-50 border-gray-200 text-xs sm:text-sm rounded-xl font-medium"
                  >
                    <option value="Metropolitana de Santiago">Metropolitana de Santiago</option>
                    <option value="Valparaíso">Valparaíso</option>
                    <option value="O'Higgins">O&apos;Higgins</option>
                    <option value="Maule">Maule</option>
                    <option value="Coquimbo">Coquimbo</option>
                    <option value="Biobío">Biobío</option>
                    <option value="Otra Región">Otra Región (A coordinar)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Tipo de Comprobante Tributario */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <FiFileText className="w-5 h-5" />
                </div>
                <h2 className="text-base font-black text-[#0F2547]">
                  2. Comprobante Tributario
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipoDocumento("boleta")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    tipoDocumento === "boleta"
                      ? "border-[#0F2547] bg-[#0F2547]/5 text-[#0F2547] font-bold"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  <div className="text-xs font-extrabold">Boleta Electrónica</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Para personas naturales</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoDocumento("factura")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    tipoDocumento === "factura"
                      ? "border-[#0F2547] bg-[#0F2547]/5 text-[#0F2547] font-bold"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  <div className="text-xs font-extrabold">Factura Electrónica</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Para empresas con RUT comercial</div>
                </button>
              </div>

              {tipoDocumento === "factura" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700 block mb-1">
                      RUT Empresa
                    </label>
                    <input
                      type="text"
                      value={datosFactura.rutEmpresa}
                      onChange={(e) => setDatosFactura({ ...datosFactura, rutEmpresa: e.target.value })}
                      placeholder="76.123.456-7"
                      className="input input-sm w-full bg-gray-50 border-gray-200 text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700 block mb-1">
                      Razón Social
                    </label>
                    <input
                      type="text"
                      value={datosFactura.razonSocial}
                      onChange={(e) => setDatosFactura({ ...datosFactura, razonSocial: e.target.value })}
                      placeholder="Empresa Solar SpA"
                      className="input input-sm w-full bg-gray-50 border-gray-200 text-xs rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Selección de Método de Pago */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <FiCreditCard className="w-5 h-5" />
                </div>
                <h2 className="text-base font-black text-[#0F2547]">
                  3. Método de Pago
                </h2>
              </div>

              <div className="space-y-3">
                <label
                  onClick={() => setMetodoPago("webpay")}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    metodoPago === "webpay"
                      ? "border-[#00fc82] bg-emerald-50/30 ring-1 ring-[#00fc82]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="metodoPago"
                      checked={metodoPago === "webpay"}
                      onChange={() => setMetodoPago("webpay")}
                      className="radio radio-sm radio-success"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-[#0F2547] block">
                        Webpay Plus / Tarjetas de Débito y Crédito
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Pago inmediato con tarjetas chilenas e internacionales
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-400">Transbank</span>
                </label>

                <label
                  onClick={() => setMetodoPago("transferencia")}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    metodoPago === "transferencia"
                      ? "border-[#00fc82] bg-emerald-50/30 ring-1 ring-[#00fc82]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="metodoPago"
                      checked={metodoPago === "transferencia"}
                      onChange={() => setMetodoPago("transferencia")}
                      className="radio radio-sm radio-success"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-[#0F2547] block">
                        Transferencia Bancaria Directa
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Cuenta Corriente BCI de Anglo Electric SpA
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-400">Manual</span>
                </label>
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: RESUMEN DE COMPRA Y BOTÓN FINAL */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h2 className="text-base font-black text-[#0F2547]">
                  Resumen de la Orden ({carrito.length} ítems)
                </h2>
                {carrito.length > 0 && (
                  <button
                    type="button"
                    onClick={vaciarCarrito}
                    className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Limpiar todos los productos del carrito"
                  >
                    <FiTrash2 className="text-xs" />
                    <span>Limpiar carrito</span>
                  </button>
                )}
              </div>

              {/* Lista de productos */}
              <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto pr-1 space-y-3">
                {carrito.map((item) => (
                  <div key={item.id} className="pt-3 flex justify-between items-center text-xs">
                    <div className="pr-2">
                      <span className="font-bold text-gray-800 block line-clamp-1">
                        {item.nombre}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {item.cantidad} un. x {formatearMoneda(item.precio)}
                      </span>
                    </div>
                    <span className="font-extrabold text-[#0F2547] whitespace-nowrap">
                      {formatearMoneda(item.precio * item.cantidad)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Subtotales */}
              <div className="pt-4 border-t border-gray-100 space-y-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal Equipamiento</span>
                  <span className="font-bold text-gray-800">{formatearMoneda(totalPagar)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Costo de Despacho</span>
                  <span className="font-bold text-emerald-700">
                    {costoDespacho === 0 ? "Gratis por monto" : formatearMoneda(costoDespacho)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>IVA (19% incluido)</span>
                  <span className="font-bold text-gray-600">{formatearMoneda(montoFinal * 0.19)}</span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                  <span className="text-sm font-black text-[#0F2547]">Total a Pagar</span>
                  <span className="text-xl sm:text-2xl font-black text-[#0F2547]">
                    {formatearMoneda(montoFinal)}
                  </span>
                </div>
              </div>

              {/* Botón de confirmación */}
              <button
                type="submit"
                disabled={procesando}
                className="btn w-full bg-[#00fc82] hover:bg-[#00e574] text-[#0F2547] font-black rounded-xl border-none shadow-lg text-sm sm:text-base h-13 tracking-wide gap-2 justify-center"
              >
                {procesando ? (
                  <span>Procesando Pedido...</span>
                ) : (
                  <>
                    <FiLock className="w-4 h-4" />
                    <span>Confirmar y Pagar Orden</span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-gray-400 text-center leading-relaxed">
                Al confirmar la orden aceptas los términos de garantía y certificación técnica de Anglo Electric SpA.
              </div>

            </div>
          </div>

        </form>

      </div>
    </div>
  );
}

