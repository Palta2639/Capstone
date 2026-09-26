import { BsCart2 } from "react-icons/bs";
import { FiUser } from "react-icons/fi";
import { MdOutlineSearch } from "react-icons/md";
import Link from "next/link";
import Image from "next/image";

const navLinkClass =
  "text-[#ffffff] hover:text-[#00fc82] hover:bg-transparent focus:bg-transparent active:bg-transparent transition-colors duration-200";
const navIconClass =
  "text-[#ffffff] hover:text-[#00fc82] hover:bg-transparent focus:bg-transparent active:bg-transparent transition-colors duration-200";

function Navbar() {
  return (
    <div className="navbar bg-linear-to-r from-[#09203F] to-[#00B4D8] shadow-sm justify-between md:justify-start px-4">
      <div className="flex items-center gap-2 md:gap-6">
        <div className="dropdown md:hidden">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost text-white px-0 mr-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-[#0F2547] text-white rounded-box z-50 mt-3 w-52 p-2 shadow"
          >
            <li>
             <Link className={navLinkClass} href="/">
              Inicio
            </Link>
            </li>
            <li>
              <Link className={navLinkClass} href="/catalogo">
                Productos
              </Link>
            </li>
            <li>
              <Link className={navLinkClass} href="/kits-instalacion">
                Kits de instalacion
              </Link>
            </li>
            <li>
              <Link className={navLinkClass} href="/cotizador">
                Cotizador IA
              </Link>
            </li>
          </ul>
        </div>

        <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity duration-200">
          <Image
            src="/logo-anglo.png"
            alt="Anglo Electric"
            width={140}
            height={40}
            style={{ width: "auto" }}
            className="h-6 object-contain"
            priority
          />
        </Link>
      </div>

      <div className="hidden md:flex flex-1">
        <ul className="menu menu-horizontal px-1 items-center gap-1">
          <li>
               <Link className={navLinkClass} href="/">
              Inicio
            </Link>
          </li>
          <li>
            <Link className={navLinkClass} href="/catalogo">
              Productos
            </Link>
          </li>
          <li>
            <Link className={navLinkClass} href="/kits-instalacion">
              Kits de instalacion
            </Link>
          </li>
          <li>
            <Link className={navLinkClass} href="/cotizador">
              Cotizador IA
            </Link>
          </li>
        </ul>
      </div>

      <div className="flex items-center gap-1 md:gap-4 ml-auto">
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className={navIconClass}
            aria-label="Buscar"
          >
            <MdOutlineSearch className="h-6 w-6" />
          </div>

         
          <div
            tabIndex={0}
            className="dropdown-content bg-linear-to-r from-[#0F2547] to-[#00fc82] rounded-xl z-50 mt-4 w-64 md:w-80 p-3 shadow-xl border "
          >
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar componentes..."
                className="input input-sm w-full bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#00fc82]"
              />
              <button className="btn btn-sm bg-[#0F2547] text-[#ffffff] hover:bg-[#00fc82] hover:text-white border-none font-semibold transition-colors">
                Ir
              </button>
            </div>
          </div>
        </div>

        <a href="#User-icon" className={navIconClass} aria-label="Ir al perfil">
          <FiUser className="h-6 w-6" />
        </a>

        <a href="#carrito" className={navIconClass} aria-label="Ir al carrito">
          <BsCart2 className="h-6 w-6" />
        </a>
      </div>
    </div>
  );
}

export default Navbar;
