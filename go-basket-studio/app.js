const sheet = document.querySelector('.action-sheet');
const backdrop = document.querySelector('.modal-backdrop');
const sheetTitle = document.getElementById('sheetTitle');
const sheetBody = document.getElementById('sheetBody');
const closeButton = document.querySelector('.close-sheet');

const content = {
  timer: {
    title: 'Reloj y tiempos fuera',
    body: `
      <p>En el Bloque 2 aquí irá el control real del cronómetro, pausa y tiempos fuera.</p>
      <div class="visual-row">
        <div class="visual-pill">Iniciar</div>
        <div class="visual-pill">Pausa</div>
        <div class="visual-pill">Tiempo fuera A</div>
        <div class="visual-pill">Tiempo fuera B</div>
      </div>
    `,
  },
  score: {
    title: 'Anotar punto',
    body: `
      <p>En el Bloque 2 aquí se elegirá equipo y jugador para sumar 1 punto universal.</p>
      <div class="visual-row">
        <div class="visual-card">Equipo A<small>#13 José Luis · 1 punto</small></div>
        <div class="visual-card">Equipo B<small>#7 Carlos · 1 punto</small></div>
      </div>
    `,
  },
  foul: {
    title: 'Faltas',
    body: `
      <p>En el Bloque 2 aquí se elegirá equipo y jugador para sumar una falta.</p>
      <div class="visual-row">
        <div class="visual-card">Jugador<small>#13 José Luis</small></div>
        <div class="visual-card">Registro<small>1 falta</small></div>
      </div>
    `,
  },
  tv: {
    title: 'Transmitir / TV',
    body: `
      <p>En el Bloque 2 aquí irá el modo TV limpio y las instrucciones para duplicar pantalla.</p>
      <div class="visual-card">Modo TV limpio<small>Cámara + marcador + teleprompter</small></div>
    `,
  },
  settings: {
    title: 'Configuración / Datos',
    body: `
      <p>Panel visual base. En el Bloque 2 se conectarán equipos, logos, periodos y jugadores.</p>
      <div class="visual-row">
        <div class="visual-card">Equipo A<small>Logo, nombre, jugadores</small></div>
        <div class="visual-card">Equipo B<small>Logo, nombre, jugadores</small></div>
        <div class="visual-card">Deporte<small>Básquet, fútbol, personalizado</small></div>
        <div class="visual-card">Tiempo<small>4 de 10, 2 de 45, etc.</small></div>
      </div>
    `,
  },
  teleprompter: {
    title: 'Sugerencia de narración',
    body: `
      <p>El operador narrará con su propia voz. La app mostrará frases listas para leer.</p>
      <div class="visual-card">Sugerencia<small>Canasta del número 13, José Luis.</small></div>
    `,
  },
};

function openSheet(key) {
  const item = content[key] || content.settings;
  sheetTitle.textContent = item.title;
  sheetBody.innerHTML = item.body;
  sheet.hidden = false;
  backdrop.hidden = false;
}

function closeSheet() {
  sheet.hidden = true;
  backdrop.hidden = true;
}

document.querySelectorAll('[data-modal]').forEach((button) => {
  button.addEventListener('click', () => openSheet(button.dataset.modal));
});

document.querySelectorAll('[data-action="teleprompter"]').forEach((button) => {
  button.addEventListener('click', () => openSheet('teleprompter'));
});

closeButton.addEventListener('click', closeSheet);
backdrop.addEventListener('click', closeSheet);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeSheet();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((error) => console.warn('SW no registrado', error));
  });
}
