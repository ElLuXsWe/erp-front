import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { SupportedModels } from '@tensorflow-models/face-landmarks-detection';
import Webcam from 'react-webcam';
import './Login.css';
import loginImage from '../img/Login.png';
function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [comparando, setComparando] = useState(false);
  const [imagenBD, setImagenBD] = useState('');
  const [usuarioData, setUsuarioData] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const webcamRef = useRef<Webcam>(null);
  const navigate = useNavigate();
  const detectorRef = useRef<any>(null);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const verificadoRef = useRef<boolean>(false);
const [token, setToken] = useState<string>('');

  useEffect(() => {
    const inicializarDetector = async () => {
      const detector = await faceLandmarksDetection.createDetector(
        SupportedModels.MediaPipeFaceMesh,
        { runtime: 'tfjs', refineLandmarks: true }
      );
      detectorRef.current = detector;
    };
    inicializarDetector();
  }, []);

  const handleFaceLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setShowCamera(false);
    setComparando(false);

    try {
      const response = await fetch('https://apierp-h9eyakdac0a2hxbh.westus-01.azurewebsites.net/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pass, codigo: false }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.mensaje || 'Credenciales inválidas');
        return;
      }

      setImagenBD(result.usuario.imagen);
      setUsuarioData(result.usuario);
      setShowCamera(true);
    } catch (error) {
      console.error('Error en login:', error);
      setErrorMessage('Error al intentar iniciar sesión.');
    }
  };

  const handleCorreoLogin = async (event: React.FormEvent) => {
  event.preventDefault();
  setErrorMessage('');
  try {
    const response = await fetch('https://apierp-h9eyakdac0a2hxbh.westus-01.azurewebsites.net/usuarios/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pass, codigo: true }),
    });

    const result = await response.json();

    if (!response.ok) {
      setErrorMessage(result.mensaje || 'Credenciales inválidas');
      return;
    }

    // Guardar el token que llegó desde el backend
    setToken(result.token);
    setModalVisible(true);
  } catch (error) {
    console.error('Error en login por correo:', error);
    setErrorMessage('Error al intentar login por correo.');
  }
};


 const verificarCodigoLogin = async () => {
  try {
    const response = await fetch('https://apierp-h9eyakdac0a2hxbh.westus-01.azurewebsites.net/usuarios/verificar-codigo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo: codigoIngresado,
        email,
        pass,
        token, // Aquí se envía el token junto con el código
      }),
    });

    const result = await response.json();

    if (result.valido) {
      const userWithPass = { ...result.usuario, loginPass: pass };
      sessionStorage.setItem('user', JSON.stringify(userWithPass));
      navigate('/home');
    } else {
      setErrorMessage('Código inválido o expirado.');
    }
  } catch (err) {
    console.error('Error al verificar código:', err);
    setErrorMessage('Error al verificar código.');
  }
};


  useEffect(() => {
    if (showCamera && webcamRef.current && detectorRef.current) {
      verificadoRef.current = false;

      detectionInterval.current = setInterval(detectarRostro, 800);

      timeoutRef.current = setTimeout(() => {
        if (!verificadoRef.current) {
          clearInterval(detectionInterval.current!);
          setShowCamera(false);
          setComparando(false);
          setErrorMessage('⏱️ No se detectó coincidencia facial a tiempo.');
        }
      }, 15000);

      return () => {
        clearInterval(detectionInterval.current!);
        clearTimeout(timeoutRef.current!);
      };
    }
  }, [showCamera]);

  const detectarRostro = async () => {
    if (!webcamRef.current || !webcamRef.current.video) return;

    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return;

    const img = new Image();
    img.src = screenshot;
    await new Promise((resolve) => (img.onload = resolve));

    const faces = await detectorRef.current!.estimateFaces(img);

    if (faces.length > 0) {
      setComparando(true);
      await compararConBD(img, screenshot);
    }
  };

  const compararConBD = async (imgUser: HTMLImageElement, screenshot: string) => {
    try {
      if (!imagenBD || typeof imagenBD !== 'string') return;

      const imgBD = new Image();
      imgBD.crossOrigin = 'anonymous';
      imgBD.src = imagenBD;

      await new Promise((resolve, reject) => {
        imgBD.onload = () => resolve(true);
        imgBD.onerror = (e) => {
          console.error("Error cargando imagenBD:", e);
          reject(new Error("No se pudo cargar la imagen de la base de datos"));
        };
      });

      const [caraBD] = await detectorRef.current!.estimateFaces(imgBD);
      const [caraUser] = await detectorRef.current!.estimateFaces(imgUser);

      if (!caraBD || !caraUser) return;

      const puntosUser = caraUser.keypoints;
      const puntosBD = caraBD.keypoints;
      let sumaDiferencia = 0;
      const puntosComparados = Math.min(puntosUser.length, puntosBD.length);

      for (let i = 0; i < puntosComparados; i++) {
        const dx = puntosUser[i].x - puntosBD[i].x;
        const dy = puntosUser[i].y - puntosBD[i].y;
        sumaDiferencia += Math.sqrt(dx * dx + dy * dy);
      }

      const promedioDiferencia = sumaDiferencia / puntosComparados;

      if (promedioDiferencia < 20 && !verificadoRef.current) {
        verificadoRef.current = true;
        clearInterval(detectionInterval.current!);
        clearTimeout(timeoutRef.current!);
        setComparando(false);
        const userWithPass = { ...usuarioData, loginPass: pass };
        sessionStorage.setItem('user', JSON.stringify(userWithPass));
        navigate('/home');
      }
    } catch (err) {
      console.error('Error durante comparación facial:', err);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <img src={loginImage} alt="Login" className="login-image" />
        <div>
          <h2 className="login-title">Iniciar Sesión</h2>
          <form>
            <input
              type="text"
              className="input"
              placeholder="Correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              className="input"
              placeholder="Contraseña"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <button onClick={handleFaceLogin} className="button">Iniciar con Face ID</button>
              <button onClick={handleCorreoLogin} className="button">Iniciar con Código</button>
            </div>
          </form>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          {showCamera && (
            <div className="camera-container">
              <p>Detectando rostro... por favor mira a la cámara</p>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                width={320}
                height={240}
                videoConstraints={{ facingMode: 'user' }}
              />
            </div>
          )}

          {comparando && (
            <div className="comparing-message">
              <p>Comparando rostros, por favor espera...</p>
            </div>
          )}

          {modalVisible && (
            <div className="modal">
              <div className="modal-content">
                <h3>Ingresa el código enviado a tu correo</h3>
                <input
                  type="text"
                  value={codigoIngresado}
                  onChange={(e) => setCodigoIngresado(e.target.value)}
                  placeholder="Código de 6 dígitos"
                />
                <div style={{ marginTop: '10px' }}>
                  <button onClick={verificarCodigoLogin} className="button">Verificar Código</button>
                  <button onClick={() => setModalVisible(false)} className="button">Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
