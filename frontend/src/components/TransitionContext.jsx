import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import PageTransition from "./PageTransition";
import { TransitionContext } from "./transitionContext";

export function TransitionProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [phase, setPhase] = useState("idle");

  const bloqueado = useRef(false);
  const navegacionControlada = useRef(false);
  const rutaAnterior = useRef(location.pathname);

  const timerCierre = useRef(null);
  const timerApertura = useRef(null);
  const timerHistorial = useRef(null);

  const limpiarTimers = () => {
    clearTimeout(timerCierre.current);
    clearTimeout(timerApertura.current);
    clearTimeout(timerHistorial.current);
  };

  useEffect(() => {
    return () => {
      limpiarTimers();
    };
  }, []);

  /*
   * Detecta cambios que NO fueron iniciados con irA().
   * Aquí entran las flechas Atrás / Adelante del navegador.
   */
  useLayoutEffect(() => {
    if (rutaAnterior.current === location.pathname) {
      return;
    }

    rutaAnterior.current = location.pathname;

    if (navegacionControlada.current) {
      navegacionControlada.current = false;
      return;
    }

    limpiarTimers();

    bloqueado.current = true;

    /*
     * La nueva ruta ya existe internamente,
     * pero la cubrimos y después la revelamos.
     */
    setPhase("history");

    timerHistorial.current = window.setTimeout(() => {
      setPhase("idle");
      bloqueado.current = false;
    }, 700);
  }, [location.pathname]);

  const irA = useCallback(
    (ruta) => {
      if (
        bloqueado.current ||
        ruta === location.pathname
      ) {
        return;
      }

      limpiarTimers();

      bloqueado.current = true;

      // FASE 1: cubrir la pantalla actual
      setPhase("closing");

      timerCierre.current = window.setTimeout(() => {
        /*
         * Indicamos que este cambio fue iniciado
         * por nuestra navegación controlada.
         */
        navegacionControlada.current = true;

        // Cambiar ruta mientras la pantalla está cubierta
        navigate(ruta);

        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "auto",
        });

        // FASE 2: revelar la nueva pantalla
        setPhase("opening");

        timerApertura.current = window.setTimeout(() => {
          setPhase("idle");
          bloqueado.current = false;
        }, 700);
      }, 650);
    },
    [location.pathname, navigate]
  );

  return (
    <TransitionContext.Provider
      value={{
        irA,
        transicionActiva: phase !== "idle",
      }}
    >
      {children}

      <PageTransition phase={phase} />
    </TransitionContext.Provider>
  );
}