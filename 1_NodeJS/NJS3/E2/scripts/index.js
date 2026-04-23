// Evento simple al cargar la página (load)
window.addEventListener('load', () => {
    const saludo = document.getElementById('saludo-dinamico');
    const hora = new Date().getHours();
    let mensaje = hora < 12 ? '¡Buenos días!' : (hora < 19 ? '¡Buenas tardes!' : '¡Buenas noches!');
    saludo.innerHTML = `<strong>${mensaje}</strong> Todos los sistemas operativos.`;
});