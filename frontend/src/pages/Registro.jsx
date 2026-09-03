import { useState } from "react";
import { registrarEstudiante } from "../services/authService";
import "../styles/registro.css";

export default function Registro() {
  const [formulario, setFormulario] = useState({
    nombreCompleto: '',
    carnet: '',
    correo: '',
    password: '',
    universidadId: ''
  });
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(false);

  const validarCarnet = (carnet, universidadId) => {
    const formatos = {
     1: /^\d{10,11}$/,
      2: /^\d{8}$/, 
      3: /^\d{7}$/, 
      4: /^\d{8}$/, 
      5: /^\d{6}$/, 
      6: /^\d{6}$/, 
      7: /^\d{8}$/, 
      8: /^\d{7}$/, 
      9: /^\d{8}$/, 
      10: /^\d{9}$/, 
      11: /^\d{7}$/, 
      12: /^\d{8}$/, 
    }

    if (!universidadId) return false;
    const regex = formatos[universidadId];
    return regex? regex.test(carnet) : true;
  }

  
  const getFormatoAyuda = () => {
    const ayudas = {
      1: 'Ej: 22942313756 - 11  u 12 dígitos',
      2: 'Ej: 202012345 - 8 dígitos',
      3: 'Ej: 2312345 - 7 dígitos',
      4: 'Ej: 21012345 - 8 dígitos',
      5: 'Ej: 123456 - 6 dígitos',
      6: 'Ej: 123456 - 6 dígitos',
      7: 'Ej: 20210001 - 8 dígitos',
      8: 'Ej: 1234567 - 7 dígitos',
      9: 'Ej: 20200001 - 8 dígitos',
      10: 'Ej: 202300001 - 9 dígitos',
      11: 'Ej: 1234567 - 7 dígitos',
      12: 'Ej: 20201234 - 8 dígitos',
    }
    return ayudas[formulario.universidadId] || 'Selecciona una universidad primero';
  }

  const actualizarCampo = (e) => {
    setFormulario({
     ...formulario,
      [e.target.name]: e.target.value
    });
  }

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setCargando(true);

    
    if (!formulario.nombreCompleto ||!formulario.carnet ||!formulario.correo ||!formulario.password ||!formulario.universidadId) {
      setError('Todos los campos son obligatorios');
      setCargando(false);
      return;
    }

   
    if (!validarCarnet(formulario.carnet, Number(formulario.universidadId))) {
      setError('El formato del carnet no es válido para la universidad seleccionada');
      setCargando(false);
      return;
    }

    try {
      await registrarEstudiante(formulario);
      setExito('Registro exitoso! Ya puedes iniciar sesión.');
      setFormulario({
        nombreCompleto: '',
        carnet: '',
        correo: '',
        password: '',
        universidadId: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="registro-page">
      <div className="tech-grid"></div>
      <div className="registro-layout">
        
        <div className="registro-info">
          <div className="system-marker">
            <span></span> SISTEMA DE BECAS
          </div>
          <h1>
            REGISTRO <strong>ESTUDIANTIL</strong>
          </h1>
          <p>Únete para acceder a convocatorias, beneficios y seguimiento de tus solicitudes de beca.</p>
        </div>

        <div className="registro-card">
          <div className="corner corner-top-left"></div>
          <div className="corner corner-bottom-right"></div>

          <div className="registro-header">
            <span className="status-dot"></span>
            <p>ACTIVO</p>
            <h2>Crear Cuenta</h2>
            <span>Completa tus datos para comenzar</span>
          </div>

          <form onSubmit={manejarSubmit}>
            <div className="campo">
              <label htmlFor="nombreCompleto">NOMBRE COMPLETO</label>
              <input
                type="text"
                id="nombreCompleto"
                name="nombreCompleto"
                value={formulario.nombreCompleto}
                onChange={actualizarCampo}
                placeholder="Juan Pérez"
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="universidadId">UNIVERSIDAD</label>
              <select
                id="universidadId"
                name="universidadId"
                value={formulario.universidadId}
                onChange={actualizarCampo}
                required
              >
                <option value="">Selecciona tu universidad</option>
                <option value="1">UMG - Universidad Mariano Gálvez</option>
                <option value="2">USAC - Universidad de San Carlos</option>
                <option value="3">UVG - Universidad del Valle</option>
                <option value="4">URL - Universidad Rafael Landívar</option>
                <option value="5">UFM - Universidad Francisco Marroquín</option>
                <option value="6">UGAL - Universidad Galileo</option>
                <option value="7">UPANA - Universidad Panamericana</option>
                <option value="8">UMES - Universidad Mesoamericana</option>
                <option value="9">UDAV - Universidad Da Vinci</option>
                <option value="10">URURAL - Universidad Rural</option>
                <option value="11">USPG - Universidad San Pablo</option>
                <option value="12">UNIS - Universidad del Istmo</option>
              </select>
            </div>

            <div className="campo">
              <label htmlFor="carnet">CARNET</label>
              <input
                type="text"
                id="carnet"
                name="carnet"
                value={formulario.carnet}
                onChange={actualizarCampo}
                placeholder="Ingresa tu carnet"
                required
              />
              <small className="muted">{getFormatoAyuda()}</small>
            </div>

            <div className="campo">
              <label htmlFor="correo">CORREO</label>
              <input
                type="email"
                id="correo"
                name="correo"
                value={formulario.correo}
                onChange={actualizarCampo}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="password">CONTRASEÑA</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formulario.password}
                onChange={actualizarCampo}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            {error && <div className="mensaje error">{error}</div>}
            {exito && <div className="mensaje exito">{exito}</div>}

            <button type="submit" disabled={cargando}>
              {cargando? 'REGISTRANDO...' : 'REGISTRARSE'}
              <span>→</span>
            </button>
          </form>

          <p className="login-text">
            ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
          </p>
        </div>
      </div>
    </div>
  );
}