import { useState } from "react";
import FormularioNombre from "./components/FormularioNombre";
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
            <FormularioNombre />
        </div>
    );
}

export default App;
