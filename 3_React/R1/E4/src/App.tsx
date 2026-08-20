import { useState } from "react";
import ListaTareas from "./components/ListaTareas";
import ThemeButton from "./components/ThemeButton";
import SubirArriba from "./components/SubirArriba";
import "./App.css";

function App() {
    const [modoOscuro, setModoOscuro] = useState(false);

    function cambiarTema() {
        setModoOscuro((anterior) => !anterior);
    }

    return (
        <div className={`pantalla ${modoOscuro ? "dark" : "light"}`}>
            <ThemeButton modoOscuro={modoOscuro} cambiarTema={cambiarTema} />
            <ListaTareas />
            <SubirArriba />
        </div>
    );
}

export default App;