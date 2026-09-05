import { useEffect, useRef } from "react";
import "../styles/effects.css";

function GlyphTrail() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const touchDevice = window.matchMedia(
      "(pointer: coarse)"
    ).matches;

    if (reduceMotion || touchDevice) {
      return undefined;
    }

    let animationFrame;

    let width = window.innerWidth;
    let height = window.innerHeight;

    let dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    const particles = [];

    let lastX = -100;
    let lastY = -100;
    let particleIndex = 0;

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      dpr = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );
    };

    const crearParticula = (x, y) => {
      particleIndex += 1;

      particles.push({
        x,
        y,

        vx:
          (Math.random() - 0.5) *
          0.7,

        vy:
          (Math.random() - 0.5) *
          0.7,

        size:
          3 +
          Math.random() *
          5,

        life: 1,

        rotation:
          Math.random() *
          Math.PI,

        rotationSpeed:
          (Math.random() - 0.5) *
          0.035,

        shape:
          particleIndex % 3,

        accent:
          particleIndex % 7 === 0,
      });

      if (particles.length > 75) {
        particles.shift();
      }
    };

    const manejarMouse = (event) => {
      const distancia = Math.hypot(
        event.clientX - lastX,
        event.clientY - lastY
      );

      if (distancia < 7) {
        return;
      }

      lastX = event.clientX;
      lastY = event.clientY;

      crearParticula(
        event.clientX,
        event.clientY
      );

      if (distancia > 28) {
        crearParticula(
          event.clientX +
            (Math.random() - 0.5) *
              10,

          event.clientY +
            (Math.random() - 0.5) *
              10
        );
      }
    };

    const dibujarParticula = (
      particula
    ) => {
      ctx.save();

      ctx.translate(
        particula.x,
        particula.y
      );

      ctx.rotate(
        particula.rotation
      );

      ctx.globalAlpha =
        Math.max(
          particula.life,
          0
        );

      ctx.strokeStyle =
        particula.accent
          ? "#d9b45b"
          : "#55f5e7";

      ctx.fillStyle =
        particula.accent
          ? "#d9b45b"
          : "#55f5e7";

      ctx.lineWidth = 1;

      const size =
        particula.size;

      if (particula.shape === 0) {
        ctx.beginPath();

        ctx.moveTo(
          0,
          -size
        );

        ctx.lineTo(
          size,
          0
        );

        ctx.lineTo(
          0,
          size
        );

        ctx.lineTo(
          -size,
          0
        );

        ctx.closePath();

        ctx.stroke();
      }

      if (particula.shape === 1) {
        ctx.beginPath();

        ctx.arc(
          0,
          0,
          size * 0.35,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.beginPath();

        ctx.arc(
          0,
          0,
          size,
          0,
          Math.PI * 2
        );

        ctx.globalAlpha =
          particula.life *
          0.18;

        ctx.stroke();
      }

      if (particula.shape === 2) {
        ctx.beginPath();

        ctx.moveTo(
          -size,
          -size
        );

        ctx.lineTo(
          size,
          -size
        );

        ctx.lineTo(
          size,
          0
        );

        ctx.lineTo(
          0,
          0
        );

        ctx.lineTo(
          0,
          size
        );

        ctx.lineTo(
          -size,
          size
        );

        ctx.stroke();
      }

      ctx.restore();
    };

    const animar = () => {
      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      for (
        let i =
          particles.length - 1;
        i >= 0;
        i -= 1
      ) {
        const particle =
          particles[i];

        particle.x +=
          particle.vx;

        particle.y +=
          particle.vy;

        particle.vx *= 0.985;
        particle.vy *= 0.985;

        particle.rotation +=
          particle.rotationSpeed;

        particle.life -=
          0.022;

        dibujarParticula(
          particle
        );

        if (
          particle.life <= 0
        ) {
          particles.splice(
            i,
            1
          );
        }
      }

      animationFrame =
        requestAnimationFrame(
          animar
        );
    };

    resizeCanvas();

    window.addEventListener(
      "resize",
      resizeCanvas
    );

    window.addEventListener(
      "pointermove",
      manejarMouse
    );

    animar();

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      window.removeEventListener(
        "resize",
        resizeCanvas
      );

      window.removeEventListener(
        "pointermove",
        manejarMouse
      );
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="glyph-trail-canvas"
      aria-hidden="true"
    />
  );
}

export default GlyphTrail;