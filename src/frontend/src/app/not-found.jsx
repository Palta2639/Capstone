import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "404 - Página no encontrada",
  description: "La página solicitada no existe.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        
        {/* Logo de la página */}
        <div className="flex justify-center">
          <Image
            src="/logo-anglo.png"
            alt="Anglo Electric"
            width={160}
            height={44}
            className="h-9 w-auto object-contain"
            priority
          />
        </div>

        {/* 404 estándar */}
        <div>
          <h1 className="text-7xl font-extrabold text-gray-900 tracking-tight">
            404
          </h1>
          <h2 className="text-xl font-bold text-gray-800 mt-3">
            Página no encontrada
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            La página que estás buscando no existe, ha sido movida o no está disponible.
          </p>
        </div>

        {/* Botón simple de volver */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block bg-gray-900 hover:bg-black text-white font-medium text-sm px-6 py-3 rounded-xl transition-colors shadow-sm"
          >
            Volver a la página principal
          </Link>
        </div>

      </div>
    </div>
  );
}
