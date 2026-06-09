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
  crowdNode: null,
  cameraStream: null,
  mediaRecorder: null,
  pendingAction: null,
  tvWindow: null,
  preferredVoice: null,
  recordingChunks: [],
  recordingCanvas: null,
  recordingCanvasContext: null,
  recordingAnimationId: null,
  recordingStream: null,
  recordingStartedAt: null,
  recordedVideoUrl: null,
  recordedVideoBlob: null,
  recordedVideoFile: null,
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
  actionModal: null,
  humanPrompt: null,
  tvStatus: null,
  gameScreen: $('[data-screen="game"]'),
  controlsPanel: $("#controlsPanel"),
  showControlsBtn: $("#showControlsBtn"),
  exitFullscreenBtn: $("#exitFullscreenBtn"),
  playerChooser: $("#playerChooser"),
  playerSelect: $("#playerSelect"),
  reportView: $("#reportView"),
  installBtn: $("#installBtn"),
};

function ensureDynamicUi() {
  if (!elements.gameScreen || !elements.controlsPanel) return;

  if (!elements.actionModal) {
    const modal = document.createElement("div");
    modal.className = "action-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="action-modal__card" role="dialog" aria-modal="true" aria-labelledby="actionModalTitle">
        <p class="eyebrow">Go Basket Studio</p>
        <h3 id="actionModalTitle">¿Quién hizo la jugada?</h3>
        <p class="action-modal__hint">Elige jugador para que la narración diga nombre, número, equipo y marcador.</p>
        <div class="action-modal__players" id="actionPlayerList"></div>
        <button class="small-btn" id="actionNoPlayerBtn" type="button">Equipo completo / Sin jugador</button>
        <button class="small-btn danger" id="actionCancelBtn" type="button">Cancelar</button>
      </div>
    `;
    document.body.append(modal);
    elements.actionModal = modal;
    $("#actionNoPlayerBtn", modal).addEventListener("click", () => completePendingAction(null));
    $("#actionCancelBtn", modal).addEventListener("click", closeActionModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeActionModal();
    });
  }

  if (!elements.humanPrompt) {
    const prompt = document.createElement("div");
    prompt.className = "human-prompt";
    prompt.innerHTML = `<span>Frase sugerida para narrador</span><strong>GO BASKET STUDIO EN VIVO</strong>`;
    elements.gameScreen.insertBefore(prompt, elements.controlsPanel);
    elements.humanPrompt = prompt;
  }

  if (!elements.tvStatus) {
    const status = document.createElement("div");
    status.className = "tv-status";
    status.hidden = true;
    status.textContent = "Tablero TV activo";
    elements.gameScreen.append(status);
    elements.tvStatus = status;
  }

  if (!$("#humanNarratorBtn")) {
    const strip = document.createElement("div");
    strip.className = "control-strip control-strip--extra";
    strip.innerHTML = `
      <button id="humanNarratorBtn" type="button">Narrador humano OFF</button>
      <button id="tvBoardBtn" type="button">Modo TV / tablero gigante</button>
      <button id="shareVideoBtn" type="button" hidden>Compartir video</button>
    `;
    elements.controlsPanel.append(strip);
  }
}

function showScreen(name) {
  elements.screens.forEach((screen) => screen.classList.toggle("active", screen.dataset.screen === name));
  if (name === "saved") renderSavedMatches();
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
    soundsEnabled: Boolean(config.sounds),
    teleprompterEnabled: true,
    crowdEnabled: false,
    recordingMode: false,
    internalRecording: false,
    recordingUrl: "",
    recordingMimeType: "",
    recordingStartedAt: null,
    recordingFinishedAt: null,
    timeAlerts: [],
    fullscreenMode: false,
    targetScore: config.targetScore || null,
    players: config.players || { A: [], B: [] },
    history: [],
  };
}

function collectRoster(teamKey) {
  const root = teamKey === "A" ? elements.rosterA : elements.rosterB;
  return $$(".player-row", root)
    .map((row) => ({
      id: row.dataset.id,
      name: $('[data-player-name]', row).value.trim(),
      number: $('[data-player-number]', row).value.trim(),
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
    <button class="small-btn danger" type="button" aria-label="Quitar jugador">×</button>
  `;
  $("button", row).addEventListener("click", () => row.remove());
  (teamKey === "A" ? elements.rosterA : elements.rosterB).append(row);
}

function startGame(config) {
  ensureDynamicUi();
  stopTimer();
  stopCamera();
  stopCrowd();
  resetInternalRecorder();
  appState.game = createGame(config);
  appState.game.startedAt = new Date().toISOString();
  showScreen("game");
  renderGame();
  if (appState.game.cameraEnabled) toggleCamera(true);
  if (appState.game.soundsEnabled) playSound("start");
  announce("Partido listo. Convierte este juego en una transmisión desde tu celular.");
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
  $("#teleprompter").textContent = game.history[0]?.prompt || "GO BASKET STUDIO EN VIVO";
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
  updateHumanPrompt();
  updateTvBoard();
  $("#recordingBtn").textContent = game.internalRecording ? "Detener grabación interna" : "Grabar video completo";
  elements.gameScreen.classList.toggle("recording", game.recordingMode);
  elements.gameScreen.classList.toggle("fullscreen-mode", game.fullscreenMode);
  elements.showControlsBtn.hidden = !game.recordingMode && !game.internalRecording;
  elements.exitFullscreenBtn.hidden = !game.fullscreenMode;
  renderPlayerSelect();
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

function updateHumanPrompt() {
  const game = appState.game;
  if (!game || !elements.humanPrompt) return;
  const phrase = game.lastHumanPrompt || game.history[0]?.prompt || "GO BASKET STUDIO EN VIVO";
  elements.humanPrompt.hidden = !game.teleprompterEnabled;
  elements.humanPrompt.classList.toggle("human-prompt--active", game.humanNarratorEnabled);
  $("strong", elements.humanPrompt).textContent = phrase;
}

function updateTvBoard() {
  const game = appState.game;
  if (!game || !appState.tvWindow || appState.tvWindow.closed) {
    if (elements.tvStatus) elements.tvStatus.hidden = true;
    return;
  }
  const payload = {
    teamA: game.teamA,
    teamB: game.teamB,
    scoreA: game.scoreA,
    scoreB: game.scoreB,
    foulsA: game.foulsA,
    foulsB: game.foulsB,
    clock: formatClock(game.remainingSeconds),
    lastPlay: game.history[0]?.text || "Go Basket Studio en vivo",
  };
  appState.tvWindow.postMessage({ type: "GO_BASKET_UPDATE", payload }, "*");
  if (elements.tvStatus) elements.tvStatus.hidden = false;
}

function openTvBoard() {
  const game = appState.game;
  if (!game) return;
  const tv = window.open("", "go-basket-tv", "popup=yes,width=1200,height=720");
  if (!tv) {
    alert("El navegador bloqueó la pantalla TV. Permite ventanas emergentes o usa pantalla completa/duplicar pantalla.");
    return;
  }
  tv.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Go Basket Studio TV</title><style>
    body{margin:0;min-height:100vh;background:radial-gradient(circle at 20% 0,#3a1708,transparent 38%),linear-gradient(135deg,#05030a,#101a2a);color:#fff;font-family:system-ui,sans-serif;display:grid;place-items:center;overflow:hidden}
    .board{width:min(96vw,1500px);display:grid;gap:26px;text-align:center}.top{font-size:clamp(24px,4vw,64px);font-weight:1000;color:#ffd166;letter-spacing:.18em}.scores{display:grid;grid-template-columns:1fr .7fr 1fr;gap:24px;align-items:center}.team,.clock,.last{border:2px solid rgba(255,255,255,.16);border-radius:36px;background:rgba(0,0,0,.5);padding:32px;box-shadow:0 28px 80px rgba(0,0,0,.55)}.team span,.clock span{display:block;color:#c8b9a5;font-size:clamp(18px,2vw,34px);font-weight:900;text-transform:uppercase}.team strong{display:block;font-size:clamp(110px,18vw,280px);line-height:.85}.a strong{color:#4cc9f0}.b strong{color:#ff3d57}.clock strong{display:block;font-size:clamp(80px,12vw,190px);color:#ffd166;line-height:.9}.last{font-size:clamp(26px,4vw,76px);font-weight:950;text-align:left}.brand{position:fixed;right:24px;bottom:20px;color:#ffd166;font-weight:1000}</style></head><body><main class="board"><div class="top">GO BASKET STUDIO</div><section class="scores"><article class="team a"><span id="teamA"></span><strong id="scoreA"></strong><span id="foulsA"></span></article><article class="clock"><span>EN VIVO</span><strong id="clock"></strong><span>Tiempo</span></article><article class="team b"><span id="teamB"></span><strong id="scoreB"></strong><span id="foulsB"></span></article></section><section class="last" id="lastPlay"></section></main><div class="brand">Tablero gigante · Duplica esta pantalla a tu TV</div><script>function set(d){for(const k in d){const el=document.getElementById(k);if(el)el.textContent=d[k]}}window.addEventListener('message',e=>{if(e.data?.type==='GO_BASKET_UPDATE'){const p=e.data.payload;set({teamA:p.teamA,teamB:p.teamB,scoreA:p.scoreA,scoreB:p.scoreB,foulsA:'Faltas '+p.foulsA,foulsB:'Faltas '+p.foulsB,clock:p.clock,lastPlay:p.lastPlay})}});</script></body></html>`);
  tv.document.close();
  appState.tvWindow = tv;
  updateTvBoard();
  alert("Tablero TV abierto. Para verlo en una Smart TV, duplica pantalla con Chromecast, AirPlay, Miracast o HDMI, o abre esta misma app en la TV.");
}

function maybeAnnounceTime(game) {
  const marker = scoreMarker(game);
  const alerts = [
    { at: 360, key: "6m", text: `Quedan 6 minutos de juego. Marcador: ${marker}.`, prompt: `QUEDAN 6 MINUTOS · MARCADOR: ${marker}` },
    { at: 180, key: "3m", text: `Quedan 3 minutos de juego. Marcador: ${marker}.`, prompt: `QUEDAN 3 MINUTOS · MARCADOR: ${marker}` },
    { at: 60, key: "1m", text: `Queda 1 minuto de juego. Marcador: ${marker}.`, prompt: `QUEDA 1 MINUTO · MARCADOR: ${marker}` },
    { at: 30, key: "30s", text: "Quedan 30 segundos de juego.", prompt: "QUEDAN 30 SEGUNDOS" },
    { at: 10, key: "10s", text: "Quedan 10 segundos de juego.", prompt: "QUEDAN 10 SEGUNDOS" },
    { at: 5, key: "5s", text: "Quedan 5, 4, 3, 2, 1, fin del juego.", prompt: "5, 4, 3, 2, 1 · FIN DEL JUEGO" },
  ];
  const fired = new Set(game.timeAlerts || []);
  const alert = alerts.find((item) => item.at > 0 && game.durationSeconds > item.at && game.remainingSeconds === item.at && !fired.has(item.key));
  if (!alert) return;
  fired.add(alert.key);
  game.timeAlerts = [...fired];
  recordPlay({ type: "time", text: alert.text, prompt: alert.prompt });
  playSound("alert");
  announce(alert.text);
}

function renderPlayerSelect() {
  const game = appState.game;
  const players = [...game.players.A, ...game.players.B];
  elements.playerChooser.hidden = players.length === 0;
  elements.playerSelect.innerHTML = '<option value="">Equipo completo</option>' + players
    .map((player) => `<option value="${player.id}">${player.team === "A" ? game.teamA : game.teamB} · ${escapeHtml(player.name || "Jugador")}${player.number ? ` #${escapeHtml(player.number)}` : ""}</option>`)
    .join("");
}

function selectedPlayerFor(teamKey) {
  const playerId = elements.playerSelect.value;
  if (!playerId) return null;
  return appState.game.players[teamKey].find((player) => player.id === playerId) || null;
}

function addScore(teamKey, points) {
  requestAction({ type: "score", teamKey, points });
}

function addFoul(teamKey) {
  requestAction({ type: "foul", teamKey });
}

function requestAction(action) {
  const game = appState.game;
  const players = game?.players?.[action.teamKey] || [];
  if (!players.length) {
    if (action.type === "score") applyScore(action.teamKey, action.points, null);
    if (action.type === "foul") applyFoul(action.teamKey, null);
    return;
  }
  appState.pendingAction = action;
  openActionModal(action, players);
}

function openActionModal(action, players) {
  ensureDynamicUi();
  const modal = elements.actionModal;
  const teamName = action.teamKey === "A" ? appState.game.teamA : appState.game.teamB;
  $("#actionModalTitle", modal).textContent = action.type === "score"
    ? `¿Quién anotó ${action.points} ${action.points === 1 ? "punto" : "puntos"} para ${teamName}?`
    : `¿Quién cometió la falta de ${teamName}?`;
  $("#actionPlayerList", modal).innerHTML = players.map((player) => `
    <button type="button" class="action-player-btn" data-player-id="${player.id}">
      <strong>${escapeHtml(player.name || "Jugador")}</strong>
      <span>${player.number ? `#${escapeHtml(player.number)} · ` : ""}${escapeHtml(teamName)}</span>
    </button>
  `).join("");
  $$("[data-player-id]", modal).forEach((button) => button.addEventListener("click", () => {
    const player = players.find((item) => item.id === button.dataset.playerId) || null;
    completePendingAction(player);
  }));
  modal.hidden = false;
}

function closeActionModal() {
  if (elements.actionModal) elements.actionModal.hidden = true;
  appState.pendingAction = null;
}

function completePendingAction(player) {
  const action = appState.pendingAction;
  closeActionModal();
  if (!action) return;
  if (action.type === "score") applyScore(action.teamKey, action.points, player);
  if (action.type === "foul") applyFoul(action.teamKey, player);
}

function applyScore(teamKey, points, player) {
  const game = appState.game;
  const scoreKey = teamKey === "A" ? "scoreA" : "scoreB";
  game[scoreKey] += points;
  if (player) {
    player.points += points;
    player.madeShots = player.madeShots || { one: 0, two: 0, three: 0 };
    if (points === 1) player.madeShots.one += 1;
    if (points === 2) player.madeShots.two += 1;
    if (points === 3) player.madeShots.three += 1;
  }

  const teamName = teamKey === "A" ? game.teamA : game.teamB;
  const playerPhrase = player ? `, por parte de ${player.name || "Jugador"}${player.number ? `, número ${player.number}` : ""}` : "";
  const text = `¡${points} ${points === 1 ? "punto" : "puntos"} para ${teamName}${playerPhrase}! Marcador: ${scoreMarker(game)}.`;
  const playerLabel = player ? `${player.name || "Jugador"}${player.number ? ` #${player.number}` : ""}` : "Equipo completo";
  const prompt = `${points} ${points === 1 ? "PUNTO" : "PUNTOS"} PARA ${teamName.toUpperCase()} · ${playerLabel.toUpperCase()} · MARCADOR: ${scoreMarker(game)}`;
  game.lastHumanPrompt = buildHumanPrompt({ type: "score", teamName, player, points, text });
  recordPlay({
    type: "score",
    teamKey,
    teamName,
    playerId: player?.id || null,
    playerName: player?.name || "",
    playerNumber: player?.number || "",
    points,
    scoreA: game.scoreA,
    scoreB: game.scoreB,
    foulsA: game.foulsA,
    foulsB: game.foulsB,
    playerFouls: player?.fouls || 0,
    text,
    prompt,
  });
  playSound(points === 3 ? "triple" : "basket");
  announce(text);
  checkTimeAndTarget();
  renderGame();
}

function applyFoul(teamKey, player) {
  const game = appState.game;
  const foulKey = teamKey === "A" ? "foulsA" : "foulsB";
  game[foulKey] += 1;
  if (player) player.fouls += 1;

  const teamName = teamKey === "A" ? game.teamA : game.teamB;
  const text = player
    ? `¡Falta de ${teamName}, cometida por ${player.name || "Jugador"}${player.number ? `, número ${player.number}` : ""}! Faltas del jugador: ${player.fouls}. Faltas de equipo: ${game[foulKey]}.`
    : `¡Falta de ${teamName}! Faltas de equipo: ${game[foulKey]}.`;
  const playerLabel = player ? `${player.name || "Jugador"}${player.number ? ` #${player.number}` : ""}` : "Equipo completo";
  const prompt = `FALTA DE ${teamName.toUpperCase()} · ${playerLabel.toUpperCase()} · FALTAS: ${game[foulKey]}`;
  game.lastHumanPrompt = buildHumanPrompt({ type: "foul", teamName, player, text });
  recordPlay({
    type: "foul",
    teamKey,
    teamName,
    playerId: player?.id || null,
    playerName: player?.name || "",
    playerNumber: player?.number || "",
    points: 0,
    scoreA: game.scoreA,
    scoreB: game.scoreB,
    foulsA: game.foulsA,
    foulsB: game.foulsB,
    playerFouls: player?.fouls || 0,
    teamFouls: game[foulKey],
    text,
    prompt,
  });
  playSound("foul");
  announce(text);
  renderGame();
}

function buildHumanPrompt({ type, teamName, player, points, text }) {
  if (type === "score") {
    const playerLine = player ? `Canasta del número ${player.number || "sin número"}, ${player.name || "jugador"}.` : `Canasta para ${teamName}.`;
    const emotion = appState.game.scoreA === appState.game.scoreB ? "El partido está empatado." : "Esto se está poniendo bueno.";
    return `${playerLine} ${points} ${points === 1 ? "punto" : "puntos"} para ${teamName}. ${emotion} Marcador: ${scoreMarker(appState.game)}.`;
  }
  if (type === "foul") {
    return player ? `Falta del número ${player.number || "sin número"}, ${player.name || "jugador"}. Faltas de ${teamName}: ${teamName === appState.game.teamA ? appState.game.foulsA : appState.game.foulsB}.` : text;
  }
  return text || "Go Basket Studio en vivo.";
}

function recordPlay(play) {
  const game = appState.game;
  const recordingTimeMs = appState.recordingStartedAt
    ? Math.max(0, Date.now() - new Date(appState.recordingStartedAt).getTime())
    : null;
  const entry = {
    ...play,
    at: new Date().toISOString(),
    remainingSeconds: game.remainingSeconds,
    recordingTimeMs,
    scoreA: play.scoreA ?? game.scoreA,
    scoreB: play.scoreB ?? game.scoreB,
    foulsA: play.foulsA ?? game.foulsA,
    foulsB: play.foulsB ?? game.foulsB,
    scoreAfter: play.scoreAfter || { A: game.scoreA, B: game.scoreB },
  };
  game.lastHumanPrompt = entry.prompt || entry.text || game.lastHumanPrompt;
  game.history.unshift(entry);
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
  if (player.name && player.number) return `${player.name}, número ${player.number}`;
  return player.name || `número ${player.number}`;
}

function scoreMarker(game) {
  return `${game.teamA} ${game.scoreA} - ${game.teamB} ${game.scoreB}`;
}

function playerDisplayName(player) {
  if (!player) return "";
  return `${player.name || "Jugador"}${player.number ? ` #${player.number}` : ""}`;
}

function toggleTimer() {
  const game = appState.game;
  game.running = !game.running;
  if (game.running) {
    appState.timerId = window.setInterval(tickClock, 1000);
  } else {
    stopTimer();
  }
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
  const stream = canvas.captureStream(30);
  const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type)) || "";

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
  appState.recordedVideoBlob = blob;
  appState.recordedVideoFile = new File([blob], `go-basket-studio-${game.id}.webm`, { type: blob.type || game.recordingMimeType || "video/webm" });
  appState.recordedVideoUrl = URL.createObjectURL(blob);
  game.recordingUrl = appState.recordedVideoUrl;
  game.recordingSize = blob.size;
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
  appState.recordingStartedAt = null;
  appState.recordedVideoBlob = null;
  appState.recordedVideoFile = null;
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

  context.fillStyle = "rgba(255, 122, 24, 0.95)";
  context.beginPath();
  context.arc(width - 84, height - 84, 16, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = "900 24px system-ui, sans-serif";
  context.fillText("REC", width - 60, height - 76);

  appState.recordingAnimationId = requestAnimationFrame(drawRecordingFrame);
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

function ensureAudioContext() {
  if (!appState.audioContext) appState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
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

  const notes = {
    basket: [660, 880],
    triple: [660, 990, 1320],
    foul: [1400, 900],
    final: [220, 165, 110],
    alert: [880, 880],
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
  source.start();
  appState.crowdNode = source;
}

function stopCrowd() {
  if (appState.crowdNode) appState.crowdNode.stop();
  appState.crowdNode = null;
  if (appState.game) appState.game.crowdEnabled = false;
}

function announce(text) {
  const game = appState.game;
  if (!game?.narratorEnabled || game.humanNarratorEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-MX";
  utterance.rate = 0.94;
  utterance.pitch = 1.06;
  const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
  const preferred = voices.find((voice) => /es[-_](MX|US|ES|419)/i.test(voice.lang) && /google|microsoft|paulina|sabina|monica|premium|natural/i.test(voice.name))
    || voices.find((voice) => /^es/i.test(voice.lang));
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

function finishGame() {
  const game = appState.game;
  if (!game || game.finishedAt) return;
  stopTimer();
  stopCrowd();
  game.finishedAt = new Date().toISOString();
  game.recordingMode = false;
  game.fullscreenMode = false;
  const finalText = `¡JUEGO FINALIZADO! Resultado final: ${scoreMarker(game)}.`;
  recordPlay({ type: "final", text: finalText, prompt: `JUEGO FINALIZADO · RESULTADO FINAL: ${scoreMarker(game)}` });
  playSound("final");
  announce(finalText);
  if (game.internalRecording) stopInternalRecording();
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
        .reverse()
        .map((play) => `${formatClock(play.remainingSeconds ?? 0)} · ${play.text}`);
      const text = `${label} (${teamName}) terminó con ${player.points} puntos, ${player.fouls} faltas y ${plays.length} jugadas registradas. Resumen beta: momentos registrados del jugador. El recorte automático de video requiere almacenamiento/procesamiento avanzado en una versión futura.`;
      return { label, teamName, plays, text };
    });
}

function renderReport(game) {
  const winner = game.scoreA === game.scoreB ? "Empate" : game.scoreA > game.scoreB ? game.teamA : game.teamB;
  const summary = buildSummary(game);
  const players = [...game.players.A, ...game.players.B].filter((player) => player.name || player.number);
  const betaSummaries = buildPlayerBetaSummaries(game);
  const canShareVideo = Boolean(appState.recordedVideoFile && navigator.canShare?.({ files: [appState.recordedVideoFile] }));
  const videoBlock = game.recordingUrl
    ? `<div class="video-report"><b>Video completo del partido</b><video controls src="${game.recordingUrl}"></video><div class="video-actions"><button id="openVideoBtn" type="button">Ver video</button><button id="downloadVideoBtn" type="button">Descargar video</button><button id="shareVideoReportBtn" type="button">Compartir video</button></div><a class="download-video" id="downloadVideoLink" href="${game.recordingUrl}" download="go-basket-studio-${game.id}.webm">Enlace alternativo de descarga</a><small>${game.recordingSize ? `${(game.recordingSize / 1024 / 1024).toFixed(1)} MB · ` : ""}${escapeHtml(game.recordingMimeType || "video/webm")} · ${canShareVideo ? "Tu navegador permite compartir archivo." : "Si WhatsApp no acepta el archivo directo, descárgalo y compártelo desde Archivos/Galería."}</small></div>`
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
    </div>
    ${videoBlock}
    <div class="history-box"><b>Resumen por jugador</b>${betaSummaries.length ? `<div class="player-beta-list">${betaSummaries.map((item) => `<article><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.text)}</span>${item.plays.length ? `<ol>${item.plays.map((play) => `<li>${escapeHtml(play)}</li>`).join("")}</ol>` : ""}</article>`).join("")}</div>` : "<p>Sin jugadores registrados para resumen beta.</p>"}</div>
    <div class="history-box"><b>Historial de jugadas</b><ol>${game.history.map((play) => `<li>${escapeHtml(formatClock(play.remainingSeconds ?? 0))} · ${escapeHtml(play.text)}</li>`).join("")}</ol></div>
    <div class="report-actions">
      <button id="copySummaryBtn" type="button">Copiar resumen</button>
      <button id="whatsBtn" type="button">Compartir por WhatsApp</button>
      <button id="saveMatchBtn" type="button">Guardar partido</button>
      <button data-open="home" type="button">Nuevo partido</button>
    </div>
  `;
  $("#copySummaryBtn").addEventListener("click", () => navigator.clipboard.writeText(summary));
  $("#whatsBtn").addEventListener("click", () => window.open(`https://wa.me/?text=${encodeURIComponent(summary)}`, "_blank", "noopener"));
  $("#openVideoBtn")?.addEventListener("click", () => game.recordingUrl && window.open(game.recordingUrl, "_blank", "noopener"));
  $("#downloadVideoBtn")?.addEventListener("click", () => downloadRecordedVideo(game));
  $("#shareVideoReportBtn")?.addEventListener("click", () => shareRecordedVideo(game, summary));
  $("#saveMatchBtn").addEventListener("click", () => saveCurrentMatch(game));
  $('[data-open="home"]', elements.reportView).addEventListener("click", () => showScreen("home"));
}

function downloadRecordedVideo(game) {
  if (!game.recordingUrl) {
    alert("No hay video generado todavía.");
    return;
  }
  const link = document.createElement("a");
  link.href = game.recordingUrl;
  link.download = `go-basket-studio-${game.id}.webm`;
  document.body.append(link);
  link.click();
  link.remove();
  alert("Video generado. Si el navegador no lo guardó automáticamente, mantén presionado el video y elige descargar o guardar.");
}

async function shareRecordedVideo(game, summary) {
  const file = appState.recordedVideoFile;
  if (file && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Go Basket Studio", text: summary });
      return;
    } catch (error) {
      console.warn("No se pudo compartir video", error);
    }
  }
  alert("Este navegador no permite compartir el archivo directamente. Descarga el video y compártelo desde tu galería o archivos.");
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

function bindEvents() {
  document.addEventListener("click", (event) => {
    const openTarget = event.target.closest("[data-open]");
    if (openTarget) showScreen(openTarget.dataset.open);

    const scoreButton = event.target.closest("[data-score]");
    if (scoreButton) addScore(scoreButton.dataset.score, Number(scoreButton.dataset.points));

    const foulButton = event.target.closest("[data-foul]");
    if (foulButton) addFoul(foulButton.dataset.foul);

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
  $("#humanNarratorBtn")?.addEventListener("click", () => { appState.game.humanNarratorEnabled = !appState.game.humanNarratorEnabled; renderGame(); });
  $("#tvBoardBtn")?.addEventListener("click", openTvBoard);
  $("#shareVideoBtn")?.addEventListener("click", () => shareRecordedVideo(appState.game, buildSummary(appState.game)));
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
ensureDynamicUi();
renderRules();
bindEvents();
registerServiceWorker();
