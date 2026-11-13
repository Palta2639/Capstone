import CotizadorIA from "@/src/components/CotizadorIA";

export const metadata = {
  title: "Cotizador Solar con IA | Anglo Electric",
  description: "Calcula en segundos el kit solar óptimo para tu propiedad con Inteligencia Artificial.",
};

export default function CotizadorPage() {
  return (
    <main className="container mx-auto px-4 py-6 max-w-7xl">
      <CotizadorIA />
    </main>
  );
}
