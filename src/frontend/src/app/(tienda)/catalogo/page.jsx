import VistaCatalogo from "@/src/components/VistaCatalogo";

export default function Catalogo() {
  return (
    <main className="p-4 container mx-auto max-w-7xl mt-4">
      <h1 className="text-3xl font-bold mb-4 text-[#0F2547]">Catálogo de Productos</h1>
      <VistaCatalogo />
    </main>
  );
}
