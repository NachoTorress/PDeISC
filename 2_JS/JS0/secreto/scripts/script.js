const PORT = 3020; // Variable de puerto

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnDescifrar');
    const input = document.getElementById('inputTexto');
    const output = document.getElementById('resultado');
    const errorCont = document.getElementById('errorContainer');
    const errorMsg = document.getElementById('errorMsg');

    const invertirParentesis = (texto) => {
        let regex = /\(([^()]*)\)/;
        let resultado = texto;
        
        while (regex.test(resultado)) {
            resultado = resultado.replace(regex, (match, contenido) => {
                return contenido.split('').reverse().join('');
            });
        }
        return resultado;
    };

    btn.addEventListener('click', () => {
        const texto = input.value.trim();
        errorCont.classList.add('d-none');

        if (!texto) return;

        // Validar balance de paréntesis
        const balance = (texto.split('(').length - 1) === (texto.split(')').length - 1);
        
        if (!balance) {
            errorMsg.textContent = "Error: Paréntesis mal balanceados.";
            errorCont.classList.remove('d-none');
            return;
        }

        const descifrado = invertirParentesis(texto);
        output.textContent = descifrado;
        output.classList.add('border-success-custom');
    });
});