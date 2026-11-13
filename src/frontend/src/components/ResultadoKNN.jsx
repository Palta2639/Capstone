"use client";

import { useState } from "react";
import { useCart } from "@/src/context/CartContext";

const formatearPrecio = (valor) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(valor);

export default function ResultadoKNN({ resultado, onVolver }) {
  const { agregarAlCarrito } = useCart();
  const [agregado, setAgregado] = useState(false);

  const agregarKit = () => {
    agregarAlCarrito({
      id: resultado.producto_id,
      nombre: resultado.nombre,
      precio: resultado.precio_clp,
      stock: resultado.stock,
      potencia_watts: Math.round(resultado.potencia_kwp * 1000),
      es_kit: true,
      imagen_url: null,
      descripcion: "Kit de prueba recomendado por el modelo KNN.",
    });

    setAgregado(true);
  };

  const detalles = [
    ["Potencia del kit", `${resultado.potencia_kwp} kWp`],
    ["Paneles de 550 W", resultado.cantidad_paneles],
    [
      "Generación mensual estimada",
      `${resultado.energia_mensual_estimada_kwh} kWh`,
    ],
    [
      "Superficie aproximada",
      `${resultado.superficie_estimada_m2} m²`,
    ],
    ["Stock consultado", resultado.stock],
    ["Código del producto", resultado.producto_id],
  ];

  return (
    <section className="max-w-4xl mx-auto my-8 px-4">
      <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-10 shadow-lg">
        <p className="text-sm font-bold text-emerald-700">
          Recomendación del modelo KNN
        </p>

        <h1 className="mt-2 text-3xl font-bold text-[#0F2547]">
          {resultado.nombre}
        </h1>

        <p className="mt-4 text-3xl font-bold text-[#0F2547]">
          {formatearPrecio(resultado.precio_clp)}
        </p>

        <p className="mt-1 text-sm text-gray-600">
          Precio del catálogo de prueba. No es una cotización
          definitiva de instalación.
        </p>

        <dl className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {detalles.map(([titulo, valor]) => (
            <div key={titulo}>
              <dt className="text-sm text-gray-600">{titulo}</dt>
              <dd className="mt-1 text-xl font-bold text-[#0F2547]">
                {valor}
              </dd>
            </div>
          ))}
        </dl>

        {resultado.ajustado_por_restricciones && (
          <p className="mt-6 text-sm text-gray-700">
            La selección se ajustó según los kits disponibles
            y las restricciones de la solicitud.
          </p>
        )}

        <h2 className="mt-8 font-bold text-[#0F2547]">
          Alcance de esta recomendación
        </h2>

        <ul className="mt-3 list-disc pl-5 space-y-2 text-sm text-gray-600">
          {(resultado.advertencias ?? []).map((texto) => (
            <li key={texto}>{texto}</li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onVolver}
            className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-800"
          >
            Nueva recomendación
          </button>

          <button
            type="button"
            onClick={agregarKit}
            disabled={agregado}
            className="rounded-xl bg-[#00fc82] px-5 py-3 font-bold text-[#0F2547] disabled:opacity-50"
          >
            {agregado
              ? "Añadido al carrito"
              : "Añadir kit de prueba al carrito"}
          </button>
        </div>
      </div>
    </section>
  );
}