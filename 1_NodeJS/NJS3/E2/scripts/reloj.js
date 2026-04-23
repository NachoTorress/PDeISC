let startTime;
let elapsedTime = 0;
let timerInterval;

const mDisp = document.getElementById('minutos');
const sDisp = document.getElementById('segundos');
const msDisp = document.getElementById('milisegundos');

const update = () => {
    const diff = Date.now() - startTime + elapsedTime;
    
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    const ms = diff % 1000;

    mDisp.textContent = String(mins).padStart(2, '0');
    sDisp.textContent = String(secs).padStart(2, '0');
    msDisp.textContent = String(ms).padStart(3, '0');
};

document.getElementById('btnStart').onclick = () => {
    if (!timerInterval) {
        startTime = Date.now();
        timerInterval = setInterval(update, 10);
    }
};

document.getElementById('btnStop').onclick = () => {
    if (timerInterval) {
        elapsedTime += Date.now() - startTime;
        clearInterval(timerInterval);
        timerInterval = null;
    }
};

document.getElementById('btnReset').onclick = () => {
    clearInterval(timerInterval);
    timerInterval = null;
    elapsedTime = 0;
    mDisp.textContent = "00";
    sDisp.textContent = "00";
    msDisp.textContent = "000";
};