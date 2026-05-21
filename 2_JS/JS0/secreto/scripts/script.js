const PORT = 3020;

document.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("btnDescifrar");

    const input = document.getElementById("inputTexto");

    const output = document.getElementById("resultado");

    const errorCont = document.getElementById("errorContainer");

    const errorMsg = document.getElementById("errorMsg");

    // =========================
    // MODO OSCURO
    // =========================

    const themeToggle = document.getElementById("themeToggle");

    const html = document.documentElement;

    function updateThemeButton(theme) {

        if (theme === "dark") {

            themeToggle.textContent = "☀️ Modo claro";

            themeToggle.classList.remove("btn-dark");

            themeToggle.classList.add("btn-light");

        } else {

            themeToggle.textContent = "🌙 Modo oscuro";

            themeToggle.classList.remove("btn-light");

            themeToggle.classList.add("btn-dark");

        }

    }

    const savedTheme =
        localStorage.getItem("theme") || "light";

    html.setAttribute("data-theme", savedTheme);

    updateThemeButton(savedTheme);

    themeToggle.addEventListener("click", () => {

        const currentTheme =
            html.getAttribute("data-theme");

        const newTheme =
            currentTheme === "light"
                ? "dark"
                : "light";

        html.setAttribute("data-theme", newTheme);

        localStorage.setItem("theme", newTheme);

        updateThemeButton(newTheme);

    });

    // =========================
    // DECODIFICADOR
    // =========================

    function invertirParentesis(texto) {

        let regex = /\(([^()]*)\)/;

        let resultado = texto;

        while (regex.test(resultado)) {

            resultado = resultado.replace(
                regex,
                (match, contenido) => {

                    return contenido
                        .split("")
                        .reverse()
                        .join("");

                }
            );

        }

        return resultado;

    }

    btn.addEventListener("click", () => {

        const texto = input.value.trim();

        errorCont.classList.add("d-none");

        if (!texto) {

            output.innerHTML = `
                <span class="placeholder-result">
                    El resultado aparecerá aquí...
                </span>
            `;

            output.classList.remove("border-success-custom");

            return;

        }

        // =========================
        // VALIDACIÓN
        // =========================

        const balance =
            (texto.split("(").length - 1) ===
            (texto.split(")").length - 1);

        if (!balance) {

            errorMsg.textContent =
                "Error: Paréntesis mal balanceados.";

            errorCont.classList.remove("d-none");

            return;

        }

        // =========================
        // DESCIFRADO
        // =========================

        const descifrado =
            invertirParentesis(texto);

        output.textContent = descifrado;

        output.classList.add(
            "border-success-custom"
        );

    });

});

console.log(
    `Aplicación inicializada en el puerto: ${PORT}`
);