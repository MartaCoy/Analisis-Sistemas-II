import { useContext } from "react";
import { TransitionContext } from "./transitionContext";

export function usePageTransition() {
  const context = useContext(TransitionContext);

  if (!context) {
    throw new Error(
      "usePageTransition debe utilizarse dentro de TransitionProvider"
    );
  }

  return context;
}