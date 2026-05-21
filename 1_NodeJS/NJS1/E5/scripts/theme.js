const button = document.getElementById('themeButton');

const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  button.innerHTML = '☀️ Modo claro';
}

button.addEventListener('click', () => {

  document.body.classList.toggle('dark-mode');

  const darkModeEnabled =
    document.body.classList.contains('dark-mode');

  if (darkModeEnabled) {
    localStorage.setItem('theme', 'dark');
    button.innerHTML = '☀️ Modo claro';
  }
  else {
    localStorage.setItem('theme', 'light');
    button.innerHTML = '🌙 Modo oscuro';
  }
});