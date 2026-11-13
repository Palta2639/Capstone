"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import api from "@/src/services/api";
import { mensajeError } from "@/src/utils/solicitudes";

export default function ChatbotSolar() {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  const [mensajes, setMensajes] = useState([
    {
      role: "assistant",
      content:
        "Hola. Puedes preguntarme por sistemas solares, " +
        "kits disponibles, pedidos o visitas técnicas.",
      actions: [],
    },
  ]);

  const bloqueo = useRef(false);

  async function enviar(e) {
    e.preventDefault();

    const consulta = texto.trim();

    if (!consulta || bloqueo.current) return;

    bloqueo.current = true;
    setOcupado(true);
    setError("");
    setTexto("");

    const anteriores = mensajes.slice(-20).map(mensaje => ({
      role: mensaje.role,
      content: mensaje.content,
    }));

    setMensajes(actuales => [
      ...actuales,
      {
        role: "user",
        content: consulta,
        actions: [],
      },
    ]);

    try {
      const { data } = await api.post("/ia/chat", {
        message: consulta,
        history: anteriores,
      });

      setMensajes(actuales => [
        ...actuales,
        {
          role: "assistant",
          content: data.reply,
          actions: data.actions || [],
        },
      ]);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 text-gray-900">
      {abierto && (
        <section className="w-[min(360px,90vw)] bg-white border rounded-xl shadow-xl mb-3 overflow-hidden">
          <header className="bg-slate-800 text-white p-4 flex justify-between">
            <strong>Asistente solar</strong>
            <button onClick={() => setAbierto(false)}>
              Cerrar
            </button>
          </header>

          <div
            className="max-h-80 overflow-y-auto p-4 space-y-4"
            aria-live="polite"
          >
            {mensajes.map((mensaje, indice) => (
              <article
                key={indice}
                className={
                  mensaje.role === "user"
                    ? "bg-green-50 p-3 rounded"
                    : "bg-gray-100 p-3 rounded"
                }
              >
                <p className="whitespace-pre-wrap">
                  {mensaje.content}
                </p>

                <div className="flex flex-col gap-2 mt-2">
                  {mensaje.actions
                    .filter(
                      accion =>
                        typeof accion.url === "string" &&
                        accion.url.startsWith("/") &&
                        !accion.url.startsWith("//")
                    )
                    .map((accion, index) => (
                      <Link
                        key={index}
                        href={accion.url}
                        className="underline text-blue-800"
                        onClick={() => setAbierto(false)}
                      >
                        {accion.label}
                      </Link>
                    ))}
                </div>
              </article>
            ))}

            {ocupado && <p>Consultando...</p>}
            {error && <p role="alert">{error}</p>}
          </div>

          <form onSubmit={enviar} className="p-3 flex gap-2 border-t">
            <input
              aria-label="Mensaje para el asistente"
              required
              maxLength={2000}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              className="border rounded p-2 min-w-0 flex-1 bg-white"
              placeholder="Escribe tu consulta"
            />

            <button
              disabled={ocupado}
              className="bg-slate-800 text-white rounded px-3"
            >
              Enviar
            </button>
          </form>
        </section>
      )}

      <button
        onClick={() => setAbierto(valor => !valor)}
        className="bg-slate-800 text-white rounded-full px-5 py-3 shadow-lg"
      >
        Asistente solar
      </button>
    </div>
  );
}