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
    // ─────────────────────────────────────────────────────────────────────────────
// BLOQUE: Historial de Resultados
// Pegá esto al FINAL del DOMContentLoaded de main.js, antes del último });
// ─────────────────────────────────────────────────────────────────────────────

    // ── Módulo: Historial ────────────────────────────────────────────────────

    const histEls = {
        loading:    document.getElementById('historyLoading'),
        empty:      document.getElementById('historyEmpty'),
        error:      document.getElementById('historyError'),
        list:       document.getElementById('historyList'),
        items:      document.getElementById('historyItems'),
        badge:      document.getElementById('historyBadge'),
        refreshBtn: document.getElementById('refreshHistoryBtn'),
    };

    /**
     * Formatea bytes a cadena legible.
     * @param {number} bytes
     * @returns {string}
     */
    function formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    /**
     * Formatea fecha ISO a "DD/MM/AAAA HH:MM".
     * @param {string} iso
     * @returns {string}
     */
    function formatHistoryDate(iso) {
        const d    = new Date(iso);
        const dd   = String(d.getDate()).padStart(2, '0');
        const mm   = String(d.getMonth() + 1).padStart(2, '0');
        const aaaa = d.getFullYear();
        const hh   = String(d.getHours()).padStart(2, '0');
        const min  = String(d.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${aaaa} ${hh}:${min}`;
    }

    /**
     * Calcula el tiempo restante antes de que el archivo expire.
     * @param {string} iso - Fecha de modificación del archivo
     * @returns {string}
     */
    function timeUntilExpiry(iso) {
        const age     = Date.now() - new Date(iso).getTime();
        const remaining = 10 * 60 * 1000 - age; // 10 min en ms
        if (remaining <= 0) return 'expirado';
        const mins = Math.ceil(remaining / 60000);
        return `expira en ${mins} min`;
    }

    /**
     * Genera el HTML de una fila del historial.
     * @param {{ nombre: string, fecha: string, tamaño: number, expirado: boolean }} archivo
     * @returns {string}
     */
    function buildHistoryItemHTML(archivo) {
        const expiry = timeUntilExpiry(archivo.fecha);
        const isExpired = expiry === 'expirado';

        return `
            <div class="col-12 col-md-6">
                <div class="history-item ${isExpired ? 'history-item-expired' : ''}">
                    <div class="history-item-info">
                        <span class="history-item-icon">📄</span>
                        <div>
                            <p class="history-item-name">${archivo.nombre}</p>
                            <span class="history-item-meta">
                                ${formatHistoryDate(archivo.fecha)}
                                · ${formatSize(archivo.tamaño)}
                                · <span class="history-expiry ${isExpired ? 'expired' : ''}">${expiry}</span>
                            </span>
                        </div>
                    </div>
                    ${isExpired
                        ? `<span class="btn-history-dl disabled" aria-disabled="true" title="Archivo expirado">✕</span>`
                        : `<a
                                href="/redescargar/${encodeURIComponent(archivo.nombre)}"
                                download="${archivo.nombre}"
                                class="btn-history-dl"
                                aria-label="Volver a descargar ${archivo.nombre}"
                                title="Volver a descargar"
                            >⬇</a>`
                    }
                </div>
            </div>
        `;
    }

    /**
     * Controla qué estado del panel se muestra.
     * @param {'loading'|'empty'|'error'|'list'} state
     * @param {Array} [items]
     */
    function renderHistoryState(state, items = []) {
        histEls.loading.classList.add('d-none');
        histEls.empty.classList.add('d-none');
        histEls.error.classList.add('d-none');
        histEls.list.classList.add('d-none');

        if (state === 'loading') {
            histEls.loading.classList.remove('d-none');

        } else if (state === 'empty') {
            histEls.empty.classList.remove('d-none');
            histEls.badge.classList.add('d-none');

        } else if (state === 'error') {
            histEls.error.classList.remove('d-none');
            histEls.badge.classList.add('d-none');

        } else if (state === 'list') {
            histEls.items.innerHTML = items.map(buildHistoryItemHTML).join('');
            histEls.list.classList.remove('d-none');
            histEls.badge.textContent = items.length;
            histEls.badge.classList.remove('d-none');
        }
    }

    /**
     * Obtiene la lista de resultados del servidor.
     */
    async function loadHistory() {
        renderHistoryState('loading');
        try {
            const res  = await fetch('/listar-resultados');
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Error del servidor');

            if (data.archivos.length === 0) {
                renderHistoryState('empty');
            } else {
                renderHistoryState('list', data.archivos);
            }
        } catch (err) {
            console.error('[historial] Error:', err);
            renderHistoryState('error');
        }
    }

    // Refresca el historial automáticamente luego de cada procesamiento exitoso
    // Extendemos showResults para que lo llame después de renderizar
    const _originalShowResults = showResults;
    // No podemos wrappear showResults fácilmente porque es declarada con function,
    // así que usamos el botón de descarga como señal: cuando aparece el card de
    // resultados (lo detectamos con MutationObserver sobre resultsCard).

    const resultsObserver = new MutationObserver(() => {
        if (!els.resultsCard.classList.contains('d-none')) {
            setTimeout(loadHistory, 500);
        }
    });
    resultsObserver.observe(els.resultsCard, { attributes: true, attributeFilter: ['class'] });

    // Botón de actualizar manual
    histEls.refreshBtn.addEventListener('click', loadHistory);

    // Carga inicial
    loadHistory();
});