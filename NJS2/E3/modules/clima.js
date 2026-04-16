// clima.js
const API_KEY = "1c3c363a15570f4fc2539ff15f619481";

export async function obtenerClima(ciudad) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${API_KEY}&units=metric&lang=es`;

  const res = await fetch(url);
  const data = await res.json();

  return {
    ciudad: data.name,
    temperatura: data.main.temp,
    descripcion: data.weather[0].description
  };
}