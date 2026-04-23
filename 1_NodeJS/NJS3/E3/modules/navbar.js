/**
 * Módulo Navbar Modular
 * Genera el menú de navegación y activa los componentes de Bootstrap.
 */
export function renderNavbar() {
    // 1. Definimos el HTML del Navbar
    const navHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm mb-4">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="/">
                <span class="fs-4 me-2">🛠️</span> 
                <span class="fw-bold">MultiTool App</span>
            </a>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" 
                    aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item"><a class="nav-link" href="/">Inicio</a></li>
                    <li class="nav-item"><a class="nav-link" href="/calculadora">Calculadora</a></li>
                    <li class="nav-item"><a class="nav-link" href="/generador">Passwords</a></li>
                    <li class="nav-item"><a class="nav-link" href="/reloj">Cronómetro</a></li>
                    <li class="nav-item"><a class="nav-link" href="/tareas">Tareas</a></li>
                    <li class="nav-item"><a class="nav-link" href="/conversor">Conversor</a></li>
                </ul>
            </div>
        </div>
    </nav>
    `;

    // 2. Inyectamos el HTML en el contenedor
    const container = document.getElementById('navbar-container');
    if (container) {
        container.innerHTML = navHTML;
    } else {
        console.error("No se encontró el contenedor #navbar-container");
        return;
    }

    // 3. Resaltar el link activo (DHTML)
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        // Si el href coincide con la ruta actual, le ponemos la clase active
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active', 'fw-bold', 'text-info');
        }
    });

    // 4. FIX: Inicialización manual del botón hamburguesa
    // Como inyectamos el HTML después de que Bootstrap cargó, debemos decirle
    // que este nuevo botón también tiene que funcionar.
    const navElement = document.getElementById('navbarNav');
    if (navElement && window.bootstrap) {
        new bootstrap.Collapse(navElement, {
            toggle: false
        });
    }
}