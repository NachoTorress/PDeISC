const contenedor = document.getElementById('contenedor');
let h1 = null;
let img = null;

// Eventos DHTML
document.getElementById('btnCrear').onclick = () => {
    if (!h1) {
        h1 = document.createElement('h1');
        h1.textContent = 'Hola DOM';
        contenedor.prepend(h1);
    }
};

document.getElementById('btnCambiarTexto').onclick = () => {
    if (h1) h1.textContent = 'Chau DOM';
};

document.getElementById('btnColor').onclick = () => {
    if (h1) h1.style.color = h1.style.color === 'blue' ? 'black' : 'blue';
};

document.getElementById('btnImg').onclick = () => {
    if (!img) {
        img = document.createElement('img');
        img.src = 'https://picsum.photos/200';
        img.className = 'img-fluid mt-3 rounded shadow';
        img.style.width = '200px';
        contenedor.appendChild(img);
    }
};

document.getElementById('btnCambiarImg').onclick = () => {
    if (img) img.src = `https://picsum.photos/200?sig=${Math.random()}`;
};

document.getElementById('btnSize').onclick = () => {
    if (img) img.style.width = img.style.width === '200px' ? '400px' : '200px';
};