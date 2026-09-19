/**
 * ScrollToTopButton.jsx
 * -----------------------------------------------------------------------
 * De donde viene: se usa en `App.jsx`, visible en todas las páginas.
 * A donde va: no depende de otros módulos; solo interactúa con el
 *   `window` del navegador.
 * -----------------------------------------------------------------------
 * Botón flotante que aparece al scrollear hacia abajo y permite volver
 * arriba del todo con una animación suave. Requisito explícito de la
 * consigna para páginas largas, especialmente en modo celular.
 */

import { useEffect, useState } from "react";

const UMBRAL_SCROLL_PX = 300;

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const manejarScroll = () => {
      setVisible(window.scrollY > UMBRAL_SCROLL_PX);
    };
    window.addEventListener("scroll", manejarScroll);
    return () => window.removeEventListener("scroll", manejarScroll);
  }, []);

  const subirArriba = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      className="scroll-top-btn"
      onClick={subirArriba}
      aria-label="Volver arriba"
      title="Volver arriba"
    >
      ↑
    </button>
  );
}

export default ScrollToTopButton;
