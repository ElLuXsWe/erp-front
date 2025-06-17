import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import Usuarios from '../Usuarios/Usuario';
import Proyectos from '../Proyectos/Proyectos';

interface User {
  nombre: string;
  rol: string;
  id_usuario: string;
  Luser: string;
  Lpass: string;
  loginPass: string;  // <- Ahora también tenemos el pass limpio
}

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState('Pendientes');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) {
      navigate('/');
    } else {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Usuario cargado:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error al parsear usuario:', error);
        navigate('/');
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    window.location.reload();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSidebarClick = (section: string) => {
    setCurrentSection(section);
  };

  return (
    <>
      {/* Barra superior */}
      <div className="navbar">
        <div className="menu-icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          ☰
        </div>

        <h3 className="navbar-title">{currentSection}</h3>

        <div className="user-info" onClick={() => setIsDropdownOpen(!isDropdownOpen)} ref={dropdownRef}>
          <span>{user?.nombre || 'Usuario'}</span>
          <div className={`dropdown-menu ${isDropdownOpen ? 'open' : ''}`}>
            <button onClick={handleLogout} className="dropdown-item">Cerrar sesión</button>
          </div>
        </div>
      </div>

      {/* Barra lateral */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <ul>
          <li onClick={() => handleSidebarClick('Pendientes')}>Inicio</li>
          <li onClick={() => handleSidebarClick('Proyectos')}>Proyectos</li>
          {user?.rol === '1' || user?.rol === '2' ? (
            <li onClick={() => handleSidebarClick('Usuarios')}>Usuarios</li>
          ) : null}
        </ul>
      </div>

      {/* Contenido */}
      <div className="content">
        {currentSection === 'Pendientes' && <div>Contenido Pendientes</div>}
        {currentSection === 'Proyectos' && <Proyectos />}
        {currentSection === 'Usuarios' && <Usuarios />}
      </div>
    </>
  );
}

export default Home;
