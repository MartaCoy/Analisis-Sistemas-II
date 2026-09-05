import { usePageTransition } from "./usePageTransition";
function TransitionLink({
  to,
  children,
  className,
}) {
  const {
    irA,
    transicionActiva,
  } = usePageTransition();

  const manejarClick = (event) => {
    event.preventDefault();

    if (!transicionActiva) {
      irA(to);
    }
  };

  return (
    <a
      href={to}
      className={className}
      onClick={manejarClick}
      aria-disabled={transicionActiva}
    >
      {children}
    </a>
  );
}

export default TransitionLink;