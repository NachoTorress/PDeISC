// Evento DHTML: 'input' bidireccional
const kmInput = document.getElementById('kmInput');
const miInput = document.getElementById('miInput');

// Convierte de KM a Millas
kmInput.addEventListener('input', () => {
    const km = parseFloat(kmInput.value);
    if (!isNaN(km)) {
        miInput.value = (km * 0.621371).toFixed(2);
    } else {
        miInput.value = ''; // Limpia si borran el número
    }
});

// Convierte de Millas a KM (hacia arriba)
miInput.addEventListener('input', () => {
    const mi = parseFloat(miInput.value);
    if (!isNaN(mi)) {
        kmInput.value = (mi / 0.621371).toFixed(2);
    } else {
        kmInput.value = '';
    }
});