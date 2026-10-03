import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Inicio from "./pages/Inicio.jsx";
import Registro from "./pages/Registro.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Convocatorias from "./pages/Convocatorias.jsx";
import SolicitudBeca from "./pages/SolicitudBeca.jsx";
import MisSolicitudes from "./pages/MisSolicitudes.jsx";
import DetalleSolicitud from "./pages/DetalleSolicitud.jsx";

import GestionConvocatorias from "./pages/admin/GestionConvocatorias.jsx";
import PanelEvaluador from "./pages/admin/PanelEvaluador.jsx";
import EvaluarSolicitud from "./pages/admin/EvaluarSolicitud.jsx";
import ReportesEstadisticas from "./pages/admin/ReportesEstadisticas.jsx";

import GlyphTrail from "./components/GlyphTrail.jsx";

import {
  TransitionProvider,
} from "./components/TransitionContext.jsx";

import {
  estaAutenticado,
  obtenerSesion,
} from "./services/authService.js";

function RutaProtegida({
  children,
  soloAdministrador = false,
  soloEstudiante = false,
}) {
  if (!estaAutenticado()) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const rol =
    obtenerSesion()?.rol;

  if (
    soloAdministrador &&
    rol !== "ADMINISTRADOR"
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  if (
    soloEstudiante &&
    rol !== "ESTUDIANTE"
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

function App() {
  return (
    <TransitionProvider>
      <GlyphTrail />

      <Routes>
        <Route
          path="/"
          element={<Inicio />}
        />

        <Route
          path="/registro"
          element={<Registro />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={
            <RutaProtegida>
              <Dashboard />
            </RutaProtegida>
          }
        />

        <Route
          path="/convocatorias"
          element={
            <RutaProtegida>
              <Convocatorias />
            </RutaProtegida>
          }
        />

        <Route
          path="/convocatorias/:id/solicitar"
          element={
            <RutaProtegida soloEstudiante>
              <SolicitudBeca />
            </RutaProtegida>
          }
        />

        <Route
          path="/mis-solicitudes"
          element={
            <RutaProtegida soloEstudiante>
              <MisSolicitudes />
            </RutaProtegida>
          }
        />

        <Route
          path="/mis-solicitudes/:id"
          element={
            <RutaProtegida soloEstudiante>
              <DetalleSolicitud />
            </RutaProtegida>
          }
        />

        <Route
          path="/admin/panel-evaluador"
          element={
            <RutaProtegida soloAdministrador>
              <PanelEvaluador />
            </RutaProtegida>
          }
        />

        <Route
          path="/admin/panel-evaluador/solicitudes/:id"
          element={
            <RutaProtegida soloAdministrador>
              <EvaluarSolicitud />
            </RutaProtegida>
          }
        />

        <Route
          path="/admin/reportes"
          element={
            <RutaProtegida soloAdministrador>
              <ReportesEstadisticas />
            </RutaProtegida>
          }
        />

        <Route
          path="/admin/convocatorias"
          element={
            <RutaProtegida soloAdministrador>
              <GestionConvocatorias />
            </RutaProtegida>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </TransitionProvider>
  );
}

export default App;