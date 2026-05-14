/**
 * scripts/main.js
 * Lógica del cliente para el Filtro de Números.
 *
 * Módulos:
 *  - theme   : manejo de tema claro / oscuro con localStorage
 *  - upload  : validación y envío del formulario
 *  - render  : renderizado de resultados
 *  - scroll  : botón de volver arriba
 */

document.addEventListener("DOMContentLoaded", () => {

    // ── Referencias del DOM ──────────────────────────────────────────────────
    const els = {
        themeToggle:    document.getElementById("themeToggle"),
        themeStylesheet: document.getElementById("theme-stylesheet"),

        uploadForm:     document.getElementById("uploadForm"),
        fileInput:      document.getElementById("fileInput"),
        fileError:      document.getElementById("fileError"),
        submitBtn:      document.getElementById("submitBtn"),
        submitSpinner:  document.getElementById("submitSpinner"),
        submitLabel:    document.getElementById("submitLabel"),

        uploadCard:     document.getElementById("uploadCard"),
        resultsCard:    document.getElementById("resultsCard"),
        successToast:   document.getElementById("successToast"),

        totalCount:     document.getElementById("totalCount"),
        usefulCount:    document.getElementById("usefulCount"),
        nonUsefulCount: document.getElementById("nonUsefulCount"),
        percentage:     document.getElementById("percentage"),

        numberList:     document.getElementById("numberList"),
        factorialList:  document.getElementById("factorialList"),

        downloadBtn:    document.getElementById("downloadBtn"),
        newUploadBtn:   document.getElementById("newUploadBtn"),
        backToTop:      document.getElementById("backToTop"),
    };

    // ── Módulo: Tema ─────────────────────────────────────────────────────────

    const STORAGE_KEY = "numfilter_theme";
    const DARK  = "dark";
    const LIGHT = "light";

    /**
     * Aplica un tema y lo persiste en localStorage.
     * @param {"light"|"dark"} theme
     */
    function setTheme(theme) {
        els.themeStylesheet.href = theme === DARK
            ? "/styles/dark.css"
            : "/styles/light.css";

        els.themeToggle.checked = theme === DARK;
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }

    // Inicializar tema
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(savedTheme ?? (systemDark ? DARK : LIGHT));

    els.themeToggle.addEventListener("change", () => {
        setTheme(els.themeToggle.checked ? DARK : LIGHT);
    });

    // ── Módulo: Validación de archivo ────────────────────────────────────────

    const MAX_SIZE_MB = 5;
    const MAX_SIZE_B  = MAX_SIZE_MB * 1024 * 1024;

    /**
     * Valida el archivo seleccionado.
     * @param {File|undefined} file
     * @returns {string|null} Mensaje de error o null si es válido.
     */
    function validateFile(file) {
        if (!file) return "Debés seleccionar un archivo.";

        if (!file.name.toLowerCase().endsWith(".txt")) {
            return "El archivo debe tener extensión .txt.";
        }

        if (file.size > MAX_SIZE_B) {
            return `El archivo supera el límite de ${MAX_SIZE_MB} MB.`;
        }

        if (file.size === 0) {
            return "El archivo está vacío.";
        }

        return null;
    }

    /**
     * Muestra u oculta el mensaje de error del input de archivo.
     * @param {string|null} message - null para limpiar el error.
     */
    function setFileError(message) {
        if (message) {
            els.fileInput.classList.add("is-invalid");
            els.fileError.textContent = message;
            els.fileError.classList.remove("d-none");
        } else {
            els.fileInput.classList.remove("is-invalid");
            els.fileError.textContent = "";
            els.fileError.classList.add("d-none");
        }
    }

    // Validación en tiempo real al cambiar el archivo
    els.fileInput.addEventListener("change", () => {
        const error = validateFile(els.fileInput.files[0]);
        setFileError(error);
    });

    // ── Módulo: Upload / Submit ───────────────────────────────────────────────

    /**
     * Bloquea el botón de envío y muestra el spinner.
     * @param {boolean} loading
     */
    function setSubmitting(loading) {
        els.submitBtn.disabled = loading;

        if (loading) {
            els.submitSpinner.classList.remove("d-none");
            els.submitLabel.textContent = "Procesando…";
        } else {
            els.submitSpinner.classList.add("d-none");
            els.submitLabel.textContent = "Procesar archivo";
        }
    }

    els.uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const file  = els.fileInput.files[0];
        const error = validateFile(file);

        if (error) {
            setFileError(error);
            return;
        }

        setFileError(null);
        setSubmitting(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/upload", {
                method: "POST",
                body:   formData
            });

            const data = await response.json();

            if (!data.success) {
                setFileError(data.error ?? "Error desconocido al procesar el archivo.");
                return;
            }

            showResults(data);

        } catch {
            setFileError("Error de conexión con el servidor. Revisá tu red e intentá de nuevo.");
        } finally {
            setSubmitting(false);
        }
    });

    // ── Módulo: Renderizado de resultados ────────────────────────────────────

    /**
     * Muestra la tarjeta de resultados con los datos recibidos del servidor.
     * @param {object} data - Respuesta del servidor
     */
    function showResults(data) {
        els.uploadCard.classList.add("d-none");
        els.resultsCard.classList.remove("d-none");

        els.totalCount.textContent     = data.total;
        els.usefulCount.textContent    = data.useful;
        els.nonUsefulCount.textContent = data.nonUseful;
        els.percentage.textContent     = `${data.percentage}%`;

        renderBadges(els.numberList,    data.usefulNumbers,    "badge-number",   "No se encontraron números útiles.");
        renderBadges(els.factorialList, data.factorialNumbers, "badge-factorial","No se encontraron factoriales.");

        els.downloadBtn.href = data.downloadUrl;

        showSuccessToast();

        setTimeout(() => {
            els.resultsCard.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    }

    /**
     * Renderiza una lista de números como badges dentro de un contenedor.
     * @param {HTMLElement} container
     * @param {number[]}    numbers
     * @param {string}      badgeClass
     * @param {string}      emptyMsg
     */
    function renderBadges(container, numbers, badgeClass, emptyMsg) {
        if (!numbers || numbers.length === 0) {
            container.innerHTML = `<span class="empty-msg">${emptyMsg}</span>`;
            return;
        }

        container.innerHTML = numbers
            .map(num => `<span class="num-badge ${badgeClass}">${num}</span>`)
            .join("");
    }

    /**
     * Muestra el toast de éxito con animación de entrada y salida.
     */
    function showSuccessToast() {
        const toast = els.successToast;
        toast.classList.add("toast-visible");

        setTimeout(() => {
            toast.classList.remove("toast-visible");
        }, 3000);
    }

    // ── Módulo: Nuevo archivo ────────────────────────────────────────────────

    els.newUploadBtn.addEventListener("click", () => {
        els.uploadForm.reset();
        setFileError(null);

        els.numberList.innerHTML    = `<span class="empty-msg">No hay números</span>`;
        els.factorialList.innerHTML = `<span class="empty-msg">No hay factoriales</span>`;
        els.downloadBtn.href        = "#";

        els.resultsCard.classList.add("d-none");
        els.uploadCard.classList.remove("d-none");

        // Esperar a que el DOM actualice antes de hacer scroll
        setTimeout(() => {
            els.uploadCard.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);

        els.backToTop.classList.add("d-none");
    });

    // ── Módulo: Scroll / Volver arriba ───────────────────────────────────────

    window.addEventListener("scroll", () => {
        if (window.scrollY > 400) {
            els.backToTop.classList.remove("d-none");
        } else {
            els.backToTop.classList.add("d-none");
        }
    }, { passive: true });

    els.backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

});