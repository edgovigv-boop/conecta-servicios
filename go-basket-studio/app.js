const STORE_KEY = "go-basket-studio-stable-live:v2";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const DEFAULT_PROMPT = "Go Basket Studio en vivo. Cámara y marcador listos.";
const PRESETS = {
  basket_fiba: { sport: "Básquet", periodCount: 4, periodDurationMinutes: 10, periodLabel: "Periodo", timeoutsPerPeriod: 2 },
  basket_nba: { sport: "Básquet", periodCount: 4, periodDurationMinutes: 12, periodLabel: "Cuarto", timeoutsPerPeriod: 2 },
  soccer: { sport: "Fútbol", periodCount: 2, periodDurationMinutes: 45, periodLabel: "Tiempo", timeoutsPerPeriod: 0 },
  football: { sport: "Fútbol americano", periodCount: 4, periodDurationMinutes: 15, periodLabel: "Cuarto", timeoutsPerPeriod: 3 },
  volleyball: { sport: "Voleibol", periodCount: 5, periodDurationMinutes: 25, periodLabel: "Set", timeoutsPerPeriod: 2 },
  cascarita: { sport: "Personalizado", periodCount: 1, periodDurationMinutes: 20, periodLabel: "Tiempo", timeoutsPerPeriod: 0 },
  custom: { sport: "Personalizado", periodCount: 1, periodDurationMinutes: 10, periodLabel: "Periodo", timeoutsPerPeriod: 2 },
};

const state = {
  cameraStream: null,
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
  lastTickAt: null,
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
  exitTvBtn: $("#exitTvBtn"),
  controlDock: $("#controlDock"),
  timerBtn: $("#timerBtn"),
  scoreBtn: $("#scoreBtn"),
  foulBtn: $("#foulBtn"),
  playersBtn: $("#playersBtn"),
  recordBtn: $("#recordBtn"),
  tvBtn: $("#tvBtn"),
  settingsBtn: $("#settingsBtn"),
  actionModal: $("#actionModal"),
  settingsModal: $("#settingsModal"),
  reportModal: $("#reportModal"),
};

function createDefaultGame() {
  return {
    sport: "Básquet",
    eventName: "Partido en vivo",
    teamA: "Equipo Azul",
    teamB: "Equipo Rojo",
    logoA: "A",
    logoB: "B",
    scoreA: 0,
    scoreB: 0,
    foulsA: 0,
    foulsB: 0,
    timeoutsA: 2,
    timeoutsB: 2,
    timeoutsPerPeriod: 2,
    periodCount: 4,
    periodDurationMinutes: 10,
    periodLabel: "Periodo",
    currentPeriod: 1,
    durationSeconds: 600,
    remainingSeconds: 600,
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
    prompt: DEFAULT_PROMPT,
    status: "PAUSADO",
  };
}

function normalizeGame(saved) {
  const defaults = createDefaultGame();
  const game = { ...defaults, ...saved };
  game.players = {
    A: Array.isArray(saved?.players?.A) ? saved.players.A : [],
    B: Array.isArray(saved?.players?.B) ? saved.players.B : [],
  };
  game.history = Array.isArray(saved?.history) ? saved.history : [];
  game.periodCount = clampNumber(game.periodCount, 1, 12, defaults.periodCount);
  game.periodDurationMinutes = clampNumber(game.periodDurationMinutes, 1, 120, defaults.periodDurationMinutes);
  game.durationSeconds = game.periodDurationMinutes * 60;
  game.remainingSeconds = clampNumber(game.remainingSeconds, 0, game.durationSeconds, game.durationSeconds);
  game.currentPeriod = clampNumber(game.currentPeriod, 1, game.periodCount, 1);
  game.timeoutsPerPeriod = clampNumber(game.timeoutsPerPeriod, 0, 9, defaults.timeoutsPerPeriod);
  game.timeoutUsage = game.timeoutUsage || {};
  game.prompt = game.prompt || DEFAULT_PROMPT;
  game.status = game.status || "PAUSADO";
  return game;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function saveLocal() {
  const payload = { ...state.game, history: state.game.history.slice(0, 120) };
  localStorage.setItem(STORE_KEY, JSON.stringify(payload));
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    state.game = normalizeGame(JSON.parse(raw));
  } catch (error) {
    console.warn("No se pudo cargar configuración local", error);
  }
}

function formatClock(totalSeconds) {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60).toString().padStart(2, "0");
  const seconds = Math.floor(Math.max(0, totalSeconds) % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function periodTitle(period = state.game.currentPeriod) {
  const label = state.game.periodLabel || "Periodo";
  return `${label} ${period}`;
}

function timeoutsUsed(team, period = state.game.currentPeriod) {
  return state.game.timeoutUsage?.[period]?.[team] || 0;
}

function timeoutsRemaining(team, period = state.game.currentPeriod) {
  return Math.max(0, state.game.timeoutsPerPeriod - timeoutsUsed(team, period));
}

function getTeamName(team) {
  return team === "A" ? state.game.teamA : state.game.teamB;
}

function getTeamScore(team) {
  return team === "A" ? state.game.scoreA : state.game.scoreB;
}

function scoreLine() {
  return `${state.game.teamA} ${state.game.scoreA} - ${state.game.teamB} ${state.game.scoreB}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function renderLogo(element, value, fallback) {
  if (value?.startsWith("data:") || value?.startsWith("blob:")) {
    element.innerHTML = `<img src="${value}" alt="Logo">`;
    return;
  }
  element.textContent = (value || fallback || "?").slice(0, 3).toUpperCase();
}

function render() {
  const game = state.game;
  game.durationSeconds = game.periodDurationMinutes * 60;
  els.teamAName.textContent = game.teamA;
  els.teamBName.textContent = game.teamB;
  renderLogo(els.teamALogo, game.logoA, "A");
  renderLogo(els.teamBLogo, game.logoB, "B");
  els.scoreA.textContent = game.scoreA;
  els.scoreB.textContent = game.scoreB;
  els.foulsA.textContent = game.foulsA;
  els.foulsB.textContent = game.foulsB;
  game.timeoutsA = timeoutsRemaining("A");
  game.timeoutsB = timeoutsRemaining("B");
  els.timeoutsA.textContent = game.timeoutsA;
  els.timeoutsB.textContent = game.timeoutsB;
  els.clock.textContent = formatClock(game.remainingSeconds);
  els.periodLabel.textContent = periodTitle();
  els.liveStatus.textContent = game.finished ? "FINAL" : game.running ? "EN VIVO" : game.status || "PAUSADO";
  els.promptText.textContent = game.prompt;
  els.teleprompter.hidden = !game.teleprompterVisible;
  els.micStatus.textContent = state.micStream ? "Micrófono activo" : "Micrófono desactivado";
  els.recordStatus.textContent = game.recording ? "Grabación activa" : state.recordedUrl ? "Video listo" : "Grabación inactiva";
  els.recordStatus.classList.toggle("record-dot", game.recording);
  els.lastPlay.textContent = `Última jugada: ${game.history[0]?.text || "listo para iniciar"}`;
  els.timerBtn.textContent = timerButtonLabel();
  els.recordBtn.textContent = game.recording ? "Detener" : "Grabar";
  els.app.classList.toggle("recording", game.recording);
  els.app.classList.toggle("tv-clean", game.tvClean);
  els.exitTvBtn.hidden = !game.tvClean;
  syncTvWindow();
  saveLocal();
}

function timerButtonLabel() {
  const game = state.game;
  if (game.finished) return "Final";
  if (!game.started) return "Iniciar";
  if (game.running) return "Pausa/TO";
  if (game.remainingSeconds === 0 && game.currentPeriod < game.periodCount) return "Siguiente";
  return "Reanudar";
}

async function requestMedia() {
  els.permissionCard.hidden = true;
  await Promise.allSettled([requestCamera(), requestMicrophone()]);
  if (!state.cameraStream) {
    els.permissionMessage.textContent = "No se pudo activar la cámara. Revisa permisos del navegador y vuelve a intentar.";
    els.permissionCard.hidden = false;
  } else if (!state.micStream) {
    setPrompt("Cámara activa. Micrófono desactivado; puedes activarlo desde este botón o desde permisos del navegador.");
  }
  render();
}

async function requestCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("getUserMedia no disponible");
  }
  if (state.cameraStream) return state.cameraStream;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    state.cameraStream = stream;
    els.video.srcObject = stream;
    await els.video.play();
    return stream;
  } catch (error) {
    console.warn("Cámara no disponible", error);
    throw error;
  }
}

async function requestMicrophone() {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("getUserMedia no disponible");
  if (state.micStream) return state.micStream;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    state.micStream = stream;
    state.game.microphoneEnabled = true;
    connectMicrophoneToRecorder();
    setPrompt("Micrófono activo para grabación. La salida en vivo puede depender del dispositivo.");
    return stream;
  } catch (error) {
    console.warn("Micrófono no disponible", error);
    state.game.microphoneEnabled = false;
    setPrompt("Micrófono desactivado. Puedes activarlo después desde el botón de permisos.");
    return null;
  }
}

function ensureAudio() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!state.audioContext) state.audioContext = new AudioCtor();
  if (!state.audioDestination) state.audioDestination = state.audioContext.createMediaStreamDestination();
  if (state.audioContext.state === "suspended") void state.audioContext.resume();
  return state.audioContext;
}

function connectMicrophoneToRecorder() {
  if (!state.micStream?.getAudioTracks().length) return;
  const audio = ensureAudio();
  if (!audio || state.micSource) return;
  state.micSource = audio.createMediaStreamSource(state.micStream);
  state.micSource.connect(state.audioDestination);
}

function playSound(type = "beep") {
  const audio = ensureAudio();
  if (!audio) return;
  const out = audio.createGain();
  out.gain.setValueAtTime(0.001, audio.currentTime);
  out.gain.exponentialRampToValueAtTime(type === "timeout" ? 0.28 : 0.16, audio.currentTime + 0.02);
  out.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.35);
  out.connect(audio.destination);
  out.connect(state.audioDestination);

  const osc = audio.createOscillator();
  osc.type = type === "foul" ? "sawtooth" : "triangle";
  osc.frequency.setValueAtTime(type === "timeout" ? 880 : 620, audio.currentTime);
  osc.connect(out);
  osc.start();
  osc.stop(audio.currentTime + 0.36);
}

function setPrompt(text) {
  state.game.prompt = text;
  if (els.promptText) els.promptText.textContent = text;
  syncTvWindow();
}

function tick() {
  const game = state.game;
  if (!game.running) return;
  const now = Date.now();
  if (!state.lastTickAt) state.lastTickAt = now;
  const diff = Math.floor((now - state.lastTickAt) / 1000);
  if (diff < 1) return;
  state.lastTickAt += diff * 1000;
  game.remainingSeconds = Math.max(0, game.remainingSeconds - diff);
  if (game.remainingSeconds === 0) finishPeriodOrGame();
  render();
}

function startTimerLoop() {
  setInterval(tick, 250);
}

function toggleTimer() {
  const game = state.game;
  if (game.finished) return openReport();
  if (!game.started) {
    game.started = true;
    game.running = true;
    game.status = "EN VIVO";
    state.lastTickAt = Date.now();
    setPrompt(`${periodTitle()} iniciado. Marcador ${scoreLine()}.`);
    playSound("beep");
    return render();
  }
  if (game.running) return openPauseModal();
  if (game.remainingSeconds === 0 && game.currentPeriod < game.periodCount) return nextPeriod();
  game.running = true;
  game.status = "EN VIVO";
  state.lastTickAt = Date.now();
  setPrompt(`${periodTitle()} reanudado. Marcador ${scoreLine()}.`);
  render();
}

function pauseOnly() {
  state.game.running = false;
  state.game.status = "PAUSADO";
  state.lastTickAt = null;
  setPrompt(`Reloj pausado. Marcador ${scoreLine()}.`);
  render();
  closeActionModal();
}

function finishPeriodOrGame() {
  const game = state.game;
  game.running = false;
  state.lastTickAt = null;
  if (game.currentPeriod >= game.periodCount) {
    finishGame();
    return;
  }
  game.status = `FIN DEL ${periodTitle().toUpperCase()}`;
  const prompt = `Fin del ${periodTitle()}. Marcador ${scoreLine()}.`;
  setPrompt(prompt);
  recordPlay({ type: "periodEnd", text: prompt, prompt, eventColor: "#f59e0b" });
  playSound("timeout");
}

function nextPeriod() {
  const game = state.game;
  if (game.currentPeriod >= game.periodCount) return finishGame();
  game.currentPeriod += 1;
  game.remainingSeconds = game.periodDurationMinutes * 60;
  game.running = false;
  game.started = true;
  game.status = "PAUSADO";
  state.lastTickAt = null;
  setPrompt(`${periodTitle()} listo para iniciar. Marcador ${scoreLine()}.`);
  closeActionModal();
  render();
}

function resetCurrentPeriod() {
  const game = state.game;
  game.running = false;
  game.remainingSeconds = game.periodDurationMinutes * 60;
  game.status = "PAUSADO";
  state.lastTickAt = null;
  setPrompt(`${periodTitle()} reiniciado. Marcador ${scoreLine()}.`);
  closeActionModal();
  render();
}

function finishGame() {
  const game = state.game;
  game.running = false;
  game.finished = true;
  game.status = "FINAL";
  state.lastTickAt = null;
  const prompt = `Juego finalizado. Resultado final: ${scoreLine()}.`;
  setPrompt(prompt);
  recordPlay({ type: "final", text: prompt, prompt, eventColor: "#f97316" });
  playSound("timeout");
  render();
  closeActionModal();
  openReport();
}

function openPauseModal() {
  const game = state.game;
  openActionModal(`
    <form method="dialog" class="modal-card">
      <h2>Pausa, tiempo fuera o periodo</h2>
      <p>El reloj está corriendo. Elige una acción rápida.</p>
      <div class="choice-grid">
        <button type="button" data-action="pause-only">Pausar solamente</button>
        <button type="button" data-action="timeout" data-team="A">Tiempo fuera ${escapeHtml(game.teamA)} (${timeoutsRemaining("A")})</button>
        <button type="button" data-action="timeout" data-team="B">Tiempo fuera ${escapeHtml(game.teamB)} (${timeoutsRemaining("B")})</button>
        <button type="button" data-action="reset-period">Reiniciar periodo</button>
        <button type="button" data-action="next-period">Iniciar siguiente periodo</button>
        <button type="button" data-action="finish-game">Finalizar partido</button>
      </div>
      <button class="ghost" value="cancel">Cerrar</button>
    </form>
  `);
}

function requestTimeout(team) {
  const game = state.game;
  const period = game.currentPeriod;
  const teamName = getTeamName(team);
  if (timeoutsRemaining(team, period) <= 0) {
    setPrompt(`${teamName} ya no tiene tiempos fuera disponibles en este periodo.`);
    render();
    return;
  }
  game.running = false;
  game.status = "TIEMPO FUERA";
  game.timeoutUsage[period] = game.timeoutUsage[period] || { A: 0, B: 0 };
  game.timeoutUsage[period][team] = (game.timeoutUsage[period][team] || 0) + 1;
  state.lastTickAt = null;
  const remaining = timeoutsRemaining(team, period);
  const prompt = `Tiempo fuera por parte del equipo ${teamName}.`;
  setPrompt(prompt);
  recordPlay({ type: "timeout", team, text: `Tiempo fuera por parte del equipo ${teamName}`, prompt, eventColor: "#38bdf8", timeoutRemaining: remaining });
  playSound("timeout");
  closeActionModal();
  render();
}

function openScoreModal() {
  openTeamModal("Anotar punto", "Elige el equipo que suma un punto.", (team) => renderPlayerPick(team, "score"));
}

function openFoulModal() {
  openTeamModal("Registrar falta", "Elige el equipo al que se le marca la falta.", (team) => renderPlayerPick(team, "foul"));
}

function openTeamModal(title, body, callback) {
  openActionModal(`
    <form method="dialog" class="modal-card">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(body)}</p>
      <div class="choice-grid two-cols">
        <button type="button" data-action="choose-team" data-team="A">${escapeHtml(state.game.teamA)}</button>
        <button type="button" data-action="choose-team" data-team="B">${escapeHtml(state.game.teamB)}</button>
      </div>
      <button class="ghost" value="cancel">Cancelar</button>
    </form>
  `);
  els.actionModal._teamCallback = callback;
}

function renderPlayerPick(team, mode) {
  const players = state.game.players[team] || [];
  const title = mode === "score" ? "¿Quién anotó el punto?" : "¿Quién cometió la falta?";
  const buttons = players.map((player) => `
    <button type="button" class="player-choice" data-action="apply-${mode}" data-team="${team}" data-player-id="${player.id}">
      <strong>#${escapeHtml(player.number || "-")} ${escapeHtml(player.name || "Jugador")}</strong>
      <span>${escapeHtml(getTeamName(team))} · ${player.points || 0} pts · ${player.fouls || 0} faltas</span>
    </button>
  `).join("");
  openActionModal(`
    <form method="dialog" class="modal-card player-pick-card">
      <h2>${title}</h2>
      <p>${escapeHtml(getTeamName(team))}</p>
      <div class="player-choice-list">
        ${buttons || `<p class="empty-state">No hay jugadores registrados. Puedes asignar la jugada al equipo completo.</p>`}
        <button type="button" class="player-choice team-wide" data-action="apply-${mode}" data-team="${team}" data-player-id="">
          <strong>Equipo completo / sin jugador</strong>
          <span>${escapeHtml(getTeamName(team))}</span>
        </button>
      </div>
      <button class="ghost" value="cancel">Cancelar</button>
    </form>
  `);
}

function findPlayer(team, id) {
  return (state.game.players[team] || []).find((player) => player.id === id) || null;
}

function applyScore(team, playerId) {
  const game = state.game;
  const player = findPlayer(team, playerId);
  if (team === "A") game.scoreA += 1;
  else game.scoreB += 1;
  if (player) player.points = (player.points || 0) + 1;
  const teamName = getTeamName(team);
  const prompt = player
    ? `Punto para ${teamName}, por parte de ${player.name}, número ${player.number || "sin número"}. Marcador: ${scoreLine()}.`
    : `Punto para ${teamName}. Marcador: ${scoreLine()}.`;
  setPrompt(prompt);
  recordPlay({ type: "score", team, player, points: 1, text: prompt, prompt, eventColor: "#22c55e" });
  if (game.scoreA === game.scoreB) setPrompt(`${prompt} El partido está empatado.`);
  playSound("score");
  closeActionModal();
  render();
}

function applyFoul(team, playerId) {
  const game = state.game;
  const player = findPlayer(team, playerId);
  if (team === "A") game.foulsA += 1;
  else game.foulsB += 1;
  if (player) player.fouls = (player.fouls || 0) + 1;
  const teamName = getTeamName(team);
  const prompt = player
    ? `Falta de ${player.name}, número ${player.number || "sin número"}. ${teamName} suma ${getTeamFouls(team)} faltas de equipo.`
    : `Falta del equipo ${teamName}. ${teamName} suma ${getTeamFouls(team)} faltas de equipo.`;
  setPrompt(prompt);
  recordPlay({ type: "foul", team, player, fouls: 1, text: prompt, prompt, eventColor: "#ef4444" });
  playSound("foul");
  closeActionModal();
  render();
}

function getTeamFouls(team) {
  return team === "A" ? state.game.foulsA : state.game.foulsB;
}

function recordPlay(payload) {
  const game = state.game;
  const elapsedInPeriod = game.durationSeconds - game.remainingSeconds;
  const record = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    type: payload.type,
    team: payload.team || "",
    teamName: payload.team ? getTeamName(payload.team) : "",
    playerId: payload.player?.id || "",
    playerName: payload.player?.name || "",
    playerNumber: payload.player?.number || "",
    points: payload.points || 0,
    fouls: payload.fouls || 0,
    scoreA: game.scoreA,
    scoreB: game.scoreB,
    foulsA: game.foulsA,
    foulsB: game.foulsB,
    remainingSeconds: game.remainingSeconds,
    elapsedGameSeconds: Math.max(0, elapsedInPeriod + (game.currentPeriod - 1) * game.durationSeconds),
    period: game.currentPeriod,
    periodLabel: periodTitle(),
    text: payload.text || payload.prompt || "Jugada registrada",
    prompt: payload.prompt || payload.text || "Jugada registrada",
    eventColor: payload.eventColor || "#f97316",
    eventLabel: payload.eventLabel || payload.type,
    recordingTimeMs: state.recordingStartedAt ? Date.now() - state.recordingStartedAt : null,
    timeoutRemaining: payload.timeoutRemaining,
    createdAt: new Date().toISOString(),
  };
  game.history.unshift(record);
  game.history = game.history.slice(0, 180);
  return record;
}

function openPlayersPanel() {
  const teamSection = (team) => {
    const players = state.game.players[team] || [];
    return `
      <section class="players-block">
        <h3>${escapeHtml(getTeamName(team))}</h3>
        <div class="player-stat-list">
          ${players.map((player) => `
            <article class="player-stat-row">
              <span>#${escapeHtml(player.number || "-")} ${escapeHtml(player.name || "Jugador")}</span>
              <b>${player.points || 0} pts</b>
              <b>${player.fouls || 0} faltas</b>
            </article>
          `).join("") || `<p class="empty-state">Sin jugadores registrados.</p>`}
        </div>
      </section>
    `;
  };
  openActionModal(`
    <form method="dialog" class="modal-card players-panel-card">
      <h2>Jugadores y estadísticas rápidas</h2>
      <p>Consulta puntos y faltas sin salir de la transmisión.</p>
      ${teamSection("A")}
      ${teamSection("B")}
      <div class="choice-grid two-cols">
        <button type="button" data-action="intro-all">Presentar todos</button>
        <button type="button" data-action="intro-team" data-team="A">Presentar ${escapeHtml(state.game.teamA)}</button>
        <button type="button" data-action="intro-team" data-team="B">Presentar ${escapeHtml(state.game.teamB)}</button>
        <button type="button" data-action="settings">Editar jugadores</button>
      </div>
      <button class="ghost" value="cancel">Cerrar</button>
    </form>
  `);
}

function openSettings() {
  const game = state.game;
  els.settingsModal.innerHTML = `
    <form id="settingsForm" class="modal-card settings-card">
      <h2>Configuración / Datos del partido</h2>
      <p>Todo se edita sobre la misma pantalla. Puedes desplazarte dentro de este panel.</p>

      <section class="settings-section">
        <h3>Datos generales</h3>
        <label>Nombre del evento<input name="eventName" value="${escapeHtml(game.eventName)}" /></label>
        <label>Deporte / preset
          <select name="preset" id="presetSelect">
            <option value="basket_fiba">Básquet FIBA · 4x10</option>
            <option value="basket_nba">Básquet NBA · 4x12</option>
            <option value="soccer">Fútbol · 2x45</option>
            <option value="football">Fútbol americano · 4x15</option>
            <option value="volleyball">Voleibol</option>
            <option value="cascarita">Cascarita · 1x20</option>
            <option value="custom" selected>Personalizado</option>
          </select>
        </label>
        <label>Nombre Equipo A<input name="teamA" value="${escapeHtml(game.teamA)}" /></label>
        <label>Logo Equipo A
          <input name="logoAFile" type="file" accept="image/*" />
          <div id="logoAPreview" class="logo-preview">${logoPreviewHtml(game.logoA, "A")}</div>
        </label>
        <label>Nombre Equipo B<input name="teamB" value="${escapeHtml(game.teamB)}" /></label>
        <label>Logo Equipo B
          <input name="logoBFile" type="file" accept="image/*" />
          <div id="logoBPreview" class="logo-preview">${logoPreviewHtml(game.logoB, "B")}</div>
        </label>
      </section>

      <section class="settings-section settings-grid">
        <h3>Tiempo y periodos</h3>
        <label>Número de periodos<input name="periodCount" type="number" min="1" max="12" value="${game.periodCount}" /></label>
        <label>Duración por periodo (min)<input name="periodDurationMinutes" type="number" min="1" max="120" value="${game.periodDurationMinutes}" /></label>
        <label>Nombre del periodo
          <select name="periodLabel">
            ${["Periodo", "Cuarto", "Tiempo", "Set", "Parte"].map((label) => `<option ${game.periodLabel === label ? "selected" : ""}>${label}</option>`).join("")}
          </select>
        </label>
        <label>Tiempos fuera por equipo / periodo<input name="timeoutsPerPeriod" type="number" min="0" max="9" value="${game.timeoutsPerPeriod}" /></label>
      </section>

      <section class="settings-section">
        <div class="section-heading-row">
          <h3>Jugadores ${escapeHtml(game.teamA)}</h3>
          <button type="button" data-action="add-player" data-team="A">Agregar jugador</button>
        </div>
        <div id="playersAEditor" class="players-editor">${playersEditorHtml("A")}</div>
      </section>

      <section class="settings-section">
        <div class="section-heading-row">
          <h3>Jugadores ${escapeHtml(game.teamB)}</h3>
          <button type="button" data-action="add-player" data-team="B">Agregar jugador</button>
        </div>
        <div id="playersBEditor" class="players-editor">${playersEditorHtml("B")}</div>
      </section>

      <div class="modal-actions sticky-actions">
        <button type="submit">Guardar configuración</button>
        <button type="button" data-action="reset-match" class="danger-soft">Restablecer partido</button>
        <button type="button" data-action="intro-all">Presentar jugadores</button>
        <button type="button" data-action="close-settings" class="ghost">Cerrar</button>
      </div>
    </form>
  `;
  openDialog(els.settingsModal);
  bindSettingsEditors();
}

function logoPreviewHtml(value, fallback) {
  if (value?.startsWith("data:") || value?.startsWith("blob:")) return `<img src="${value}" alt="Logo ${fallback}">`;
  return `<span>${escapeHtml(value || fallback)}</span>`;
}

function playersEditorHtml(team) {
  const players = state.game.players[team] || [];
  return players.map((player) => playerEditorRow(team, player)).join("") || `<p class="empty-state">Agrega jugadores para asignar puntos, faltas y presentaciones.</p>`;
}

function playerEditorRow(team, player = makePlayer(team)) {
  return `
    <article class="player-editor" data-player-row data-team="${team}" data-id="${player.id}">
      <div class="player-photo-preview">${player.photo ? `<img src="${player.photo}" alt="${escapeHtml(player.name)}">` : `<span>#${escapeHtml(player.number || "?")}</span>`}</div>
      <label>Nombre<input data-field="name" value="${escapeHtml(player.name)}" placeholder="José Luis" /></label>
      <label>Número<input data-field="number" value="${escapeHtml(player.number)}" placeholder="13" /></label>
      <label>Posición<input data-field="position" value="${escapeHtml(player.position)}" placeholder="Base, Poste, Portero..." /></label>
      <label>Procedencia<input data-field="origin" value="${escapeHtml(player.origin)}" placeholder="Mexicaltzingo" /></label>
      <label>Dato extra<input data-field="extra" value="${escapeHtml(player.extra)}" placeholder="Capitán, mejor tirador..." /></label>
      <label>Foto<input data-field="photo" type="file" accept="image/*" /></label>
      <button type="button" data-action="remove-player" data-team="${team}" data-id="${player.id}" class="danger-soft">Eliminar</button>
    </article>
  `;
}

function makePlayer(team) {
  return { id: crypto.randomUUID ? crypto.randomUUID() : `${team}-${Date.now()}-${Math.random()}`, team, name: "", number: "", position: "", origin: "", extra: "", photo: "", points: 0, fouls: 0 };
}

function bindSettingsEditors() {
  const form = $("#settingsForm", els.settingsModal);
  form.onsubmit = saveSettings;
  els.settingsModal.onclick = settingsClick;
  els.settingsModal.onchange = settingsChange;
}

async function settingsChange(event) {
  const target = event.target;
  if (target.id === "presetSelect") applyPresetToForm(target.value);
  if (target.name === "logoAFile" || target.name === "logoBFile") {
    const preview = target.name === "logoAFile" ? $("#logoAPreview") : $("#logoBPreview");
    const dataUrl = await resizeImageFile(target.files?.[0]);
    if (dataUrl) preview.innerHTML = `<img src="${dataUrl}" alt="Vista previa">`;
  }
  if (target.dataset.field === "photo") {
    const row = target.closest("[data-player-row]");
    const dataUrl = await resizeImageFile(target.files?.[0], 500);
    if (dataUrl) row.dataset.photo = dataUrl;
    const preview = $(".player-photo-preview", row);
    if (preview && dataUrl) preview.innerHTML = `<img src="${dataUrl}" alt="Foto jugador">`;
  }
}

function applyPresetToForm(key) {
  const preset = PRESETS[key];
  if (!preset) return;
  const form = $("#settingsForm", els.settingsModal);
  form.periodCount.value = preset.periodCount;
  form.periodDurationMinutes.value = preset.periodDurationMinutes;
  form.periodLabel.value = preset.periodLabel;
  form.timeoutsPerPeriod.value = preset.timeoutsPerPeriod;
}

async function settingsClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "close-settings") closeDialog(els.settingsModal);
  if (action === "add-player") addPlayerEditor(button.dataset.team);
  if (action === "remove-player") button.closest("[data-player-row]")?.remove();
  if (action === "reset-match") resetMatchFromSettings();
  if (action === "intro-all") {
    await saveSettings(event, false);
    startIntro("all");
  }
}

function addPlayerEditor(team) {
  const container = $(`#players${team}Editor`, els.settingsModal);
  const empty = $(".empty-state", container);
  if (empty) empty.remove();
  container.insertAdjacentHTML("beforeend", playerEditorRow(team, makePlayer(team)));
}

async function saveSettings(event, close = true) {
  event?.preventDefault?.();
  const form = $("#settingsForm", els.settingsModal);
  if (!form) return;
  const logoAFile = form.logoAFile.files?.[0];
  const logoBFile = form.logoBFile.files?.[0];
  state.game.eventName = form.eventName.value.trim() || "Partido en vivo";
  state.game.sport = PRESETS[form.preset.value]?.sport || "Personalizado";
  state.game.teamA = form.teamA.value.trim() || "Equipo A";
  state.game.teamB = form.teamB.value.trim() || "Equipo B";
  state.game.periodCount = clampNumber(form.periodCount.value, 1, 12, 1);
  state.game.periodDurationMinutes = clampNumber(form.periodDurationMinutes.value, 1, 120, 10);
  state.game.periodLabel = form.periodLabel.value || "Periodo";
  state.game.timeoutsPerPeriod = clampNumber(form.timeoutsPerPeriod.value, 0, 9, 2);
  state.game.durationSeconds = state.game.periodDurationMinutes * 60;
  state.game.currentPeriod = clampNumber(state.game.currentPeriod, 1, state.game.periodCount, 1);
  state.game.remainingSeconds = Math.min(state.game.remainingSeconds, state.game.durationSeconds);
  if (!state.game.started || state.game.remainingSeconds === 0) state.game.remainingSeconds = state.game.durationSeconds;
  if (logoAFile) state.game.logoA = (await resizeImageFile(logoAFile)) || state.game.logoA;
  if (logoBFile) state.game.logoB = (await resizeImageFile(logoBFile)) || state.game.logoB;
  state.game.players.A = collectPlayers("A");
  state.game.players.B = collectPlayers("B");
  setPrompt(`Configuración guardada para ${state.game.eventName}. Marcador ${scoreLine()}.`);
  if (close) closeDialog(els.settingsModal);
  render();
}

function collectPlayers(team) {
  return $$(`[data-player-row][data-team="${team}"]`, els.settingsModal).map((row) => {
    const current = findPlayer(team, row.dataset.id) || makePlayer(team);
    const data = { ...current, id: row.dataset.id, team };
    $$('[data-field]', row).forEach((input) => {
      if (input.type === "file") return;
      data[input.dataset.field] = input.value.trim();
    });
    if (row.dataset.photo) data.photo = row.dataset.photo;
    data.points = Number(current.points || 0);
    data.fouls = Number(current.fouls || 0);
    return data;
  }).filter((player) => player.name || player.number);
}

async function resizeImageFile(file, maxSize = 640) {
  if (!file) return "";
  try {
    const dataUrl = await fileToDataUrl(file);
    const image = await loadImage(dataUrl);
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch (error) {
    console.warn("No se pudo cargar imagen", error);
    alert("No se pudo cargar el logo o foto. Intenta con otra imagen.");
    return "";
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function resetMatchFromSettings() {
  if (!confirm("¿Restablecer marcador, faltas, tiempos fuera, historial y reloj?")) return;
  resetMatch();
  closeDialog(els.settingsModal);
}

function resetMatch() {
  const game = state.game;
  game.scoreA = 0;
  game.scoreB = 0;
  game.foulsA = 0;
  game.foulsB = 0;
  game.currentPeriod = 1;
  game.durationSeconds = game.periodDurationMinutes * 60;
  game.remainingSeconds = game.durationSeconds;
  game.running = false;
  game.started = false;
  game.finished = false;
  game.status = "PAUSADO";
  game.timeoutUsage = {};
  game.history = [];
  ["A", "B"].forEach((team) => (game.players[team] || []).forEach((player) => { player.points = 0; player.fouls = 0; }));
  state.lastTickAt = null;
  setPrompt("Partido restablecido. Cámara y marcador listos.");
  render();
}

function startIntro(scope = "all") {
  const teams = scope === "all" ? ["A", "B"] : [scope];
  state.introQueue = teams.flatMap((team) => (state.game.players[team] || []).map((player) => ({ team, player })));
  state.introIndex = 0;
  if (!state.introQueue.length) {
    setPrompt("No hay jugadores registrados para presentar.");
    render();
    return;
  }
  closeDialog(els.actionModal);
  showIntro();
}

function showIntro() {
  const entry = state.introQueue[state.introIndex];
  if (!entry) return closeIntro();
  const { team, player } = entry;
  state.currentIntro = entry;
  const phrase = buildIntroPhrase(team, player);
  setPrompt(phrase);
  els.introOverlay.hidden = false;
  els.introOverlay.innerHTML = `
    <article class="intro-card-live">
      <div class="intro-photo">${player.photo ? `<img src="${player.photo}" alt="${escapeHtml(player.name)}">` : `<span>#${escapeHtml(player.number || "?")}</span>`}</div>
      <p>${escapeHtml(getTeamName(team))}</p>
      <h2>${escapeHtml(player.name || "Jugador")}</h2>
      <strong>Número ${escapeHtml(player.number || "-")}</strong>
      <small>${escapeHtml([player.position, player.origin, player.extra].filter(Boolean).join(" · "))}</small>
      <div class="intro-controls">
        <button type="button" data-intro="prev">Anterior</button>
        <button type="button" data-intro="next">Siguiente</button>
        <button type="button" data-intro="teamA">Equipo A</button>
        <button type="button" data-intro="teamB">Equipo B</button>
        <button type="button" data-intro="all">Todos</button>
        <button type="button" data-intro="close">Cerrar presentación</button>
      </div>
    </article>
  `;
  recordPlay({ type: "playerIntro", team, player, text: phrase, prompt: phrase, eventColor: "#a855f7" });
  render();
}

function buildIntroPhrase(team, player) {
  const parts = [`Del equipo ${getTeamName(team)}`];
  if (player.number) parts.push(`con el número ${player.number}`);
  if (player.position) parts.push(`jugando en la posición de ${player.position}`);
  if (player.origin) parts.push(`originario de ${player.origin}`);
  if (player.extra) parts.push(player.extra);
  return `${parts.join(", ")}... ¡${player.name || "Jugador"}!`;
}

function nextIntro(delta = 1) {
  state.introIndex = Math.min(state.introQueue.length - 1, Math.max(0, state.introIndex + delta));
  showIntro();
}

function closeIntro() {
  state.currentIntro = null;
  state.introQueue = [];
  state.introIndex = 0;
  els.introOverlay.hidden = true;
  els.introOverlay.innerHTML = "";
  render();
}

function openTvPanel() {
  const presentationAvailable = "PresentationRequest" in window;
  openActionModal(`
    <form method="dialog" class="modal-card">
      <h2>Transmitir / TV</h2>
      <p>Para verlo en TV, duplica la pantalla del celular con Chromecast, AirPlay, Miracast o cable HDMI, o abre esta misma página en la TV.</p>
      <div class="choice-grid">
        <button type="button" data-action="toggle-tv-clean">${state.game.tvClean ? "Volver a controles" : "Modo TV limpio"}</button>
        <button type="button" data-action="open-tv-window">Abrir tablero en nueva pestaña</button>
        <button type="button" data-action="fullscreen">Pantalla completa</button>
        ${presentationAvailable ? `<button type="button" data-action="presentation">Enviar a pantalla (experimental)</button>` : `<button type="button" disabled>Presentation API no disponible: usa duplicar pantalla</button>`}
      </div>
      <button class="ghost" value="cancel">Cerrar</button>
    </form>
  `);
}

function toggleTvClean() {
  state.game.tvClean = !state.game.tvClean;
  closeActionModal();
  render();
}

function openTvWindow() {
  state.tvWindow = window.open("", "go-basket-studio-tv", "width=980,height=640");
  syncTvWindow();
}

function syncTvWindow() {
  if (!state.tvWindow || state.tvWindow.closed) return;
  const game = state.game;
  state.tvWindow.document.open();
  state.tvWindow.document.write(`<!doctype html><html><head><title>Go Basket Studio TV</title><style>
    body{margin:0;background:#070814;color:white;font-family:Inter,Arial,sans-serif;display:grid;min-height:100vh;place-items:center}
    .tv{width:min(92vw,1100px);background:linear-gradient(135deg,#111827,#050816);border:3px solid #f97316;border-radius:28px;padding:34px;box-shadow:0 30px 80px #0009}
    .score{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px}.team{text-align:center}.team b{font-size:clamp(72px,14vw,160px);display:block;color:#f8fafc}.team span{font-size:clamp(24px,4vw,48px);font-weight:900}.center{text-align:center}.center strong{font-size:clamp(46px,8vw,96px);display:block;color:#f97316}.meta{font-size:clamp(18px,3vw,32px);color:#cbd5e1}.prompt{margin-top:28px;padding:24px;border-radius:22px;background:#ffffff14;font-size:clamp(22px,4vw,44px);text-align:center;font-weight:800}
  </style></head><body><main class="tv"><section class="score"><div class="team"><span>${escapeHtml(game.teamA)}</span><b>${game.scoreA}</b><p class="meta">Faltas ${game.foulsA} · TO ${timeoutsRemaining("A")}</p></div><div class="center"><small>${escapeHtml(game.status)}</small><strong>${formatClock(game.remainingSeconds)}</strong><p class="meta">${escapeHtml(periodTitle())}</p></div><div class="team"><span>${escapeHtml(game.teamB)}</span><b>${game.scoreB}</b><p class="meta">Faltas ${game.foulsB} · TO ${timeoutsRemaining("B")}</p></div></section><section class="prompt">${escapeHtml(game.prompt)}</section></main></body></html>`);
  state.tvWindow.document.close();
}

async function enterFullscreen() {
  try {
    await els.app.requestFullscreen?.();
  } catch (error) {
    console.warn("Pantalla completa no disponible", error);
  }
}

async function startPresentationMode() {
  if (!("PresentationRequest" in window)) return;
  try {
    const request = new PresentationRequest([location.href]);
    await request.start();
  } catch (error) {
    alert("No fue posible enviar a pantalla. Usa duplicar pantalla con Chromecast, AirPlay, Miracast o cable HDMI.");
  }
}

async function toggleRecording() {
  if (state.game.recording) return stopRecording();
  if (!state.cameraStream) {
    await requestCamera().catch(() => null);
    if (!state.cameraStream) return alert("Tu navegador no permitió cámara. Puedes usar grabación de pantalla.");
  }
  await requestMicrophone().catch(() => null);
  try {
    state.recordingCanvas = document.createElement("canvas");
    state.recordingCanvas.width = 1280;
    state.recordingCanvas.height = 720;
    state.recordingContext = state.recordingCanvas.getContext("2d");
    const canvasStream = state.recordingCanvas.captureStream(30);
    const audioTracks = state.audioDestination?.stream?.getAudioTracks?.() || [];
    const stream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : "video/webm";
    state.chunks = [];
    state.recorder = new MediaRecorder(stream, { mimeType });
    state.recorder.ondataavailable = (event) => event.data.size && state.chunks.push(event.data);
    state.recorder.onstop = finalizeRecording;
    state.recordingStartedAt = Date.now();
    drawRecordingFrame();
    state.recorder.start(1000);
    state.game.recording = true;
    setPrompt("Grabación activa. Se capturan cámara, marcador, teleprompter y micrófono si el navegador lo permite.");
    playSound("beep");
    render();
  } catch (error) {
    console.warn("Grabación no disponible", error);
    alert("Tu navegador no permitió grabación completa. Puedes usar grabación de pantalla.");
  }
}

function stopRecording() {
  if (state.recorder && state.recorder.state !== "inactive") state.recorder.stop();
  state.game.recording = false;
  cancelAnimationFrame(state.recordingAnimation);
  state.recordingAnimation = null;
  setPrompt("Grabación detenida. Preparando video.");
  render();
}

function drawRecordingFrame() {
  const ctx = state.recordingContext;
  const canvas = state.recordingCanvas;
  if (!ctx || !canvas) return;
  ctx.fillStyle = "#050816";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (els.video.readyState >= 2) {
    drawCover(ctx, els.video, 0, 0, canvas.width, canvas.height);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#111827");
    gradient.addColorStop(1, "#451a03");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  drawCanvasScoreboard(ctx, canvas.width, canvas.height);
  drawCanvasPrompt(ctx, canvas.width, canvas.height);
  drawCanvasIntro(ctx, canvas.width, canvas.height);
  drawCanvasFooter(ctx, canvas.width, canvas.height);
  if (state.game.recording) state.recordingAnimation = requestAnimationFrame(drawRecordingFrame);
}

function drawCover(ctx, video, x, y, width, height) {
  const ratio = Math.max(width / video.videoWidth, height / video.videoHeight);
  const drawWidth = video.videoWidth * ratio;
  const drawHeight = video.videoHeight * ratio;
  ctx.drawImage(video, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawCanvasScoreboard(ctx, width) {
  const game = state.game;
  roundRect(ctx, 48, 26, width - 96, 122, 28, "rgba(5, 8, 22, .86)");
  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "left";
  ctx.font = "800 31px Arial";
  ctx.fillText(game.teamA, 90, 74);
  ctx.font = "900 66px Arial";
  ctx.fillText(String(game.scoreA), 90, 132);
  ctx.font = "700 22px Arial";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText(`Faltas ${game.foulsA} · TO ${timeoutsRemaining("A")}`, 190, 120);
  ctx.textAlign = "right";
  ctx.fillStyle = "#f8fafc";
  ctx.font = "800 31px Arial";
  ctx.fillText(game.teamB, width - 90, 74);
  ctx.font = "900 66px Arial";
  ctx.fillText(String(game.scoreB), width - 90, 132);
  ctx.font = "700 22px Arial";
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText(`Faltas ${game.foulsB} · TO ${timeoutsRemaining("B")}`, width - 190, 120);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fb923c";
  ctx.font = "900 52px Arial";
  ctx.fillText(formatClock(game.remainingSeconds), width / 2, 92);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "800 22px Arial";
  ctx.fillText(`${game.finished ? "FINAL" : game.running ? "EN VIVO" : game.status} · ${periodTitle()}`, width / 2, 126);
}

function drawCanvasPrompt(ctx, width, height) {
  roundRect(ctx, 78, height - 152, width - 156, 92, 24, "rgba(15, 23, 42, .82)");
  ctx.fillStyle = "#f8fafc";
  ctx.font = "800 27px Arial";
  ctx.textAlign = "center";
  fillWrappedText(ctx, state.game.prompt, width / 2, height - 116, width - 220, 32);
}

function drawCanvasIntro(ctx, width, height) {
  if (!state.currentIntro) return;
  const { team, player } = state.currentIntro;
  roundRect(ctx, width / 2 - 300, height / 2 - 150, 600, 300, 32, "rgba(5, 8, 22, .88)");
  ctx.textAlign = "center";
  ctx.fillStyle = "#fb923c";
  ctx.font = "800 30px Arial";
  ctx.fillText(getTeamName(team), width / 2, height / 2 - 85);
  ctx.fillStyle = "#fff";
  ctx.font = "900 58px Arial";
  ctx.fillText(player.name || "Jugador", width / 2, height / 2 - 20);
  ctx.font = "900 42px Arial";
  ctx.fillText(`#${player.number || "-"}`, width / 2, height / 2 + 35);
  ctx.font = "700 25px Arial";
  ctx.fillStyle = "#cbd5e1";
  fillWrappedText(ctx, [player.position, player.origin, player.extra].filter(Boolean).join(" · "), width / 2, height / 2 + 82, 500, 30);
}

function drawCanvasFooter(ctx, width, height) {
  ctx.fillStyle = "rgba(249, 115, 22, .92)";
  ctx.fillRect(0, height - 8, width, 8);
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fillRect(0, height - 38, width, 30);
  ctx.fillStyle = "#fff";
  ctx.font = "800 18px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Go Basket Studio Live · ${state.game.eventName}`, 32, height - 17);
}

function roundRect(ctx, x, y, width, height, radius, fill) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function fillWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || "").split(/\s+/);
  let line = "";
  let offset = 0;
  words.forEach((word) => {
    const test = `${line} ${word}`.trim();
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + offset);
      line = word;
      offset += lineHeight;
    } else {
      line = test;
    }
  });
  if (line) ctx.fillText(line, x, y + offset);
}

function finalizeRecording() {
  cancelAnimationFrame(state.recordingAnimation);
  state.recordingAnimation = null;
  state.game.recording = false;
  const blob = new Blob(state.chunks, { type: state.chunks[0]?.type || "video/webm" });
  if (state.recordedUrl) URL.revokeObjectURL(state.recordedUrl);
  state.recordedBlob = blob;
  state.recordedUrl = URL.createObjectURL(blob);
  state.recordedFile = new File([blob], "go-basket-studio-partido.webm", { type: blob.type || "video/webm" });
  setPrompt("Video generado. Si tu navegador no lo guarda automáticamente, mantén presionado el video y elige Guardar o Descargar.");
  render();
  openReport();
}

function openReport() {
  const size = state.recordedBlob ? `${(state.recordedBlob.size / 1024 / 1024).toFixed(1)} MB` : "Sin video todavía";
  els.reportModal.innerHTML = `
    <form method="dialog" class="modal-card report-card">
      <h2>Reporte final</h2>
      <p>${escapeHtml(state.game.eventName)} · ${escapeHtml(scoreLine())}</p>
      <p class="help-text">Video generado. Puedes descargarlo o compartirlo si tu celular lo permite. No se confirma guardado en galería automáticamente.</p>
      ${state.recordedUrl ? `<video controls playsinline src="${state.recordedUrl}"></video><p>Tamaño del archivo: ${size}</p>` : `<p class="empty-state">Aún no hay video generado. Usa Grabar y luego Detener.</p>`}
      <div class="choice-grid two-cols">
        ${state.recordedUrl ? `<button type="button" data-action="download-video">Descargar video</button><button type="button" data-action="share-video">Compartir video</button>` : ""}
        <button type="button" data-action="copy-summary">Copiar resumen</button>
        <button type="button" data-action="close-report" class="ghost">Cerrar</button>
      </div>
      <section class="timeline-report">
        <h3>Historial rápido</h3>
        ${state.game.history.slice(0, 25).map((play) => `<article><b style="color:${play.eventColor}">${escapeHtml(play.periodLabel || periodTitle(play.period))} · ${formatClock(play.remainingSeconds)}</b><span>${escapeHtml(play.text)}</span></article>`).join("") || `<p class="empty-state">Sin jugadas registradas.</p>`}
      </section>
    </form>
  `;
  els.reportModal.onclick = reportClick;
  openDialog(els.reportModal);
}

function reportClick(event) {
  const action = event.target.closest("button[data-action]")?.dataset.action;
  if (action === "download-video") downloadVideo();
  if (action === "share-video") shareVideo();
  if (action === "copy-summary") copySummary();
  if (action === "close-report") closeDialog(els.reportModal);
}

function downloadVideo() {
  if (!state.recordedUrl) return;
  const link = document.createElement("a");
  link.href = state.recordedUrl;
  link.download = "go-basket-studio-partido.webm";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setPrompt("Si tu navegador no descarga automáticamente, mantén presionado el video y elige Guardar video o Descargar.");
  render();
}

async function shareVideo() {
  if (!state.recordedFile) return;
  const data = { files: [state.recordedFile], title: "Go Basket Studio", text: `${state.game.eventName}: ${scoreLine()}` };
  if (navigator.canShare?.(data)) {
    try {
      await navigator.share(data);
      return;
    } catch (error) {
      console.warn("No se pudo compartir video", error);
    }
  }
  alert("Este navegador no permite compartir el archivo directamente. Descarga el video y compártelo desde tu galería o archivos.");
}

async function copySummary() {
  const summary = `${state.game.eventName}\nResultado: ${scoreLine()}\n${state.game.history.slice(0, 12).map((play) => `- ${play.text}`).join("\n")}`;
  await navigator.clipboard?.writeText(summary);
  setPrompt("Resumen copiado. También puedes descargar el video si tu navegador lo permite.");
  render();
}

function openActionModal(html) {
  els.actionModal.innerHTML = html;
  els.actionModal.onclick = actionModalClick;
  openDialog(els.actionModal);
}

function actionModalClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, team, playerId } = button.dataset;
  if (action === "choose-team") els.actionModal._teamCallback?.(team);
  if (action === "apply-score") applyScore(team, playerId);
  if (action === "apply-foul") applyFoul(team, playerId);
  if (action === "pause-only") pauseOnly();
  if (action === "timeout") requestTimeout(team);
  if (action === "reset-period") resetCurrentPeriod();
  if (action === "next-period") nextPeriod();
  if (action === "finish-game") finishGame();
  if (action === "toggle-tv-clean") toggleTvClean();
  if (action === "open-tv-window") openTvWindow();
  if (action === "fullscreen") void enterFullscreen();
  if (action === "presentation") void startPresentationMode();
  if (action === "intro-all") startIntro("all");
  if (action === "intro-team") startIntro(team);
  if (action === "settings") {
    closeActionModal();
    openSettings();
  }
}

function closeActionModal() {
  closeDialog(els.actionModal);
}

function openDialog(dialog) {
  if (!dialog.open) dialog.showModal();
  document.body.classList.add("modal-open");
  history.pushState({ modal: true }, "");
}

function closeDialog(dialog) {
  if (dialog.open) dialog.close();
  if (![els.actionModal, els.settingsModal, els.reportModal].some((item) => item.open)) document.body.classList.remove("modal-open");
}

function closeTopModal() {
  if (els.reportModal.open) return closeDialog(els.reportModal), true;
  if (els.settingsModal.open) return closeDialog(els.settingsModal), true;
  if (els.actionModal.open) return closeDialog(els.actionModal), true;
  return false;
}

function setupBackButton() {
  history.replaceState({ screen: "live" }, "");
  window.addEventListener("popstate", () => {
    if (closeTopModal()) {
      history.pushState({ screen: "live" }, "");
      return;
    }
    if (state.game.tvClean) {
      state.game.tvClean = false;
      render();
      history.pushState({ screen: "live" }, "");
      return;
    }
    if (state.game.started && !state.game.finished) {
      if (confirm("Hay un partido en curso. ¿Quieres salir al menú?")) {
        state.game.running = false;
        state.game.status = "PAUSADO";
        render();
      } else {
        history.pushState({ screen: "live" }, "");
      }
      return;
    }
    const now = Date.now();
    if (now - state.lastBackAt < 1600) return;
    state.lastBackAt = now;
    setPrompt("Presiona regresar otra vez para salir.");
    history.pushState({ screen: "live" }, "");
    render();
  });
}

function setupPullToRefreshGuard() {
  window.addEventListener("touchstart", (event) => {
    state.touchStartY = event.touches[0]?.clientY || 0;
  }, { passive: true });
  window.addEventListener("touchmove", (event) => {
    const modalOpen = [els.actionModal, els.settingsModal, els.reportModal].some((dialog) => dialog.open);
    if (modalOpen) return;
    const y = event.touches[0]?.clientY || 0;
    const pullingDown = y > state.touchStartY && window.scrollY <= 0;
    if ((state.game.running || state.game.recording || state.game.tvClean) && pullingDown) event.preventDefault();
  }, { passive: false });
}

function bindEvents() {
  els.retryPermissionsBtn.addEventListener("click", requestMedia);
  els.micStatus.addEventListener("click", () => requestMicrophone().then(render));
  els.timerBtn.addEventListener("click", toggleTimer);
  els.scoreBtn.addEventListener("click", openScoreModal);
  els.foulBtn.addEventListener("click", openFoulModal);
  els.playersBtn.addEventListener("click", openPlayersPanel);
  els.recordBtn.addEventListener("click", toggleRecording);
  els.tvBtn.addEventListener("click", openTvPanel);
  els.settingsBtn.addEventListener("click", openSettings);
  els.exitTvBtn.addEventListener("click", toggleTvClean);
  els.teleprompter.addEventListener("click", () => {
    state.game.teleprompterVisible = !state.game.teleprompterVisible;
    render();
  });
  els.introOverlay.addEventListener("click", (event) => {
    const action = event.target.closest("button[data-intro]")?.dataset.intro;
    if (!action) return;
    if (action === "next") nextIntro(1);
    if (action === "prev") nextIntro(-1);
    if (action === "teamA") startIntro("A");
    if (action === "teamB") startIntro("B");
    if (action === "all") startIntro("all");
    if (action === "close") closeIntro();
  });
}

function init() {
  loadLocal();
  bindEvents();
  setupBackButton();
  setupPullToRefreshGuard();
  startTimerLoop();
  render();
  void requestMedia();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(console.warn);
}

document.addEventListener("DOMContentLoaded", init);
