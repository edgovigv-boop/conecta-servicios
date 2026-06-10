const STORE_KEY = "go-basket-studio-live:v1";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  stream: null,
  micStream: null,
  micSource: null,
  audioContext: null,
  audioDestination: null,
  recorder: null,
  chunks: [],
  recordingCanvas: null,
  recordingContext: null,
  recordingAnimation: null,
  recordingStartedAt: null,
  recordedUrl: "",
  recordedBlob: null,
  recordedFile: null,
  tvWindow: null,
  wakeLock: null,
  lastBackAt: 0,
  touchStartY: 0,
  introQueue: [],
  introIndex: 0,
  currentIntro: null,
  game: createDefaultGame(),
};

const els = {
  app: $("#app"),
  video: $("#cameraView"),
  permissionCard: $("#permissionCard"),
  permissionMessage: $("#permissionMessage"),
  retryPermissionsBtn: $("#retryPermissionsBtn"),
  teamAName: $("#teamAName"),
  teamBName: $("#teamBName"),
  teamALogo: $("#teamALogo"),
  teamBLogo: $("#teamBLogo"),
  scoreA: $("#scoreA"),
  scoreB: $("#scoreB"),
  foulsA: $("#foulsA"),
  foulsB: $("#foulsB"),
  timeoutsA: $("#timeoutsA"),
  timeoutsB: $("#timeoutsB"),
  liveStatus: $("#liveStatus"),
  clock: $("#clock"),
  periodLabel: $("#periodLabel"),
  promptText: $("#promptText"),
  teleprompter: $("#teleprompter"),
  micStatus: $("#micStatus"),
  recordStatus: $("#recordStatus"),
  lastPlay: $("#lastPlay"),
  introOverlay: $("#introOverlay"),
  controlDock: $("#controlDock"),
  timerBtn: $("#timerBtn"),
  scoreBtn: $("#scoreBtn"),
  foulBtn: $("#foulBtn"),
  recordBtn: $("#recordBtn"),
  tvBtn: $("#tvBtn"),
  settingsBtn: $("#settingsBtn"),
  actionModal: $("#actionModal"),
  settingsModal: $("#settingsModal"),
  reportModal: $("#reportModal"),
};

function createDefaultGame() {
  return {
    teamA: "Equipo Azul",
    teamB: "Equipo Rojo",
    logoA: "A",
    logoB: "B",
    scoreA: 0,
    scoreB: 0,
    foulsA: 0,
    foulsB: 0,
    durationSeconds: 600,
    remainingSeconds: 600,
    period: 1,
    running: false,
    started: false,
    finished: false,
    recording: false,
    microphoneEnabled: false,
    teleprompterVisible: true,
    tvClean: false,
    timeoutUsage: {},
    players: { A: [], B: [] },
    history: [],
    prompt: "Go Basket Studio en vivo. Cámara y marcador listos.",
    status: "EN VIVO",
  };
}

function saveLocal() {
  const payload = { ...state.game, history: state.game.history.slice(0, 80) };
  localStorage.setItem(STORE_KEY, JSON.stringify(payload));
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    state.game = { ...createDefaultGame(), ...saved, players: saved.players || { A: [], B: [] }, history: saved.history || [] };
  } catch (error) {
    console.warn("No se pudo cargar configuración local", error);
  }
}

function formatClock(totalSeconds) {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60).toString().padStart(2, "0");
  const seconds = Math.floor(Math.max(0, totalSeconds) % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function currentPeriod() {
  const elapsed = state.game.durationSeconds - state.game.remainingSeconds;
  return Math.floor(Math.max(0, elapsed) / 600) + 1;
}

function timeoutsUsed(team, period = currentPeriod()) {
  return state.game.timeoutUsage?.[period]?.[team] || 0;
}

function timeoutsRemaining(team, period = currentPeriod()) {
  return Math.max(0, 2 - timeoutsUsed(team, period));
}

function getTeamName(team) {
  return team === "A" ? state.game.teamA : state.game.teamB;
}

function scoreLine() {
  return `${state.game.teamA} ${state.game.scoreA} - ${state.game.teamB} ${state.game.scoreB}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function renderLogo(element, value, fallback) {
  element.innerHTML = value?.startsWith("data:") || value?.startsWith("blob:")
    ? `<img src="${value}" alt="Logo">`
    : escapeHtml(value || fallback);
}

function render() {
  const game = state.game;
  game.period = currentPeriod();
  els.teamAName.textContent = game.teamA;
  els.teamBName.textContent = game.teamB;
  renderLogo(els.teamALogo, game.logoA, "A");
  renderLogo(els.teamBLogo, game.logoB, "B");
  els.scoreA.textContent = game.scoreA;
  els.scoreB.textContent = game.scoreB;
  els.foulsA.textContent = game.foulsA;
  els.foulsB.textContent = game.foulsB;
  els.timeoutsA.textContent = timeoutsRemaining("A");
  els.timeoutsB.textContent = timeoutsRemaining("B");
  els.clock.textContent = formatClock(game.remainingSeconds);
  els.periodLabel.textContent = `Periodo ${game.period}`;
  els.liveStatus.textContent = game.finished ? "FINAL" : game.running ? "EN VIVO" : game.status || "PAUSADO";
  els.promptText.textContent = game.prompt;
  els.teleprompter.hidden = !game.teleprompterVisible;
  els.micStatus.textContent = state.micStream ? "Micrófono activo" : "Micrófono inactivo";
  els.recordStatus.textContent = game.recording ? "Grabación activa" : state.recordedUrl ? "Video listo" : "Grabación inactiva";
  els.recordStatus.classList.toggle("record-dot", game.recording);
  els.lastPlay.textContent = `Última jugada: ${game.history[0]?.text || "listo para iniciar"}`;
  els.timerBtn.textContent = !game.started ? "Iniciar" : game.running ? "Pausa/TO" : "Reanudar";
  els.recordBtn.textContent = game.recording ? "Detener" : "Grabar";
  els.app.classList.toggle("recording", game.recording);
  els.app.classList.toggle("tv-clean", game.tvClean);
  syncTvWindow();
  saveLocal();
}

async function requestMedia() {
  els.permissionCard.hidden = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true });
    state.stream = stream;
    const videoTracks = stream.getVideoTracks();
    state.micStream = new MediaStream(stream.getAudioTracks());
    els.video.srcObject = new MediaStream(videoTracks);
    await els.video.play();
    connectMicrophoneToRecorder();
    state.game.microphoneEnabled = true;
    setPrompt("Micrófono activo para grabación. La salida en vivo puede depender del dispositivo.");
  } catch (error) {
    console.warn("Permisos no disponibles", error);
    els.permissionMessage.textContent = "No se pudo activar cámara o micrófono. Revisa permisos del navegador y vuelve a intentar.";
    els.permissionCard.hidden = false;
  }
  render();
}

function ensureAudio() {
  if (!state.audioContext) state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (!state.audioDestination) state.audioDestination = state.audioContext.createMediaStreamDestination();
  if (state.audioContext.state === "suspended") void state.audioContext.resume();
  return state.audioContext;
}

function connectMicrophoneToRecorder() {
  if (!state.micStream?.getAudioTracks().length) return;
  const audio = ensureAudio();
  if (state.micSource) return;
  state.micSource = audio.createMediaStreamSource(state.micStream);
  state.micSource.connect(state.audioDestination);
}

function playSound(type = "beep") {
  const audio = ensureAudio();
  const out = audio.createGain();
  out.gain.setValueAtTime(0.001, audio.currentTime);
  out.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 0.02);
  out.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.38);
  out.connect(audio.destination);
  out.connect(state.audioDestination);
  const notes = {
    score: [660, 880],
    triple: [660, 990, 1320],
    foul: [1200, 700],
    timeout: [1200, 880, 1200],
    final: [220, 165, 110],
  }[type] || [520];
  notes.forEach((freq, index) => {
    const osc = audio.createOscillator();
    osc.type = type === "foul" ? "square" : "sine";
    osc.frequency.setValueAtTime(freq, audio.currentTime + index * 0.1);
    osc.connect(out);
    osc.start(audio.currentTime + index * 0.1);
    osc.stop(audio.currentTime + index * 0.1 + 0.16);
  });
}

function setPrompt(text) {
  state.game.prompt = text;
  render();
}

function recordPlay(play) {
  const game = state.game;
  const elapsedGameSeconds = game.durationSeconds - game.remainingSeconds;
  const recordingTimeMs = state.recordingStartedAt ? Date.now() - state.recordingStartedAt : null;
  const item = {
    id: crypto.randomUUID?.() || String(Date.now()),
    type: play.type,
    team: play.team || "",
    teamName: play.team ? getTeamName(play.team) : "",
    playerId: play.player?.id || null,
    playerName: play.player?.name || "",
    playerNumber: play.player?.number || "",
    points: play.points || 0,
    foulsA: game.foulsA,
    foulsB: game.foulsB,
    scoreA: game.scoreA,
    scoreB: game.scoreB,
    remainingSeconds: game.remainingSeconds,
    elapsedGameSeconds,
    recordingTimeMs,
    text: play.text,
    prompt: play.prompt || play.text,
    eventColor: play.eventColor || eventColor(play.type, play.points),
    at: new Date().toISOString(),
  };
  game.history.unshift(item);
  setPrompt(item.prompt);
}

function eventColor(type, points) {
  if (type === "score" && points === 3) return "#ffd166";
  if (type === "score") return "#45f59a";
  if (type === "foul") return "#ff3d57";
  if (type === "timeout") return "#4cc9f0";
  if (type === "intro") return "#b467ff";
  return "#ffffff";
}

function toggleTimer() {
  const game = state.game;
  if (!game.started) {
    game.started = true;
    game.running = true;
    game.status = "EN VIVO";
    state.timerId = window.setInterval(tick, 1000);
    requestWakeLock();
    render();
    return;
  }
  if (game.running) openPauseModal();
  else {
    game.running = true;
    game.status = "EN VIVO";
    state.timerId = window.setInterval(tick, 1000);
    render();
  }
}

function tick() {
  const game = state.game;
  game.remainingSeconds = Math.max(0, game.remainingSeconds - 1);
  if (game.remainingSeconds === 0) finishGame();
  render();
}

function stopClock(status = "PAUSADO") {
  window.clearInterval(state.timerId);
  state.timerId = null;
  state.game.running = false;
  state.game.status = status;
}

function openPauseModal() {
  const modal = els.actionModal;
  modal.innerHTML = modalShell("Pausa / tiempo fuera", `
    <div class="choice-list">
      <button class="choice-btn" data-pause="only" type="button">Pausar solamente</button>
      <button class="choice-btn" data-timeout="A" type="button">Tiempo fuera ${escapeHtml(state.game.teamA)}<small>${timeoutsRemaining("A")} disponibles</small></button>
      <button class="choice-btn" data-timeout="B" type="button">Tiempo fuera ${escapeHtml(state.game.teamB)}<small>${timeoutsRemaining("B")} disponibles</small></button>
    </div>
  `);
  modal.showModal();
}

function requestTimeout(team) {
  const period = currentPeriod();
  const teamName = getTeamName(team);
  if (timeoutsRemaining(team, period) <= 0) {
    alert(`${teamName} ya no tiene tiempos fuera disponibles en este periodo.`);
    return;
  }
  state.game.timeoutUsage[period] ||= { A: 0, B: 0 };
  state.game.timeoutUsage[period][team] = timeoutsUsed(team, period) + 1;
  stopClock("TIEMPO FUERA");
  const text = `Tiempo fuera por parte del equipo ${teamName}.`;
  recordPlay({ type: "timeout", team, text, prompt: text });
  playSound("timeout");
  render();
}

function openScoreModal() {
  const modal = els.actionModal;
  modal.innerHTML = modalShell("Anotar puntos", `
    <div class="grid-2">
      <button class="choice-btn" data-score-team="A" type="button">${escapeHtml(state.game.teamA)}</button>
      <button class="choice-btn" data-score-team="B" type="button">${escapeHtml(state.game.teamB)}</button>
    </div>
    <div id="scoreStep" class="settings-section"></div>
  `);
  modal.showModal();
}

function renderScoreStep(team) {
  const root = $("#scoreStep", els.actionModal);
  root.innerHTML = `
    <h3>${escapeHtml(getTeamName(team))}</h3>
    <div class="grid-3">
      <button data-score-points="1" data-team="${team}" type="button">+1</button>
      <button data-score-points="2" data-team="${team}" type="button">+2</button>
      <button data-score-points="3" data-team="${team}" type="button">+3</button>
    </div>
  `;
}

function openPlayerPick({ team, points = 0, type }) {
  const players = state.game.players[team] || [];
  const root = $("#scoreStep", els.actionModal) || $("#foulStep", els.actionModal);
  root.innerHTML = `
    <h3>¿Quién hizo la jugada?</h3>
    <div class="choice-list">
      ${players.map((player) => `<button class="choice-btn" data-player="${player.id}" data-team="${team}" data-points="${points}" data-type="${type}" type="button">${escapeHtml(player.name || "Jugador")} ${player.number ? `#${escapeHtml(player.number)}` : ""}<small>${escapeHtml(getTeamName(team))}</small></button>`).join("")}
      <button class="choice-btn" data-player="" data-team="${team}" data-points="${points}" data-type="${type}" type="button">Equipo completo / sin jugador</button>
    </div>
  `;
}

function applyScore(team, points, playerId = "") {
  const player = (state.game.players[team] || []).find((item) => item.id === playerId) || null;
  state.game[team === "A" ? "scoreA" : "scoreB"] += points;
  if (player) player.points = (player.points || 0) + points;
  const playerText = player ? `Canasta del número ${player.number || "sin número"}, ${player.name || "jugador"}. ` : "";
  const text = `${playerText}${points} puntos para ${getTeamName(team)}. Marcador ${scoreLine()}.`;
  recordPlay({ type: "score", team, player, points, text, prompt: text });
  playSound(points === 3 ? "triple" : "score");
  els.actionModal.close();
  render();
}

function openFoulModal() {
  els.actionModal.innerHTML = modalShell("Registrar falta", `
    <div class="grid-2">
      <button class="choice-btn" data-foul-team="A" type="button">${escapeHtml(state.game.teamA)}</button>
      <button class="choice-btn" data-foul-team="B" type="button">${escapeHtml(state.game.teamB)}</button>
    </div>
    <div id="foulStep" class="settings-section"></div>
  `);
  els.actionModal.showModal();
}

function applyFoul(team, playerId = "") {
  const player = (state.game.players[team] || []).find((item) => item.id === playerId) || null;
  state.game[team === "A" ? "foulsA" : "foulsB"] += 1;
  if (player) player.fouls = (player.fouls || 0) + 1;
  const text = player
    ? `Falta de ${player.name || "jugador"}, número ${player.number || "sin número"}. Faltas de equipo: ${state.game[team === "A" ? "foulsA" : "foulsB"]}.`
    : `Falta de ${getTeamName(team)}. Faltas de equipo: ${state.game[team === "A" ? "foulsA" : "foulsB"]}.`;
  recordPlay({ type: "foul", team, player, text, prompt: text });
  playSound("foul");
  els.actionModal.close();
  render();
}

function openTvModal() {
  els.actionModal.innerHTML = modalShell("Transmitir / enviar a pantalla", `
    <p>Para verlo en una TV, duplica la pantalla del celular con Chromecast, AirPlay, Miracast o cable HDMI, o abre esta misma página en la TV.</p>
    <div class="choice-list">
      <button data-tv-clean type="button">${state.game.tvClean ? "Volver a controles" : "Modo TV limpio"}</button>
      <button data-tv-window type="button">Abrir tablero en nueva pestaña</button>
      <button data-tv-fullscreen type="button">Pantalla completa</button>
      ${"PresentationRequest" in window ? '<button data-tv-presentation type="button">Enviar a pantalla experimental</button>' : '<p class="report-box">Presentation API no disponible. Usa duplicar pantalla.</p>'}
    </div>
  `);
  els.actionModal.showModal();
}

function openTvWindow() {
  state.tvWindow = window.open("", "goBasketStudioLiveTv");
  syncTvWindow();
}

function syncTvWindow() {
  if (!state.tvWindow || state.tvWindow.closed) return;
  const g = state.game;
  state.tvWindow.document.open();
  state.tvWindow.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Go Basket Studio TV</title><style>body{margin:0;min-height:100vh;background:#07030d;color:#fff8ed;font-family:system-ui;display:grid;place-items:center}.board{width:min(1200px,92vw);display:grid;gap:24px;text-align:center}.score{display:grid;grid-template-columns:1fr auto 1fr;gap:20px;align-items:center}.team{border:1px solid rgba(255,255,255,.2);border-radius:34px;padding:26px;background:rgba(255,255,255,.08)}strong{font-size:clamp(7rem,20vw,15rem);line-height:.9}.clock{font-size:clamp(4rem,12vw,10rem);color:#ffd166;font-weight:1000}.last{font-size:clamp(1.4rem,4vw,3rem);background:rgba(255,122,24,.18);border-radius:28px;padding:24px}.brand{color:#ffd166;font-weight:1000;letter-spacing:.15em}</style></head><body><main class="board"><div class="brand">GO BASKET STUDIO LIVE</div><section class="score"><article class="team"><h1>${escapeHtml(g.teamA)}</h1><strong style="color:#4cc9f0">${g.scoreA}</strong><p>Faltas ${g.foulsA} · TO ${timeoutsRemaining("A")}</p></article><div class="clock">${formatClock(g.remainingSeconds)}</div><article class="team"><h1>${escapeHtml(g.teamB)}</h1><strong style="color:#ff3d57">${g.scoreB}</strong><p>Faltas ${g.foulsB} · TO ${timeoutsRemaining("B")}</p></article></section><div class="last">${escapeHtml(g.prompt)}</div></main></body></html>`);
  state.tvWindow.document.close();
}

async function startPresentationMode() {
  try {
    const request = new PresentationRequest([window.location.href]);
    await request.start();
  } catch (error) {
    alert("No se pudo enviar a pantalla desde este navegador. Usa duplicar pantalla.");
  }
}

function openSettings() {
  els.settingsModal.innerHTML = modalShell("Configuración / datos", settingsHtml());
  els.settingsModal.showModal();
  bindSettingsEditors();
}

function settingsHtml() {
  return `
    <form id="settingsForm" class="settings-section">
      <div class="grid-2">
        <label>Nombre Equipo A<input name="teamA" value="${escapeHtml(state.game.teamA)}"></label>
        <label>Nombre Equipo B<input name="teamB" value="${escapeHtml(state.game.teamB)}"></label>
        <label>Logo Equipo A<input name="logoA" value="${escapeHtml(state.game.logoA)}" placeholder="A o emoji"></label>
        <label>Logo Equipo B<input name="logoB" value="${escapeHtml(state.game.logoB)}" placeholder="B o emoji"></label>
        <label>Duración en minutos<input name="duration" type="number" min="1" max="240" value="${Math.round(state.game.durationSeconds / 60)}"></label>
      </div>
      <div class="settings-section">
        <h3>Jugadores Equipo A</h3><div id="rosterA" class="roster-editor">${rosterHtml("A")}</div><button data-add-player="A" type="button">+ Agregar jugador A</button>
      </div>
      <div class="settings-section">
        <h3>Jugadores Equipo B</h3><div id="rosterB" class="roster-editor">${rosterHtml("B")}</div><button data-add-player="B" type="button">+ Agregar jugador B</button>
      </div>
      <div class="grid-3">
        <button type="submit" class="primary">Guardar</button>
        <button data-present="all" type="button">Presentar jugadores</button>
        <button data-toggle-prompt type="button">${state.game.teleprompterVisible ? "Ocultar" : "Mostrar"} teleprompter</button>
      </div>
    </form>
  `;
}

function rosterHtml(team) {
  return (state.game.players[team] || []).map((player) => playerEditorHtml(team, player)).join("") || "";
}

function playerEditorHtml(team, player = {}) {
  const id = player.id || crypto.randomUUID?.() || `${team}-${Date.now()}`;
  return `
    <article class="player-editor" data-player-row="${team}" data-id="${id}">
      <label>Nombre<input data-field="name" value="${escapeHtml(player.name || "")}"></label>
      <label>Número<input data-field="number" value="${escapeHtml(player.number || "")}"></label>
      <label>Posición<input data-field="position" value="${escapeHtml(player.position || "")}"></label>
      <label>Procedencia<input data-field="origin" value="${escapeHtml(player.origin || "")}"></label>
      <label class="full">Dato extra<input data-field="extra" value="${escapeHtml(player.extra || "")}"></label>
      <label class="full">Foto opcional<input data-field="photo" type="file" accept="image/*"></label>
      <button data-remove-player type="button">Quitar</button>
    </article>
  `;
}

function bindSettingsEditors() {
  els.settingsModal.onclick = settingsClick;
  $("#settingsForm", els.settingsModal).onsubmit = saveSettings;
}

function settingsClick(event) {
  const add = event.target.closest("[data-add-player]");
  const remove = event.target.closest("[data-remove-player]");
  const present = event.target.closest("[data-present]");
  const togglePrompt = event.target.closest("[data-toggle-prompt]");
  if (add) {
    event.preventDefault();
    $(`#roster${add.dataset.addPlayer}`, els.settingsModal).insertAdjacentHTML("beforeend", playerEditorHtml(add.dataset.addPlayer));
    bindSettingsEditors();
  } else if (remove) {
    event.preventDefault();
    remove.closest("[data-player-row]").remove();
    bindSettingsEditors();
  } else if (present) {
    event.preventDefault();
    saveSettings(event, false);
    els.settingsModal.close();
    startIntro(present.dataset.present);
  } else if (togglePrompt) {
    event.preventDefault();
    state.game.teleprompterVisible = !state.game.teleprompterVisible;
    els.settingsModal.close();
    render();
  }
}

function saveSettings(event, close = true) {
  event.preventDefault();
  const form = $("#settingsForm", els.settingsModal);
  const data = new FormData(form);
  state.game.teamA = data.get("teamA") || "Equipo A";
  state.game.teamB = data.get("teamB") || "Equipo B";
  state.game.logoA = data.get("logoA") || "A";
  state.game.logoB = data.get("logoB") || "B";
  const newDuration = Math.max(60, Number(data.get("duration") || 10) * 60);
  if (!state.game.started) state.game.remainingSeconds = newDuration;
  state.game.durationSeconds = newDuration;
  state.game.players = { A: collectPlayersFromSettings("A"), B: collectPlayersFromSettings("B") };
  if (close) els.settingsModal.close();
  render();
}

function collectPlayersFromSettings(team) {
  return $$(`[data-player-row="${team}"]`, els.settingsModal).map((row) => {
    const existing = (state.game.players[team] || []).find((player) => player.id === row.dataset.id) || {};
    const photo = $('[data-field="photo"]', row).files?.[0];
    return {
      id: row.dataset.id,
      team,
      name: $('[data-field="name"]', row).value.trim(),
      number: $('[data-field="number"]', row).value.trim(),
      position: $('[data-field="position"]', row).value.trim(),
      origin: $('[data-field="origin"]', row).value.trim(),
      extra: $('[data-field="extra"]', row).value.trim(),
      photoUrl: photo ? URL.createObjectURL(photo) : existing.photoUrl || "",
      points: existing.points || 0,
      fouls: existing.fouls || 0,
    };
  }).filter((player) => player.name || player.number);
}

function startIntro(scope = "all") {
  const all = scope === "A" ? state.game.players.A : scope === "B" ? state.game.players.B : [...state.game.players.A, ...state.game.players.B];
  state.introQueue = all.map((player) => ({ player, team: player.team, teamName: getTeamName(player.team) }));
  state.introIndex = 0;
  showIntro();
}

function showIntro() {
  const intro = state.introQueue[state.introIndex];
  if (!intro) {
    closeIntro();
    return;
  }
  state.currentIntro = intro;
  const player = intro.player;
  const media = player.photoUrl ? `<img class="intro-photo" src="${player.photoUrl}" alt="${escapeHtml(player.name)}">` : `<div class="intro-avatar">#${escapeHtml(player.number || "--")}</div>`;
  const phrase = buildIntroPhrase(intro);
  els.introOverlay.innerHTML = `
    <div class="intro-layout">
      ${media}
      <div class="intro-copy">
        <span>${escapeHtml(intro.teamName)}</span>
        <h2>${escapeHtml(player.name || "Jugador")}</h2>
        <strong>Número ${escapeHtml(player.number || "sin número")}</strong>
        <p>${[player.position, player.origin, player.extra].filter(Boolean).map(escapeHtml).join(" · ")}</p>
        <p>${escapeHtml(phrase)}</p>
        <div class="report-actions">
          <button data-intro-next type="button">Siguiente jugador</button>
          <button data-intro-team="A" type="button">Presentar equipo A</button>
          <button data-intro-team="B" type="button">Presentar equipo B</button>
          <button data-intro-team="all" type="button">Presentar todos</button>
          <button data-intro-close type="button">Cerrar presentación</button>
        </div>
      </div>
    </div>`;
  els.introOverlay.hidden = false;
  recordPlay({ type: "intro", team: intro.team, player, text: phrase, prompt: phrase });
  setPrompt(phrase);
}

function buildIntroPhrase(intro) {
  const player = intro.player;
  const parts = [`Del equipo ${intro.teamName}`];
  if (player.number) parts.push(`con el número ${player.number}`);
  if (player.position) parts.push(`jugando en la posición de ${player.position}`);
  if (player.origin) parts.push(`originario de ${player.origin}`);
  if (player.extra) parts.push(player.extra);
  return `${parts.join(", ")}... ¡${player.name || "Jugador"}!`;
}

function closeIntro() {
  els.introOverlay.hidden = true;
  state.currentIntro = null;
  render();
}

async function toggleRecording() {
  if (state.game.recording) {
    stopRecording();
    return;
  }
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    alert("Este navegador no permite grabación interna con MediaRecorder.");
    return;
  }
  connectMicrophoneToRecorder();
  state.recordingCanvas = document.createElement("canvas");
  state.recordingCanvas.width = 1280;
  state.recordingCanvas.height = 720;
  state.recordingContext = state.recordingCanvas.getContext("2d");
  const canvasStream = state.recordingCanvas.captureStream(30);
  const audioTracks = state.audioDestination?.stream?.getAudioTracks() || [];
  const mixed = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
  const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type)) || "";
  state.chunks = [];
  state.recordingStartedAt = Date.now();
  state.recorder = new MediaRecorder(mixed, mimeType ? { mimeType } : undefined);
  state.recorder.addEventListener("dataavailable", (event) => { if (event.data?.size) state.chunks.push(event.data); });
  state.recorder.addEventListener("stop", finalizeRecording);
  drawRecordingFrame();
  state.recorder.start(1000);
  state.game.recording = true;
  setPrompt("Grabación activa. Narra con tu voz; marcador, cámara y micrófono se están capturando.");
  render();
}

function stopRecording() {
  if (state.recorder?.state !== "inactive") state.recorder.stop();
  state.game.recording = false;
  cancelAnimationFrame(state.recordingAnimation);
  render();
}

function finalizeRecording() {
  state.recordedBlob = new Blob(state.chunks, { type: state.recorder?.mimeType || "video/webm" });
  if (state.recordedUrl) URL.revokeObjectURL(state.recordedUrl);
  state.recordedUrl = URL.createObjectURL(state.recordedBlob);
  try {
    state.recordedFile = new File([state.recordedBlob], "go-basket-studio-partido.webm", { type: state.recordedBlob.type || "video/webm" });
  } catch {
    state.recordedFile = null;
  }
  setPrompt("Video generado. Si tu navegador no lo guarda automáticamente, mantén presionado el video y elige Guardar o Descargar.");
  openReport();
}

function drawRecordingFrame() {
  const ctx = state.recordingContext;
  const canvas = state.recordingCanvas;
  if (!ctx || !canvas) return;
  ctx.fillStyle = "#07030d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (els.video.readyState >= 2) {
    const ratio = els.video.videoWidth / els.video.videoHeight || 16 / 9;
    const canvasRatio = canvas.width / canvas.height;
    let w = canvas.width;
    let h = canvas.height;
    let x = 0;
    let y = 0;
    if (ratio > canvasRatio) { h = canvas.height; w = h * ratio; x = (canvas.width - w) / 2; }
    else { w = canvas.width; h = w / ratio; y = (canvas.height - h) / 2; }
    ctx.drawImage(els.video, x, y, w, h);
    ctx.fillStyle = "rgba(5,2,10,.34)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  drawCanvasScoreboard(ctx);
  drawCanvasPrompt(ctx);
  if (!els.introOverlay.hidden && state.currentIntro) drawCanvasIntro(ctx);
  if (state.game.recording) state.recordingAnimation = requestAnimationFrame(drawRecordingFrame);
}

function drawCanvasScoreboard(ctx) {
  const g = state.game;
  drawRound(ctx, 44, 32, 1192, 142, 30, "rgba(10,7,18,.84)");
  ctx.fillStyle = "#4cc9f0";
  ctx.font = "1000 78px system-ui";
  ctx.fillText(String(g.scoreA), 72, 136);
  ctx.fillStyle = "#ff3d57";
  ctx.textAlign = "right";
  ctx.fillText(String(g.scoreB), 1208, 136);
  ctx.textAlign = "left";
  ctx.fillStyle = "#fff8ed";
  ctx.font = "900 30px system-ui";
  ctx.fillText(g.teamA, 180, 78);
  ctx.textAlign = "right";
  ctx.fillText(g.teamB, 1100, 78);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd166";
  ctx.font = "1000 64px system-ui";
  ctx.fillText(formatClock(g.remainingSeconds), 640, 112);
  ctx.fillStyle = "#c8b9a5";
  ctx.font = "800 22px system-ui";
  ctx.fillText(`${g.running ? "EN VIVO" : g.status || "PAUSADO"} · Periodo ${currentPeriod()}`, 640, 146);
  ctx.textAlign = "left";
  ctx.fillText(`Faltas ${g.foulsA} · TO ${timeoutsRemaining("A")}`, 180, 122);
  ctx.textAlign = "right";
  ctx.fillText(`Faltas ${g.foulsB} · TO ${timeoutsRemaining("B")}`, 1100, 122);
  ctx.textAlign = "left";
}

function drawCanvasPrompt(ctx) {
  drawRound(ctx, 70, 566, 1140, 92, 24, "rgba(10,7,18,.78)");
  ctx.fillStyle = "#ffd166";
  ctx.font = "800 22px system-ui";
  ctx.fillText("SUGERENCIA PARA NARRADOR", 100, 604);
  ctx.fillStyle = "#fff";
  ctx.font = "900 32px system-ui";
  wrapText(ctx, state.game.prompt, 100, 642, 1080, 36);
}

function drawCanvasIntro(ctx) {
  const intro = state.currentIntro;
  if (!intro) return;
  drawRound(ctx, 170, 210, 940, 290, 34, "rgba(10,7,18,.9)");
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = "#ffd166";
  ctx.font = "900 28px system-ui";
  ctx.fillText(intro.teamName.toUpperCase(), 430, 270);
  ctx.fillStyle = "#fff";
  ctx.font = "1000 64px system-ui";
  ctx.fillText(intro.player.name || "Jugador", 430, 350);
  ctx.fillStyle = "#4cc9f0";
  ctx.font = "1000 92px system-ui";
  ctx.fillText(`#${intro.player.number || "--"}`, 230, 360);
  ctx.fillStyle = "#d1d5db";
  ctx.font = "700 28px system-ui";
  wrapText(ctx, [intro.player.position, intro.player.origin, intro.player.extra].filter(Boolean).join(" · "), 430, 398, 580, 34);
}

function drawRound(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || "").split(" ");
  let line = "";
  words.forEach((word) => {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y);
      line = `${word} `;
      y += lineHeight;
    } else line = test;
  });
  if (line) ctx.fillText(line.trim(), x, y);
}

function openReport() {
  const summary = buildSummary();
  els.reportModal.innerHTML = modalShell("Reporte final", `
    ${state.recordedUrl ? `<video class="report-video" controls src="${state.recordedUrl}"></video>` : ""}
    <p class="report-box">Video generado. Si tu navegador no lo guarda automáticamente, mantén presionado el video y elige Guardar o Descargar.</p>
    <div class="report-actions">
      <button data-view-video type="button">Ver video</button>
      <button data-download-video type="button">Descargar video</button>
      <button data-share-video type="button">Compartir video</button>
      <button data-copy-summary type="button">Copiar resumen</button>
      <button data-whatsapp type="button">WhatsApp texto</button>
    </div>
    <div class="report-box"><strong>Estado de audio</strong><p>${state.micStream ? "Video con audio de micrófono." : "Micrófono no activo."}<br>Video con sonidos de app cuando el navegador lo permite.<br>La salida/monitoreo en vivo puede depender del dispositivo.</p></div>
    <div class="report-box"><strong>Historial</strong><ol class="history-list">${state.game.history.map((play) => `<li>${escapeHtml(formatClock(play.remainingSeconds))} · ${escapeHtml(play.text)}</li>`).join("")}</ol></div>
  `);
  els.reportModal.showModal();
  els.reportModal.dataset.summary = summary;
}

function buildSummary() {
  return `🏀 Go Basket Studio Live\n${scoreLine()}\nDuración: ${Math.round(state.game.durationSeconds / 60)} min\nJugadas: ${state.game.history.length}`;
}

function downloadVideo() {
  if (!state.recordedUrl) return alert("Aún no hay video generado.");
  const link = document.createElement("a");
  link.href = state.recordedUrl;
  link.download = "go-basket-studio-partido.webm";
  document.body.append(link);
  link.click();
  link.remove();
}

async function shareVideo() {
  if (state.recordedFile && navigator.canShare?.({ files: [state.recordedFile] })) {
    try {
      await navigator.share({ files: [state.recordedFile], title: "Go Basket Studio Live", text: buildSummary() });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  alert("Este navegador no permite compartir el archivo directamente. Descarga el video o comparte el resumen por WhatsApp.");
}

function finishGame() {
  stopClock("FINAL");
  state.game.finished = true;
  const text = `Juego finalizado. Resultado final: ${scoreLine()}.`;
  recordPlay({ type: "final", text, prompt: text });
  playSound("final");
  if (state.game.recording) stopRecording();
  else openReport();
  render();
}

function modalShell(title, body) {
  return `<div class="modal-head"><h2>${escapeHtml(title)}</h2><button class="close-btn" data-close-modal type="button">×</button></div>${body}`;
}

function bindEvents() {
  els.retryPermissionsBtn.addEventListener("click", requestMedia);
  els.timerBtn.addEventListener("click", toggleTimer);
  els.scoreBtn.addEventListener("click", openScoreModal);
  els.foulBtn.addEventListener("click", openFoulModal);
  els.recordBtn.addEventListener("click", toggleRecording);
  els.tvBtn.addEventListener("click", openTvModal);
  els.settingsBtn.addEventListener("click", openSettings);

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]")) event.target.closest("dialog")?.close();
    const pauseOnly = event.target.closest("[data-pause='only']");
    if (pauseOnly) { stopClock("PAUSADO"); els.actionModal.close(); render(); }
    const timeout = event.target.closest("[data-timeout]");
    if (timeout) { requestTimeout(timeout.dataset.timeout); els.actionModal.close(); }
    const scoreTeam = event.target.closest("[data-score-team]");
    if (scoreTeam) renderScoreStep(scoreTeam.dataset.scoreTeam);
    const scorePoints = event.target.closest("[data-score-points]");
    if (scorePoints) openPlayerPick({ team: scorePoints.dataset.team, points: Number(scorePoints.dataset.scorePoints), type: "score" });
    const foulTeam = event.target.closest("[data-foul-team]");
    if (foulTeam) openPlayerPick({ team: foulTeam.dataset.foulTeam, type: "foul" });
    const player = event.target.closest("[data-player]");
    if (player) player.dataset.type === "score" ? applyScore(player.dataset.team, Number(player.dataset.points), player.dataset.player) : applyFoul(player.dataset.team, player.dataset.player);
    if (event.target.closest("[data-tv-clean]")) { state.game.tvClean = !state.game.tvClean; els.actionModal.close(); render(); }
    if (event.target.closest("[data-tv-window]")) openTvWindow();
    if (event.target.closest("[data-tv-fullscreen]")) document.documentElement.requestFullscreen?.();
    if (event.target.closest("[data-tv-presentation]")) startPresentationMode();
    if (event.target.closest("[data-intro-next]")) { state.introIndex += 1; showIntro(); }
    const introTeam = event.target.closest("[data-intro-team]");
    if (introTeam) startIntro(introTeam.dataset.introTeam);
    if (event.target.closest("[data-intro-close]")) closeIntro();
    if (event.target.closest("[data-view-video]")) $(".report-video", els.reportModal)?.play?.();
    if (event.target.closest("[data-download-video]")) downloadVideo();
    if (event.target.closest("[data-share-video]")) shareVideo();
    if (event.target.closest("[data-copy-summary]")) navigator.clipboard?.writeText(els.reportModal.dataset.summary || buildSummary());
    if (event.target.closest("[data-whatsapp]")) window.open(`https://wa.me/?text=${encodeURIComponent(buildSummary())}`, "_blank", "noopener");
  });

  window.addEventListener("popstate", () => {
    if (state.game.started && !state.game.finished && !confirm("Hay un partido en curso. ¿Quieres salir al menú?")) {
      history.pushState({ live: true }, "", "#live");
    }
  });

  document.addEventListener("touchstart", (event) => { state.touchStartY = event.touches?.[0]?.clientY || 0; }, { passive: true });
  document.addEventListener("touchmove", (event) => {
    const scrollable = event.target.closest?.("dialog, input, textarea, select, .settings-modal, .report-modal");
    const y = event.touches?.[0]?.clientY || 0;
    if (!scrollable && window.scrollY <= 0 && y > state.touchStartY) event.preventDefault();
  }, { passive: false });
}

async function requestWakeLock() {
  try { state.wakeLock = await navigator.wakeLock?.request("screen"); } catch {}
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}

loadLocal();
bindEvents();
history.replaceState({ live: true }, "", "#live");
render();
requestMedia();
registerServiceWorker();
