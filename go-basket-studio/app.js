const modalData = {
  clock: {
    kicker: "Control visual",
    title: "Reloj y tiempo fuera",
    text: "Aquí irá el control de iniciar, pausar, pedir tiempo fuera y avanzar periodos. En este bloque solo validamos diseño.",
    actions: ["Iniciar reloj", "Tiempo fuera Equipo A", "Tiempo fuera Equipo B"],
  },
  score: {
    kicker: "Anotación universal",
    title: "Anotar punto",
    text: "Aquí se elegirá equipo y jugador para sumar 1 punto. Si una jugada vale 6 puntos, el operador tocará seis veces.",
    actions: ["Equipo A +1", "Equipo B +1", "Ver jugadores"],
  },
  foul: {
    kicker: "Faltas",
    title: "Registrar falta",
    text: "Aquí se elegirá equipo y jugador para sumar una falta y mantener visibles puntos y faltas por jugador.",
    actions: ["Falta Equipo A", "Falta Equipo B"],
  },
  tv: {
    kicker: "Pantalla externa",
    title: "Transmitir / TV",
    text: "Aquí irá el modo TV limpio. La app recomendará duplicar pantalla con Chromecast, AirPlay, Miracast o HDMI.",
    actions: ["Modo TV limpio", "Pantalla completa"],
  },
  settings: {
    kicker: "Datos del partido",
    title: "Configuración",
    text: "Aquí se configurarán nombres, logos, deporte, periodos, duración y jugadores. En este bloque es solo visual.",
    actions: ["Equipos y logos", "Periodos y duración", "Jugadores"],
  },
};

const modal = document.querySelector("#glassModal");
const backdrop = document.querySelector("#modalBackdrop");
const closeBtn = document.querySelector("#modalClose");
const title = document.querySelector("#modalTitle");
const kicker = document.querySelector("#modalKicker");
const text = document.querySelector("#modalText");
const actions = document.querySelector("#modalActions");
const promptText = document.querySelector(".prompt-pill p");

function openModal(key) {
  const data = modalData[key];
  if (!data) return;
  kicker.textContent = data.kicker;
  title.textContent = data.title;
  text.textContent = data.text;
  actions.innerHTML = "";
  data.actions.forEach((label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => {
      promptText.innerHTML = `<b>Sugerencia:</b> ${label}`;
      closeModal();
    });
    actions.append(button);
  });
  modal.hidden = false;
  backdrop.hidden = false;
}

function closeModal() {
  modal.hidden = true;
  backdrop.hidden = true;
}

document.querySelectorAll("[data-modal]").forEach((button) => {
  button.addEventListener("click", () => openModal(button.dataset.modal));
});

closeBtn.addEventListener("click", closeModal);
backdrop.addEventListener("click", closeModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
