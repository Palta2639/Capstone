"use client";

import { BsCart2 } from "react-icons/bs";
import { FiUser } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/src/context/CartContext";
import CartSidebar from "./CartSidebar";
import AuthModal from "./AuthModal";

const navLinkClass =
  "text-[#ffffff] hover:text-[#00fc82] hover:bg-transparent focus:bg-transparent active:bg-transparent transition-colors duration-200";
const navIconClass =
  "text-[#ffffff] hover:text-[#00fc82] hover:bg-transparent focus:bg-transparent active:bg-transparent transition-colors duration-200 relative cursor-pointer";

function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems, isCartOpen, setIsCartOpen, montado } = useCart();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const getNavLinkClass = (href) => {
    let isActive = false;
    if (href === "/") {
      isActive = pathname === "/";
    } else if (href === "/catalogo") {
      isActive = pathname === "/catalogo" || pathname.startsWith("/producto");
    } else if (href === "/cotizador") {
      isActive = pathname === "/cotizador" || pathname === "/dimensionamiento";
    } else {
      isActive = pathname === href || pathname.startsWith(href);
    }

    return isActive
      ? "text-[#00fc82] font-bold hover:text-[#00fc82] focus:text-[#00fc82] active:text-[#00fc82] hover:bg-transparent focus:bg-transparent active:bg-transparent transition-colors duration-200"
      : "text-white hover:text-[#00fc82] focus:text-white active:text-white hover:bg-transparent focus:bg-transparent active:bg-transparent transition-colors duration-200";
  };

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        setIsLoggedIn(true);
        try {
          const base64Url = token.split('.')[1];
          let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          const payload = JSON.parse(window.atob(base64));
          if (payload.rol_id === 1) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (e) {
          console.error("Error validando token en Navbar:", e);
        }
      } else {
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    };

    checkAuth();

    const handleOpenAuth = () => setIsAuthOpen(true);

    window.addEventListener("auth-change", checkAuth);
    window.addEventListener("open-auth-modal", handleOpenAuth);

    return () => {
      window.removeEventListener("auth-change", checkAuth);
      window.removeEventListener("open-auth-modal", handleOpenAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setIsAdmin(false);
    window.dispatchEvent(new Event("auth-change"));
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <div className="navbar bg-linear-to-r from-[#09203F] to-[#00B4D8] shadow-sm justify-between md:justify-start px-4 relative z-40">
        <div className="flex items-center gap-2 md:gap-6">
          <div className="dropdown md:hidden">
            <div
              tabIndex={0}
              role="button"
              aria-label="Abrir menú de navegación"
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
                <Link className={getNavLinkClass("/")} href="/">
                  Inicio
                </Link>
              </li>
              <li>
                <Link className={getNavLinkClass("/catalogo")} href="/catalogo">
                  Productos
                </Link>
              </li>
              <li>
                <Link className={getNavLinkClass("/cotizador")} href="/cotizador">
                  Cotizador IA
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link 
                    href="/admin/crud" 
                    className={pathname.startsWith("/admin") ? "text-[#00fc82] font-bold" : "text-white hover:text-[#00fc82] font-medium"}
                  >
                    Panel Admin
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity duration-200">
            <Image
              src="/logo-anglo.png"
              alt="Anglo Electric"
              width={160}
              height={45}
              className="h-8 md:h-10 object-contain"
              style={{ width: "auto" }}
              priority
            />
          </Link>
        </div>

        <div className="hidden md:flex flex-1">
          <ul className="menu menu-horizontal px-1 items-center gap-1">
            <li>
              <Link className={getNavLinkClass("/")} href="/">
                Inicio
              </Link>
            </li>
            <li>
              <Link className={getNavLinkClass("/catalogo")} href="/catalogo">
                Productos
              </Link>
            </li>
            <li>
              <Link className={getNavLinkClass("/cotizador")} href="/cotizador">
                Cotizador IA
              </Link>
            </li>
            {isAdmin && (
              <li className="ml-2">
                <Link 
                  href="/admin/crud" 
                  className={
                    pathname.startsWith("/admin")
                      ? "bg-[#00fc82] text-[#0F2547] px-3 py-2 rounded-lg font-bold border border-[#00fc82] shadow-sm transition-all"
                      : "bg-[#00fc82]/10 text-[#00fc82] hover:bg-[#00fc82] hover:text-[#0F2547] px-3 py-2 rounded-lg font-bold border border-[#00fc82]/30 transition-all"
                  }
                >
                  Panel Admin
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div className="flex items-center gap-1 md:gap-4 ml-auto">
          {isLoggedIn ? (
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className={navIconClass}
                aria-label="Menú de Usuario"
              >
                <div className="w-8 h-8 rounded-full bg-[#00fc82] flex items-center justify-center text-[#0F2547] font-bold text-sm border-2 border-white shadow-sm">
                  U
                </div>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-white text-gray-800 rounded-xl z-50 mt-4 w-48 p-2 shadow-xl border border-gray-100"
              >
                <li>
                  <Link href="/perfil" className="hover:bg-gray-50 font-medium">Mi Perfil</Link>
                </li>
                <li>
                  <Link href="/mis-pedidos" className="hover:bg-gray-50 font-medium">Mis Compras</Link>
                </li>
                <div className="divider my-1"></div>
                <li>
                  <button 
                    onClick={handleLogout}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 font-bold"
                  >
                    Cerrar Sesión
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div 
              className={navIconClass} 
              aria-label="Iniciar Sesión"
              onClick={() => setIsAuthOpen(true)}
            >
              <FiUser className="h-6 w-6" />
            </div>
          )}

          {/* Icono del Carrito con Badge y onClick */}
          <div 
            className={navIconClass} 
            aria-label="Abrir carrito"
            onClick={() => setIsCartOpen(true)}
          >
            <BsCart2 className="h-6 w-6" />
            {montado && totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#00fc82] text-[#0F2547] text-xs font-black w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-bounce-short">
                {totalItems}
              </span>
            )}
          </div>
        </div>
      </div>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}

export default Navbar;
