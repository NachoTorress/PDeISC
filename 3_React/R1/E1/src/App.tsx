import { useState } from "react";
import HolaMundo from "./components/holaMundo";
import ThemeButton from "./components/themeButton";
import "./App.css";

function App() {
    const [darkMode, setDarkMode] = useState(false);

    function cambiarTema() {
        setDarkMode(!darkMode);
    }

    return (
        <div className={darkMode ? "dark" : "light"}>
            <ThemeButton cambiarTema={cambiarTema} />
            <HolaMundo />
            
        </div>
    );
}

export default App;