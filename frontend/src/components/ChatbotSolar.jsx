'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FiMessageSquare, 
  FiX, 
  FiSend, 
  FiTrash2, 
  FiArrowRight, 
  FiLock
} from 'react-icons/fi';
import { useCart } from '@/src/context/CartContext';
import { iaService } from '@/src/services/api';

const MENSAJE_INICIAL = {
  id: 'init-1',
  role: 'assistant',
  content: 'Bienvenido al canal de chat de Anglo Electric. La interfaz se encuentra lista y protegida para la conexión con el modelo que implementará el ingeniero de IA.',
  actions: [],
  timestamp: 'Ahora'
};

const RESPUESTA_POR_DEFECTO = 'Mensaje recibido. La integración del modelo de lenguaje y el procesamiento de respuestas especializadas será implementado por el ingeniero de IA.';

// Sanitización de texto para mitigar inyecciones y caracteres de control
const sanitizarEntrada = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/\0/g, '') // Elimina null bytes
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Elimina caracteres de control
    .trim()
    .slice(0, 500); // Límite estricto de longitud
};

// Validación estricta de URLs permitidas (solo rutas relativas seguras)
const esUrlSegura = (url) => {
  if (!url || typeof url !== 'string') return false;
  const urlLimpia = url.trim();
  // Solo se permiten rutas internas que comiencen con '/' y sin esquemas peligrosos (javascript:, data:)
  return urlLimpia.startsWith('/') && !urlLimpia.startsWith('//') && !urlLimpia.includes(':');
};

export default function ChatbotSolar() {
  const { isCartOpen } = useCart();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([MENSAJE_INICIAL]);
  const [inputTexto, setInputTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const messagesEndRef = useRef(null);
  const ultimoEnvioRef = useRef(0);

  // Auto-scroll seguro al recibir o enviar mensajes
  useEffect(() => {
    if (abierto) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes, abierto, cargando]);

  const enviarMensaje = async () => {
    const ahora = Date.now();
    // Protección contra ráfagas (rate-limit en cliente: mínimo 1 segundo entre envíos)
    if (ahora - ultimoEnvioRef.current < 1000) return;

    const textoLimpio = sanitizarEntrada(inputTexto);
    if (!textoLimpio || cargando) return;

    ultimoEnvioRef.current = ahora;
    setInputTexto('');

    const nuevoMensajeUsuario = {
      id: `usr-${ahora}`,
      role: 'user',
      content: textoLimpio,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    setCargando(true);

    try {
      // Limitar historial para prevenir desbordamiento de payload
      const historiaParaBackend = mensajes.slice(-10).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: sanitizarEntrada(m.content)
      }));

      const res = await iaService.chat(textoLimpio, historiaParaBackend);

      // Filtrar y validar acciones devueltas
      const accionesSeguras = Array.isArray(res?.actions)
        ? res.actions.filter((act) => act && typeof act.label === 'string' && esUrlSegura(act.url))
        : [];

      const nuevoMensajeBot = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: sanitizarEntrada(res?.reply) || RESPUESTA_POR_DEFECTO,
        actions: accionesSeguras,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMensajes((prev) => [...prev, nuevoMensajeBot]);
    } catch {
      const fallbackBot = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: RESPUESTA_POR_DEFECTO,
        actions: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMensajes((prev) => [...prev, fallbackBot]);
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  const limpiarHistorial = () => {
    setMensajes([MENSAJE_INICIAL]);
  };

  return (
    <>
      {/* Botón Flotante */}
      <aside 
        aria-label="Asistente Virtual Anglo Electric" 
        className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
          isCartOpen ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'
        }`}
      >
        <button
          onClick={() => setAbierto(!abierto)}
          className={`flex items-center gap-2.5 px-4 py-3.5 rounded-full shadow-2xl transition-all duration-300 font-semibold text-sm ${
            abierto
              ? 'bg-[#0F2547] text-white hover:bg-slate-800 border border-slate-700'
              : 'bg-[#0F2547] text-[#00fc82] hover:scale-105 border-2 border-[#00fc82] shadow-[0_0_20px_rgba(0,252,130,0.35)]'
          }`}
          title="Abrir Asistente"
          aria-expanded={abierto}
        >
          {abierto ? (
            <>
              <FiX className="text-xl text-slate-300" />
              <span className="hidden sm:inline">Cerrar Asistente</span>
            </>
          ) : (
            <>
              <FiMessageSquare className="text-xl" />
              <span className="text-white font-medium">Asistente Virtual</span>
            </>
          )}
        </button>
      </aside>

      {/* Ventana de Chat */}
      {abierto && !isCartOpen && (
        <section
          aria-label="Ventana de chat del Asistente Virtual"
          className="fixed bottom-24 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-105 h-135 max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          {/* Cabecera del Chat con Logo Oficial */}
          <header className="bg-[#0F2547] text-white p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/10 shrink-0">
                <Image
                  src="/logo-anglo.png"
                  alt="Anglo Electric"
                  width={34}
                  height={34}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Anglo Electric</h3>
                <p className="text-xs text-slate-300">Asistente Virtual</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={limpiarHistorial}
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
                title="Reiniciar conversación"
              >
                <FiTrash2 className="text-sm" />
              </button>
              <button
                onClick={() => setAbierto(false)}
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
                title="Minimizar"
              >
                <FiX className="text-base" />
              </button>
            </div>
          </header>

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70 text-sm">
            {mensajes.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                    <span>{isAssistant ? 'Asistente Anglo' : 'Usted'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-line text-sm ${
                      isAssistant
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/80 rounded-tl-sm'
                        : 'bg-[#0F2547] text-white shadow rounded-tr-sm'
                    }`}
                  >
                    {/* Renderizado nativo seguro (React escapa automáticamente strings, previniendo XSS) */}
                    {msg.content}

                    {/* Acciones seguras si existen */}
                    {isAssistant && msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                        {msg.actions.map((act, i) => (
                          <Link
                            key={i}
                            href={act.url}
                            onClick={() => setAbierto(false)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#0F2547] text-xs font-semibold border border-slate-200 transition-colors"
                          >
                            <span>{act.label}</span>
                            <FiArrowRight className="text-xs text-slate-500" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Indicador de escritura  */}
            {cargando && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm w-fit">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-500 font-medium ml-1">Procesando mensaje...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de Entrada Protegido */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviarMensaje();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value.slice(0, 500))}
              onKeyDown={handleKeyDown}
              maxLength={500}
              autoComplete="off"
              spellCheck="false"
              placeholder="Escriba un mensaje..."
              disabled={cargando}
              className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00fc82] focus:border-transparent transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!inputTexto.trim() || cargando}
              className="p-2.5 rounded-xl bg-[#0F2547] hover:bg-slate-800 text-[#00fc82] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shrink-0"
              title="Enviar mensaje"
            >
              <FiSend className="text-base" />
            </button>
          </form>

          {/* Pie informativo de seguridad */}
          <footer className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
              <FiLock className="text-[10px] text-slate-400" /> Canal seguro y cifrado. Modelo en preparación técnica.
            </span>
          </footer>
        </section>
      )}
    </>
  );
}
