import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './Proyectos.css';
import Select from 'react-select';
interface Proyecto {
  id: number;
  nombre: string;
  descripcion: string;
  fecha_inicio?: string;
  fecha_limite?: string;
  estado?: string;
  usuarios?: { id_usuario: string; nombre: string }[];
  fecha_fin?: string;
}

interface Usuario {
  id_usuario: string;
  nombre: string;
  creado_por: string;
}

const Proyectos = () => {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proyectoEditando, setProyectoEditando] = useState<Proyecto | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<Usuario[]>([]);
  type Opcion = { value: string; label: string };

  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<Opcion[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [proyectosPorPagina] = useState(6);
  const [textoBusqueda, setTextoBusqueda] = useState('');

  const storedUser = sessionStorage.getItem('user');
  const userParsed = storedUser ? JSON.parse(storedUser) : null;
  const Luser = userParsed?.Luser;
  const Lpass = userParsed?.loginPass;
  const id_creador = userParsed?.id_usuario;
  const rolUsuario = userParsed?.rol;

  const fechaMinima = new Date().toISOString().split('T')[0];

  const obtenerEstadoTexto = (estado: string | undefined): string => {
    switch (estado) {
      case '1':
        return 'Activo';
      case '2':
        return 'Terminado';
      case '3':
        return 'Atrasado';
      case '4':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  // Cargar proyectos
  useEffect(() => {
    const fetchProyectos = async () => {
      try {
        const res = await fetch('https://apierp-h9eyakdac0a2hxbh.westus-01.azurewebsites.net/proyectos/proyectos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Luser, Lpass, id_creador }),
        });

        const data = await res.json();

        if (res.ok) {
          const proyectosFormateados = data.map((proy: any) => ({
            id: proy.id_proyecto,
            nombre: proy.nombre,
            descripcion: proy.descripcion,
            fecha_inicio: proy.fecha_inicio,
            fecha_limite: proy.fecha_limite,
            estado: proy.estado,
            usuarios: proy.asignados,
            fecha_fin: proy.fecha_fin,
          }));

          setProyectos(proyectosFormateados);
        } else {
          Swal.fire('Error', data.mensaje || 'Error al cargar proyectos', 'error');
        }
      } catch (error) {
        Swal.fire('Error del servidor', 'No se pudo conectar al servidor.', 'error');
      }
    };

    if (Luser && Lpass) fetchProyectos();
  }, [Luser, Lpass, id_creador]);

  // Cargar usuarios
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await fetch('https://apierp-h9eyakdac0a2hxbh.westus-01.azurewebsites.net/usuarios/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Luser, Lpass }),
        });

        const data = await res.json();

        if (res.ok) {
          const filtrados = data.usuarios.filter((u: Usuario) => u.creado_por === id_creador);
          setUsuariosDisponibles(filtrados);
        } else {
          Swal.fire('Error', data.mensaje || 'Error al cargar usuarios', 'error');
        }
      } catch (error) {
        Swal.fire('Error del servidor', 'No se pudo cargar la lista de usuarios.', 'error');
      }
    };

    if (isModalOpen && !modoEdicion && Luser && Lpass) {
      fetchUsuarios();
    }
  }, [isModalOpen, modoEdicion, Luser, Lpass, id_creador]);

  const abrirModalAgregar = () => {
    setProyectoEditando({
      id: 0,
      nombre: '',
      descripcion: '',
      fecha_inicio: fechaMinima,
      fecha_limite: fechaMinima,
      estado: '1',
    });
    setUsuariosSeleccionados([]);
    setModoEdicion(false);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (proyecto: Proyecto) => {
    setProyectoEditando(proyecto);
    setModoEdicion(true);
    setIsModalOpen(true);
  };

const TerminarProyecto = async (id: number) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, terminar',
    });

    if (confirm.isConfirmed) {
      try {
        
        const res = await fetch('https://apierp-h9eyakdac0a2hxbh.westus-01.azurewebsites.net/proyectos/terminarProyecto', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Luser, Lpass, id }),
        });

        const data = await res.json();

        if (res.ok) {
          setProyectos((prev) => prev.filter((p) => p.id !== id));
          Swal.fire('Eliminado', 'Proyecto a terminado correctamente.', 'success');
        } else {
          Swal.fire('Error', data.mensaje || 'No se pudo terminar el proyecto.', 'error');
        }
      } catch (error) {
        Swal.fire('Error del servidor', 'No se pudo conectar al servidor.', 'error');
      }
    }
  };

  const eliminarProyecto = async (id: number) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
    });

    if (confirm.isConfirmed) {
      try {
        
        const res = await fetch('https://apierp-h9eyakdac0a2hxbh.westus-01.azurewebsites.net/proyectos/cancelarProyecto', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Luser, Lpass, id }),
        });

        const data = await res.json();

        if (res.ok) {
          setProyectos((prev) => prev.filter((p) => p.id !== id));
          Swal.fire('Eliminado', 'Proyecto eliminado correctamente.', 'success');
        } else {
          Swal.fire('Error', data.mensaje || 'No se pudo eliminar el proyecto.', 'error');
        }
      } catch (error) {
        Swal.fire('Error del servidor', 'No se pudo conectar al servidor.', 'error');
      }
    }
  };

  const handleGuardar = async () => {
    if (!proyectoEditando) return;

    const { nombre, descripcion, fecha_limite } = proyectoEditando;

    if (!nombre || !descripcion || !fecha_limite) {
      Swal.fire('Campos incompletos', 'Rellena todos los campos.', 'warning');
      return;
    }

    const url = modoEdicion
      ? 'https://apierp-h9eyakdac0a2hxbh.westus-01.azurewebsites.net/proyectos/editarProyecto'
      : 'https://apierp-h9eyakdac0a2hxbh.westus-01.azurewebsites.net/proyectos/crearP';

    const payload = {
      ...proyectoEditando,
      Luser,
      Lpass,
      id_creador: userParsed?.id_usuario,
      usuarios: usuariosSeleccionados,
    };

    try {
      const res = await fetch(url, {
        method: modoEdicion ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (modoEdicion) {
          setProyectos((prev) =>
            prev.map((p) => (p.id === proyectoEditando.id ? proyectoEditando : p))
          );
        } else {
          setProyectos((prev) => [...prev, { ...proyectoEditando, id: data.id }]);
        }

        setIsModalOpen(false);
        Swal.fire('Éxito', modoEdicion ? 'Proyecto actualizado' : 'Proyecto creado', 'success');
      } else {
        Swal.fire('Error', data.mensaje || 'No se pudo guardar el proyecto.', 'error');
      }
    } catch (error) {
      Swal.fire('Error del servidor', 'No se pudo conectar al servidor.', 'error');
    }
  };

  useEffect(() => {
    if (proyectoEditando?.usuarios) {
      const seleccionInicial = proyectoEditando.usuarios.map((u) => ({
        value: u.id_usuario,
        label: u.nombre,
      }));
      setUsuariosSeleccionados(seleccionInicial);
    }
  }, [proyectoEditando]);

  const indiceUltimoProyecto = paginaActual * proyectosPorPagina;
  const indicePrimerProyecto = indiceUltimoProyecto - proyectosPorPagina;

  const proyectosFiltrados = proyectos.filter((proyecto) =>
    proyecto.nombre.toLowerCase().includes(textoBusqueda.toLowerCase())
  );

  const proyectosActuales = proyectosFiltrados.slice(
    indicePrimerProyecto,
    indiceUltimoProyecto
  );

const paginar = (numeroPagina: number) => setPaginaActual(numeroPagina);
const abrirReporteProyectos = () => {
  sessionStorage.setItem('reporteProyectos', JSON.stringify(proyectosFiltrados));
  window.open('/reportes/reporteP.html', '_blank');
};

  return (
  <div className="proyectos-container">
    {(rolUsuario === '1' || rolUsuario === '2') && (
      <button className="btn-agregar" onClick={abrirModalAgregar} title="Agregar proyecto">
        ➕
      </button>
    )}
    {(rolUsuario === '1' || rolUsuario === '2') && (
  <button className="btn-agregar" onClick={abrirReporteProyectos} title="Reportes">
    📄
  </button>
)}

    <div className="buscador-container">
      <input
        type="text"
        placeholder="Buscar por nombre"
        value={textoBusqueda}
        onChange={(e) => setTextoBusqueda(e.target.value)}
      />
    </div>

    <table className="tabla-proyectos">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Descripción</th>
          <th>Fecha Límite</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {proyectosActuales.map((proyecto) => (
          <tr key={proyecto.id}>
            <td 
  style={{
    maxWidth: '300px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }}  >{proyecto.nombre}</td>
        <td 
  style={{
    maxWidth: '300px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }} 
  title={proyecto.descripcion}
>
  {proyecto.descripcion}
</td>
            <td 
  style={{
    maxWidth: '300px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }} >{proyecto.fecha_limite || 'No definida'}</td>
            <td 
  style={{
    maxWidth: '300px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }} >{obtenerEstadoTexto(proyecto.estado)}</td>
            <td 
  style={{
    maxWidth: '300px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }} >
              {(rolUsuario === '1' || rolUsuario === '2') && proyecto.estado === '1' && (
      <button onClick={() => TerminarProyecto(proyecto.id)}>✅</button>
    )}
              <button onClick={() => abrirModalEditar(proyecto)}>✏️</button>
             {(rolUsuario === '1' || rolUsuario === '2') && proyecto.estado === '1' && (
              <button onClick={() => eliminarProyecto(proyecto.id)}>🗑️</button>  )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="paginacion">
      <button onClick={() => paginar(paginaActual - 1)} disabled={paginaActual === 1}>
        ⬅️
      </button>
      {Array(Math.ceil(proyectosFiltrados.length / proyectosPorPagina))
        .fill(null)
        .map((_, index) => (
          <button
            key={index + 1}
            onClick={() => paginar(index + 1)}
            className={paginaActual === index + 1 ? 'active' : ''}
          >
            {index + 1}
          </button>
        ))}
      <button onClick={() => paginar(paginaActual + 1)} disabled={paginaActual === Math.ceil(proyectosFiltrados.length / proyectosPorPagina)}>
        ➡️
      </button>
    </div>

    {isModalOpen && (
  <div className="modal-overlay">
    <div className="modal-content modal-linea">
      <div className="form-group">
        <label>Nombre:</label>
        <input
          type="text"
          value={proyectoEditando?.nombre || ''}
          onChange={(e) =>
            setProyectoEditando({ ...proyectoEditando!, nombre: e.target.value })
          }
          readOnly={
            !(rolUsuario === '1' || rolUsuario === '2') || 
  proyectoEditando?.estado === '2' || 
  proyectoEditando?.estado === '4'
          }
        />
      </div>

      <div className="form-group">
        <label>Descripción:</label>
        </div>
        <div className="form-group">
        <textarea
          value={proyectoEditando?.descripcion || ''}
          onChange={(e) =>
            setProyectoEditando({ ...proyectoEditando!, descripcion: e.target.value })
          }
          readOnly={
            !(rolUsuario === '1' || rolUsuario === '2') || 
  proyectoEditando?.estado === '2' || 
  proyectoEditando?.estado === '4'
          }
          rows={20}
          className="w-full max-w-7xl p-2 border rounded resize-y"
          placeholder="Escribe una descripción detallada..."
        />
      </div>

      <div className="form-group">
        <label>Fecha Límite:</label>
        <input
          type="date"
          value={proyectoEditando?.fecha_limite || ''}
          onChange={(e) =>
            setProyectoEditando({ ...proyectoEditando!, fecha_limite: e.target.value })
          }
          min={fechaMinima}
          readOnly={
            !(rolUsuario === '1' || rolUsuario === '2') || 
  proyectoEditando?.estado === '2' || 
  proyectoEditando?.estado === '4'
          }
        />
      </div>

      {(rolUsuario === '1' || rolUsuario === '2') && proyectoEditando?.estado === '1' ? (
        <div className="form-group">
          <label>Asignar Usuarios:</label>
          <Select
            options={usuariosDisponibles.map((u) => ({
              value: u.id_usuario,
              label: u.nombre,
            }))}
            isMulti
            value={usuariosSeleccionados}
            onChange={(selected) => setUsuariosSeleccionados(selected ? [...selected] : [])}
          />
        </div>
      ) : null}

      <div className="botones">
        {(rolUsuario === '1' || rolUsuario === '2') &&
  (!modoEdicion || (proyectoEditando?.estado === '1' || proyectoEditando?.estado === '3')) && (
    <button className="btn guardar" onClick={handleGuardar}>
      {modoEdicion ? 'Actualizar' : 'Guardar'}
    </button>
)}

        <button className="btn cancelar" onClick={() => setIsModalOpen(false)}>
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}

  </div>
  );
};

export default Proyectos;