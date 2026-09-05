import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Inicio from "./pages/Inicio";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import GlyphTrail from "./components/GlyphTrail";

import {
  TransitionProvider,
} from "./components/TransitionContext.jsx";

import {
  estaAutenticado,
} from "./services/authService";

function RutaProtegida({ children }) {
  if (!estaAutenticado()) {
    return (
      <Navigate
        to="/login"
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
      </Routes>
    </TransitionProvider>
  );
}

export default App;