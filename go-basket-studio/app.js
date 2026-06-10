const modal = document.querySelector("#messageModal");
const buttons = document.querySelectorAll(".dock-action");

function openModal(content) {
  modal.innerHTML = content;
  if (!modal.open) modal.showModal();
}

function closeModal() {
  if (modal.open) modal.close();
}

function basicMessage(text) {
  openModal(`
    <form method="dialog" class="modal-card">
      <button class="modal-close" value="close" aria-label="Cerrar">×</button>
      <p class="eyebrow">Bloque 1 · UI visual</p>
      <h2>${text}</h2>
      <p>Esta acción queda preparada visualmente para conectarse en el Bloque 2.</p>
      <button class="modal-action" value="close">Entendido</button>
    </form>
  `);
}

function settingsPanel() {
  openModal(`
    <form method="dialog" class="modal-card settings-card">
      <button class="modal-close" value="close" aria-label="Cerrar">×</button>
      <p class="eyebrow">Configuración visual</p>
      <h2>Datos del partido</h2>
      <p>Panel simulado para validar estructura, alineación y scroll en celular.</p>
      <label>Equipo A<input value="Equipo A" aria-label="Equipo A" /></label>
      <label>Equipo B<input value="Equipo B" aria-label="Equipo B" /></label>
      <label>Deporte
        <select aria-label="Deporte">
          <option>Básquet</option>
          <option>Fútbol</option>
          <option>Fútbol americano</option>
          <option>Voleibol</option>
          <option>Personalizado</option>
        </select>
      </label>
      <div class="form-grid">
        <label>Periodos<input type="number" value="4" min="1" aria-label="Periodos" /></label>
        <label>Duración<input value="10 min" aria-label="Duración" /></label>
      </div>
      <button class="modal-action" value="close">Cerrar panel</button>
    </form>
  `);
}

function handleDockClick(event) {
  const button = event.currentTarget;
  button.classList.add("is-pressed");
  window.setTimeout(() => button.classList.remove("is-pressed"), 160);

  if (button.hasAttribute("data-settings")) {
    settingsPanel();
    return;
  }
  basicMessage(button.dataset.message || "Función visual preparada.");
}

buttons.forEach((button) => button.addEventListener("click", handleDockClick));
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => undefined);
}
