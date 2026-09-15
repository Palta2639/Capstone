import Image from "next/image";

function Footer() {
  return (
    <>
      {/* Aplicamos el degradado de azul oscuro a celeste brillante */}
      <footer className="flex flex-col md:flex-row items-center justify-between p-6 bg-linear-to-r from-[#09203F] to-[#00B4D8] text-white gap-6 md:gap-4">
        {/* Sección Izquierda: Logo y Copyright */}
        <aside className="flex flex-col md:flex-row items-center gap-3 text-center md:text-left">
          <Image
            src=""
            alt="Logo Anglo Electric"
            width={40}
            height={40}
            className="object-contain"
          />
          <p>Copyright © {new Date().getFullYear()} - Todos los derechos reservados</p>
        </aside>

        {/* Sección Derecha: Redes Sociales */}
        <nav className="flex items-center gap-6">
          <a
            href="/codigo/public/gatito.png"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#00fc82] transition-colors cursor-pointer"
          >
            <svg
              aria-label="Facebook"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className="fill-current"
            >
              <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path>
            </svg>
          </a>
        </nav>
      </footer>
    </>
  );
}

export default Footer;