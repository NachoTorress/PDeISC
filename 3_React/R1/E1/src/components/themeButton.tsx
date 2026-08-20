import "./ThemeButton.css";

type ThemeButtonProps = {
    cambiarTema: () => void;
};

function ThemeButton({ cambiarTema }: ThemeButtonProps) {
    return (
        <button className="theme-button" onClick={cambiarTema}>
            Cambiar tema
        </button>
    );
}

export default ThemeButton;