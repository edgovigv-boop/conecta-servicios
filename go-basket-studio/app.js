const STORE_KEYS = {
  saved: "go-basket-studio:saved:v1",
  rules: "go-basket-studio:rules:v1",
};

const defaultRules = [
  { key: "womanThree", label: "Mujer vale 3 puntos", enabled: false },
  { key: "womanFreeThree", label: "Tiro libre mujer vale 3 puntos", enabled: false },
  { key: "foulOut", label: "Eliminar jugador a cierto número de faltas", enabled: false },
  { key: "timedChanges", label: "Cambios cada ciertos minutos", enabled: false },
  { key: "threeMode", label: "Modo 3x3", enabled: false },
  { key: "targetScore", label: "Partido a cierta cantidad de puntos", enabled: false },
  { key: "runningClock", label: "Tiempo corrido", enabled: true },
];

const appState = {
  game: null,
  timerId: null,
  audioContext: null,
  recordingAudioDestination: null,
  microphoneStream: null,
  microphoneSource: null,
  crowdNode: null,
  cameraStream: null,
  mediaRecorder: null,
  recordingChunks: [],
  recordingCanvas: null,
  recordingCanvasContext: null,
  recordingAnimationId: null,
  recordingStream: null,
  recordingStartedAt: null,
  recordedVideoUrl: null,
  recordingBlob: null,
  recordingFile: null,
  pendingPlay: null,
  pendingIntroChoice: null,
  introQueue: [],
  introIndex: 0,
  currentIntroPlayer: null,
  spanishVoice: null,
  currentScreen: "home",
  lastBackAt: 0,
  suppressPushState: false,
  touchStartY: 0,
  lastTap: 0,
  deferredInstallPrompt: null,
  rules: loadRules(),
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const elements = {
  screens: $$(".screen"),
  quickForm: $("#quickForm"),
  playersForm: $("#playersForm"),
  threeForm: $("#threeForm"),
  rosterA: $("#rosterA"),
  rosterB: $("#rosterB"),
  rulesPanel: $("#rulesPanel"),
  savedList: $("#savedList"),
  cameraView: $("#cameraView"),
  cameraStatus: null,
  recordingStatus: null,
  playerActionModal: null,
  humanPromptBox: null,
  tvHelpPanel: null,
  timeoutModal: null,
  introModal: null,
  microphoneStatus: null,
  timelineDetail: null,
  tvWindow: null,
  gameScreen: $('[data-screen="game"]'),
  controlsPanel: $("#controlsPanel"),
  showControlsBtn: $("#showControlsBtn"),
  exitFullscreenBtn: $("#exitFullscreenBtn"),
  playerChooser: $("#playerChooser"),
  playerSelect: $("#playerSelect"),
  reportView: $("#reportView"),
  installBtn: $("#installBtn"),
};

function showScreen(name, options = {}) {
  const { push = true } = options;
  elements.screens.forEach((screen) => screen.classList.toggle("active", screen.dataset.screen === name));
  if (name === "saved") renderSavedMatches();
  appState.currentScreen = name;
  if (push && !appState.suppressPushState && history.state?.screen !== name) {
    history.pushState({ screen: name }, "", `#${name}`);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function loadRules() {
  const raw = localStorage.getItem(STORE_KEYS.rules);
  if (!raw) return defaultRules;
  try {
    const stored = JSON.parse(raw);
    return defaultRules.map((rule) => ({ ...rule, enabled: Boolean(stored[rule.key] ?? rule.enabled) }));
  } catch (error) {
    console.warn("No se pudieron cargar reglas", error);
    return defaultRules;
  }
}

function saveRules() {
  const payload = Object.fromEntries(appState.rules.map((rule) => [rule.key, rule.enabled]));
  localStorage.setItem(STORE_KEYS.rules, JSON.stringify(payload));
}

function getSavedMatches() {
  const raw = localStorage.getItem(STORE_KEYS.saved);
  if (!raw) return [];
  try {
    const saved = JSON.parse(raw);
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.warn("No se pudieron cargar partidos", error);
    return [];
  }
}

function setSavedMatches(matches) {
  localStorage.setItem(STORE_KEYS.saved, JSON.stringify(matches));
}

function createGame(config) {
  const durationSeconds = Math.max(60, Number(config.duration || 10) * 60);
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    type: config.type || "quick",
    teamA: config.teamA || "Equipo A",
    teamB: config.teamB || "Equipo B",
    scoreA: 0,
    scoreB: 0,
    foulsA: 0,
    foulsB: 0,
    durationSeconds,
    remainingSeconds: durationSeconds,
    startedAt: null,
    finishedAt: null,
    running: false,
    cameraEnabled: Boolean(config.camera),
    cameraStatus: Boolean(config.camera) ? "Cámara activa" : "",
    cameraError: "",
    narratorEnabled: Boolean(config.narrator),
    humanNarratorEnabled: false,
    soundsEnabled: Boolean(config.sounds),
    teleprompterEnabled: true,
    crowdEnabled: false,
    recordingMode: false,
    internalRecording: false,
    recordingUrl: "",
    recordingMimeType: "",
    recordingStartedAt: null,
    recordingFinishedAt: null,
    recordingFileName: "",
    recordingSize: 0,
    downloadHint: "",
    microphoneEnabled: false,
    audioStatus: { appSounds: false, microphone: false, autoVoiceNote: true },
    timeAlerts: [],
    finalAnnounced: false,
    tvMode: false,
    timeoutUsage: {},
    fullscreenMode: false,
    targetScore: config.targetScore || null,
    players: config.players || { A: [], B: [] },
    history: [],
    introActive: false,
    introCompleted: false,
  };
}

function collectRoster(teamKey) {
  const root = teamKey === "A" ? elements.rosterA : elements.rosterB;
  return $$(".player-row", root)
    .map((row) => ({
      id: row.dataset.id,
      name: $('[data-player-name]', row).value.trim(),
      number: $('[data-player-number]', row).value.trim(),
      position: $('[data-player-position]', row)?.value.trim() || "",
      origin: $('[data-player-origin]', row)?.value.trim() || "",
      extra: $('[data-player-extra]', row)?.value.trim() || "",
      photoUrl: $('[data-player-photo]', row)?.files?.[0] ? URL.createObjectURL($('[data-player-photo]', row).files[0]) : "",
      points: 0,
      fouls: 0,
      team: teamKey,
    }))
    .filter((player) => player.name || player.number);
}

function addPlayerRow(teamKey, data = {}) {
  const row = document.createElement("div");
  row.className = "player-row";
  row.dataset.id = data.id || `${teamKey}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  row.innerHTML = `
    <label>Nombre<input data-player-name value="${escapeHtml(data.name || "")}" placeholder="Nombre" /></label>
    <label>Número<input data-player-number value="${escapeHtml(data.number || "")}" placeholder="#" /></label>
    <label>Posición<input data-player-position value="${escapeHtml(data.position || "")}" placeholder="Base, Ala, Poste" /></label>
    <label>Procedencia<input data-player-origin value="${escapeHtml(data.origin || "")}" placeholder="Lugar de origen" /></label>
    <label>Dato extra<input data-player-extra value="${escapeHtml(data.extra || "")}" placeholder="Capitán, mejor tirador" /></label>
    <label>Foto opcional<input data-player-photo type="file" accept="image/*" /></label>
    <button class="small-btn danger" type="button" aria-label="Quitar jugador">×</button>
  `;
  $("button", row).addEventListener("click", () => row.remove());
  (teamKey === "A" ? elements.rosterA : elements.rosterB).append(row);
}

function startGame(config) {
  stopTimer();
  stopCamera();
  stopCrowd();
  stopNarratorMicrophone();
  resetInternalRecorder();
  appState.pendingPlay = null;
  appState.game = createGame(config);
  appState.game.startedAt = new Date().toISOString();
  showScreen("game");
  renderGame();
  if (appState.game.cameraEnabled) toggleCamera(true);
  if (appState.game.soundsEnabled) playSound("start");
  setSuggestedPrompt("Go Basket Studio en vivo. Partido listo para comenzar.");
  announce("Go Basket Studio en vivo. Partido listo para comenzar.");
  maybeOfferPlayerIntro();
}

function renderGame() {
  const game = appState.game;
  if (!game) return;

  $("#gameTeamA").textContent = game.teamA;
  $("#gameTeamB").textContent = game.teamB;
  $("#controlTeamA").textContent = game.teamA;
  $("#controlTeamB").textContent = game.teamB;
  $("#scoreA").textContent = game.scoreA;
  $("#scoreB").textContent = game.scoreB;
  $("#foulsA").textContent = game.foulsA;
  $("#foulsB").textContent = game.foulsB;
  $("#clock").textContent = formatClock(game.remainingSeconds);
  $("#lastPlay").textContent = game.history[0]?.text || "Listo para iniciar transmisión";
  const suggestedPrompt = game.history[0]?.teleprompterText || game.history[0]?.prompt || game.suggestedPrompt || "GO BASKET STUDIO EN VIVO";
  $("#teleprompter").textContent = suggestedPrompt;
  $("#teleprompter").classList.toggle("off", !game.teleprompterEnabled);
  $("#timerBtn").textContent = game.running ? "Pausar tiempo" : "Iniciar tiempo";
  $("#soundBtn").textContent = `Sonidos ${game.soundsEnabled ? "ON" : "OFF"}`;
  $("#narratorBtn").textContent = `Narrador automático ${game.narratorEnabled ? "ON" : "OFF"}`;
  const humanBtn = $("#humanNarratorBtn");
  if (humanBtn) humanBtn.textContent = `Narrador humano ${game.humanNarratorEnabled ? "ON" : "OFF"}`;
  $("#teleBtn").textContent = `Teleprompter ${game.teleprompterEnabled ? "ON" : "OFF"}`;
  $("#crowdBtn").textContent = `Ambiente público ${game.crowdEnabled ? "ON" : "OFF"}`;
  $("#cameraBtn").textContent = `${game.cameraEnabled ? "Apagar" : "Activar"} cámara`;
  updateCameraStatus();
  updateRecordingStatus();
  $("#recordingBtn").textContent = game.internalRecording ? "Detener grabación interna" : "Grabar video completo";
  elements.gameScreen.classList.toggle("recording", game.recordingMode);
  elements.gameScreen.classList.toggle("fullscreen-mode", game.fullscreenMode);
  elements.gameScreen.classList.toggle("tv-mode", game.tvMode);
  elements.showControlsBtn.hidden = !game.recordingMode && !game.internalRecording;
  elements.exitFullscreenBtn.hidden = !game.fullscreenMode;
  renderPlayerSelect();
  ensureExtraControls();
  updateHumanPromptBox(suggestedPrompt);
  updateTvPanel();
  updateTimeoutDisplay();
  updateMicrophoneStatus();
}

function updateCameraStatus() {
  const game = appState.game;
  if (!game) return;
  if (!elements.cameraStatus) {
    elements.cameraStatus = document.createElement("div");
    elements.cameraStatus.className = "camera-status";
    elements.cameraStatus.setAttribute("role", "status");
    elements.cameraStatus.setAttribute("aria-live", "polite");
    elements.gameScreen.append(elements.cameraStatus);
  }

  const visible = game.recordingMode || game.cameraEnabled || Boolean(game.cameraError);
  elements.cameraStatus.hidden = !visible;
  elements.cameraStatus.classList.toggle("camera-status--ok", game.cameraEnabled);
  elements.cameraStatus.classList.toggle("camera-status--error", Boolean(game.cameraError) || game.cameraStatus === "Cámara no disponible");
  elements.cameraStatus.textContent = game.cameraError || game.cameraStatus || (game.cameraEnabled ? "Cámara activa" : "");
  elements.gameScreen.classList.toggle("camera-on", game.cameraEnabled);
}


function updateRecordingStatus() {
  const game = appState.game;
  if (!game) return;
  if (!elements.recordingStatus) {
    elements.recordingStatus = document.createElement("div");
    elements.recordingStatus.className = "recording-status";
    elements.recordingStatus.setAttribute("role", "status");
    elements.recordingStatus.setAttribute("aria-live", "polite");
    elements.gameScreen.append(elements.recordingStatus);
  }

  elements.recordingStatus.hidden = !game.internalRecording && !game.recordingUrl;
  elements.recordingStatus.textContent = game.internalRecording
    ? "● Grabando video interno con marcador, cámara y jugadas"
    : game.recordingUrl ? "Video completo listo en el reporte final" : "";
  elements.gameScreen.classList.toggle("internal-recording", game.internalRecording);
}

function maybeAnnounceTime(game) {
  const alerts = [
    { at: 360, key: "6m", text: `Quedan 6 minutos de juego. Marcador: ${buildScoreLine(game)}.`, prompt: `Quedan 6 minutos. ${buildScoreLine(game)}.` },
    { at: 180, key: "3m", text: `Quedan 3 minutos de juego. Marcador: ${buildScoreLine(game)}.`, prompt: `Quedan 3 minutos. ${buildScoreLine(game)}.` },
    { at: 60, key: "1m", text: `Queda 1 minuto de juego. Marcador: ${buildScoreLine(game)}.`, prompt: `Queda 1 minuto. ${buildScoreLine(game)}.` },
    { at: 30, key: "30s", text: "Quedan 30 segundos de juego.", prompt: "Últimos 30 segundos." },
    { at: 10, key: "10s", text: "Quedan 10 segundos de juego.", prompt: "Quedan 10 segundos de juego." },
    { at: 5, key: "5s", text: "Quedan 5, 4, 3, 2, 1, fin del juego.", prompt: "Cuenta final: 5, 4, 3, 2, 1." },
  ];
  const fired = new Set(game.timeAlerts || []);
  const alert = alerts.find((item) => game.remainingSeconds === item.at && !fired.has(item.key));
  if (!alert) return;
  fired.add(alert.key);
  game.timeAlerts = [...fired];
  recordPlay({ type: "time", text: alert.text, narrationText: alert.text, teleprompterText: alert.prompt });
  setSuggestedPrompt(alert.prompt);
  playSound("alert");
  announce(alert.text);
}

function ensureExtraControls() {
  if (!$("#humanNarratorBtn")) {
    const button = document.createElement("button");
    button.id = "humanNarratorBtn";
    button.type = "button";
    button.textContent = `Narrador humano ${appState.game?.humanNarratorEnabled ? "ON" : "OFF"}`;
    button.addEventListener("click", () => {
      appState.game.humanNarratorEnabled = !appState.game.humanNarratorEnabled;
      if (appState.game.humanNarratorEnabled) appState.game.teleprompterEnabled = true;
      renderGame();
    });
    $("#narratorBtn").after(button);
  }

  if (!$("#tvModeBtn")) {
    const tvButton = document.createElement("button");
    tvButton.id = "tvModeBtn";
    tvButton.type = "button";
    tvButton.textContent = "Modo TV / Tablero gigante";
    tvButton.addEventListener("click", toggleTvMode);
    $("#fullscreenBtn").after(tvButton);
  }

  if (!$("#microphoneBtn")) {
    const micButton = document.createElement("button");
    micButton.id = "microphoneBtn";
    micButton.type = "button";
    micButton.textContent = "Micrófono narrador OFF";
    micButton.addEventListener("click", toggleNarratorMicrophone);
    $("#humanNarratorBtn").after(micButton);
  }

  if (!$("#introBtn")) {
    const introButton = document.createElement("button");
    introButton.id = "introBtn";
    introButton.type = "button";
    introButton.textContent = "Presentar jugadores";
    introButton.addEventListener("click", () => openIntroModal("all"));
    $("#tvModeBtn").after(introButton);
  }
}

function ensurePlayerActionModal() {
  if (elements.playerActionModal) return elements.playerActionModal;
  const modal = document.createElement("div");
  modal.className = "player-action-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="player-action-card" role="dialog" aria-modal="true" aria-labelledby="playerActionTitle">
      <button class="player-action-close" type="button" aria-label="Cerrar">×</button>
      <p class="eyebrow">Registro de jugada</p>
      <h2 id="playerActionTitle">¿Quién hizo la jugada?</h2>
      <p class="player-action-subtitle"></p>
      <div class="player-action-list"></div>
    </div>
  `;
  $(".player-action-close", modal).addEventListener("click", () => closePlayerActionModal());
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closePlayerActionModal();
  });
  document.body.append(modal);
  elements.playerActionModal = modal;
  return modal;
}

function requestPlayerForAction(teamKey, type, points = 0) {
  const game = appState.game;
  const players = game.players[teamKey] || [];
  if (!players.length) {
    processPlayAction({ teamKey, type, points, player: null });
    return;
  }

  const modal = ensurePlayerActionModal();
  const teamName = getTeamName(teamKey);
  appState.pendingPlay = { teamKey, type, points };
  $(".player-action-subtitle", modal).textContent = `${teamName} · ${type === "score" ? `+${points} punto${points === 1 ? "" : "s"}` : "Falta"}`;
  const list = $(".player-action-list", modal);
  list.innerHTML = `
    ${players.map((player) => `
      <button class="player-pick-btn" data-player-id="${escapeHtml(player.id)}" type="button">
        <strong>${escapeHtml(player.name || "Jugador")}${player.number ? ` <span>#${escapeHtml(player.number)}</span>` : ""}</strong>
        <small>${escapeHtml(teamName)}</small>
      </button>
    `).join("")}
    <button class="player-pick-btn player-pick-btn--team" data-player-id="" type="button">
      <strong>Equipo completo / Sin jugador</strong>
      <small>${escapeHtml(teamName)}</small>
    </button>
  `;
  $$("[data-player-id]", list).forEach((button) => button.addEventListener("click", () => {
    const player = players.find((item) => item.id === button.dataset.playerId) || null;
    const pending = appState.pendingPlay;
    closePlayerActionModal();
    processPlayAction({ ...pending, player });
  }));
  modal.hidden = false;
  document.body.classList.add("modal-open");
}

function closePlayerActionModal() {
  if (elements.playerActionModal) elements.playerActionModal.hidden = true;
  document.body.classList.remove("modal-open");
  appState.pendingPlay = null;
}

function processPlayAction({ teamKey, type, points = 0, player = null }) {
  if (type === "score") addScore(teamKey, points, player);
  if (type === "foul") addFoul(teamKey, player);
}

function getTeamName(teamKey) {
  const game = appState.game;
  return teamKey === "A" ? game.teamA : game.teamB;
}

function buildScoreLine(game) {
  return `${game.teamA} ${game.scoreA} - ${game.teamB} ${game.scoreB}`;
}

function describePlayerForSpeech(player) {
  if (!player) return "";
  if (player.name && player.number) return `${player.name}, número ${player.number}`;
  if (player.name) return player.name;
  return `número ${player.number}`;
}

function buildTeleprompterLines({ type, teamKey, points = 0, player = null }) {
  const game = appState.game;
  const teamName = getTeamName(teamKey);
  const playerLine = player ? `${type === "foul" ? "Falta de" : "Canasta del"} número ${player.number || "sin número"}, ${player.name || "jugador"}.` : `${type === "foul" ? "Falta de" : `${points} puntos para`} ${teamName}.`;
  const scoreLine = `El marcador está ${buildScoreLine(game)}.`;
  const gameLine = game.scoreA === game.scoreB ? "El partido está empatado." : `Va arriba ${game.scoreA > game.scoreB ? game.teamA : game.teamB}.`;
  const timeLine = `Quedan ${formatClock(game.remainingSeconds)} de juego.`;
  return [playerLine, type === "score" ? `${points} punto${points === 1 ? "" : "s"} para ${teamName}.` : `Faltas de equipo: ${teamKey === "A" ? game.foulsA : game.foulsB}.`, scoreLine, gameLine, timeLine].join(" ");
}

function setSuggestedPrompt(text) {
  if (!appState.game) return;
  appState.game.suggestedPrompt = text;
  updateHumanPromptBox(text);
}

function updateHumanPromptBox(text) {
  const game = appState.game;
  if (!game) return;
  if (!elements.humanPromptBox) {
    elements.humanPromptBox = document.createElement("aside");
    elements.humanPromptBox.className = "human-prompt-box";
    elements.humanPromptBox.innerHTML = `<span>Frase sugerida para narrador</span><strong></strong>`;
    elements.gameScreen.append(elements.humanPromptBox);
  }
  elements.humanPromptBox.hidden = !game.humanNarratorEnabled && !game.teleprompterEnabled;
  $("strong", elements.humanPromptBox).textContent = text || game.suggestedPrompt || "Go Basket Studio en vivo.";
}

function getSpecialPhrase(playType) {
  const game = appState.game;
  if (playType !== "score") return "";
  const scorePlays = game.history.filter((play) => play.type === "score").length;
  const phrases = [" ¡Qué jugada!", " ¡Canasta importante!", " ¡Esto se está poniendo bueno!", " ¡Go Basket Studio en vivo!"];
  return scorePlays > 0 && scorePlays % 4 === 0 ? phrases[(scorePlays / 4 - 1) % phrases.length] : "";
}


function getCurrentPeriod(game = appState.game) {
  const elapsed = Math.max(0, game.durationSeconds - game.remainingSeconds);
  return Math.floor(elapsed / 600) + 1;
}

function getTimeoutsUsed(teamKey, period = getCurrentPeriod()) {
  return appState.game.timeoutUsage?.[period]?.[teamKey] || 0;
}

function getTimeoutsRemaining(teamKey, period = getCurrentPeriod()) {
  return Math.max(0, 2 - getTimeoutsUsed(teamKey, period));
}

function updateTimeoutDisplay() {
  const game = appState.game;
  if (!game) return;
  let box = $("#timeoutStatus");
  if (!box) {
    box = document.createElement("section");
    box.id = "timeoutStatus";
    box.className = "timeout-status";
    elements.gameScreen.insertBefore(box, elements.controlsPanel);
  }
  const period = getCurrentPeriod(game);
  box.innerHTML = `
    <div><span>Tiempos fuera ${escapeHtml(game.teamA)}</span><strong>${getTimeoutsRemaining("A", period)} disponibles</strong></div>
    <div><span>Periodo/bloque ${period}</span><strong>10 min</strong></div>
    <div><span>Tiempos fuera ${escapeHtml(game.teamB)}</span><strong>${getTimeoutsRemaining("B", period)} disponibles</strong></div>
  `;
}

function openTimeoutModal() {
  if (!elements.timeoutModal) {
    const modal = document.createElement("div");
    modal.className = "timeout-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="timeout-card" role="dialog" aria-modal="true">
        <p class="eyebrow">Pausa del partido</p>
        <h2>¿Quién pidió tiempo fuera?</h2>
        <div class="timeout-actions">
          <button data-timeout-team="A" type="button"></button>
          <button data-timeout-team="B" type="button"></button>
          <button data-timeout-team="none" type="button">Solo pausar reloj</button>
        </div>
      </div>
    `;
    modal.addEventListener("click", (event) => { if (event.target === modal) closeTimeoutModal(); });
    document.body.append(modal);
    elements.timeoutModal = modal;
  }
  $("[data-timeout-team='A']", elements.timeoutModal).textContent = `Tiempo fuera ${appState.game.teamA}`;
  $("[data-timeout-team='B']", elements.timeoutModal).textContent = `Tiempo fuera ${appState.game.teamB}`;
  $$('[data-timeout-team]', elements.timeoutModal).forEach((button) => {
    button.onclick = () => {
      const team = button.dataset.timeoutTeam;
      closeTimeoutModal();
      if (team === "none") pauseClockOnly();
      else requestTimeout(team);
    };
  });
  elements.timeoutModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeTimeoutModal() {
  if (elements.timeoutModal) elements.timeoutModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function pauseClockOnly() {
  stopTimer();
  setSuggestedPrompt("Reloj pausado.");
  renderGame();
}

function requestTimeout(teamKey) {
  const game = appState.game;
  const period = getCurrentPeriod(game);
  const teamName = getTeamName(teamKey);
  if (getTimeoutsRemaining(teamKey, period) <= 0) {
    alert(`${teamName} ya no tiene tiempos fuera disponibles en este periodo.`);
    renderGame();
    return;
  }
  stopTimer();
  game.timeoutUsage[period] ||= { A: 0, B: 0 };
  game.timeoutUsage[period][teamKey] = getTimeoutsUsed(teamKey, period) + 1;
  const remaining = getTimeoutsRemaining(teamKey, period);
  const narrationText = `TIEMPO FUERA POR PARTE DEL EQUIPO ${teamName}.`;
  const teleprompterText = `TIEMPO FUERA — ${teamName}`;
  recordPlay({ type: "timeout", team: teamKey, teamKey, teamName, timeoutPeriod: period, timeoutsRemaining: remaining, text: `Tiempo fuera por parte del equipo ${teamName}`, narrationText, teleprompterText, prompt: teleprompterText });
  playSound("timeout");
  setSuggestedPrompt(teleprompterText);
  announce(narrationText);
  renderGame();
}

function renderPlayerSelect() {
  const game = appState.game;
  const players = [...game.players.A, ...game.players.B];
  elements.playerChooser.hidden = true;
  elements.playerSelect.innerHTML = '<option value="">Equipo completo</option>' + players
    .map((player) => `<option value="${player.id}">${player.team === "A" ? game.teamA : game.teamB} · ${player.number ? `#${escapeHtml(player.number)} ` : ""}${escapeHtml(player.name || "Jugador")}</option>`)
    .join("");
}

function selectedPlayerFor(teamKey) {
  const playerId = elements.playerSelect.value;
  if (!playerId) return null;
  return appState.game.players[teamKey].find((player) => player.id === playerId) || null;
}

function addScore(teamKey, points, player = null) {
  const game = appState.game;
  const scoreKey = teamKey === "A" ? "scoreA" : "scoreB";
  game[scoreKey] += points;
  if (player) player.points += points;

  const teamName = getTeamName(teamKey);
  const playerSpeech = describePlayerForSpeech(player);
  const scoreLine = buildScoreLine(game);
  const narrationText = player
    ? `¡${points} punto${points === 1 ? "" : "s"} para ${teamName}, por parte de ${playerSpeech}! Marcador: ${scoreLine}.${getSpecialPhrase("score")}`
    : `¡${points} punto${points === 1 ? "" : "s"} para ${teamName}! Marcador: ${scoreLine}.${getSpecialPhrase("score")}`;
  const teleprompterText = buildTeleprompterLines({ type: "score", teamKey, points, player });
  const text = narrationText;
  recordPlay({ type: "score", team: teamKey, teamKey, teamName, points, playerId: player?.id || null, playerName: player?.name || "", playerNumber: player?.number || "", playerFouls: player?.fouls || 0, text, narrationText, teleprompterText, prompt: teleprompterText });
  playSound(points === 3 ? "triple" : "basket");
  setSuggestedPrompt(teleprompterText);
  announce(narrationText);
  checkTimeAndTarget();
  renderGame();
}

function addFoul(teamKey, player = null) {
  const game = appState.game;
  const foulKey = teamKey === "A" ? "foulsA" : "foulsB";
  game[foulKey] += 1;
  if (player) player.fouls += 1;

  const teamName = getTeamName(teamKey);
  const playerSpeech = describePlayerForSpeech(player);
  const teamFouls = game[foulKey];
  const narrationText = player
    ? `¡Falta de ${teamName}, cometida por ${playerSpeech}! Faltas del jugador: ${player.fouls}. Faltas de equipo: ${teamFouls}.`
    : `¡Falta de ${teamName}! Faltas de equipo: ${teamFouls}.`;
  const teleprompterText = buildTeleprompterLines({ type: "foul", teamKey, player });
  recordPlay({ type: "foul", team: teamKey, teamKey, teamName, playerId: player?.id || null, playerName: player?.name || "", playerNumber: player?.number || "", playerFouls: player?.fouls || 0, points: 0, text: narrationText, narrationText, teleprompterText, prompt: teleprompterText });
  playSound("foul");
  setSuggestedPrompt(teleprompterText);
  announce(narrationText);
  renderGame();
}

function recordPlay(play) {
  const game = appState.game;
  const elapsed = appState.recordingStartedAt ? Math.max(0, Date.now() - new Date(appState.recordingStartedAt).getTime()) : null;
  const elapsedGameSeconds = Math.max(0, game.durationSeconds - game.remainingSeconds);
  const eventColor = play.eventColor || getEventColor(play);
  const eventLabel = play.eventLabel || getEventLabel(play);
  game.history.unshift({
    type: play.type,
    team: play.team || play.teamKey || "",
    teamKey: play.teamKey || play.team || "",
    teamName: play.teamName || (play.teamKey || play.team ? getTeamName(play.teamKey || play.team) : ""),
    playerId: play.playerId || null,
    playerName: play.playerName || "",
    playerNumber: play.playerNumber || "",
    points: Number(play.points || 0),
    scoreA: game.scoreA,
    scoreB: game.scoreB,
    foulsA: game.foulsA,
    foulsB: game.foulsB,
    playerFouls: Number(play.playerFouls || 0),
    remainingSeconds: game.remainingSeconds,
    recordingTimeMs: elapsed,
    elapsedGameSeconds,
    eventColor,
    eventLabel,
    timeoutPeriod: play.timeoutPeriod || null,
    timeoutsRemaining: Number.isFinite(play.timeoutsRemaining) ? play.timeoutsRemaining : null,
    text: play.text || play.narrationText || "",
    narrationText: play.narrationText || play.text || "",
    teleprompterText: play.teleprompterText || play.prompt || play.text || "",
    prompt: play.prompt || play.teleprompterText || play.text || "",
    at: new Date().toISOString(),
  });
}


function getEventColor(play) {
  if (play.type === "score" && Number(play.points) === 3) return "#ffd166";
  if (play.type === "score") return "#45f59a";
  if (play.type === "foul") return "#ff3d57";
  if (play.type === "timeout") return "#4cc9f0";
  if (play.type === "playerIntro") return "#b467ff";
  if (play.type === "time" || play.type === "final") return "#ffffff";
  return "#b467ff";
}

function getEventLabel(play) {
  if (play.type === "score") return `+${play.points || 0}`;
  if (play.type === "foul") return "F";
  if (play.type === "timeout") return "TO";
  if (play.type === "playerIntro") return "IN";
  if (play.type === "time") return "T";
  if (play.type === "final") return "FIN";
  return "·";
}

function undoLastPlay() {
  const game = appState.game;
  const play = game.history.shift();
  if (!play) return;
  if (play.type === "score") {
    game[play.teamKey === "A" ? "scoreA" : "scoreB"] = Math.max(0, game[play.teamKey === "A" ? "scoreA" : "scoreB"] - play.points);
    const player = game.players[play.teamKey].find((item) => item.id === play.playerId);
    if (player) player.points = Math.max(0, player.points - play.points);
  }
  if (play.type === "foul") {
    game[play.teamKey === "A" ? "foulsA" : "foulsB"] = Math.max(0, game[play.teamKey === "A" ? "foulsA" : "foulsB"] - 1);
    const player = game.players[play.teamKey].find((item) => item.id === play.playerId);
    if (player) player.fouls = Math.max(0, player.fouls - 1);
  }
  announce("Última jugada deshecha.");
  renderGame();
}

function describeSubject(player, teamName) {
  if (!player) return teamName;
  if (player.number && player.name) return `número ${player.number}, ${player.name}`;
  return player.name || `número ${player.number}`;
}

function toggleTimer() {
  const game = appState.game;
  if (game.running) {
    openTimeoutModal();
    return;
  }
  game.running = true;
  appState.timerId = window.setInterval(tickClock, 1000);
  renderGame();
}

function tickClock() {
  const game = appState.game;
  if (!game) return;
  game.remainingSeconds = Math.max(0, game.remainingSeconds - 1);
  maybeAnnounceTime(game);
  if (game.remainingSeconds === 0) finishGame();
  renderGame();
}

function resetTimer() {
  stopTimer();
  appState.game.remainingSeconds = appState.game.durationSeconds;
  appState.game.running = false;
  appState.game.timeAlerts = [];
  renderGame();
}

function stopTimer() {
  window.clearInterval(appState.timerId);
  appState.timerId = null;
  if (appState.game) appState.game.running = false;
}

function checkTimeAndTarget() {
  const game = appState.game;
  if (game.targetScore && (game.scoreA >= game.targetScore || game.scoreB >= game.targetScore)) finishGame();
}

async function toggleCamera(forceOn = null, options = {}) {
  const game = appState.game;
  const { showAlert = true } = options;
  const shouldEnable = forceOn ?? !game.cameraEnabled;
  if (shouldEnable && appState.cameraStream && elements.cameraView.srcObject) {
    elements.cameraView.classList.add("active");
    game.cameraEnabled = true;
    game.cameraStatus = "Cámara activa";
    game.cameraError = "";
    renderGame();
    return true;
  }

  if (!shouldEnable) {
    stopCamera();
    game.cameraEnabled = false;
    game.cameraStatus = "";
    game.cameraError = "";
    renderGame();
    return false;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    const message = "Cámara no disponible. Puedes seguir grabando el marcador.";
    if (showAlert) alert(message);
    game.cameraEnabled = false;
    game.cameraStatus = "Cámara no disponible";
    game.cameraError = message;
    renderGame();
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    appState.cameraStream = stream;
    elements.cameraView.srcObject = stream;
    await elements.cameraView.play();
    elements.cameraView.classList.add("active");
    game.cameraEnabled = true;
    game.cameraStatus = "Cámara activa";
    game.cameraError = "";
    renderGame();
    return true;
  } catch (error) {
    const message = "Cámara no disponible. Puedes seguir grabando el marcador.";
    if (showAlert) alert(message);
    console.warn("Cámara no disponible", error);
    game.cameraEnabled = false;
    game.cameraStatus = "Cámara no disponible";
    game.cameraError = message;
    renderGame();
    return false;
  }
}

function stopCamera() {
  if (appState.cameraStream) appState.cameraStream.getTracks().forEach((track) => track.stop());
  appState.cameraStream = null;
  elements.cameraView.srcObject = null;
  elements.cameraView.classList.remove("active");
}

async function toggleRecordingMode() {
  const game = appState.game;
  if (game.internalRecording) {
    stopInternalRecording();
    return;
  }

  if (await startInternalRecording()) return;

  const enteringRecording = !game.recordingMode;
  game.recordingMode = enteringRecording;
  game.fullscreenMode = false;
  elements.controlsPanel.classList.remove("hidden");

  if (enteringRecording && !game.cameraEnabled) {
    game.cameraStatus = "Activando cámara…";
    game.cameraError = "";
    renderGame();
    const cameraStarted = await toggleCamera(true, { showAlert: false });
    game.recordingMode = true;
    if (!cameraStarted && !game.cameraError) {
      game.cameraStatus = "Cámara no disponible";
      game.cameraError = "Cámara no disponible. Puedes seguir grabando el marcador.";
    }
  }

  if (!enteringRecording) {
    game.cameraError = "";
  }

  renderGame();
}

async function toggleFullscreenMode(forceOff = false) {
  const game = appState.game;
  const entering = !forceOff && !game.fullscreenMode;
  game.fullscreenMode = entering;
  game.recordingMode = false;
  if (entering && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
  if (!entering && document.fullscreenElement) await document.exitFullscreen();
  renderGame();
}

function showControls() {
  appState.game.recordingMode = false;
  elements.controlsPanel.classList.remove("hidden");
  renderGame();
}

function handleDoubleTap() {
  const now = Date.now();
  if (now - appState.lastTap < 360) {
    if (appState.game?.fullscreenMode) toggleFullscreenMode(true);
    if (appState.game?.recordingMode) showControls();
  }
  appState.lastTap = now;
}


async function startInternalRecording() {
  const game = appState.game;
  if (!game || appState.mediaRecorder) return false;
  if (!("MediaRecorder" in window) || !HTMLCanvasElement.prototype.captureStream) {
    alert("Este navegador no permite grabación interna. Puedes usar el modo visual y grabar pantalla.");
    return false;
  }

  if (game.cameraEnabled && !appState.cameraStream) await toggleCamera(true, { showAlert: false });
  resetInternalRecorder();

  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const context = canvas.getContext("2d");
  const canvasStream = canvas.captureStream(30);
  const audio = ensureAudioContext();
  const audioTracks = appState.recordingAudioDestination?.stream?.getAudioTracks() || [];
  const stream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
  const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type)) || "";
  game.audioStatus = {
    appSounds: Boolean(appState.recordingAudioDestination),
    microphone: Boolean(appState.microphoneStream),
    autoVoiceNote: true,
    note: "La voz automática puede escucharse en vivo, pero algunos navegadores no permiten guardarla dentro del video. El video conservará marcador, subtítulos/teleprompter, sonidos y micrófono si están activos.",
  };
  void audio.resume?.();

  appState.recordingCanvas = canvas;
  appState.recordingCanvasContext = context;
  appState.recordingStream = stream;
  appState.recordingChunks = [];
  appState.recordingStartedAt = new Date().toISOString();
  game.internalRecording = true;
  game.recordingMode = true;
  game.recordingStartedAt = appState.recordingStartedAt;
  game.recordingUrl = "";
  game.recordingMimeType = mimeType || "video/webm";

  drawRecordingFrame();
  appState.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  appState.mediaRecorder.addEventListener("dataavailable", (event) => {
    if (event.data?.size) appState.recordingChunks.push(event.data);
  });
  appState.mediaRecorder.addEventListener("stop", () => finalizeInternalRecording(game));
  appState.mediaRecorder.start(1000);
  recordPlay({ type: "recording", text: "Grabación interna iniciada.", prompt: "GRABACIÓN INTERNA EN CURSO" });
  renderGame();
  return true;
}

function stopInternalRecording() {
  const recorder = appState.mediaRecorder;
  const game = appState.game;
  if (!recorder || recorder.state === "inactive") return;
  if (game) {
    game.internalRecording = false;
    game.recordingMode = false;
    game.recordingFinishedAt = new Date().toISOString();
  }
  recorder.stop();
}

function finalizeInternalRecording(game) {
  if (appState.recordingAnimationId) cancelAnimationFrame(appState.recordingAnimationId);
  const blob = new Blob(appState.recordingChunks, { type: game.recordingMimeType || "video/webm" });
  if (appState.recordedVideoUrl) URL.revokeObjectURL(appState.recordedVideoUrl);
  appState.recordingBlob = blob;
  const fileName = "go-basket-studio-partido.webm";
  appState.recordingFile = new File([blob], fileName, { type: blob.type || "video/webm" });
  appState.recordedVideoUrl = URL.createObjectURL(blob);
  game.recordingUrl = appState.recordedVideoUrl;
  game.recordingFileName = fileName;
  game.recordingSize = blob.size;
  game.downloadHint = "Video generado. Puedes descargarlo o compartirlo si tu celular lo permite.";
  game.internalRecording = false;
  game.recordingMode = false;
  appState.mediaRecorder = null;
  appState.recordingStream?.getTracks().forEach((track) => track.stop());
  appState.recordingStream = null;
  recordPlay({ type: "recording", text: "Video completo generado y listo en el reporte final.", prompt: "VIDEO COMPLETO LISTO" });
  renderGame();
  if (game.finishedAt) renderReport(game);
}

function resetInternalRecorder() {
  if (appState.mediaRecorder && appState.mediaRecorder.state !== "inactive") appState.mediaRecorder.stop();
  if (appState.recordingAnimationId) cancelAnimationFrame(appState.recordingAnimationId);
  appState.recordingAnimationId = null;
  appState.recordingCanvas = null;
  appState.recordingCanvasContext = null;
  appState.recordingStream?.getTracks().forEach((track) => track.stop());
  appState.recordingStream = null;
  appState.mediaRecorder = null;
  appState.recordingChunks = [];
  appState.recordingBlob = null;
  appState.recordingFile = null;
  appState.recordingStartedAt = null;
}

function drawRecordingFrame() {
  const game = appState.game;
  const canvas = appState.recordingCanvas;
  const context = appState.recordingCanvasContext;
  if (!game || !canvas || !context) return;

  const { width, height } = canvas;
  const video = elements.cameraView;
  context.fillStyle = "#0a0712";
  context.fillRect(0, 0, width, height);

  if (game.cameraEnabled && video.readyState >= 2) {
    const videoRatio = video.videoWidth / video.videoHeight || 16 / 9;
    const canvasRatio = width / height;
    let drawWidth = width;
    let drawHeight = height;
    let x = 0;
    let y = 0;
    if (videoRatio > canvasRatio) {
      drawHeight = height;
      drawWidth = height * videoRatio;
      x = (width - drawWidth) / 2;
    } else {
      drawWidth = width;
      drawHeight = width / videoRatio;
      y = (height - drawHeight) / 2;
    }
    context.drawImage(video, x, y, drawWidth, drawHeight);
    context.fillStyle = "rgba(6, 4, 12, 0.5)";
    context.fillRect(0, 0, width, height);
  } else {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#21103d");
    gradient.addColorStop(0.5, "#0a0712");
    gradient.addColorStop(1, "#321107");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  drawScoreBox(context, 50, 38, 320, 150, game.teamA, game.scoreA, game.foulsA, "#4cc9f0");
  drawScoreBox(context, width - 370, 38, 320, 150, game.teamB, game.scoreB, game.foulsB, "#ff3d57");
  drawClockBox(context, width / 2 - 170, 38, 340, 150, formatClock(game.remainingSeconds));

  context.fillStyle = "rgba(10, 7, 18, 0.78)";
  roundRect(context, 70, height - 178, width - 140, 118, 28);
  context.fill();
  context.fillStyle = "#9ca3af";
  context.font = "700 24px system-ui, sans-serif";
  context.fillText("ÚLTIMA JUGADA", 105, height - 126);
  context.fillStyle = "#ffffff";
  context.font = "900 38px system-ui, sans-serif";
  fillWrappedText(context, game.history[0]?.text || "Go Basket Studio en vivo", 105, height - 82, width - 210, 42);

  drawCanvasTimeline(context, game, 90, height - 42, width - 180, 14);

  if (game.introActive && appState.currentIntroPlayer) drawIntroCard(context, appState.currentIntroPlayer, game);

  context.fillStyle = "rgba(255, 122, 24, 0.95)";
  context.beginPath();
  context.arc(width - 84, height - 84, 16, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = "900 24px system-ui, sans-serif";
  context.fillText("REC", width - 60, height - 76);

  appState.recordingAnimationId = requestAnimationFrame(drawRecordingFrame);
}


function drawCanvasTimeline(context, game, x, y, width, height) {
  context.fillStyle = "rgba(255, 255, 255, 0.24)";
  roundRect(context, x, y, width, height, height / 2);
  context.fill();
  const progress = game.durationSeconds ? (game.durationSeconds - game.remainingSeconds) / game.durationSeconds : 0;
  context.fillStyle = "rgba(255, 209, 102, 0.8)";
  roundRect(context, x, y, Math.max(height, width * progress), height, height / 2);
  context.fill();
  game.history.forEach((play) => {
    if (typeof play.elapsedGameSeconds !== "number") return;
    const px = x + (play.elapsedGameSeconds / game.durationSeconds) * width;
    context.fillStyle = play.eventColor || "#ffffff";
    context.beginPath();
    context.arc(px, y + height / 2, 8, 0, Math.PI * 2);
    context.fill();
  });
}

function drawIntroCard(context, intro, game) {
  const player = intro.player;
  const teamName = intro.teamName;
  const x = 170;
  const y = 210;
  const width = 940;
  const height = 300;
  context.fillStyle = "rgba(10, 7, 18, 0.9)";
  roundRect(context, x, y, width, height, 36);
  context.fill();
  context.strokeStyle = "#ffd166";
  context.lineWidth = 5;
  context.stroke();
  context.fillStyle = "#ffd166";
  context.font = "900 28px system-ui, sans-serif";
  context.fillText(teamName.toUpperCase(), x + 260, y + 62);
  context.fillStyle = "#ffffff";
  context.font = "1000 66px system-ui, sans-serif";
  context.fillText(player.name || "Jugador", x + 260, y + 145);
  context.fillStyle = "#4cc9f0";
  context.font = "1000 92px system-ui, sans-serif";
  context.fillText(`#${player.number || "--"}`, x + 42, y + 165);
  context.fillStyle = "#d1d5db";
  context.font = "700 28px system-ui, sans-serif";
  fillWrappedText(context, [player.position, player.origin, player.extra].filter(Boolean).join(" · "), x + 260, y + 206, 610, 34);
}

function drawScoreBox(context, x, y, width, height, teamName, score, fouls, color) {
  context.fillStyle = "rgba(10, 7, 18, 0.82)";
  roundRect(context, x, y, width, height, 26);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 4;
  context.stroke();
  context.fillStyle = "#ffffff";
  context.font = "900 30px system-ui, sans-serif";
  context.fillText(teamName.slice(0, 18), x + 26, y + 45);
  context.fillStyle = color;
  context.font = "1000 86px system-ui, sans-serif";
  context.fillText(String(score), x + 26, y + 126);
  context.fillStyle = "#d1d5db";
  context.font = "700 24px system-ui, sans-serif";
  context.fillText(`Faltas ${fouls}`, x + 190, y + 118);
}

function drawClockBox(context, x, y, width, height, clock) {
  context.fillStyle = "rgba(10, 7, 18, 0.88)";
  roundRect(context, x, y, width, height, 30);
  context.fill();
  context.strokeStyle = "#ffd166";
  context.lineWidth = 4;
  context.stroke();
  context.fillStyle = "#ffd166";
  context.font = "1000 76px system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText(clock, x + width / 2, y + 100);
  context.fillStyle = "#ffffff";
  context.font = "900 22px system-ui, sans-serif";
  context.fillText("EN VIVO", x + width / 2, y + 132);
  context.textAlign = "left";
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function fillWrappedText(context, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  words.forEach((word) => {
    const testLine = `${line}${word} `;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line.trim(), x, y);
      line = `${word} `;
      y += lineHeight;
    } else {
      line = testLine;
    }
  });
  if (line) context.fillText(line.trim(), x, y);
}



function maybeOfferPlayerIntro() {
  const players = [...appState.game.players.A, ...appState.game.players.B];
  if (!players.length) return;
  if (confirm("¿Deseas presentar jugadores antes de iniciar?")) openIntroModal("all");
}

function buildIntroQueue(scope = "all") {
  const game = appState.game;
  const source = scope === "A" ? game.players.A : scope === "B" ? game.players.B : [...game.players.A, ...game.players.B];
  return source.map((player) => ({ player, teamKey: player.team, teamName: player.team === "A" ? game.teamA : game.teamB }));
}

function openIntroModal(scope = "all") {
  const queue = buildIntroQueue(scope);
  if (!queue.length) {
    alert("No hay jugadores registrados para presentar.");
    return;
  }
  appState.introQueue = queue;
  appState.introIndex = 0;
  appState.game.introActive = true;
  ensureIntroModal();
  showIntroPlayer();
}

function ensureIntroModal() {
  if (elements.introModal) return elements.introModal;
  const modal = document.createElement("div");
  modal.className = "intro-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="intro-card" role="dialog" aria-modal="true">
      <div class="intro-player-view"></div>
      <div class="intro-actions">
        <button data-intro-action="next" type="button">Siguiente jugador</button>
        <button data-intro-action="skip" type="button">Saltar presentación</button>
        <button data-intro-action="repeat" type="button">Repetir presentación</button>
        <button data-intro-action="teamA" type="button">Presentar equipo A</button>
        <button data-intro-action="teamB" type="button">Presentar equipo B</button>
        <button data-intro-action="all" type="button">Presentar todos</button>
      </div>
    </div>
  `;
  modal.addEventListener("click", (event) => {
    const action = event.target.closest("[data-intro-action]")?.dataset.introAction;
    if (!action) return;
    if (action === "next") nextIntroPlayer();
    if (action === "skip") closeIntroModal();
    if (action === "repeat") presentCurrentIntro(true);
    if (action === "teamA") openIntroModal("A");
    if (action === "teamB") openIntroModal("B");
    if (action === "all") openIntroModal("all");
  });
  document.body.append(modal);
  elements.introModal = modal;
  return modal;
}

function showIntroPlayer() {
  const intro = appState.introQueue[appState.introIndex];
  if (!intro) {
    closeIntroModal();
    return;
  }
  appState.currentIntroPlayer = intro;
  elements.introModal.hidden = false;
  document.body.classList.add("modal-open");
  const player = intro.player;
  const avatar = player.photoUrl ? `<img src="${player.photoUrl}" alt="${escapeHtml(player.name || "Jugador")}">` : `<div class="intro-avatar">#${escapeHtml(player.number || "--")}</div>`;
  $(".intro-player-view", elements.introModal).innerHTML = `
    <p class="eyebrow">Presentación profesional</p>
    <div class="intro-layout">
      ${avatar}
      <div>
        <span>${escapeHtml(intro.teamName)}</span>
        <h2>${escapeHtml(player.name || "Jugador")}</h2>
        <strong>Número ${escapeHtml(player.number || "sin número")}</strong>
        <p>${[player.position, player.origin, player.extra].filter(Boolean).map(escapeHtml).join(" · ") || "Go Basket Studio en vivo"}</p>
      </div>
    </div>
  `;
  presentCurrentIntro();
  renderGame();
}

function buildIntroNarration(intro) {
  const player = intro.player;
  const parts = [`Del equipo ${intro.teamName}`];
  if (player.number) parts.push(`con el número ${player.number}`);
  if (player.position) parts.push(`jugando en la posición de ${player.position}`);
  if (player.origin) parts.push(`originario de ${player.origin}`);
  if (player.extra) parts.push(player.extra);
  return `${parts.join(", ")}... ¡${player.name || "Jugador"}!`;
}

function presentCurrentIntro(repeat = false) {
  const intro = appState.currentIntroPlayer;
  if (!intro) return;
  const narrationText = buildIntroNarration(intro);
  const teleprompterText = `Presentación: ${intro.teamName} · #${intro.player.number || "--"} ${intro.player.name || "Jugador"}`;
  if (!repeat) recordPlay({ type: "playerIntro", team: intro.teamKey, teamKey: intro.teamKey, teamName: intro.teamName, playerId: intro.player.id, playerName: intro.player.name || "", playerNumber: intro.player.number || "", text: narrationText, narrationText, teleprompterText, prompt: teleprompterText });
  playSound("intro");
  setSuggestedPrompt(teleprompterText);
  announce(narrationText);
}

function nextIntroPlayer() {
  appState.introIndex += 1;
  showIntroPlayer();
}

function closeIntroModal() {
  if (elements.introModal) elements.introModal.hidden = true;
  document.body.classList.remove("modal-open");
  if (appState.game) {
    appState.game.introActive = false;
    appState.game.introCompleted = true;
  }
  appState.currentIntroPlayer = null;
  renderGame();
}

function toggleTvMode() {
  const game = appState.game;
  game.tvMode = !game.tvMode;
  game.recordingMode = false;
  elements.controlsPanel.classList.remove("hidden");
  renderGame();
}

function updateTvPanel() {
  const game = appState.game;
  if (!game) return;
  if (!elements.tvHelpPanel) {
    elements.tvHelpPanel = document.createElement("aside");
    elements.tvHelpPanel.className = "tv-help-panel";
    elements.tvHelpPanel.innerHTML = `
      <strong>Modo TV / Tablero gigante</strong>
      <p>Para verlo en una TV, abre esta pantalla en la TV o duplica la pantalla del celular con Chromecast, AirPlay, Miracast o cable HDMI.</p>
      <div>
        <button id="openTvWindowBtn" type="button">Abrir tablero en nueva pestaña</button>
        <button id="tvFullscreenBtn" type="button">Pantalla completa</button>
        <button id="presentationBtn" type="button" hidden>Enviar a pantalla</button>
      </div>
      <small class="presentation-message">Usa duplicar pantalla si tu navegador no muestra envío externo.</small>
    `;
    elements.gameScreen.append(elements.tvHelpPanel);
    $("#openTvWindowBtn", elements.tvHelpPanel).addEventListener("click", openTvWindow);
    $("#tvFullscreenBtn", elements.tvHelpPanel).addEventListener("click", () => toggleFullscreenMode());
    const presentationBtn = $("#presentationBtn", elements.tvHelpPanel);
    if ("PresentationRequest" in window) {
      presentationBtn.hidden = false;
      presentationBtn.addEventListener("click", startPresentationMode);
    }
  }
  elements.tvHelpPanel.hidden = !game.tvMode;
  const tvButton = $("#tvModeBtn");
  if (tvButton) tvButton.textContent = game.tvMode ? "Salir de modo TV" : "Modo TV / Tablero gigante";
  syncTvWindow();
}

function openTvWindow() {
  const win = window.open("", "goBasketStudioTv");
  if (!win) {
    alert("No se pudo abrir la pestaña. Permite ventanas emergentes o usa duplicar pantalla.");
    return;
  }
  elements.tvWindow = win;
  syncTvWindow();
}

function syncTvWindow() {
  const game = appState.game;
  const win = elements.tvWindow;
  if (!game || !win || win.closed) return;
  win.document.open();
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Go Basket Studio TV</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at top left,#2b1454,#07030d 55%,#180904);color:#fff8ed;font-family:system-ui,sans-serif}.board{width:min(1200px,92vw);display:grid;gap:24px;text-align:center}.brand{color:#ffd166;font-weight:1000;letter-spacing:.16em}.score{display:grid;grid-template-columns:1fr auto 1fr;gap:24px;align-items:center}.team{border:1px solid rgba(255,255,255,.2);border-radius:32px;padding:28px;background:rgba(255,255,255,.08)}.team strong{display:block;font-size:clamp(6rem,18vw,14rem);line-height:.9}.clock{font-size:clamp(4rem,12vw,10rem);font-weight:1000;color:#ffd166}.last{border-radius:28px;padding:24px;background:rgba(255,122,24,.18);font-size:clamp(1.4rem,4vw,3rem);font-weight:900}</style></head><body><main class="board"><div class="brand">GO BASKET STUDIO · TABLERO GIGANTE</div><section class="score"><article class="team"><h1>${escapeHtml(game.teamA)}</h1><strong style="color:#4cc9f0">${game.scoreA}</strong><p>Faltas ${game.foulsA}</p></article><div class="clock">${formatClock(game.remainingSeconds)}</div><article class="team"><h1>${escapeHtml(game.teamB)}</h1><strong style="color:#ff3d57">${game.scoreB}</strong><p>Faltas ${game.foulsB}</p></article></section><div class="last">${escapeHtml(game.history[0]?.teleprompterText || game.history[0]?.text || "Go Basket Studio en vivo")}</div></main></body></html>`);
  win.document.close();
}

async function startPresentationMode() {
  if (!("PresentationRequest" in window)) return;
  try {
    const request = new PresentationRequest([window.location.href]);
    await request.start();
  } catch (error) {
    alert("No se pudo enviar a pantalla desde este navegador. Usa duplicar pantalla.");
  }
}

function ensureAudioContext() {
  if (!appState.audioContext) appState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (!appState.recordingAudioDestination) appState.recordingAudioDestination = appState.audioContext.createMediaStreamDestination();
  if (appState.audioContext.state === "suspended") appState.audioContext.resume();
  return appState.audioContext;
}

function playSound(type) {
  const game = appState.game;
  if (!game?.soundsEnabled && type !== "start") return;
  const audio = ensureAudioContext();
  const now = audio.currentTime;
  const out = audio.createGain();
  out.gain.setValueAtTime(0.001, now);
  out.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
  out.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
  out.connect(audio.destination);
  if (appState.recordingAudioDestination) out.connect(appState.recordingAudioDestination);

  const notes = {
    basket: [660, 880],
    triple: [660, 990, 1320],
    foul: [1400, 900],
    final: [220, 165, 110],
    alert: [880, 880],
    timeout: [1200, 880, 1200],
    intro: [330, 495, 660, 990],
    start: [440, 660],
  }[type] || [520];

  notes.forEach((freq, index) => {
    const osc = audio.createOscillator();
    osc.type = type === "foul" ? "square" : "sine";
    osc.frequency.setValueAtTime(freq, now + index * 0.11);
    osc.connect(out);
    osc.start(now + index * 0.11);
    osc.stop(now + index * 0.11 + 0.18);
  });
}


async function toggleNarratorMicrophone() {
  if (appState.microphoneStream) {
    stopNarratorMicrophone();
    renderGame();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    alert("Micrófono no disponible en este navegador.");
    return;
  }
  try {
    const audio = ensureAudioContext();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    appState.microphoneStream = stream;
    appState.microphoneSource = audio.createMediaStreamSource(stream);
    appState.microphoneSource.connect(appState.recordingAudioDestination);
    appState.game.microphoneEnabled = true;
    appState.game.audioStatus.microphone = true;
    setSuggestedPrompt("Micrófono narrador activo. Lee la frase sugerida en voz alta.");
  } catch (error) {
    console.warn("No se pudo activar micrófono narrador", error);
    alert("No se pudo activar el micrófono narrador. Revisa permisos del navegador.");
  }
  renderGame();
}

function stopNarratorMicrophone() {
  appState.microphoneStream?.getTracks().forEach((track) => track.stop());
  appState.microphoneStream = null;
  appState.microphoneSource = null;
  if (appState.game) {
    appState.game.microphoneEnabled = false;
    appState.game.audioStatus.microphone = false;
  }
}

function updateMicrophoneStatus() {
  const game = appState.game;
  if (!game) return;
  const button = $("#microphoneBtn");
  if (button) button.textContent = `Micrófono narrador ${appState.microphoneStream ? "ON" : "OFF"}`;
  if (!elements.microphoneStatus) {
    elements.microphoneStatus = document.createElement("div");
    elements.microphoneStatus.className = "microphone-status";
    elements.gameScreen.append(elements.microphoneStatus);
  }
  elements.microphoneStatus.hidden = !appState.microphoneStream;
  elements.microphoneStatus.textContent = "Micrófono narrador activo";
}

function toggleCrowd() {
  const game = appState.game;
  game.crowdEnabled = !game.crowdEnabled;
  if (game.crowdEnabled) startCrowd();
  else stopCrowd();
  renderGame();
}

function startCrowd() {
  const audio = ensureAudioContext();
  const buffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * 0.18;
  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  const gain = audio.createGain();
  gain.gain.value = 0.08;
  source.connect(filter).connect(gain).connect(audio.destination);
  if (appState.recordingAudioDestination) gain.connect(appState.recordingAudioDestination);
  source.start();
  appState.crowdNode = source;
}

function stopCrowd() {
  if (appState.crowdNode) appState.crowdNode.stop();
  appState.crowdNode = null;
  if (appState.game) appState.game.crowdEnabled = false;
}

function getSpanishVoice() {
  if (appState.spanishVoice) return appState.spanishVoice;
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices?.() || [];
  const preferred = voices.find((voice) => /es[-_](MX|US|ES|419)/i.test(voice.lang) && /Google|Microsoft|Paulina|Mónica|Monica|Luciana|Jorge|Natural/i.test(voice.name))
    || voices.find((voice) => /^es/i.test(voice.lang));
  appState.spanishVoice = preferred || null;
  return appState.spanishVoice;
}

function announce(text) {
  const game = appState.game;
  if (!game?.narratorEnabled || game.humanNarratorEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-MX";
  utterance.rate = 0.94;
  utterance.pitch = 1.06;
  utterance.volume = 1;
  const voice = getSpanishVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    appState.spanishVoice = null;
    getSpanishVoice();
  });
}

function finishGame() {
  const game = appState.game;
  if (!game || game.finishedAt) return;
  stopTimer();
  stopCrowd();
  game.finishedAt = new Date().toISOString();
  game.recordingMode = false;
  if (game.internalRecording) stopInternalRecording();
  game.fullscreenMode = false;
  const finalText = `¡JUEGO FINALIZADO! Resultado final: ${buildScoreLine(game)}.`;
  if (!game.finalAnnounced) {
    game.finalAnnounced = true;
    game.timeAlerts = [...new Set([...(game.timeAlerts || []), "final"] )];
    recordPlay({ type: "final", text: finalText, narrationText: finalText, teleprompterText: "Juego finalizado. Resultado final listo para reporte.", prompt: "JUEGO FINALIZADO" });
    playSound("final");
    setSuggestedPrompt("Juego finalizado. Resultado final listo para reporte.");
    announce(finalText);
  }
  stopCamera();
  renderReport(game);
  showScreen("report");
}

function buildSummary(game) {
  const winner = game.scoreA === game.scoreB ? "Empate" : game.scoreA > game.scoreB ? game.teamA : game.teamB;
  const lines = [
    "🏀 Go Basket Studio",
    `${game.teamA} ${game.scoreA} - ${game.scoreB} ${game.teamB}`,
    `Ganador: ${winner}`,
    `Duración programada: ${Math.round(game.durationSeconds / 60)} minutos`,
    `Faltas: ${game.teamA} ${game.foulsA} · ${game.teamB} ${game.foulsB}`,
  ];
  const players = [...game.players.A, ...game.players.B].filter((player) => player.points || player.fouls);
  if (players.length) {
    lines.push("Jugadores:");
    players.forEach((player) => lines.push(`- ${player.number ? `#${player.number} ` : ""}${player.name || "Jugador"}: ${player.points} pts, ${player.fouls} faltas`));
  }
  lines.push("Creado con Go Basket Studio.");
  return lines.join("\n");
}


function buildPlayerBetaSummaries(game) {
  return [...game.players.A, ...game.players.B]
    .filter((player) => player.name || player.number || player.points || player.fouls)
    .map((player) => {
      const teamName = player.team === "A" ? game.teamA : game.teamB;
      const label = `${player.name || "Jugador"}${player.number ? ` #${player.number}` : ""}`;
      const plays = game.history
        .filter((play) => play.playerId === player.id)
        .slice()
        .reverse();
      const shareText = `${label} (${teamName}): ${player.points} puntos, ${player.fouls} faltas. Jugadas registradas: ${plays.length ? plays.map((play) => play.narrationText || play.text).join(" | ") : "sin jugadas individuales"}.`;
      return { label, teamName, player, plays, shareText };
    });
}

function downloadRecording(game) {
  if (!game.recordingUrl) return;
  const link = document.createElement("a");
  link.href = game.recordingUrl;
  link.download = game.recordingFileName || "go-basket-studio-partido.webm";
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  const help = $("#videoHelp");
  if (help) help.textContent = "Si no se guardó automáticamente, mantén presionado el video y elige descargar/guardar.";
}

async function shareRecording(game, summary) {
  const file = appState.recordingFile;
  const help = $("#videoHelp");
  if (!file || !navigator.canShare?.({ files: [file] })) {
    const message = "Este navegador no permite compartir el archivo directamente. Descarga el video y compártelo desde tu galería o archivos.";
    if (help) help.textContent = message;
    alert(message);
    return;
  }
  try {
    await navigator.share({ files: [file], title: "Go Basket Studio", text: summary });
  } catch (error) {
    if (error.name !== "AbortError") {
      const message = "No se pudo compartir directamente. Descarga el video y compártelo desde tu galería o archivos.";
      if (help) help.textContent = message;
      alert(message);
    }
  }
}


function buildTimelineHtml(game) {
  const plays = game.history.filter((play) => ["score", "foul", "timeout", "playerIntro", "time", "final"].includes(play.type)).slice().reverse();
  if (!plays.length) return '<p class="saved-meta">Sin eventos para la línea de tiempo.</p>';
  return `
    <div class="timeline-bar" style="--duration:${game.durationSeconds}">
      ${plays.map((play, index) => {
        const left = game.durationSeconds ? Math.min(100, Math.max(0, (play.elapsedGameSeconds || 0) / game.durationSeconds * 100)) : 0;
        return `<button class="timeline-dot" type="button" data-timeline-index="${index}" style="left:${left}%; --event-color:${play.eventColor || '#fff'}" title="${escapeHtml(play.eventLabel || play.type)}"><span>${escapeHtml(play.eventLabel || "·")}</span></button>`;
      }).join("")}
    </div>
    <div id="timelineDetail" class="timeline-detail">Toca una marca para ver el detalle.</div>
  `;
}

function bindTimelineEvents(game) {
  const plays = game.history.filter((play) => ["score", "foul", "timeout", "playerIntro", "time", "final"].includes(play.type)).slice().reverse();
  $$('[data-timeline-index]', elements.reportView).forEach((button) => button.addEventListener("click", () => {
    const play = plays[Number(button.dataset.timelineIndex)];
    if (!play) return;
    const detail = $("#timelineDetail", elements.reportView);
    const player = play.playerName ? ` · ${escapeHtml(play.playerName)}${play.playerNumber ? ` #${escapeHtml(play.playerNumber)}` : ""}` : "";
    detail.innerHTML = `<strong>${escapeHtml(formatClock(play.remainingSeconds ?? 0))}</strong><p>${escapeHtml(play.narrationText || play.text)}${player}</p><small>Marcador: ${play.scoreA} - ${play.scoreB}</small>`;
    const video = $("#finalVideo");
    if (video && typeof play.recordingTimeMs === "number") video.currentTime = Math.max(0, play.recordingTimeMs / 1000);
  }));
}

function renderReport(game) {
  const winner = game.scoreA === game.scoreB ? "Empate" : game.scoreA > game.scoreB ? game.teamA : game.teamB;
  const summary = buildSummary(game);
  const players = [...game.players.A, ...game.players.B].filter((player) => player.name || player.number);
  const betaSummaries = buildPlayerBetaSummaries(game);
  const audioStatus = game.audioStatus || {};
  const audioBlock = `<div class="stat-box"><b>Estado de audio</b><p>${audioStatus.microphone ? "Video con audio de micrófono" : "Micrófono narrador no activo"}<br>${audioStatus.appSounds ? "Video con sonidos de app" : "Sonidos de app preparados cuando el navegador lo permite"}<br>La voz automática puede depender del navegador.</p></div>`;
  const videoBlock = game.recordingUrl
    ? `<div class="video-report"><b>Video completo del partido</b><video id="finalVideo" controls src="${game.recordingUrl}"></video><small>${game.downloadHint || "Video generado. Puedes descargarlo o compartirlo si tu celular lo permite."}</small><small>${game.recordingSize ? `${(game.recordingSize / 1024 / 1024).toFixed(1)} MB · ` : ""}${escapeHtml(game.recordingMimeType || "video/webm")}</small><div class="video-actions"><button id="viewVideoBtn" type="button">Ver video</button><button id="downloadVideoBtn" type="button">Descargar video</button><button id="shareVideoBtn" type="button">Compartir video</button></div><p id="videoHelp" class="video-help">Si tu navegador bloquea la descarga, mantén presionado el video y elige descargar/guardar.</p></div>`
    : `<div class="video-report video-report--empty"><b>Video completo del partido</b><p>No se generó video interno en este partido. Usa “Grabar video completo” antes de finalizar.</p></div>`;
  elements.reportView.innerHTML = `
    <p class="eyebrow">Resultado final</p>
    <h2>${escapeHtml(winner)}</h2>
    <div class="report-score">
      <span>${escapeHtml(game.teamA)}</span><strong>${game.scoreA} - ${game.scoreB}</strong><span>${escapeHtml(game.teamB)}</span>
    </div>
    <div class="report-grid">
      <div class="stat-box"><b>Puntos por equipo</b><p>${escapeHtml(game.teamA)}: ${game.scoreA}<br>${escapeHtml(game.teamB)}: ${game.scoreB}</p></div>
      <div class="stat-box"><b>Faltas por equipo</b><p>${escapeHtml(game.teamA)}: ${game.foulsA}<br>${escapeHtml(game.teamB)}: ${game.foulsB}</p></div>
      <div class="stat-box"><b>Duración</b><p>${Math.round(game.durationSeconds / 60)} minutos programados</p></div>
      <div class="stat-box"><b>Jugadores</b><p>${players.length ? players.map((player) => `${escapeHtml(player.number ? `#${player.number} ` : "")}${escapeHtml(player.name || "Jugador")}: ${player.points} pts, ${player.fouls} faltas`).join("<br>") : "Sin jugadores registrados"}</p></div>
      ${audioBlock}
    </div>
    ${videoBlock}
    <div class="history-box"><b>Línea de tiempo del partido</b>${buildTimelineHtml(game)}</div>
    <div class="history-box"><b>Resumen por jugador</b>${betaSummaries.length ? `<div class="player-beta-list">${betaSummaries.map((item) => `<article><strong>${escapeHtml(item.label)} · ${escapeHtml(item.teamName)}</strong><span>${item.player.points} puntos · ${item.player.fouls} faltas</span><ol>${item.plays.length ? item.plays.map((play) => `<li>${escapeHtml(play.narrationText || play.text)}</li>`).join("") : "<li>Sin jugadas individuales registradas.</li>"}</ol><p>${escapeHtml(item.shareText)}</p><button class="small-btn" type="button" data-beta-summary="${escapeHtml(item.player.id)}">Crear resumen beta</button><small>Resumen beta: momentos registrados del jugador. El recorte automático de video requiere almacenamiento/procesamiento avanzado en una versión futura.</small></article>`).join("")}</div>` : "<p>Sin jugadores registrados para resumen beta.</p>"}</div>
    <div class="history-box"><b>Historial de jugadas</b><ol>${game.history.map((play) => `<li>${escapeHtml(formatClock(play.remainingSeconds ?? 0))} · ${escapeHtml(play.text)}</li>`).join("")}</ol></div>
    <div class="report-actions">
      <button id="copySummaryBtn" type="button">Copiar resumen</button>
      <button id="whatsBtn" type="button">Compartir por WhatsApp</button>
      <button id="saveMatchBtn" type="button">Guardar partido</button>
      <button data-open="home" type="button">Nuevo partido</button>
    </div>
  `;
  bindTimelineEvents(game);
  const viewVideoBtn = $("#viewVideoBtn");
  if (viewVideoBtn) viewVideoBtn.addEventListener("click", () => {
    const video = $("#finalVideo");
    video?.scrollIntoView({ behavior: "smooth", block: "center" });
    video?.play?.();
  });
  const downloadVideoBtn = $("#downloadVideoBtn");
  if (downloadVideoBtn) downloadVideoBtn.addEventListener("click", () => downloadRecording(game));
  const shareVideoBtn = $("#shareVideoBtn");
  if (shareVideoBtn) shareVideoBtn.addEventListener("click", () => shareRecording(game, summary));
  $$('[data-beta-summary]', elements.reportView).forEach((button) => button.addEventListener("click", () => alert("Resumen beta: momentos registrados del jugador. El recorte automático de video requiere almacenamiento/procesamiento avanzado en una versión futura.")));
  $("#copySummaryBtn").addEventListener("click", () => navigator.clipboard.writeText(summary));
  $("#whatsBtn").addEventListener("click", () => window.open(`https://wa.me/?text=${encodeURIComponent(summary)}`, "_blank", "noopener"));
  $("#saveMatchBtn").addEventListener("click", () => saveCurrentMatch(game));
  $('[data-open="home"]', elements.reportView).addEventListener("click", () => showScreen("home"));
}

function saveCurrentMatch(game) {
  const saved = getSavedMatches();
  const snapshot = JSON.parse(JSON.stringify(game));
  snapshot.savedAt = new Date().toISOString();
  const next = [snapshot, ...saved.filter((item) => item.id !== game.id)].slice(0, 50);
  setSavedMatches(next);
  alert("Partido guardado en este dispositivo.");
}

function renderSavedMatches() {
  const saved = getSavedMatches();
  if (!saved.length) {
    elements.savedList.innerHTML = '<div class="saved-item"><p class="saved-meta">No hay partidos guardados todavía.</p></div>';
    return;
  }
  elements.savedList.innerHTML = saved.map((match) => `
    <article class="saved-item">
      <div>
        <strong>${escapeHtml(match.teamA)} ${match.scoreA} - ${match.scoreB} ${escapeHtml(match.teamB)}</strong>
        <p class="saved-meta">${new Date(match.savedAt || match.finishedAt || match.startedAt).toLocaleString("es")} · ${match.history?.length || 0} jugadas</p>
      </div>
      <div class="saved-actions">
        <button data-view-report="${match.id}" type="button">Ver reporte</button>
        <button class="danger" data-delete-match="${match.id}" type="button">Borrar</button>
      </div>
    </article>
  `).join("");
}

function renderRules() {
  elements.rulesPanel.innerHTML = appState.rules.map((rule) => `
    <label class="rule-card">
      <input type="checkbox" data-rule="${rule.key}" ${rule.enabled ? "checked" : ""} />
      <strong>${rule.label}</strong>
      <small>Estructura lista para futuras versiones.</small>
    </label>
  `).join("");
}

function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}


function setupInternalNavigation() {
  history.replaceState({ screen: appState.currentScreen }, "", `#${appState.currentScreen}`);
  window.addEventListener("popstate", (event) => {
    const target = event.state?.screen || "home";
    if (appState.currentScreen === "game" && appState.game && !appState.game.finishedAt) {
      if (!confirm("Hay un partido en curso. ¿Quieres salir al menú?")) {
        history.pushState({ screen: "game" }, "", "#game");
        return;
      }
      stopTimer();
      appState.suppressPushState = true;
      showScreen("home", { push: false });
      appState.suppressPushState = false;
      return;
    }
    if (appState.currentScreen === "home" && target === "home") {
      const now = Date.now();
      if (now - appState.lastBackAt > 1800) {
        appState.lastBackAt = now;
        alert("Presiona regresar otra vez para salir.");
        history.pushState({ screen: "home" }, "", "#home");
      }
      return;
    }
    appState.suppressPushState = true;
    showScreen(target, { push: false });
    appState.suppressPushState = false;
  });
}

function setupPullToRefreshGuard() {
  document.addEventListener("touchstart", (event) => {
    appState.touchStartY = event.touches?.[0]?.clientY || 0;
  }, { passive: true });
  document.addEventListener("touchmove", (event) => {
    const gameActive = appState.currentScreen === "game" || appState.game?.recordingMode || appState.game?.tvMode;
    if (!gameActive) return;
    const target = event.target;
    const scrollable = target.closest?.(".player-action-card, .intro-card, .timeout-card, .history-box, .controls-panel, form, input, select, textarea");
    if (scrollable) return;
    const y = event.touches?.[0]?.clientY || 0;
    if (window.scrollY <= 0 && y > appState.touchStartY) event.preventDefault();
  }, { passive: false });
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const openTarget = event.target.closest("[data-open]");
    if (openTarget) showScreen(openTarget.dataset.open);

    const scoreButton = event.target.closest("[data-score]");
    if (scoreButton) requestPlayerForAction(scoreButton.dataset.score, "score", Number(scoreButton.dataset.points));

    const foulButton = event.target.closest("[data-foul]");
    if (foulButton) requestPlayerForAction(foulButton.dataset.foul, "foul");

    const deleteButton = event.target.closest("[data-delete-match]");
    if (deleteButton) {
      setSavedMatches(getSavedMatches().filter((match) => match.id !== deleteButton.dataset.deleteMatch));
      renderSavedMatches();
    }

    const viewButton = event.target.closest("[data-view-report]");
    if (viewButton) {
      const match = getSavedMatches().find((item) => item.id === viewButton.dataset.viewReport);
      if (match) {
        appState.game = match;
        renderReport(match);
        showScreen("report");
      }
    }
  });

  $$('[data-add-player]').forEach((button) => button.addEventListener("click", () => addPlayerRow(button.dataset.addPlayer)));

  elements.quickForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(elements.quickForm);
    startGame({ type: "quick", teamA: data.get("teamA"), teamB: data.get("teamB"), duration: data.get("duration"), camera: data.get("camera"), narrator: data.get("narrator"), sounds: data.get("sounds") });
  });

  elements.playersForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(elements.playersForm);
    startGame({ type: "players", teamA: data.get("teamA"), teamB: data.get("teamB"), duration: data.get("duration"), camera: data.get("camera"), narrator: data.get("narrator"), sounds: data.get("sounds"), players: { A: collectRoster("A"), B: collectRoster("B") } });
  });

  elements.threeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(elements.threeForm);
    const isPointMode = data.get("mode") === "points";
    startGame({ type: "3x3", teamA: data.get("teamA"), teamB: data.get("teamB"), duration: isPointMode ? 30 : data.get("limit"), targetScore: isPointMode ? Number(data.get("limit")) : null, narrator: true, sounds: true });
  });

  elements.rulesPanel.addEventListener("change", (event) => {
    const key = event.target.dataset.rule;
    const rule = appState.rules.find((item) => item.key === key);
    if (rule) {
      rule.enabled = event.target.checked;
      saveRules();
    }
  });

  $("#undoBtn").addEventListener("click", undoLastPlay);
  $("#timerBtn").addEventListener("click", toggleTimer);
  $("#resetTimerBtn").addEventListener("click", resetTimer);
  $("#finishBtn").addEventListener("click", finishGame);
  $("#cameraBtn").addEventListener("click", () => toggleCamera());
  $("#recordingBtn").addEventListener("click", toggleRecordingMode);
  $("#fullscreenBtn").addEventListener("click", () => toggleFullscreenMode());
  $("#soundBtn").addEventListener("click", () => { appState.game.soundsEnabled = !appState.game.soundsEnabled; renderGame(); });
  $("#narratorBtn").addEventListener("click", () => { appState.game.narratorEnabled = !appState.game.narratorEnabled; renderGame(); });
  $("#teleBtn").addEventListener("click", () => { appState.game.teleprompterEnabled = !appState.game.teleprompterEnabled; renderGame(); });
  $("#crowdBtn").addEventListener("click", toggleCrowd);
  elements.showControlsBtn.addEventListener("click", showControls);
  elements.exitFullscreenBtn.addEventListener("click", () => toggleFullscreenMode(true));
  elements.gameScreen.addEventListener("touchend", handleDoubleTap);
  elements.gameScreen.addEventListener("dblclick", handleDoubleTap);

  document.addEventListener("fullscreenchange", () => {
    if (appState.game && !document.fullscreenElement && appState.game.fullscreenMode) {
      appState.game.fullscreenMode = false;
      renderGame();
    }
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    appState.deferredInstallPrompt = event;
    elements.installBtn.hidden = false;
  });

  elements.installBtn.addEventListener("click", async () => {
    if (!appState.deferredInstallPrompt) return;
    appState.deferredInstallPrompt.prompt();
    await appState.deferredInstallPrompt.userChoice;
    appState.deferredInstallPrompt = null;
    elements.installBtn.hidden = true;
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}

addPlayerRow("A", { name: "Carlos", number: "13" });
addPlayerRow("B", { name: "José Luis", number: "7" });
renderRules();
setupInternalNavigation();
setupPullToRefreshGuard();
bindEvents();
registerServiceWorker();
