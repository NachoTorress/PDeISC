import { useState } from "react";
import Tateti from "./components/Tateti";
import ThemeButton from "./components/ThemeButton";
import "./App.css";

function App() {
    const [modoOscuro, setModoOscuro] = useState(false);

    function cambiarTema() {
        setModoOscuro((anterior) => !anterior);
    }

    return (
        <div className={`pantalla ${modoOscuro ? "dark" : "light"}`}>
            <ThemeButton modoOscuro={modoOscuro} cambiarTema={cambiarTema} />
            <Tateti />
        </div>
    );
}

export default App;
