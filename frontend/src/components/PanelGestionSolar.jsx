"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";

import api from "@/src/services/api";
import { useCart } from "@/src/context/CartContext";
import {
  nuevaClave,
  mensajeError,
} from "@/src/utils/solicitudes";

// Importamos el botón de Transbank que creaste (debe estar en la misma carpeta)
import BotonPago from "./BotonPago"; 

const pesos = valor =>
  valor == null
    ? "Sin costos completos"
    : new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
      }).format(valor);

const fecha = valor =>
  new Date(valor).toLocaleString("es-CL", {
    timeZone: "America/Santiago",
  });

const boton =
  "border rounded-lg px-4 py-2 bg-slate-800 text-white disabled:opacity-40";

const campo =
  "border rounded p-2 w-full bg-white text-gray-900";

const siguientes = {
  pendiente: ["confirmado", "cancelado"],
  confirmado: ["enviado", "cancelado"],
  enviado: ["entregado"],
};

export default function PanelGestionSolar({
  vista = "cotizador",
}) {
  const { carrito, agregarAlCarrito } = useCart();

  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const [form, setForm] = useState({
    consumo_kwh_mensual: "350",
    comuna: "",
    objetivo_sistema: "ahorro_red",
    tipo_red: "monofasico",
    hsp: "4.8",
    presupuesto_max_clp: "",
    superficie_disponible_m2: "",
  });

  const [resultado, setResultado] = useState(null);
  const [guardada, setGuardada] = useState(null);
  const [cotizaciones, setCotizaciones] = useState([]);

  const [turnos, setTurnos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [nuevoTurno, setNuevoTurno] = useState("");
  const [destinos, setDestinos] = useState({});

  const [reserva, setReserva] = useState({
    turno_id: "",
    direccion: "",
    comuna: "",
    telefono: "",
  });

  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState(null);
  const [productos, setProductos] = useState([]);

  const [costo, setCosto] = useState({
    producto_id: "",
    costo_unitario: "",
  });

  const solicitud = useRef(null);
  const bloqueo = useRef(false);

  const cargar = useCallback(async () => {
    if (vista === "agenda") {
      const respuesta = await api.get("/agenda/disponibles");
      setTurnos(respuesta.data);
    }

    if (!localStorage.getItem("token")) {
      setPerfil(null);
      setCitas([]);
      setPedidos([]);
      setCotizaciones([]);
      setStats(null);
      setProductos([]);

      if (["cotizaciones", "pedidos", "admin"].includes(vista)) {
        throw new Error("Inicia sesión desde el menú.");
      }

      return;
    }

    const p = (await api.get("/usuarios/me")).data;
    setPerfil(p);

    if (vista === "cotizaciones") {
      setCotizaciones(
        (await api.get("/cotizaciones/mis-cotizaciones")).data
      );
    }

    if (vista === "pedidos") {
      setPedidos(
        (await api.get("/pedidos/mis-pedidos")).data
      );
    }

    if (vista === "agenda") {
      const ruta =
        p.rol_id === 1
          ? "/agenda/"
          : "/agenda/mis-citas";

      setCitas((await api.get(ruta)).data);
    }

    if (vista === "admin") {
      const [s, pe, c, pr] = await Promise.all(
        [
          "/pedidos/stats",
          "/pedidos/",
          "/cotizaciones/",
          "/productos/",
        ].map(url => api.get(url))
      );

      setStats(s.data);
      setPedidos(pe.data);
      setCotizaciones(c.data);
      setProductos(pr.data);
    }
  }, [vista]);

  function mostrarError(e) {
    setError(
      e.response || e.request
        ? mensajeError(e)
        : e.message
    );
  }

  useEffect(() => {
    const refrescar = () => {
      cargar().catch(mostrarError);
    };

    refrescar();

    window.addEventListener("auth-change", refrescar);

    const timer =
      vista === "agenda"
        ? setInterval(refrescar, 15000)
        : null;

    return () => {
      window.removeEventListener("auth-change", refrescar);

      if (timer) {
        clearInterval(timer);
      }
    };
  }, [cargar, vista]);

  async function ejecutar(
    funcion,
    mensaje = "",
    refrescar = true
  ) {
    if (bloqueo.current) return;

    bloqueo.current = true;
    setOcupado(true);
    setError("");
    setAviso("");

    try {
      await funcion();
      setAviso(mensaje);

      if (refrescar) {
        await cargar();
      }
    } catch (e) {
      mostrarError(e);
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }

  function agregar(recomendacion, cotizacionId) {
    const existe = carrito.some(
      producto =>
        Number(producto.id) === recomendacion.producto_id
    );

    if (existe) {
      setError(
        "Ese kit ya está en el carrito. " +
        "Retíralo antes de añadir esta cotización."
      );
      return;
    }

    agregarAlCarrito({
      id: recomendacion.producto_id,
      nombre: recomendacion.nombre,
      precio: recomendacion.precio_clp,
      stock: recomendacion.stock,
      es_kit: true,
      imagen_url: recomendacion.imagen_url || "",
      cotizacion_id: cotizacionId || null,
    });

    setAviso("Kit añadido al carrito.");
  }

  function recomendar(e) {
    e.preventDefault();

    const datos = {
      ...form,
      consumo_kwh_mensual: Number(form.consumo_kwh_mensual),
      hsp: Number(form.hsp),
      cobertura_objetivo: 1,
      presupuesto_max_clp:
        form.presupuesto_max_clp === ""
          ? null
          : Number(form.presupuesto_max_clp),
      superficie_disponible_m2:
        form.superficie_disponible_m2 === ""
          ? null
          : Number(form.superficie_disponible_m2),
    };

    ejecutar(
      async () => {
        setResultado(null);
        setGuardada(null);
        solicitud.current = null;

        const respuesta = await api.post(
          "/cotizaciones/knn",
          datos
        );

        setResultado(respuesta.data);
        solicitud.current = {
          clave: nuevaClave(),
          datos,
        };
      },
      "",
      false
    );
  }

  function guardarCotizacion() {
    ejecutar(
      async () => {
        const { data } = await api.post(
          "/cotizaciones/guardar",
          solicitud.current
        );

        setGuardada(data);
        setResultado(data.resultado);
      },
      "Cotización guardada.",
      false
    );
  }

  function opcionesTurno(valor, cambiar) {
    return (
      <select
        required
        className={campo}
        value={valor}
        onChange={e => cambiar(e.target.value)}
      >
        <option value="">Selecciona un horario</option>

        {turnos.map(turno => (
          <option key={turno.id} value={turno.id}>
            {fecha(turno.inicio)}
          </option>
        ))}
      </select>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-5 text-gray-900">
      <nav className="flex flex-wrap gap-4 underline">
        <Link href="/cotizador">Cotizador</Link>
        <Link href="/mis-cotizaciones">Mis cotizaciones</Link>
        <Link href="/agenda">Agenda</Link>
        <Link href="/mis-pedidos">Mis pedidos</Link>

        {perfil?.rol_id === 1 && (
          <Link href="/admin">Administración</Link>
        )}
      </nav>

      {error && (
        <p role="alert" className="p-3 bg-red-50 text-red-800">
          {error}
        </p>
      )}

      {aviso && (
        <p role="status" className="p-3 bg-green-50 text-green-800">
          {aviso}
        </p>
      )}

      {vista === "cotizador" && (
        <>
          <h1 className="text-3xl font-bold">
            Cotizador solar KNN
          </h1>

          <p>
            Prototipo con datos simulados. HSP es un supuesto
            editable; no se calcula desde tu comuna.
            Requiere revisión técnica.
          </p>

          <form onSubmit={recomendar}>
            <fieldset
              disabled={ocupado}
              className="grid md:grid-cols-2 gap-4"
            >
              <label>
                Consumo mensual kWh
                <input
                  required
                  type="number"
                  min="30"
                  max="1500"
                  step="0.1"
                  className={campo}
                  value={form.consumo_kwh_mensual}
                  onChange={e =>
                    setForm({
                      ...form,
                      consumo_kwh_mensual: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Comuna
                <input
                  required
                  maxLength="100"
                  className={campo}
                  value={form.comuna}
                  onChange={e =>
                    setForm({ ...form, comuna: e.target.value })
                  }
                />
              </label>

              <label>
                Sistema
                <select
                  className={campo}
                  value={form.objetivo_sistema}
                  onChange={e =>
                    setForm({
                      ...form,
                      objetivo_sistema: e.target.value,
                    })
                  }
                >
                  <option value="ahorro_red">On-Grid</option>
                  <option value="hibrido">Híbrido</option>
                  <option value="off_grid">Off-Grid</option>
                </select>
              </label>

              <label>
                Tipo de red
                <select
                  className={campo}
                  value={form.tipo_red}
                  onChange={e =>
                    setForm({ ...form, tipo_red: e.target.value })
                  }
                >
                  <option value="monofasico">Monofásica</option>
                  <option value="trifasico">
                    Trifásica: requiere evaluación
                  </option>
                </select>
              </label>

              <label>
                Horas solares pico
                <input
                  required
                  type="number"
                  min="2"
                  max="7"
                  step="0.1"
                  className={campo}
                  value={form.hsp}
                  onChange={e =>
                    setForm({ ...form, hsp: e.target.value })
                  }
                />
              </label>

              <label>
                Presupuesto máximo CLP, opcional
                <input
                  type="number"
                  min="1"
                  step="1"
                  className={campo}
                  value={form.presupuesto_max_clp}
                  onChange={e =>
                    setForm({
                      ...form,
                      presupuesto_max_clp: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Superficie disponible m², opcional
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  className={campo}
                  value={form.superficie_disponible_m2}
                  onChange={e =>
                    setForm({
                      ...form,
                      superficie_disponible_m2: e.target.value,
                    })
                  }
                />
              </label>

              <button className={boton}>
                {ocupado ? "Procesando..." : "Recomendar kit"}
              </button>
            </fieldset>
          </form>

          {resultado && (
            <article className="border rounded-xl p-5 space-y-3">
              <h2 className="text-xl font-bold">
                {resultado.nombre}
              </h2>

              <p>
                {pesos(resultado.precio_clp)}
                {" · "}Stock: {resultado.stock}
              </p>

              <p>
                {resultado.cantidad_paneles} paneles
                {" · "}{resultado.potencia_kwp} kWp
                {" · "}Superficie: {resultado.superficie_estimada_m2} m²
              </p>

              <p>
                Energía mensual estimada:{" "}
                {resultado.energia_mensual_estimada_kwh} kWh
              </p>

              <ul>
                {resultado.advertencias.map(advertencia => (
                  <li key={advertencia}>• {advertencia}</li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <button
                  className={boton}
                  disabled={ocupado || !!guardada}
                  onClick={guardarCotizacion}
                >
                  {guardada
                    ? `Guardada #${guardada.id}`
                    : "Guardar cotización"}
                </button>

                <button
                  className={boton}
                  disabled={ocupado}
                  onClick={() =>
                    agregar(resultado, guardada?.id)
                  }
                >
                  Añadir al carrito
                </button>

                <Link className="underline" href="/checkout">
                  Registrar pedido
                </Link>
              </div>
            </article>
          )}
        </>
      )}

      {vista === "cotizaciones" && (
        <>
          <h1 className="text-3xl font-bold">
            Mis cotizaciones
          </h1>

          <p>
            El precio y stock se consultan de nuevo
            al crear el pedido.
          </p>

          {cotizaciones.map(cotizacion => (
            <article
              key={cotizacion.id}
              className="border rounded p-4 space-y-2"
            >
              <h2>
                #{cotizacion.id} · {cotizacion.estado}
                {" · "}{cotizacion.consumo_kwh_mensual} kWh/mes
              </h2>

              {cotizacion.resultado ? (
                <>
                  <p>
                    {cotizacion.resultado.nombre}
                    {" · "}
                    {pesos(cotizacion.resultado.precio_clp)}
                  </p>

                  <button
                    className={boton}
                    onClick={() =>
                      agregar(cotizacion.resultado, cotizacion.id)
                    }
                  >
                    Añadir kit al carrito
                  </button>
                </>
              ) : (
                <p>Cotización anterior sin detalle KNN.</p>
              )}
            </article>
          ))}
        </>
      )}

      {vista === "agenda" && (
        <>
          <h1 className="text-3xl font-bold">Agenda técnica</h1>

          <p>
            Horarios de Chile continental. Visitas de una hora.
            Disponibilidad actualizada cada 15 segundos.
          </p>

          {!perfil ? (
            <p>Inicia sesión para reservar.</p>
          ) : (
            <form
              onSubmit={e => {
                e.preventDefault();

                ejecutar(
                  () =>
                    api.post("/agenda/", {
                      ...reserva,
                      turno_id: Number(reserva.turno_id),
                    }),
                  "Visita confirmada."
                );
              }}
            >
              <fieldset
                disabled={ocupado}
                className="space-y-3 border p-4 rounded"
              >
                {opcionesTurno(
                  reserva.turno_id,
                  valor =>
                    setReserva({ ...reserva, turno_id: valor })
                )}

                {["direccion", "comuna", "telefono"].map(key => (
                  <label key={key} className="block">
                    {key}
                    <input
                      required
                      className={campo}
                      minLength={
                        key === "direccion"
                          ? 5
                          : key === "telefono"
                            ? 6
                            : 2
                      }
                      maxLength={
                        key === "direccion"
                          ? 250
                          : key === "telefono"
                            ? 30
                            : 100
                      }
                      value={reserva[key]}
                      onChange={e =>
                        setReserva({
                          ...reserva,
                          [key]: e.target.value,
                        })
                      }
                    />
                  </label>
                ))}

                <button
                  disabled={!reserva.turno_id}
                  className={boton}
                >
                  Confirmar reserva
                </button>
              </fieldset>
            </form>
          )}

          {perfil?.rol_id === 1 && (
            <form
              className="space-y-3 border rounded p-4"
              onSubmit={e => {
                e.preventDefault();

                ejecutar(
                  () =>
                    api.post("/agenda/turnos", {
                      inicio: new Date(nuevoTurno).toISOString(),
                    }),
                  "Horario publicado."
                );
              }}
            >
              <p>
                Publicar horario: introduce la fecha en la zona
                horaria de tu computador.
              </p>

              <input
                required
                type="datetime-local"
                step="3600"
                className={campo}
                value={nuevoTurno}
                onChange={e => setNuevoTurno(e.target.value)}
              />

              <button disabled={ocupado} className={boton}>
                Publicar hora
              </button>
            </form>
          )}

          {!turnos.length && (
            <p>No hay horarios libres publicados.</p>
          )}

          {citas.map(cita => (
            <article
              key={cita.id}
              className="border rounded p-4 space-y-3"
            >
              <h2>
                Cita #{cita.id} · {fecha(cita.inicio)}
                {" · "}{cita.estado}
              </h2>

              <p>
                {cita.direccion}, {cita.comuna}
                {" · "}{cita.telefono}
              </p>

              {cita.estado === "confirmada" &&
                new Date(cita.inicio) > new Date() && (
                  <>
                    <button
                      disabled={ocupado}
                      className={boton}
                      onClick={() =>
                        ejecutar(
                          () =>
                            api.put(`/agenda/${cita.id}/cancelar`),
                          "Cita cancelada."
                        )
                      }
                    >
                      Cancelar
                    </button>

                    {opcionesTurno(
                      destinos[cita.id] || "",
                      valor =>
                        setDestinos({
                          ...destinos,
                          [cita.id]: valor,
                        })
                    )}

                    <button
                      disabled={ocupado || !destinos[cita.id]}
                      className={boton}
                      onClick={() =>
                        ejecutar(
                          () =>
                            api.put(
                              `/agenda/${cita.id}/reprogramar`,
                              {
                                turno_id: Number(destinos[cita.id]),
                              }
                            ),
                          "Cita reprogramada."
                        )
                      }
                    >
                      Reprogramar
                    </button>
                  </>
                )}
            </article>
          ))}
        </>
      )}

      {vista === "admin" && perfil?.rol_id === 1 && (
        <>
          <h1 className="text-3xl font-bold">
            Administración
          </h1>

          <button
            className={boton}
            disabled={ocupado}
            onClick={() =>
              ejecutar(cargar, "Datos actualizados.", false)
            }
          >
            Actualizar
          </button>

          {stats && (
            <>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  ["Ventas entregadas", pesos(stats.total_ingresos)],
                  ["Costos registrados", pesos(stats.costos_registrados)],
                  ["Margen bruto", pesos(stats.margen_bruto)],
                  ["Pedidos", stats.total_pedidos],
                  ["Cotizaciones", stats.total_cotizaciones],
                  ["Conversión", `${stats.tasa_conversion}%`],
                ].map(([titulo, valor]) => (
                  <article
                    key={titulo}
                    className="border rounded p-4"
                  >
                    <p>{titulo}</p>
                    <strong>{valor}</strong>
                  </article>
                ))}
              </div>

              <p>{stats.criterio}</p>
              <p>
                Pedidos sin costo completo: {stats.pedidos_sin_costo}.
              </p>
            </>
          )}

          <form
            className="border p-4 space-y-3"
            onSubmit={e => {
              e.preventDefault();

              ejecutar(
                () =>
                  api.put(`/costos/${costo.producto_id}`, {
                    costo_unitario: Number(costo.costo_unitario),
                  }),
                "Costo guardado."
              );
            }}
          >
            <h2>Registrar costos antes de crear pedidos</h2>

            <select
              required
              className={campo}
              value={costo.producto_id}
              onChange={e =>
                setCosto({
                  ...costo,
                  producto_id: e.target.value,
                })
              }
            >
              <option value="">Producto</option>

              {productos.map(producto => (
                <option
                  value={producto.id}
                  key={producto.id}
                >
                  {producto.nombre}
                </option>
              ))}
            </select>

            <input
              aria-label="Costo unitario CLP"
              required
              type="number"
              min="0"
              max="2000000000"
              step="1"
              className={campo}
              value={costo.costo_unitario}
              onChange={e =>
                setCosto({
                  ...costo,
                  costo_unitario: e.target.value,
                })
              }
            />

            <button disabled={ocupado} className={boton}>
              Guardar costo CLP
            </button>

            <p>
              Los cambios no alteran los costos
              de pedidos anteriores.
            </p>
          </form>

          <h2 className="text-xl font-bold">Cotizaciones</h2>

          {cotizaciones.map(cotizacion => (
            <article
              key={cotizacion.id}
              className="border rounded p-3"
            >
              <p>
                #{cotizacion.id}
                {" · "}Cliente {cotizacion.usuario_id}
                {" · "}
                {cotizacion.resultado?.nombre || "Registro anterior"}
              </p>

              <select
                disabled={ocupado}
                className={campo}
                value={cotizacion.estado}
                onChange={e =>
                  ejecutar(
                    () =>
                      api.put(
                        `/cotizaciones/${cotizacion.id}`,
                        null,
                        {
                          params: {
                            nuevo_estado: e.target.value,
                          },
                        }
                      ),
                    "Estado actualizado."
                  )
                }
              >
                {[
                  "pendiente",
                  "contactado",
                  "aprobada",
                  "rechazada",
                ].map(estado => (
                  <option key={estado}>{estado}</option>
                ))}
              </select>
            </article>
          ))}
        </>
      )}

      {(vista === "pedidos" ||
        (vista === "admin" && perfil?.rol_id === 1)) && (
        <>
          <h2 className="text-2xl font-bold">Pedidos</h2>
          <p>Registrar un pedido no realiza un cobro.</p>

          {pedidos.map(pedido => (
            <article
              key={pedido.id}
              className="border rounded p-4 space-y-2"
            >
              <h3>
                #{pedido.id} · {pedido.estado}
                {" · "}{pesos(pedido.monto_total)}
              </h3>

              <p>{pedido.cliente}</p>

              {pedido.entrega && (
                <p>
                  {pedido.entrega.direccion},{" "}
                  {pedido.entrega.comuna}
                  {" · "}{pedido.entrega.telefono}
                </p>
              )}

              <ul>
                {pedido.items.map(item => (
                  <li key={item.producto_id}>
                    {item.cantidad} × {item.nombre}
                    {" · "}{pesos(item.precio_unitario)}
                  </li>
                ))}
              </ul>

              {/* AQUÍ ESTÁ EL BOTÓN DE TRANSBANK PARA CLIENTES */}
              {vista === "pedidos" && pedido.estado === "pendiente" && (
                <div className="mt-3">
                  <BotonPago monto={pedido.monto_total} ordenCompra={`pedido_${pedido.id}`} />
                </div>
              )}

              {vista === "admin" && (
                <div className="flex gap-2">
                  {(siguientes[pedido.estado] || []).map(estado => (
                    <button
                      key={estado}
                      disabled={ocupado}
                      className={boton}
                      onClick={() =>
                        ejecutar(
                          () =>
                            api.put(`/pedidos/${pedido.id}`, null, {
                              params: {
                                nuevo_estado: estado,
                              },
                            }),
                          "Pedido actualizado."
                        )
                      }
                    >
                      {estado}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </>
      )}
    </main>
  );
}