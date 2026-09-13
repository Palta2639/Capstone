import { useState } from 'react';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import { FaSearch, FaRegUser, FaSignInAlt } from "react-icons/fa";
import { FaCartShopping, FaBars } from "react-icons/fa6";

function Navbar1() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <Navbar 
      expanded={menuAbierto} 
      onToggle={(estado) => setMenuAbierto(estado)} 
      expand="lg" 
      className="main-navbar"
    >
      <Container fluid className="navbar-inner">
        {/* Logo */}
        <Navbar.Brand href="#home" className="brand-container">
          <div className="brand-mark">A</div>
          <span className="brand-title">Anglo Electric</span>
        </Navbar.Brand>

        {/* Iconos móviles: solo visibles en pantalla chica */}
        <div className="mobile-icons">
          <a href="#busqueda" className="nav-icon-link">
            <FaSearch size={16} />
          </a>
          <a href="#carrito" className="nav-icon-link">
            <FaCartShopping size={18} />
          </a>
          <Navbar.Toggle 
            aria-controls="main-nav" 
            className="custom-toggler"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <FaBars size={22} color="#ffffff" style={{ pointerEvents: 'none' }} />
          </Navbar.Toggle>
        </div>

        {/* Contenido colapsable */}
        <Navbar.Collapse id="main-nav">
          {/* Links de navegación */}
          <Nav className="navbar-links-group">
            <Nav.Link href="#inicio" onClick={() => setMenuAbierto(false)}>Inicio</Nav.Link>
            <Nav.Link href="#Productos" onClick={() => setMenuAbierto(false)}>Productos</Nav.Link>
            <Nav.Link href="#cotizar" onClick={() => setMenuAbierto(false)}>Cotizar</Nav.Link>
            <Nav.Link href="#admin" onClick={() => setMenuAbierto(false)}>Admin Portal</Nav.Link>
          </Nav>

          {/* Iconos derecha: solo visibles en desktop */}
          <div className="desktop-right-icons">
            <Nav.Link href="#busqueda" className="nav-icon-link">
              <FaSearch size={16} />
            </Nav.Link>
            <Nav.Link href="#carrito" className="nav-icon-link">
              <FaCartShopping size={18} />
            </Nav.Link>
            <div className="nav-divider"></div>
            {isLoggedIn ? (
              <div className="auth-group">
                <Nav.Link href="#perfil" className="nav-text-link">Mi Perfil</Nav.Link>
                <a href="#user-menu" className="user-avatar-btn">
                  <FaRegUser size={14} />
                </a>
              </div>
            ) : (
              <div className="auth-group">
                <Nav.Link href="#login" className="nav-text-link auth-text">
                  <FaSignInAlt size={16} /> Acceso
                </Nav.Link>
                <a href="#login" className="user-avatar-btn">
                  <FaRegUser size={14} />
                </a>
              </div>
            )}
          </div>

          {/* Acceso dentro del dropdown móvil */}
          <div className="mobile-auth">
            {isLoggedIn ? (
              <Nav.Link href="#perfil" className="nav-text-link" onClick={() => setMenuAbierto(false)}>
                <FaRegUser size={16} /> Mi Perfil
              </Nav.Link>
            ) : (
              <Nav.Link href="#login" className="nav-text-link" onClick={() => setMenuAbierto(false)}>
                <FaSignInAlt size={16} /> Acceso
              </Nav.Link>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navbar1;