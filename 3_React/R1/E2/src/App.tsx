import { useState } from "react";
import Tarjeta from "./components/Tarjeta";
import ThemeButton from "./components/ThemeButton";
import fotoNacho from "./assets/Nacho.jpeg";
import "./App.css";

function App() {
    const [modoOscuro, setModoOscuro] = useState(false);

    function cambiarTema() {
        setModoOscuro((anterior) => !anterior);
    }

    return (
        <div className={`pantalla ${modoOscuro ? "dark" : "light"}`}>
            <ThemeButton modoOscuro={modoOscuro} cambiarTema={cambiarTema} />

            <Tarjeta
                nombre="Ignacio"
                apellido="Torres"
                profesion="Estudiante"
                imagen={fotoNacho}
            />
        </div>
    );
}

export default App;
