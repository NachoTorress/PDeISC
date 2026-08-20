import { useState } from "react";
import Contador from "./components/Contador";
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
            <Contador />
        </div>
    );
}

export default App;
