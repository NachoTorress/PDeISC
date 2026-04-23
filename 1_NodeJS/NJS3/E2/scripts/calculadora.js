// Evento DHTML: 'input' (dispara en tiempo real al escribir o mover el slider)
const montoInput = document.getElementById('monto');
const rangoInput = document.getElementById('rango');
const lblPorcentaje = document.getElementById('lblPorcentaje');
const totalFinal = document.getElementById('totalFinal');

function calcularPropina() {
    const monto = parseFloat(montoInput.value) || 0;
    const porcentaje = parseInt(rangoInput.value);
    
    lblPorcentaje.textContent = `${porcentaje}%`;
    const total = monto + (monto * (porcentaje / 100));
    totalFinal.textContent = `$ ${total.toFixed(2)}`;
}

montoInput.addEventListener('input', calcularPropina);
rangoInput.addEventListener('input', calcularPropina);