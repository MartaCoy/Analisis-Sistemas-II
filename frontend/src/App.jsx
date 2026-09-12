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

import GestionConvocatorias from "./pages/admin/GestionConvocatorias.jsx";

import GlyphTrail from "./components/GlyphTrail.jsx";

import {
  TransitionProvider,
} from "./components/TransitionContext.jsx";

import {
  estaAutenticado,
  obtenerSesion,
} from "./services/authService.js";

/*
 * Controla qué pantalla se muestra según la sesión.
 * Los permisos reales de cada petición los valida el backend.
 */
function RutaProtegida({
  children,
  soloAdministrador = false,
}) {
  if (!estaAutenticado()) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    soloAdministrador &&
    obtenerSesion()?.rol !== "ADMINISTRADOR"
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