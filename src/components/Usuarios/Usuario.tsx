import React, { useState, useEffect, useRef } from 'react';
import './Usuarios.css';
import Swal from 'sweetalert2';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl'; 
import * as tf from '@tensorflow/tfjs';
interface Usuario {
  id_usuario: string;
  nombre: string;
  email: string;
  rol: string;
  creado_por: string;
  pass?: string;
  imagen: string;
}
const Usuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario>({
    id_usuario: '',
    nombre: '',
    email: '',
    rol: '',
    creado_por: '',
    pass: '',
   imagen: '',
  });
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 6;
  const usuariosFiltrados = usuarios.filter(usuario =>
  usuario.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );
  const indiceInicio = (paginaActual - 1) * usuariosPorPagina;
  const indiceFin = indiceInicio + usuariosPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(indiceInicio, indiceFin);
  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [rolUsuario, setRolUsuario] = useState<string>('');
  const [model, setModel] = useState<any>(null);
  const [imagenes, setImagenes] = useState<{ [key: string]: string }>({});
  useEffect(() => {
  const nuevasImagenes: { [key: string]: string } = {};
  usuarios.forEach(usuario => {
    if (usuario.imagen) {
      nuevasImagenes[usuario.id_usuario] = usuario.imagen;
    }
  });
  setImagenes(nuevasImagenes);
}, [usuarios]);
  useEffect(() => {
    
    const fetchUsuarios = async () => {
      const storedUser = sessionStorage.getItem('user');
      if (!storedUser) return;

      const userParsed = JSON.parse(storedUser);
      const Lemail = userParsed.Luser;
      const Lpass = userParsed.loginPass;
      const rol = userParsed.rol;
      setRolUsuario(rol);
      try {
        const response = await fetch('https://apierp-h9eyakdac0a2hxbh.westus-01.azurewebsites.net/usuarios/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Luser: Lemail, Lpass }),
        });
        const data = await response.json();
        const usuariosFormateados: Usuario[] = data.usuarios.map((u: any) => ({
          id_usuario: u.id_usuario ?? '',
          nombre: u.nombre ?? '',
          email: u.email ?? '',
          rol: u.rol ?? '',
          creado_por: u.creado_por ?? '',
          imagen: u.imagen ?? '',
        }));
        const usuariosFiltrados = usuariosFormateados.filter(usuario => {
          if (rol === '1') return true;
          if (rol === '2') return usuario.creado_por === userParsed.id_usuario;
          return false;
        });
        setUsuarios(usuariosFiltrados);
      } catch (error) {
        console.error('Error en fetch:', error);
      }
    };
    fetchUsuarios();
  }, []);
  useEffect(() => {
  const loadModel = async () => {
    await tf.setBackend('webgl'); 
    const detector = await faceLandmarksDetection.createDetector(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh, {
      runtime: 'tfjs',
      refineLandmarks: true,
    });
    setModel(detector);
  };
  loadModel();
}, []);
  const abrirModalAgregar = () => {
    setUsuarioEditando({
      id_usuario: '',
      nombre: '',
      email: '',
      rol: '',
      creado_por: '',
      pass: '',
      imagen: '',
    });
    setModoEdicion(false);
    setIsModalOpen(true);
  };
  const abrirModalEditar = (usuario: Usuario) => {
    setUsuarioEditando({ ...usuario, pass: '' });
    setModoEdicion(true);
    setIsModalOpen(true);
  };
  const handleEliminar = async (id_usuario: string) => {
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) return;
    const userParsed = JSON.parse(storedUser);
    const Luser = userParsed.Luser;
    const Lpass = userParsed.loginPass;
    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Estás seguro?',
      text: 'Esto eliminará el usuario (cambiará su rol a inactivo).',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (confirmacion.isConfirmed) {
      try {
        const response = await fetch('https://apierp-h9eyakdac0a2hxbh.westus-01.azurewebsites.net/usuarios/editarUsuario', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Luser, Lpass, id_usuario, rol: '4' }),
        });
        const data = await response.json();
        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Usuario eliminado',
            text: '✅ El usuario fue desactivado exitosamente.',
          });
          setUsuarios(usuarios.filter(usuario => usuario.id_usuario !== id_usuario));
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al eliminar',
            text: `❌ ${data.mensaje}`,
          });
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error del servidor',
          text: '❌ No se pudo conectar al servidor.',
        });
      }
    }
  };
  const handleGuardar = async () => {
    if (!usuarioEditando) return;
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) return;
    const userParsed = JSON.parse(storedUser);
    const Luser = userParsed.Luser;
    const Lpass = userParsed.loginPass;
    const creado_por = userParsed.id_usuario;
    if (!usuarioEditando.nombre || !usuarioEditando.email || (!modoEdicion && !usuarioEditando.pass) || !usuarioEditando.rol || !usuarioEditando.imagen) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: '⚠️ Por favor, completa todos los campos.',
      });
      return;
    } 
   const usuarioData = {
  id_usuario: usuarioEditando.id_usuario,
  Luser,
  Lpass,
  nombre: usuarioEditando.nombre,
  email: usuarioEditando.email,
  pass: !modoEdicion ? usuarioEditando.pass : undefined,
  rol: usuarioEditando.rol,
  creado_por,
  imagen: usuarioEditando.imagen, 
};
    const url = modoEdicion
      ? 'https://apierp-h9eyakdac0a2hxbh.westus-01.azurewebsites.net/usuarios/editarUsuario'
      : 'https://apierp-h9eyakdac0a2hxbh.westus-01.azurewebsites.net/usuarios/crearUsuario';
    const method = modoEdicion ? 'PATCH' : 'POST';
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuarioData),
      });
      const data = await response.json();
      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: modoEdicion ? 'Usuario editado' : 'Usuario creado',
          text: `✅ El usuario se ${modoEdicion ? 'editó' : 'creó'} exitosamente.`,
        });
        const reload = async () => {
          const Lemail = userParsed.Luser;
          const Lpass = userParsed.loginPass;
          const rol = userParsed.rol;
          try {
            const response = await fetch('https://apierp-h9eyakdac0a2hxbh.westus-01.azurewebsites.net/usuarios/usuarios', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ Luser: Lemail, Lpass }),
            });
            const data = await response.json();
            const usuariosFormateados: Usuario[] = data.usuarios.map((u: any) => ({
              id_usuario: u.id_usuario ?? '',
              nombre: u.nombre ?? '',
              email: u.email ?? '',
              rol: u.rol ?? '',
              creado_por: u.creado_por ?? '',
              imagen: u.imagen ?? '',
            }));
            const usuariosFiltrados = usuariosFormateados.filter(usuario => {
              if (rol === '1') return true;
              if (rol === '2') return usuario.creado_por === userParsed.id_usuario;
              return false;
            });
            setUsuarios(usuariosFiltrados);
          } catch (error) {
            console.error('Error en fetch:', error);
          }
        };
        reload();
        setIsModalOpen(false);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: `❌ ${data.mensaje}`,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error del servidor',
        text: '❌ No se pudo conectar al servidor.',
      });
    }
  };
  const obtenerNombreRol = (rol: string) => {
    switch (rol) {
      case '1': return 'Admin';
      case '2': return 'Jefe';
      case '3': return 'Empleado';
      case '4': return 'Inactivo';
      default: return 'Desconocido';
    }
  };
const [stream, setStream] = useState<MediaStream | null>(null);
const [foto, setFoto] = useState<string | null>(null);
const videoRef = useRef<HTMLVideoElement>(null);
const [mostrarCamara, setMostrarCamara] = useState(false);
const abrirCamara = async () => {
  setMostrarCamara(true);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    setStream(stream);
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  } catch (error) {
    console.error('Error al abrir la cámara:', error);
  }
};
const [escaneando, setEscaneando] = useState(false);
const tomarFoto = async () => {
  setEscaneando(true);

  if (videoRef.current) {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg');
    const img = new Image();
    img.src = base64Image;
    await new Promise(resolve => { img.onload = resolve; });
    if (model) {
      const predictions = await model.estimateFaces(img);
      if (predictions.length > 0) {
        setUsuarioEditando(prev => ({
          ...prev,
          imagen: base64Image,
        }));
        setFoto(base64Image); 
        setMostrarCamara(false);
        setEscaneando(false);
        stream?.getTracks().forEach(track => track.stop());
        Swal.fire({
          icon: 'success',
          title: 'Foto tomada correctamente',
          text: '✅ Se detectó un rostro y la foto fue guardada.',
        });
      } else {
        setEscaneando(false);
        Swal.fire({
          icon: 'warning',
          title: 'No se detectó un rostro',
          text: '❌ Asegúrate de estar bien encuadrado en la cámara.',
        });
      }
    }
  }
};
const usuariosConNombreDeCreador = usuarios.map((usuario) => {
  const creador = usuarios.find((u) => u.id_usuario === usuario.creado_por);
  return {
    ...usuario,
    creado_por: creador ? creador.nombre : 'Desconocido', // CAMBIAMOS aquí
  };
});
const handleAbrirReporte = () => {
 sessionStorage.setItem("usuariosParaReporte", JSON.stringify(usuariosConNombreDeCreador));
window.open("/reportes/reporte.html", "_blank");
};
  return (
    <div className="usuarios-container">
      <h2>Gestión de Usuarios</h2>
      <button className="btn-agregar"title="nuevo usuario" onClick={abrirModalAgregar}>➕</button>
      <input
  type="text"
  placeholder="🔍 Buscar por nombre"
  value={busqueda}
  onChange={e => {
    setBusqueda(e.target.value);
    setPaginaActual(1); // reinicia a la página 1 si se hace nueva búsqueda
  }}
  className="input-busqueda"/>
  {(rolUsuario === '1' || rolUsuario === '2') && (
  <button
    className="btn-agregar"
    onClick={handleAbrirReporte}
    title="Reportes"
  >
    📄
  </button>
)}
      <table className="tabla-usuarios">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosPaginados.map(usuario => (
           <tr key={usuario.id_usuario}>
           <td>{usuario.nombre}</td>
           <td>{usuario.email}</td>
           <td>{obtenerNombreRol(usuario.rol)}</td>
           <td>
               <button className="btn-editar" onClick={() => abrirModalEditar(usuario)}>✏️</button>
               <button className="btn-eliminar" onClick={() => handleEliminar(usuario.id_usuario)}>🗑️</button>
           </td>
         </tr>
  ))}
</tbody>

      </table>
      <div className="paginacion">
        <button onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))} disabled={paginaActual === 1}>◀️</button>
        <span>Página {paginaActual} de {totalPaginas}</span>
        <button onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}disabled={paginaActual === totalPaginas}>▶️</button>
      </div>
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{modoEdicion ? 'Editar Usuario' : 'Agregar Usuario'}</h3>
            <input
              type="text"
              value={usuarioEditando?.nombre || ''}
              onChange={e => setUsuarioEditando(prev => ({ ...prev!, nombre: e.target.value }))}
              placeholder="Nombre"/>
            <input
              type="email"
              value={usuarioEditando?.email || ''}
              onChange={e => setUsuarioEditando(prev => ({ ...prev!, email: e.target.value }))}
              placeholder="Correo"/>
            {!modoEdicion && (
              <input
                type="password"
                value={usuarioEditando?.pass || ''}
                onChange={e => setUsuarioEditando(prev => ({ ...prev!, pass: e.target.value }))}
                placeholder="Contraseña"/>
            )}
            <select
              className={`custom-select ${rolUsuario === '2' ? 'select-disabled' : ''}`}
              value={rolUsuario === '2' ? '3' : usuarioEditando?.rol}
              onChange={e => setUsuarioEditando(prev => ({ ...prev!, rol: e.target.value }))}
              disabled={rolUsuario === '2'}>
              {rolUsuario === '1' && <option value="">Selecciona un rol</option>}
              {rolUsuario === '1' && <option value="1">Admin</option>}
              {rolUsuario === '1' && <option value="2">Jefe</option>}
              <option value="3">Empleado</option>
            </select>
             <button className="btn-tomar-foto" onClick={abrirCamara}>📸 Tomar foto</button>
      {mostrarCamara && (
         <div>
    <video ref={videoRef} width="100%" height="100%"></video>
    <button className="btn-tomar-foto" onClick={tomarFoto}>📸 Capturar</button>
    {escaneando && (
      <p>Escaneando...</p>)}
  </div>)}   
{usuarioEditando.imagen && (
  <div>
  <img
    alt="Foto del usuario"
    src={usuarioEditando.imagen}
    style={{
      width: '150px',
      height: '150px',
      objectFit: 'cover',
      borderRadius: '8px',
       marginTop: '10px', 
    }}/>
  </div>
)}
            <div className="modal-buttons">
              <button className="btn-guardar" onClick={handleGuardar}>Guardar</button>
              <button className="btn-cancelar" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;