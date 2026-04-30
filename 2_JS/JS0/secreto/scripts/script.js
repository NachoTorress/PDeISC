document.getElementById('btnDescifrar').addEventListener('click', () => {
    const input = document.getElementById('inputTexto').value;
    const errorContainer = document.getElementById('errorContainer');
    const errorMsg = document.getElementById('errorMsg');
    const resultadoDiv = document.getElementById('resultado');
    
    // Resetear estados
    errorContainer.classList.add('d-none');
    resultadoDiv.classList.remove('border-success');

    try {
        if (!input.trim()) throw new Error("El campo de texto está vacío.");
        
        const mensajeFinal = decodificarOIA(input);
        
        resultadoDiv.innerHTML = `<span class="text-primary fw-bold">${mensajeFinal}</span>`;
        resultadoDiv.classList.add('border-success');
    } catch (e) {
        errorMsg.innerText = e.message;
        errorContainer.classList.remove('d-none');
        resultadoDiv.innerHTML = '<span class="text-muted italic text-danger">Error de formato</span>';
    }
});

function decodificarOIA(texto) {
    let final = "";
    for (let i = 0; i < texto.length; i++) {
        if (texto[i] === '(') {
            let start = i;
            let end = -1;
            
            // Buscar cierre y validar anidamiento
            for (let j = i + 1; j < texto.length; j++) {
                if (texto[j] === '(') {
                    throw new Error("Formato inválido: Se detectó anidamiento de paréntesis. Por favor, inténtalo de nuevo.");
                }
                if (texto[j] === ')') {
                    end = j;
                    break;
                }
            }

            if (end === -1) {
                throw new Error("Formato inválido: Hay un paréntesis '(' que nunca se cierra.");
            }

            // Invertir el contenido
            let contenido = texto.substring(start + 1, end);
            final += contenido.split('').reverse().join('');
            i = end; // Mover el puntero al final del paréntesis
        } else if (texto[i] === ')') {
            throw new Error("Formato inválido: Se cerró un paréntesis ')' sin haberlo abierto.");
        } else {
            final += texto[i];
        }
    }
    return final;
}