import "./ThemeButton.css";

type ThemeButtonProps = {
    modoOscuro: boolean;
    cambiarTema: () => void;
};

/**
 * ThemeButton
 * Boton flotante que alterna entre modo claro y oscuro.
 * Muestra un icono de sol o luna segun el tema activo.
 */
function ThemeButton({ modoOscuro, cambiarTema }: ThemeButtonProps) {
    return (
        <button
            className="theme-button"
            onClick={cambiarTema}
            aria-label="Cambiar tema"
        >
            {modoOscuro ? "☀️" : "🌙"}
        </button>
    );
}

export default ThemeButton;
