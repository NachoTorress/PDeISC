// Evento DHTML: 'click'
const btnGenerar = document.getElementById('btnGenerar');
const btnCopiar = document.getElementById('btnCopiar');
const passResult = document.getElementById('passResult');

btnGenerar.addEventListener('click', () => {
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    passResult.value = password;
    btnCopiar.textContent = "Copiar"; // Resetea el texto
    btnCopiar.classList.remove('btn-success');
    btnCopiar.classList.add('btn-outline-secondary');
});

btnCopiar.addEventListener('click', () => {
    if (passResult.value) {
        navigator.clipboard.writeText(passResult.value);
        btnCopiar.textContent = "¡Copiado!";
        btnCopiar.classList.replace('btn-outline-secondary', 'btn-success');
    }
});