const STORAGE_KEY = 'sdp_broadcast_studio_state_v1';
const HISTORY_KEY = 'sdp_broadcast_studio_history_v1';

const defaultState = () => ({
  teams: {
    A: { name: 'Equipo Azul', score: 0, fouls: 0 },
    B: { name: 'Equipo Blanco', score: 0, fouls: 0 }
  },
  selectedTeam: 'A',
  period: 1,
  periodLength: 10 * 60,
  clock: 10 * 60,
  running: false,
  lastPlay: 'Listo para iniciar transmisión deportiva.',
  events: [],
  soundEnabled: true,
  narratorEnabled: true,
  crowdEnabled: false,
  musicEnabled: false,
  cleanMode: false,
  startedAt: Date.now(),
  updatedAt: Date.now()
});

let state = loadState();
let cameraStream = null;
let clockTimer = null;
let audioCtx = null;
let crowdNode = null;
let musicNode = null;
let mediaRecorder = null;

const $ = (id) => document.getElementById(id);

const phrases = {
  two: ['Canasta de {team}, dos puntos.', 'Dos puntos para {team}.', '{team} suma con canasta de media distancia.'],
  female: ['Canasta de {team}, regla especial: tres puntos.', '{team} suma tres por canasta femenil.', 'Tres puntos para {team} con la regla de mujer.'],
  three: ['Triple para {team}.', 'Tres puntos de {team}.', 'Bombazo de larga distancia para {team}.'],
  freeThrow: ['Tiro libre anotado por {team}.', '{team} suma uno desde la línea.', 'Un punto más para {team}.'],
  foul: ['Falta marcada a {team}.', 'Silbatazo: falta de {team}.', 'Se registra falta para {team}.'],
  period: ['Final del cuarto, vamos al siguiente periodo.', 'Cambio de periodo en la transmisión.', 'Nuevo cuarto listo para comenzar.'],
  finish: ['Partido finalizado.', 'Final del encuentro.', 'Se termina el partido con marcador final.']
};

function loadState() {
  try { return { ...defaultState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return defaultState(); }
}

function saveState() {
  state.updatedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveToHistory() {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  history.unshift({ ...state, finishedAt: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
}

function formatClock(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function selectedTeam() { return state.teams[state.selectedTeam]; }
function teamLabel(teamKey = state.selectedTeam) { return state.teams[teamKey].name || `Equipo ${teamKey}`; }

function render() {
  $('teamAName').value = state.teams.A.name;
  $('teamBName').value = state.teams.B.name;
  $('teamAScore').textContent = state.teams.A.score;
  $('teamBScore').textContent = state.teams.B.score;
  $('teamAFouls').textContent = state.teams.A.fouls;
  $('teamBFouls').textContent = state.teams.B.fouls;
  $('gameClock').textContent = formatClock(state.clock);
  $('periodLabel').textContent = state.period;
  $('lastPlay').textContent = state.lastPlay;
  $('selectA').classList.toggle('active', state.selectedTeam === 'A');
  $('selectB').classList.toggle('active', state.selectedTeam === 'B');
  $('clockIcon').textContent = state.running ? '⏸' : '▶';
  $('clockText').textContent = state.running ? 'Pausar' : 'Reloj';
  $('soundToggle').checked = state.soundEnabled;
  $('narratorToggle').checked = state.narratorEnabled;
  $('crowdToggle').checked = state.crowdEnabled;
  $('musicToggle').checked = state.musicEnabled;
  document.body.classList.toggle('clean-mode', state.cleanMode);
  $('controlsPanel').classList.toggle('clean', state.cleanMode);
  $('recordingBadge').classList.toggle('hidden', !state.cleanMode);
  $('toggleControlsBtn').textContent = state.cleanMode || $('controlsPanel').classList.contains('collapsed') ? 'Mostrar controles' : 'Ocultar controles';
  renderEvents();
}

function renderEvents() {
  const list = $('eventList');
  list.innerHTML = '';
  state.events.slice(-12).reverse().forEach((event) => {
    const li = document.createElement('li');
    li.textContent = `${formatClock(event.clock)} · Q${event.period} · ${event.label} · ${event.scoreA}-${event.scoreB}`;
    list.appendChild(li);
  });
}

function addEvent(type, label, points = 0, team = state.selectedTeam, extra = {}) {
  const event = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
    clock: state.clock,
    period: state.period,
    type,
    team,
    player: $('playerName').value.trim(),
    number: $('playerNumber').value.trim(),
    female: $('femaleSwitch').checked,
    points,
    scoreA: state.teams.A.score,
    scoreB: state.teams.B.score,
    foulsA: state.teams.A.fouls,
    foulsB: state.teams.B.fouls,
    label,
    ...extra
  };
  state.events.push(event);
  state.lastPlay = label;
  saveState();
  render();
}

function score(action) {
  const team = selectedTeam();
  const isFemale = $('femaleSwitch').checked;
  let points = 2;
  let kind = 'two';
  if (action === 'freeThrow') { points = 1; kind = 'freeThrow'; }
  if (action === 'three') { points = 3; kind = 'three'; }
  if (action === 'two' && isFemale) { points = 3; kind = 'female'; }
  team.score += points;
  const player = playerText();
  const label = `+${points} ${team.name}${player} · ${kindLabel(kind)}`;
  addEvent(action === 'freeThrow' ? 'free_throw' : 'score', label, points, state.selectedTeam, { kind });
  playCue(kind);
  narrate(pick(phrases[kind]).replace('{team}', team.name));
}

function foul() {
  const team = selectedTeam();
  team.fouls += 1;
  const label = `Falta de ${team.name}${playerText()}`;
  addEvent('foul', label, 0, state.selectedTeam);
  playCue('foul');
  narrate(pick(phrases.foul).replace('{team}', team.name));
}

function undo() {
  const idx = [...state.events].reverse().findIndex((event) => ['score', 'free_throw', 'foul'].includes(event.type));
  if (idx === -1) { state.lastPlay = 'No hay jugada para deshacer.'; saveState(); render(); return; }
  const realIndex = state.events.length - 1 - idx;
  const event = state.events[realIndex];
  const team = state.teams[event.team];
  if (event.type === 'score' || event.type === 'free_throw') team.score = Math.max(0, team.score - event.points);
  if (event.type === 'foul') team.fouls = Math.max(0, team.fouls - 1);
  const label = `Deshecho: ${event.label}`;
  state.events.push({ ...event, id: `${Date.now()}-undo`, timestamp: Date.now(), type: 'undo', label, scoreA: state.teams.A.score, scoreB: state.teams.B.score, points: -event.points });
  state.lastPlay = label;
  saveState();
  render();
}

function toggleClock() {
  state.running = !state.running;
  state.lastPlay = state.running ? 'Reloj iniciado.' : 'Reloj pausado.';
  if (state.running) startTicker(); else stopTicker();
  addEvent('clock', state.lastPlay, 0, null);
}

function startTicker() {
  stopTicker();
  clockTimer = setInterval(() => {
    if (!state.running) return;
    state.clock = Math.max(0, state.clock - 1);
    if (state.clock === 0) {
      state.running = false;
      addEvent('period_end', `Final del periodo ${state.period}.`, 0, null);
      playCue('period');
      narrate(pick(phrases.period));
      stopTicker();
    }
    saveState();
    render();
  }, 1000);
}

function stopTicker() { if (clockTimer) clearInterval(clockTimer); clockTimer = null; }

function nextPeriod() {
  state.period += 1;
  state.clock = state.periodLength;
  state.running = false;
  state.teams.A.fouls = 0;
  state.teams.B.fouls = 0;
  addEvent('period_change', `Cambio a cuarto ${state.period}.`, 0, null);
  playCue('period');
  narrate(pick(phrases.period));
}

function newGame() {
  if (!confirm('¿Crear partido nuevo? El partido actual quedará guardado en historial local.')) return;
  saveToHistory();
  state = defaultState();
  stopTicker();
  saveState();
  render();
}

function finishGame() {
  state.running = false;
  const label = `Partido finalizado · ${state.teams.A.name} ${state.teams.A.score} - ${state.teams.B.score} ${state.teams.B.name}`;
  addEvent('game_end', label, 0, null);
  saveToHistory();
  playCue('finish');
  narrate(pick(phrases.finish));
}

function kindLabel(kind) {
  return { freeThrow: 'tiro libre', three: 'triple', female: 'canasta mujer = 3', two: 'canasta' }[kind] || 'canasta';
}

function playerText() {
  const name = $('playerName').value.trim();
  const number = $('playerNumber').value.trim();
  return `${name ? ` · ${name}` : ''}${number ? ` #${number}` : ''}`;
}

function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    $('cameraVideo').srcObject = cameraStream;
    $('cameraPlaceholder').classList.add('hidden');
  } catch (error) {
    $('cameraPlaceholder').classList.remove('hidden');
    $('lastPlay').textContent = 'Cámara no disponible. Usa el placeholder para probar marcador y controles.';
  }
}

function ensureAudio() {
  audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playCue(kind) {
  if (!state.soundEnabled) return;
  const files = { freeThrow: 'sounds/basket.mp3', two: 'sounds/basket.mp3', female: 'sounds/basket.mp3', three: 'sounds/triple.mp3', foul: 'sounds/whistle.mp3', period: 'sounds/period.mp3', finish: 'sounds/victory.mp3' };
  const audio = new Audio(files[kind] || files.two);
  audio.volume = .8;
  audio.play().catch(() => synthCue(kind));
}

function synthCue(kind) {
  const ctx = ensureAudio();
  const now = ctx.currentTime;
  const sequence = {
    three: [660, 880, 1180],
    foul: [1200, 900],
    period: [420, 520, 620],
    finish: [523, 659, 784, 1046],
    freeThrow: [440, 660],
    female: [520, 760, 960],
    two: [420, 620]
  }[kind] || [440, 660];
  sequence.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = kind === 'foul' ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(freq, now + index * .12);
    gain.gain.setValueAtTime(.0001, now + index * .12);
    gain.gain.exponentialRampToValueAtTime(.18, now + index * .12 + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, now + index * .12 + .18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + index * .12);
    osc.stop(now + index * .12 + .2);
  });
}

function narrate(text) {
  if (!state.narratorEnabled || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-MX';
  utterance.rate = .98;
  utterance.pitch = 1.02;
  const voices = speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => voice.lang.toLowerCase().startsWith('es')) || null;
  speechSynthesis.speak(utterance);
}

function toggleCrowd(enabled) {
  state.crowdEnabled = enabled;
  if (!enabled && crowdNode) { crowdNode.stop(); crowdNode = null; return; }
  if (!enabled) return;
  const ctx = ensureAudio();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * .18;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  source.loop = true;
  filter.type = 'bandpass';
  filter.frequency.value = 900;
  gain.gain.value = .08;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
  crowdNode = source;
}

function toggleMusic(enabled) {
  state.musicEnabled = enabled;
  if (!enabled && musicNode) { musicNode.stop(); musicNode = null; return; }
  if (!enabled) return;
  const ctx = ensureAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 96;
  gain.gain.value = .035;
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  musicNode = osc;
}

function enterCleanMode() {
  state.cleanMode = true;
  $('controlsPanel').classList.remove('collapsed');
  saveState();
  render();
}

function exitCleanMode() {
  state.cleanMode = false;
  $('controlsPanel').classList.remove('collapsed');
  saveState();
  render();
}

function toggleCleanMode() {
  if (state.cleanMode) exitCleanMode(); else enterCleanMode();
}

function prepareRecorder() {
  if (!cameraStream || !window.MediaRecorder) {
    $('recorderStatus').textContent = 'MediaRecorder no disponible todavía. Usa grabación de pantalla del celular.';
    return;
  }
  mediaRecorder = new MediaRecorder(cameraStream);
  $('recorderStatus').textContent = 'MediaRecorder preparado para V2.1; esta demo prioriza grabación de pantalla con overlay visible.';
}

function bind() {
  $('startCameraBtn').addEventListener('click', startCamera);
  $('toggleControlsBtn').addEventListener('click', () => {
    if (state.cleanMode) {
      exitCleanMode();
      return;
    }
    $('controlsPanel').classList.toggle('collapsed');
    render();
  });
  $('cleanModeBtn').addEventListener('click', toggleCleanMode);
  $('cameraVideo').addEventListener('dblclick', exitCleanMode);
  $('cameraPlaceholder').addEventListener('dblclick', exitCleanMode);
  $('prepareRecorderBtn').addEventListener('click', prepareRecorder);
  $('selectA').addEventListener('click', () => { state.selectedTeam = 'A'; saveState(); render(); });
  $('selectB').addEventListener('click', () => { state.selectedTeam = 'B'; saveState(); render(); });
  $('teamAName').addEventListener('input', (event) => { state.teams.A.name = event.target.value || 'Equipo A'; saveState(); render(); });
  $('teamBName').addEventListener('input', (event) => { state.teams.B.name = event.target.value || 'Equipo B'; saveState(); render(); });
  $('soundToggle').addEventListener('change', (event) => { state.soundEnabled = event.target.checked; saveState(); });
  $('narratorToggle').addEventListener('change', (event) => { state.narratorEnabled = event.target.checked; saveState(); });
  $('crowdToggle').addEventListener('change', (event) => { toggleCrowd(event.target.checked); saveState(); });
  $('musicToggle').addEventListener('change', (event) => { toggleMusic(event.target.checked); saveState(); });
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'freeThrow' || action === 'two' || action === 'three') score(action);
    if (action === 'foul') foul();
    if (action === 'undo') undo();
    if (action === 'clock') toggleClock();
    if (action === 'period') nextPeriod();
    if (action === 'newGame') newGame();
    if (action === 'finish') finishGame();
  }));
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

bind();
render();
startCamera();
if (state.running) startTicker();
