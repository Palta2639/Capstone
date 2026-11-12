import { useState, useRef } from 'react';

export default function BotonPago({ monto = 15000, ordenCompra = "orden_001" }) {
  const [loading, setLoading] = useState(false);
  const [txData, setTxData] = useState(null);
  const formRef = useRef(null);

  const iniciarPago = async () => {
    setLoading(true);
    try {
      // 1. Llamamos a tu backend en FastAPI para obtener el token
      const res = await fetch(`http://localhost:8000/pagos/crear?monto=${monto}&orden_compra=${ordenCompra}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();

      // 2. Si recibimos el token, lo guardamos y enviamos el formulario a Transbank
      if (data.token && data.url) {
        setTxData(data);
        
        // Le damos un pequeño respiro a React para renderizar el form antes de enviarlo
        setTimeout(() => {
          if (formRef.current) {
            formRef.current.submit();
          }
        }, 100);
      } else {
        alert("Error al contactar con Transbank");
      }
    } catch (error) {
      console.error("Error al iniciar el pago:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={iniciarPago} 
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {loading ? 'Conectando con el banco...' : 'Pagar con Webpay'}
      </button>

      {/* Formulario oculto obligatorio para Transbank */}
      {txData && (
        <form ref={formRef} action={txData.url} method="POST" className="hidden">
          <input type="hidden" name="token_ws" value={txData.token} />
        </form>
      )}
    </div>
  );
}