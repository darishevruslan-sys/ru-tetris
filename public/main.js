(() => {

window.__appInstance = window.__appInstance || {};
if (typeof window.__appInstance.gameMode !== 'string') {
  window.__appInstance.gameMode = 'sprint';
}

window.__gameInstance = window.__gameInstance || {};
const globalGameState = window.__gameInstance;
if (!Array.isArray(globalGameState.sharedBag)) {
  globalGameState.sharedBag = [];
}
if (!Number.isFinite(globalGameState.bagIndex)) {
  globalGameState.bagIndex = 0;
}
if (typeof globalGameState.bagVersion !== 'number') {
  globalGameState.bagVersion = null;
}
if (!Number.isFinite(globalGameState.pendingAttackToSend)) {
  globalGameState.pendingAttackToSend = 0;
}
if (!Number.isFinite(globalGameState.garbageQueue)) {
  globalGameState.garbageQueue = 0;
}
if (typeof globalGameState.isRunning !== 'boolean') {
  globalGameState.isRunning = false;
}
if (typeof globalGameState.isDead !== 'boolean') {
  globalGameState.isDead = false;
}
if (!Number.isFinite(globalGameState.linesCleared)) {
  globalGameState.linesCleared = 0;
}
if (typeof globalGameState.matchFinished !== 'boolean') {
  globalGameState.matchFinished = false;
}
if (!Number.isFinite(globalGameState.totalPiecesPlaced)) {
  globalGameState.totalPiecesPlaced = 0;
}
if (!Number.isFinite(globalGameState.startTimestampMs)) {
  globalGameState.startTimestampMs = 0;
}
if (!Number.isFinite(globalGameState.inputsCount)) {
  globalGameState.inputsCount = 0;
}
if (!Number.isFinite(globalGameState.oppPps)) {
  globalGameState.oppPps = 0;
}
if (!Number.isFinite(globalGameState.oppApm)) {
  globalGameState.oppApm = 0;
}
if (typeof globalGameState.startNewRound !== 'function') {
  globalGameState.startNewRound = () => {};
}
if (typeof globalGameState.stopGameLoop !== 'function') {
  globalGameState.stopGameLoop = () => {};
}
if (typeof globalGameState.applyIncomingGarbage !== 'function') {
  globalGameState.applyIncomingGarbage = () => {};
}
if (typeof globalGameState.renderOpponent !== 'function') {
  globalGameState.renderOpponent = () => {};
}
if (typeof globalGameState.startSprintRun !== 'function') {
  globalGameState.startSprintRun = () => {};
}
if (typeof globalGameState.startMultiplayerRoundFromServer !== 'function') {
  globalGameState.startMultiplayerRoundFromServer = () => {};
}

function getNextSharedPiece() {
  const g = window.__gameInstance;
  if (!g || !Array.isArray(g.sharedBag) || g.sharedBag.length === 0) {
    return 'I';
  }
  const currentIndex = Number.isFinite(g.bagIndex) ? g.bagIndex : 0;
  const piece = g.sharedBag[currentIndex % g.sharedBag.length];
  g.bagIndex = currentIndex + 1;
  return piece;
}

function getSharedPreview(count) {
  const g = window.__gameInstance;
  if (!g || !Array.isArray(g.sharedBag) || g.sharedBag.length === 0) {
    return Array(Math.max(0, count)).fill('I');
  }
  const startIndex = Number.isFinite(g.bagIndex) ? g.bagIndex : 0;
  const preview = [];
  for (let i = 0; i < count; i++) {
    const idx = (startIndex + i) % g.sharedBag.length;
    preview.push(g.sharedBag[idx]);
  }
  return preview;
}

function flushGarbageQueueIntoField() {
  const g = window.__gameInstance;
  if (!g || !Number.isFinite(g.garbageQueue) || g.garbageQueue <= 0) {
    return;
  }
  const linesToAdd = g.garbageQueue;
  g.garbageQueue = 0;
  if (typeof g.applyIncomingGarbage === 'function') {
    g.applyIncomingGarbage(linesToAdd);
  }
}

function getCurrentGameMode() {
  const app = window.__appInstance;
  return app && typeof app.gameMode === 'string' ? app.gameMode : 'sprint';
}

function applyUIMode() {
  const mode = getCurrentGameMode();
  const oppPanel = document.getElementById('opponentPanel');
  const apmLabel = document.getElementById('apmLabel');
  const apmValue = document.getElementById('apmVal');
  const ppsLabel = document.getElementById('ppsLabel');
  const ppsValue = document.getElementById('ppsVal');
  const elements = [oppPanel, apmLabel, apmValue, ppsLabel, ppsValue];
  for (const el of elements) {
    if (!el) continue;
    if (mode === 'sprint') {
      el.classList.add('hidden');
    } else {
      el.classList.remove('hidden');
    }
  }
}

function incrementInputCount() {
  const g = window.__gameInstance;
  if (!g) return;
  const current = Number.isFinite(g.inputsCount) ? g.inputsCount : 0;
  g.inputsCount = current + 1;
}

function getOpponentStatsFromPayload(payload) {
  if (!payload || !payload.opponents) return null;
  const entries = Object.values(payload.opponents);
  for (const entry of entries) {
    if (!entry) continue;
    if (entry.state && entry.state.stats) {
      return entry.state.stats;
    }
    if (entry.stats) {
      return entry.stats;
    }
  }
  return null;
}

function endOfMatchShowOverlay(data) {
  const g = window.__gameInstance;
  if (!g) return;

  const now = Date.now();
  const startTs = Number.isFinite(g.startTimestampMs) && g.startTimestampMs > 0 ? g.startTimestampMs : now;
  const durationSec = Math.max(0, (now - startTs) / 1000);
  const piecesPlaced = Number.isFinite(g.totalPiecesPlaced) ? g.totalPiecesPlaced : 0;
  const inputs = Number.isFinite(g.inputsCount) ? g.inputsCount : 0;
  const yourPps = durationSec > 0 ? piecesPlaced / durationSec : 0;
  const yourApm = durationSec > 0 ? (inputs / durationSec) * 60 : 0;
  const iWon = !g.isDead;
  const winnerText = iWon ? 'YOU' : 'OPPONENT';

  const oppStats = getOpponentStatsFromPayload(data);
  const oppPpsValue = oppStats && Number.isFinite(oppStats.pps) ? oppStats.pps : (Number.isFinite(g.oppPps) ? g.oppPps : 0);
  const oppApmValue = oppStats && Number.isFinite(oppStats.apm) ? oppStats.apm : (Number.isFinite(g.oppApm) ? g.oppApm : 0);

  const overlay = document.getElementById('postMatchOverlay');
  if (!overlay) return;

  const titleEl = document.getElementById('matchResultTitle');
  const winnerEl = document.getElementById('matchWinnerName');
  const yourPpsEl = document.getElementById('matchYourPps');
  const yourApmEl = document.getElementById('matchYourApm');
  const oppPpsEl = document.getElementById('matchOppPps');
  const oppApmEl = document.getElementById('matchOppApm');

  if (titleEl) titleEl.textContent = 'MATCH OVER';
  if (winnerEl) winnerEl.textContent = winnerText;
  if (yourPpsEl) yourPpsEl.textContent = yourPps.toFixed(2);
  if (yourApmEl) yourApmEl.textContent = yourApm.toFixed(2);
  if (oppPpsEl) oppPpsEl.textContent = Number.isFinite(oppPpsValue) ? oppPpsValue.toFixed(2) : '0.00';
  if (oppApmEl) oppApmEl.textContent = Number.isFinite(oppApmValue) ? oppApmValue.toFixed(2) : '0.00';

  overlay.classList.remove('hidden');
}

function setupPostMatchButtons() {
  const overlay = document.getElementById('postMatchOverlay');
  const btnRematch = document.getElementById('btnRematch');
  const btnExit = document.getElementById('btnExitToMenu');
  if (!overlay || !btnRematch || !btnExit) return;

  btnRematch.addEventListener('click', () => {
    overlay.classList.add('hidden');
    const g = window.__gameInstance;
    if (g) {
      g.matchFinished = false;
      g.isDead = false;
      g.startTimestampMs = 0;
      g.totalPiecesPlaced = 0;
      g.inputsCount = 0;
    }
    if (g && typeof g.sendReadyToServer === 'function') {
      g.sendReadyToServer(true);
    }
  });

  btnExit.addEventListener('click', () => {
    overlay.classList.add('hidden');
    const g = window.__gameInstance;
    if (g) {
      g.matchFinished = false;
      g.isRunning = false;
      g.isDead = false;
      g.startTimestampMs = 0;
      g.totalPiecesPlaced = 0;
      g.inputsCount = 0;
      g.oppPps = 0;
      g.oppApm = 0;
    }
    if (g && typeof g.stopGameLoop === 'function') {
      g.stopGameLoop();
    }
    if (window.__appInstance && typeof window.__appInstance.openScreen === 'function') {
      window.__appInstance.openScreen('mainMenu');
    } else {
      window.location.reload();
    }
  });
}

setupPostMatchButtons();

const LOCAL_PIECES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

const i18n = {
  ru: {
    menu: {
      play40: 'Играть (40 линий)',
      matchmaking: 'Онлайн матчмейкинг',
      settings: 'Настройки управления',
      login: 'Войти',
      hint: 'Соревнуйтесь с собой и улучшайте время прохождения спринта на 40 линий.'
    },
    game: {
      back: 'В меню'
    },
    settings: {
      title: 'Настройки управления',
      hint: 'Нажмите на действие и затем нажмите желаемую клавишу. Настройки сохраняются автоматически.',
      waiting: 'Ожидание ввода...'
    },
    match: {
      title: 'Онлайн матчмейкинг',
      description: 'Введите код комнаты или создайте новую, чтобы начать матч.',
      back: 'Назад',
      join: 'Войти',
      create: 'Создать комнату',
      placeholder: 'Например, ABC123',
      statusIdle: 'Введите код комнаты или создайте новую.',
      statusNeedCode: 'Введите код комнаты, чтобы подключиться.',
      statusConnecting: 'Подключение...',
      statusError: 'Не удалось подключиться. Попробуйте ещё раз.',
      createSuccess: 'Комната {{code}} создана. Поделитесь кодом с другом.',
      joinSuccess: 'Вы присоединились к комнате {{code}}.',
      localPlayer: 'Вы',
      remotePlayer: 'Оппонент',
      waitingOpponent: 'Ожидание данных от оппонента...',
      ready: 'Готов',
      notReady: 'Отменить готовность',
      statusPromptReady: 'Нажмите «Готов», когда будете готовы к старту.',
      statusWaitingOpponentReady: 'Ожидание готовности второго игрока...',
      statusCountdown: 'Старт через 1.5 секунды...',
      statusInGame: 'Матч идёт!'
    },
    login: {
      title: 'Войти',
      description: 'Авторизация появится позже. Следите за обновлениями!',
      back: 'Назад'
    },
    result: {
      title: '40 линий завершены!',
      toMenu: 'В меню'
    },
    actions: {
      moveLeft: 'Влево',
      moveRight: 'Вправо',
      softDrop: 'Soft drop',
      hardDrop: 'Hard drop',
      rotateCW: 'Поворот CW',
      rotateCCW: 'Поворот CCW',
      rotate180: 'Поворот 180°',
      hold: 'Холд'
    }
  },
  en: {
    menu: {
      play40: 'Play (40 Lines)',
      matchmaking: 'Online Matchmaking',
      settings: 'Controls',
      login: 'Sign In',
      hint: 'Race against yourself and improve your 40L sprint time.'
    },
    game: {
      back: 'Main Menu'
    },
    settings: {
      title: 'Controls',
      hint: 'Click an action and press a key. The settings are saved automatically.',
      waiting: 'Listening...'
    },
    match: {
      title: 'Online Matchmaking',
      description: 'Enter a room code or create a new one to start a match.',
      back: 'Back',
      join: 'Join',
      create: 'Create Room',
      placeholder: 'e.g. ABC123',
      statusIdle: 'Enter a room code or create a new one.',
      statusNeedCode: 'Type a room code to connect.',
      statusConnecting: 'Connecting...',
      statusError: 'Connection failed. Please try again.',
      createSuccess: 'Room {{code}} created. Share the code with a friend.',
      joinSuccess: 'Joined room {{code}}.',
      localPlayer: 'You',
      remotePlayer: 'Opponent',
      waitingOpponent: 'Waiting for opponent data...',
      ready: 'Ready',
      notReady: 'Not Ready',
      statusPromptReady: 'Press Ready when you are set to begin.',
      statusWaitingOpponentReady: 'Waiting for the other player...',
      statusCountdown: 'Starting in 1.5 seconds...',
      statusInGame: 'Match in progress!'
    },
    login: {
      title: 'Sign In',
      description: 'Authentication will arrive in a future update. Stay tuned!',
      back: 'Back'
    },
    result: {
      title: '40 Lines Complete!',
      toMenu: 'Main Menu'
    },
    actions: {
      moveLeft: 'Move left',
      moveRight: 'Move right',
      softDrop: 'Soft drop',
      hardDrop: 'Hard drop',
      rotateCW: 'Rotate CW',
      rotateCCW: 'Rotate CCW',
      rotate180: 'Rotate 180°',
      hold: 'Hold'
    }
  }
};

class Localization {
  constructor(dictionary, lang = 'ru') {
    this.dictionary = dictionary;
    this.lang = lang;
  }
  t(path, values = {}) {
    const segments = path.split('.');
    let node = this.dictionary[this.lang];
    for (const segment of segments) {
      if (!node) break;
      node = node[segment];
    }
    if (typeof node === 'string') {
      return node.replace(/\{\{(\w+)\}\}/g, (match, key) => (key in values ? values[key] : match));
    }
    return node ?? path;
  }
}

class SettingsStore {
  constructor(storageKey, defaults) {
    this.storageKey = storageKey;
    this.defaults = defaults;
    this.data = this.load();
  }
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return { ...this.defaults };
      const parsed = JSON.parse(raw);
      return { ...this.defaults, ...parsed };
    } catch (err) {
      return { ...this.defaults };
    }
  }
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (err) {
      /* ignore */
    }
  }
  getBindings() {
    return { ...this.data };
  }
  setBinding(action, keyCode) {
    this.data[action] = keyCode;
    this.save();
  }
  getKeyForAction(action) {
    return this.data[action] ?? null;
  }
}

class ScreenManager {
  constructor() {
    this.current = null;
  }
  show(element) {
    if (this.current === element) return;
    if (this.current) this.current.classList.remove('active');
    this.current = element;
    if (this.current) this.current.classList.add('active');
  }
}

const DEFAULT_BINDINGS = {
  moveLeft: 'ArrowLeft',
  moveRight: 'ArrowRight',
  softDrop: 'ArrowDown',
  hardDrop: 'Space',
  rotateCW: 'KeyX',
  rotateCCW: 'KeyZ',
  rotate180: 'KeyA',
  hold: 'ShiftLeft'
};

const ACTIONS = [
  { id: 'moveLeft', icon: '←' },
  { id: 'moveRight', icon: '→' },
  { id: 'rotateCW', icon: '↻' },
  { id: 'rotateCCW', icon: '↺' },
  { id: 'rotate180', icon: '⟳' },
  { id: 'hardDrop', icon: '⭳' },
  { id: 'softDrop', icon: '⭱' },
  { id: 'hold', icon: '⧖' }
];

class SettingsUI {
  constructor(root, store, locale, onChange) {
    this.root = root;
    this.store = store;
    this.locale = locale;
    this.onChange = onChange;
    this.waitingAction = null;
    this.rows = new Map();
    this.build();
    document.addEventListener('keydown', (event) => this.handleKeydown(event));
  }
  build() {
    this.root.innerHTML = '';
    const bindings = this.store.getBindings();
    ACTIONS.forEach(action => {
      const row = document.createElement('div');
      row.className = 'settings-row';
      row.dataset.action = action.id;

      const label = document.createElement('div');
      label.className = 'action-label';
      label.textContent = `${action.icon} ${this.locale.t(`actions.${action.id}`)}`;

      const btn = document.createElement('button');
      btn.textContent = this.formatKey(bindings[action.id]);
      btn.addEventListener('click', () => this.beginListening(action.id));

      row.appendChild(label);
      row.appendChild(btn);
      this.root.appendChild(row);
      this.rows.set(action.id, { row, btn });
    });
  }
  formatKey(code) {
    if (!code) return '—';
    if (code.startsWith('Key')) return code.replace('Key', '');
    if (code.startsWith('Digit')) return code.replace('Digit', '');
    switch (code) {
      case 'Space': return 'Space';
      case 'ShiftLeft':
      case 'ShiftRight':
        return 'Shift';
      case 'ControlLeft':
      case 'ControlRight':
        return 'Ctrl';
      case 'AltLeft':
      case 'AltRight':
        return 'Alt';
      case 'ArrowLeft': return '←';
      case 'ArrowRight': return '→';
      case 'ArrowUp': return '↑';
      case 'ArrowDown': return '↓';
      default: return code;
    }
  }
  beginListening(actionId) {
    if (this.waitingAction) {
      this.endListening();
    }
    this.waitingAction = actionId;
    const entry = this.rows.get(actionId);
    if (entry) {
      entry.row.classList.add('listening');
      entry.btn.textContent = this.locale.t('settings.waiting');
    }
  }
  endListening() {
    if (!this.waitingAction) return;
    const entry = this.rows.get(this.waitingAction);
    if (entry) {
      entry.row.classList.remove('listening');
      entry.btn.textContent = this.formatKey(this.store.getKeyForAction(this.waitingAction));
    }
    this.waitingAction = null;
  }
  handleKeydown(event) {
    if (!this.waitingAction) return;
    event.preventDefault();
    if (event.code === 'Escape') {
      this.endListening();
      return;
    }
    this.store.setBinding(this.waitingAction, event.code);
    const entry = this.rows.get(this.waitingAction);
    if (entry) {
      entry.btn.textContent = this.formatKey(event.code);
    }
    if (typeof this.onChange === 'function') {
      this.onChange();
    }
    this.endListening();
  }
  refresh() {
    const bindings = this.store.getBindings();
    for (const [action, entry] of this.rows.entries()) {
      entry.btn.textContent = this.formatKey(bindings[action]);
    }
  }
}

const CONFIG = {
  boardWidth: 10,
  boardHeight: 20,
  hiddenRows: 2,
  previewCount: 5,
  gravity: 1.2,
  softDropSpeed: 20,
  lockDelay: 0.5,
  are: 0.04,
  lineClearAre: 0.25,
  das: 0.13,
  arr: 0.03
};

const SPAWN_X_STD = 3;
const SPAWN_X_O = 4;
const SPAWN_Y_STD = -2;
const SPAWN_POS = {
  default: { x: SPAWN_X_STD, y: SPAWN_Y_STD },
  I: { x: SPAWN_X_STD, y: SPAWN_Y_STD - 1 },
  O: { x: SPAWN_X_O, y: SPAWN_Y_STD }
};
const COLORS = {
  I: '#5dd9ff',
  J: '#4f6bff',
  L: '#ff9458',
  O: '#ffd952',
  S: '#66ff99',
  T: '#c08cff',
  Z: '#ff5f7a',
  ghost: 'rgba(255,255,255,0.08)',
  garbage: '#555555'
};
const TETROMINO_SHAPES = {
  T: [
    [[0, 1], [1, 0], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 1]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 0], [1, 1], [1, 2]]
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]]
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]]
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]]
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]]
  ],
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]]
  ],
  O: [
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]]
  ]
};
// JLSTZ (includes T, J, L, S, Z). Y-DOWN => all Y already inverted.
const JLSTZ_KICKS = {
  '0>1': [[0,0], [-1,0], [-1,-1], [0, 2], [-1, 2]],
  '1>0': [[0,0], [ 1,0], [ 1, 1], [0,-2], [ 1,-2]],

  '1>2': [[0,0], [ 1,0], [ 1, 1], [0,-2], [ 1,-2]],
  '2>1': [[0,0], [-1,0], [-1,-1], [0, 2], [-1, 2]],

  '2>3': [[0,0], [ 1,0], [ 1,-1], [0, 2], [ 1, 2]],
  '3>2': [[0,0], [-1,0], [-1, 1], [0,-2], [-1,-2]],

  '3>0': [[0,0], [-1,0], [-1, 1], [0,-2], [-1,-2]],
  '0>3': [[0,0], [ 1,0], [ 1,-1], [0, 2], [ 1, 2]]
};

// I-piece SRS+ (tetr.io-style symmetric I kicks), Y-DOWN.
const I_KICKS = {
  '0>1': [[0,0], [-2,0], [ 1,0], [-2, 1], [ 1,-2]],
  '1>0': [[0,0], [ 2,0], [-1,0], [ 2,-1], [-1, 2]],

  '1>2': [[0,0], [-1,0], [ 2,0], [-1,-2], [ 2, 1]],
  '2>1': [[0,0], [ 1,0], [-2,0], [ 1, 2], [-2,-1]],

  '2>3': [[0,0], [ 2,0], [-1,0], [ 2,-1], [-1, 2]],
  '3>2': [[0,0], [-2,0], [ 1,0], [-2,-1], [ 1, 2]],

  '3>0': [[0,0], [-2,0], [ 1,0], [-2,-1], [ 1, 2]],
  '0>3': [[0,0], [ 2,0], [-1,0], [ 2, 1], [-1,-2]]
};

const O_KICKS = {
  '0>1': [[0, 0]],
  '1>2': [[0, 0]],
  '2>3': [[0, 0]],
  '3>0': [[0, 0]],
  '1>0': [[0, 0]],
  '2>1': [[0, 0]],
  '3>2': [[0, 0]],
  '0>3': [[0, 0]]
};

function getKickTable(pieceType, fromState, toState) {
  const key = `${fromState}>${toState}`;
  if (pieceType === 'I') {
    return I_KICKS[key] || [[0, 0]];
  }
  if (pieceType === 'O') {
    return O_KICKS[key] || [[0, 0]];
  }
  return JLSTZ_KICKS[key] || [[0, 0]];
}
const COMBO_ATTACK = [0, 1, 1, 2, 3, 4, 4, 5, 6, 7, 8];

class Tetromino {
  constructor(type) {
    this.type = type;
    this.rotationState = 0;
    const spawn = SPAWN_POS[type] || SPAWN_POS.default;
    this.x = spawn.x;
    this.y = spawn.y;
    this.spinState = null;
  }
  clone() {
    const t = new Tetromino(this.type);
    t.rotationState = this.rotationState;
    t.x = this.x;
    t.y = this.y;
    t.spinState = this.spinState ? { ...this.spinState } : null;
    return t;
  }
  getShapeAtRotation(state = this.rotationState) {
    const shapes = TETROMINO_SHAPES[this.type];
    return shapes[state] || shapes[0];
  }
  cells(rot = this.rotationState, x = this.x, y = this.y) {
    const shape = this.getShapeAtRotation(rot);
    return shape.map(([dx, dy]) => ({ x: x + dx, y: y + dy }));
  }
}
class Board {
  constructor(width, height, hidden) {
    this.width = width;
    this.visibleHeight = height;
    this.hidden = hidden;
    this.height = height + hidden;
    this.reset();
  }
  reset() {
    this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(null));
    this.toppedOut = false;
  }
  isInside(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
  isEmpty(x, y) {
    if (y < 0) return true;
    if (!this.isInside(x, y)) return false;
    return this.grid[y][x] === null;
  }
  canPlace(shape, x, y) {
    return shape.every(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      return nx >= 0 && nx < this.width && ny < this.height && this.isEmpty(nx, ny);
    });
  }
  isValid(piece, x = piece.x, y = piece.y, rot = piece.rotationState) {
    const shape = piece.getShapeAtRotation(rot);
    return this.canPlace(shape, x, y);
  }
  place(piece) {
    let toppedOut = false;
    for (const cell of piece.cells()) {
      if (cell.y < 0) {
        toppedOut = true;
        continue;
      }
      if (cell.y < this.height) {
        this.grid[cell.y][cell.x] = piece.type;
      }
    }
    if (toppedOut) this.toppedOut = true;
    return toppedOut;
  }
  clearLines() {
    let cleared = 0;
    for (let y = this.height - 1; y >= 0; y--) {
      if (this.grid[y].every(v => v)) {
        this.grid.splice(y, 1);
        this.grid.unshift(Array(this.width).fill(null));
        cleared++;
        y++;
      }
    }
    const perfectClear = cleared > 0 && this.grid.every(row => row.every(v => !v));
    return { lines: cleared, perfectClear };
  }
  addGarbage(lines) {
    const amount = Math.max(0, Math.floor(lines));
    if (amount <= 0) return;
    for (let i = 0; i < amount; i++) {
      const hole = Math.floor(Math.random() * this.width);
      const row = Array(this.width).fill('garbage');
      row[hole] = null;
      this.grid.shift();
      this.grid.push(row);
    }
  }
  getSnapshot() {
    return this.grid.map(row => row.slice());
  }
  isToppedOut() {
    if (this.toppedOut) return true;
    // Hidden rows live above the visible field; any filled cell here signals top-out.
    for (let y = 0; y < Math.min(this.hidden, this.grid.length); y++) {
      if (this.grid[y].some(cell => cell !== null)) {
        this.toppedOut = true;
        return true;
      }
    }
    return false;
  }
}

class StatsTracker {
  constructor() {
    this.reset();
  }
  reset() {
    this.lines = 0;
    this.attack = 0;
    this.pieces = 0;
    this.elapsed = 0;
    this.running = false;
  }
  start() {
    this.elapsed = 0;
    this.running = true;
  }
  stop() {
    this.running = false;
  }
  update(dt) {
    if (this.running) this.elapsed += dt;
  }
  addLines(n) {
    this.lines += n;
  }
  addAttack(n) {
    this.attack += n;
  }
  addPiece() {
    this.pieces++;
  }
  snapshot() {
    const seconds = this.elapsed;
    const minutes = seconds / 60;
    return {
      lines: this.lines,
      time: seconds,
      attack: this.attack,
      pieces: this.pieces,
      apm: seconds > 0 ? this.attack / minutes : 0,
      pps: seconds > 0 ? this.pieces / seconds : 0
    };
  }
}

const API_BASE = 'https://ru-tetris.vercel.app';

class MultiplayerClient {
  constructor() {
    this.roomCode = null;
    this.playerId = null;
    this.remoteStateHandler = () => {};
    this.garbageHandler = () => {};
    this.infoHandler = () => {};
    this.syncTimer = null;
    this.lastState = null;
    this.startAt = null;
    this.gameStarted = false;
    this.readyState = {};
    this.syncInFlight = false;
    this.roundActive = false;
    this.reportedDeath = false;
  }

  configure(config) {
    this.config = config || {};
  }

  async postJSON(url, payload) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      });
      if (!res.ok) {
        console.warn('postJSON fail', url, res.status, await res.text());
        return { ok: false };
      }
      return res.json();
    } catch (err) {
      return { ok: false };
    }
  }

  async createRoom() {
    const data = await this.postJSON(`${API_BASE}/api/room-create`, { playerId: this.playerId });
    if (!data || !data.ok) throw new Error('createRoom failed');
    this.roomCode = data.roomCode;
    this.playerId = data.you;
    this.startAt = null;
    this.gameStarted = false;
    this.readyState = {};
    this.roundActive = false;
    this.reportedDeath = false;
    this.startSyncLoop();
    this.emitRoomInfo();
    return data;
  }

  async joinRoom(roomCode) {
    const data = await this.postJSON(`${API_BASE}/api/room-join`, {
      roomCode,
      playerId: this.playerId
    });
    if (!data || !data.ok) throw new Error('joinRoom failed');
    this.roomCode = data.roomCode;
    this.playerId = data.you;
    this.startAt = null;
    this.gameStarted = false;
    this.readyState = {};
    this.roundActive = false;
    this.reportedDeath = false;
    this.startSyncLoop();
    this.emitRoomInfo();
    return data;
  }

  async setReady(isReady) {
    if (!this.roomCode || !this.playerId) return null;
    const data = await this.postJSON(`${API_BASE}/api/room-ready`, {
      roomCode: this.roomCode,
      playerId: this.playerId,
      ready: !!isReady
    });
    if (data && data.ok) {
      this.startAt = data.startAt || null;
      this.readyState = data.ready ? { ...data.ready } : {};
      if (typeof data.roundActive === 'boolean') {
        this.roundActive = data.roundActive;
      } else if (!this.startAt) {
        this.roundActive = false;
      }
      if (!this.startAt) {
        this.gameStarted = false;
      }
      this.emitRoomInfo();
    }
    return data;
  }

  sendState(state) {
    this.lastState = state;
  }

  onRemoteState(callback) {
    this.remoteStateHandler = typeof callback === 'function' ? callback : () => {};
  }

  onGarbage(callback) {
    this.garbageHandler = typeof callback === 'function' ? callback : () => {};
  }

  onRoomInfo(callback) {
    this.infoHandler = typeof callback === 'function' ? callback : () => {};
  }

  emitRoomInfo() {
    if (typeof this.infoHandler === 'function') {
      this.infoHandler({
        roomCode: this.roomCode,
        you: this.playerId,
        startAt: this.startAt,
        roundActive: this.roundActive,
        ready: { ...this.readyState }
      });
    }
  }

  shouldReportDeath() {
    if (this.reportedDeath) return false;
    if (getCurrentGameMode() !== 'multi') return false;
    const game = window.__gameInstance;
    if (!game) return false;
    if (typeof game.getLastFinishReason === 'function') {
      if (game.state === 'finished') {
        const reason = game.getLastFinishReason();
        return reason === 'toppedOut';
      }
      return false;
    }
    return game.state === 'finished';
  }

  async syncOnce() {
    if (this.syncInFlight) return;
    if (!this.roomCode || !this.playerId) return;
    if (getCurrentGameMode() === 'sprint') return;
    this.syncInFlight = true;
    let resp = null;
    try {
      const g = window.__gameInstance;
      if (!g) return;

      const snapshot = typeof g.getNetworkState === 'function' ? g.getNetworkState() : this.lastState || {};
      if (this.gameStarted && (g.isRunning === false || g.state !== 'running')) {
        this.gameStarted = false;
      }
      this.lastState = snapshot;
      const pendingAttackRaw = Number.isFinite(g.pendingAttackToSend) ? g.pendingAttackToSend : 0;
      const attackToSend = Math.max(0, pendingAttackRaw);
      const deadFlag = this.shouldReportDeath();

      const payload = {
        roomCode: this.roomCode,
        playerId: this.playerId,
        state: snapshot,
        attack: attackToSend,
        dead: deadFlag
      };

      resp = await this.postJSON(`${API_BASE}/api/room-state`, payload);
      if (!resp || !resp.ok) {
        return;
      }

      if (deadFlag) {
        this.reportedDeath = true;
      }

      g.pendingAttackToSend -= attackToSend;
      if (!Number.isFinite(g.pendingAttackToSend) || g.pendingAttackToSend < 0) {
        g.pendingAttackToSend = 0;
      }

      if (resp.startAt !== undefined) {
        this.startAt = resp.startAt || null;
      }

      if (resp.ready) {
        this.readyState = { ...resp.ready };
      }

      if (typeof resp.roundActive === 'boolean') {
        this.roundActive = resp.roundActive;
      } else if (!this.startAt) {
        this.roundActive = false;
      }

      let hasNewBag = false;
      if (typeof resp.bagVersion === 'number') {
        if (g.bagVersion !== resp.bagVersion) {
          g.sharedBag = Array.isArray(resp.bag) ? resp.bag.slice() : [];
          g.bagVersion = resp.bagVersion;
          g.bagIndex = 0;
          hasNewBag = true;
          this.gameStarted = false;
          g.isRunning = false;
          g.isDead = false;
        } else {
          g.sharedBag = Array.isArray(resp.bag) ? resp.bag.slice() : g.sharedBag;
        }
      }

      if (!this.roundActive) {
        this.startAt = null;
        this.gameStarted = false;
        const shouldShowOverlay =
          (Number.isFinite(g.startTimestampMs) && g.startTimestampMs > 0) || g.isDead;
        if (!g.matchFinished && shouldShowOverlay) {
          g.matchFinished = true;
          endOfMatchShowOverlay(resp);
        }
        if (g.isRunning && typeof g.stopGameLoop === 'function') {
          g.stopGameLoop();
        } else if (g.state === 'running' && typeof g.finish === 'function') {
          g.finish('aborted');
        }
        g.isRunning = false;
        g.pendingAttackToSend = 0;
        g.garbageQueue = 0;
        this.reportedDeath = false;
      } else {
        const startTime = resp.startAt || 0;
        if (Date.now() >= startTime) {
          if (window.__appInstance && window.__appInstance.currentScreenId !== 'gameScreen') {
            window.__appInstance.openScreen('gameScreen');
          }
          if ((hasNewBag || !this.gameStarted || !g.isRunning) && typeof g.startMultiplayerRoundFromServer === 'function') {
            g.startMultiplayerRoundFromServer(resp);
          }
          this.gameStarted = true;
          this.reportedDeath = false;
          g.matchFinished = false;
        } else {
          this.gameStarted = false;
        }
      }

      if (typeof resp.incomingGarbage === 'number' && resp.incomingGarbage > 0) {
        const currentGarbage = Number.isFinite(g.garbageQueue) ? g.garbageQueue : 0;
        g.garbageQueue = currentGarbage + resp.incomingGarbage;
      }

      const opponents = resp.opponents || {};
      const oppIds = Object.keys(opponents);
      let firstOpponentState = null;
      if (oppIds.length > 0) {
        const firstOpp = opponents[oppIds[0]];
        if (firstOpp && firstOpp.state) {
          firstOpponentState = firstOpp.state;
          if (firstOpp.state.matrix && typeof g.renderOpponent === 'function') {
            g.renderOpponent(firstOpp.state.matrix);
          } else if (typeof g.renderOpponent === 'function') {
            g.renderOpponent(null);
          }
          const oppStats = firstOpp.state.stats || firstOpp.stats || null;
          if (oppStats) {
            g.oppPps = Number.isFinite(oppStats.pps) ? oppStats.pps : 0;
            g.oppApm = Number.isFinite(oppStats.apm) ? oppStats.apm : 0;
          }
        }
      } else if (typeof g.renderOpponent === 'function') {
        g.renderOpponent(null);
        g.oppPps = 0;
        g.oppApm = 0;
      }

      if (typeof this.remoteStateHandler === 'function') {
        this.remoteStateHandler(firstOpponentState || null);
      }

      this.emitRoomInfo();
    } finally {
      this.syncInFlight = false;
    }
  }

  sendAttack(lines) {
    const amount = Math.max(0, Math.floor(lines));
    if (amount <= 0) return;
    const g = window.__gameInstance;
    if (g) {
      const current = Number.isFinite(g.pendingAttackToSend) ? g.pendingAttackToSend : 0;
      g.pendingAttackToSend = current + amount;
    }
  }

  startSyncLoop() {
    this.stopSyncLoop();
    this.syncOnce();
    this.syncTimer = setInterval(() => {
      if (this.roomCode && this.playerId) {
        this.syncOnce();
      }
    }, 300);
  }

  stopSyncLoop() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  isLocalReady() {
    if (!this.playerId) return false;
    return !!this.readyState[this.playerId];
  }

  disconnect() {
    this.stopSyncLoop();
    this.startAt = null;
    this.gameStarted = false;
    this.readyState = {};
    this.lastState = null;
    this.roundActive = false;
    this.reportedDeath = false;
    this.roomCode = null;
    this.emitRoomInfo();
  }
}

class Game {
  constructor(config) {
    this.config = config;
    this.board = new Board(config.boardWidth, config.boardHeight, config.hiddenRows);
    this.stats = new StatsTracker();
    this.callbacks = {};
    this.random = Math.random.bind(Math);
    this.multiplayerClient = null;
    this.lastSharedState = null;
    this.isRunning = false;
    this.lastFinishReason = null;
    this.mode = getCurrentGameMode();
    this.localBag = [];
    this.reset();
  }
  reset() {
    this.state = 'idle';
    this.queue = [];
    this.localBag = [];
    this.holdPiece = null;
    this.holdUsed = false;
    this.active = null;
    this.fallAcc = 0;
    this.lockTimer = 0;
    this.softDrop = false;
    this.areTimer = 0;
    this.combo = 0;
    this.b2b = 0;
    this.pendingGarbage = 0;
    this.lastClear = null;
    this.lastSharedState = null;
    this.isRunning = false;
    this.lastFinishReason = null;
  }
  setMode(mode) {
    this.mode = mode === 'multi' ? 'multi' : 'sprint';
  }
  setCallbacks(cb) {
    this.callbacks = cb || {};
  }
  attachMultiplayer(client) {
    this.multiplayerClient = client;
  }
  start() {
    if (this.mode === 'multi') {
      this.startMultiplayerRound();
    } else {
      this.startSprintRound();
    }
  }
  startSprintRound() {
    this.setMode('sprint');
    this.startRoundCore();
  }
  startMultiplayerRound() {
    this.setMode('multi');
    this.startRoundCore();
  }
  startRoundCore() {
    this.reset();
    this.stats.reset();
    this.stats.start();
    this.board.reset();
    this.state = 'running';
    this.isRunning = true;
    this.lastFinishReason = null;
    const g = window.__gameInstance;
    if (g) {
      g.isRunning = true;
      g.isDead = false;
      g.pendingAttackToSend = 0;
      g.garbageQueue = 0;
      g.linesCleared = 0;
    }
    this.ensureQueue();
    this.spawnNext();
    if (this.callbacks.state) this.callbacks.state(this.state);
    this.shareState();
  }
  update(dt) {
    if (this.state !== 'running') return;
    flushGarbageQueueIntoField();
    this.stats.update(dt);
    if (this.areTimer > 0) {
      this.areTimer -= dt;
      if (this.areTimer <= 0) this.spawnNext();
      return;
    }
    if (!this.active) return;
    const speed = this.softDrop ? this.config.softDropSpeed : this.config.gravity;
    this.fallAcc += speed * dt;
    while (this.fallAcc >= 1) {
      if (this.tryFall()) this.fallAcc -= 1;
      else {
        this.fallAcc = 0;
        break;
      }
    }
    if (this.active && !this.canFall()) {
      this.lockTimer += dt;
      if (this.lockTimer >= this.config.lockDelay) this.lockPiece();
    } else {
      this.lockTimer = 0;
    }
    this.shareState();
  }
  ensureQueue() {
    const previewCount = this.config.previewCount || 0;
    if (this.mode === 'multi') {
      this.queue = getSharedPreview(previewCount);
    } else {
      this.ensureLocalPieces(previewCount + 1);
      this.queue = this.localBag.slice(0, previewCount);
    }
  }
  takeFromQueue() {
    if (this.mode === 'multi') {
      return getNextSharedPiece();
    }
    this.ensureLocalPieces(1);
    const next = this.localBag.shift();
    return next || 'I';
  }
  ensureLocalPieces(minCount) {
    const target = Math.max(0, minCount);
    while (this.localBag.length < target) {
      const bag = this.generateLocalBag();
      this.localBag.push(...bag);
    }
  }
  generateLocalBag() {
    const bag = LOCAL_PIECES.slice();
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      const tmp = bag[i];
      bag[i] = bag[j];
      bag[j] = tmp;
    }
    return bag;
  }
  createPiece(type) {
    const piece = new Tetromino(type);
    piece.rotationState = 0;
    piece.spinState = null;
    return piece;
  }
  applyPendingGarbage() {
    if (this.pendingGarbage <= 0) return;
    const lines = this.pendingGarbage;
    this.pendingGarbage = 0;
    this.board.addGarbage(lines);
    if (this.board.isToppedOut()) {
      this.finish('toppedOut');
    }
  }
  spawnNext(skipGarbage = false) {
    if (!skipGarbage) this.applyPendingGarbage();
    if (this.state !== 'running') return;
    const type = this.takeFromQueue();
    const piece = this.createPiece(type);
    if (!this.board.isValid(piece)) {
      this.finish('toppedOut');
      return;
    }
    this.active = piece;
    this.fallAcc = 0;
    this.lockTimer = 0;
    this.ensureQueue();
  }
  hold() {
    if (this.state !== 'running' || !this.active || this.holdUsed) return;
    const current = this.active.type;
    if (this.holdPiece) {
      const nextType = this.holdPiece;
      this.holdPiece = current;
      const piece = this.createPiece(nextType);
      if (!this.board.isValid(piece)) {
        this.finish('toppedOut');
        return;
      }
      this.active = piece;
    } else {
      this.holdPiece = current;
      this.active = null;
      this.spawnNext(true);
    }
    this.holdUsed = true;
    this.softDrop = false;
    this.fallAcc = 0;
    this.lockTimer = 0;
  }
  hardDrop() {
    if (this.state !== 'running' || !this.active) return;
    while (this.board.isValid(this.active, this.active.x, this.active.y + 1)) {
      this.active.y++;
    }
    this.lockPiece();
  }
  move(dir) {
    if (this.state !== 'running' || !this.active) return false;
    const nx = this.active.x + dir;
    if (!this.board.isValid(this.active, nx, this.active.y)) return false;
    this.active.x = nx;
    this.resetSpin();
    this.lockTimer = 0;
    return true;
  }
  tryFall() {
    if (!this.active) return false;
    const ny = this.active.y + 1;
    if (this.board.isValid(this.active, this.active.x, ny)) {
      this.active.y = ny;
      this.resetSpin();
      return true;
    }
    return false;
  }
  canFall() {
    return this.active && this.board.isValid(this.active, this.active.x, this.active.y + 1);
  }
  tryRotate(dir) {
    if (this.state !== 'running' || !this.active) return false;
    const piece = this.active;
    const from = piece.rotationState;
    const to = (from + dir + 4) % 4;
    const rotatedShape = piece.getShapeAtRotation(to);
    const kicks = dir === 2 ? [[0, 0]] : getKickTable(piece.type, from, to);
    const rotationType = dir === 2 ? '180' : dir === 1 ? 'cw' : 'ccw';
    for (let i = 0; i < kicks.length; i++) {
      const [kx, ky] = kicks[i];
      const testX = piece.x + kx;
      const testY = piece.y + ky;
      if (this.board.canPlace(rotatedShape, testX, testY)) {
        piece.rotationState = to;
        piece.x = testX;
        piece.y = testY;
        piece.spinState = { used: true, kick: i, type: rotationType };
        this.lockTimer = 0;
        return true;
      }
    }
    return false;
  }
  rotateCW() {
    return this.tryRotate(1);
  }
  rotateCCW() {
    return this.tryRotate(-1);
  }
  rotate180() {
    return this.tryRotate(2);
  }
  rotate(dir) {
    switch (dir) {
      case 'cw':
        return this.rotateCW();
      case 'ccw':
        return this.rotateCCW();
      case '180':
        return this.rotate180();
      default:
        return false;
    }
  }
  resetSpin() {
    if (this.active) this.active.spinState = null;
  }
  lockPiece() {
    if (!this.active) return;
    const toppedOut = this.board.place(this.active);
    this.stats.addPiece();
    const g = window.__gameInstance;
    if (g) {
      const currentPieces = Number.isFinite(g.totalPiecesPlaced) ? g.totalPiecesPlaced : 0;
      g.totalPiecesPlaced = currentPieces + 1;
    }
    if (toppedOut || this.board.isToppedOut()) {
      this.combo = 0;
      this.b2b = 0;
      this.lastClear = null;
      this.active = null;
      this.holdUsed = false;
      this.lockTimer = 0;
      this.fallAcc = 0;
      this.softDrop = false;
      this.areTimer = 0;
      this.finish('toppedOut');
      return;
    }
    const spinResult = this.evaluateSpin(this.active);
    const clear = this.board.clearLines();
    const lines = clear.lines;
    const perfectClear = clear.perfectClear;
    let attack = 0;
    if (lines > 0) {
      this.stats.addLines(lines);
      if (g) {
        const previousLines = Number.isFinite(g.linesCleared) ? g.linesCleared : 0;
        g.linesCleared = previousLines + lines;
      }
      const spinType = spinResult.type || 'none';
      const baseAttack = this.calculateAttack(lines, spinType, this.combo, this.b2b);
      let totalAttack = baseAttack;
      if (perfectClear) totalAttack += 10;
      totalAttack = Math.min(totalAttack, 20);
      if (totalAttack > 0 && this.pendingGarbage > 0) {
        const cancel = Math.min(this.pendingGarbage, totalAttack);
        this.pendingGarbage -= cancel;
        totalAttack -= cancel;
      }
      attack = totalAttack;
      if (attack > 0) {
        this.stats.addAttack(attack);
        if (g) {
          const current = Number.isFinite(g.pendingAttackToSend)
            ? g.pendingAttackToSend
            : 0;
          g.pendingAttackToSend = current + attack;
        }
      }
      this.combo += 1;
      const b2bEligible = spinType === 't' || spinType === 'mini' || lines === 4;
      if (b2bEligible) {
        this.b2b = Math.min(this.b2b + 1, 999);
      } else {
        this.b2b = 0;
      }
    } else {
      this.combo = 0;
      this.b2b = 0;
    }
    // Detect top-out: if any blocks remain in hidden rows after lock/clear
    if (this.board.isToppedOut()) {
      this.finish('toppedOut');
      return;
    }
    this.lastClear = { lines, spin: spinResult, perfectClear, attack };
    this.active = null;
    this.holdUsed = false;
    this.lockTimer = 0;
    this.fallAcc = 0;
    this.softDrop = false;
    this.areTimer = lines > 0 ? this.config.lineClearAre : this.config.are;
    if (this.mode === 'sprint' && this.stats.lines >= 40) {
      this.finish('clear40');
    }
  }
  calculateAttack(linesCleared, tSpinType, combo, b2b) {
    let attack = 0;
    switch (tSpinType) {
      case 't':
        if (linesCleared === 1) attack += 2;
        else if (linesCleared === 2) attack += 4;
        else if (linesCleared === 3) attack += 6;
        break;
      case 'mini':
        if (linesCleared === 1) attack += 1;
        else if (linesCleared === 2) attack += 2;
        break;
      default:
        if (linesCleared === 2) attack += 1;
        else if (linesCleared === 3) attack += 2;
        else if (linesCleared === 4) attack += 4;
        break;
    }
    const comboIndex = Math.max(0, Math.min(combo, COMBO_ATTACK.length - 1));
    attack += COMBO_ATTACK[comboIndex];
    const b2bEligible = tSpinType === 't' || tSpinType === 'mini' || linesCleared === 4;
    if (b2bEligible && b2b > 0) {
      attack += Math.min(b2b, 4);
    }
    return attack;
  }
  receiveGarbage(lines) {
    const amount = Math.max(0, Math.floor(lines));
    if (amount <= 0) return;
    this.pendingGarbage += amount;
    if (this.state === 'running' && !this.active && this.areTimer <= 0) {
      this.applyPendingGarbage();
      if (this.state === 'running' && !this.active) {
        this.spawnNext();
      }
    }
  }
  evaluateSpin(piece) {
    if (piece.type !== 'T' || !piece.spinState || !piece.spinState.used) return { type: 'none' };
    const center = { x: piece.x + 1, y: piece.y + 1 };
    const corners = [
      { x: center.x - 1, y: center.y - 1 },
      { x: center.x + 1, y: center.y - 1 },
      { x: center.x - 1, y: center.y + 1 },
      { x: center.x + 1, y: center.y + 1 }
    ];
    let filled = 0;
    for (const corner of corners) {
      if (!this.board.isEmpty(corner.x, corner.y)) filled++;
    }
    if (filled < 3) return { type: 'none' };
    let mini = false;
    if (piece.spinState.type !== '180') {
      mini = filled === 3 && piece.spinState.kick >= 3;
    }
    return mini ? { type: 'mini' } : { type: 't' };
  }
  setSoftDrop(active) {
    if (this.state !== 'running') return;
    this.softDrop = active;
  }
  finish(reason = 'unknown') {
    if (this.state === 'finished') return;
    this.state = 'finished';
    this.isRunning = false;
    this.active = null;
    this.areTimer = 0;
    this.softDrop = false;
    this.combo = 0;
    this.b2b = 0;
    this.pendingGarbage = 0;
    this.lastFinishReason = reason;
    this.stats.stop();
    const g = window.__gameInstance;
    if (g) {
      g.isRunning = false;
      g.isDead = reason === 'toppedOut';
    }
    this.shareState();
    // TODO: сохранение статистики результатов на сервере
    if (this.callbacks.finish) this.callbacks.finish(this.getSummary());
  }
  getLastFinishReason() {
    return this.lastFinishReason;
  }
  startNewRound() {
    this.start();
  }
  stopGameLoop() {
    this.stats.stop();
    this.board.reset();
    this.reset();
    this.stats.reset();
    this.shareState();
    const g = window.__gameInstance;
    if (g) {
      g.isRunning = false;
    }
  }
  showLobbyScreen() {
    if (typeof window === 'undefined') return;
    if (window.__appInstance) {
      window.__appInstance.hideOverlay();
      if (window.__appInstance.currentScreenId !== 'matchScreen') {
        window.__appInstance.openScreen('matchScreen');
      } else if (window.__appInstance.matchmaking) {
        window.__appInstance.matchmaking.updateStatusText();
      }
    }
  }
  getSummary() {
    const snap = this.stats.snapshot();
    return { time: snap.time, apm: snap.apm, pps: snap.pps, lines: snap.lines };
  }
  getRenderState() {
    const grid = this.board.getSnapshot();
    const active = this.active ? this.active.clone() : null;
    const ghost = active ? this.ghostCells(active) : null;
    return {
      grid,
      active,
      ghost,
      hold: this.holdPiece,
      queue: this.queue.slice(0, this.config.previewCount),
      stats: this.stats.snapshot(),
      state: this.state
    };
  }
  getNetworkState() {
    const matrix = this.board.getSnapshot();
    const active = this.active
      ? {
          type: this.active.type,
          rotation: this.active.rotationState,
          x: this.active.x,
          y: this.active.y,
          cells: this.active.cells().map(cell => ({ x: cell.x, y: cell.y }))
        }
      : null;
    return {
      matrix,
      active,
      hold: this.holdPiece,
      queue: this.queue.slice(0, this.config.previewCount),
      stats: this.stats.snapshot()
    };
  }
  shareState() {
    if (!this.multiplayerClient) return;
    const snapshot = this.getNetworkState();
    const serialized = JSON.stringify(snapshot);
    if (serialized === this.lastSharedState) return;
    this.lastSharedState = serialized;
    this.multiplayerClient.sendState(snapshot);
  }
  ghostCells(piece) {
    const shadow = piece.clone();
    while (this.board.isValid(shadow, shadow.x, shadow.y + 1)) shadow.y++;
    return shadow.cells();
  }
}
class BoardSnapshotRenderer {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = config.boardWidth;
    this.blockSize = Math.floor(canvas.width / this.width);
    this.baseRows = config.boardHeight + (config.hiddenRows || 0);
    this.totalRows = this.baseRows;
    this.ensureCanvasHeight(this.totalRows);
  }
  ensureCanvasHeight(rows) {
    if (rows <= 0) return;
    const targetRows = Math.max(rows, this.baseRows);
    const requiredHeight = targetRows * this.blockSize;
    if (this.canvas.height !== requiredHeight) {
      this.canvas.height = requiredHeight;
    }
    const cssHeight = `${requiredHeight}px`;
    if (this.canvas.style.height !== cssHeight) {
      this.canvas.style.height = cssHeight;
    }
    this.totalRows = targetRows;
  }
  clear() {
    this.ctx.fillStyle = '#050a18';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  render(snapshot) {
    const matrix = snapshot && Array.isArray(snapshot.matrix) ? snapshot.matrix : [];
    if (matrix.length > 0) {
      this.ensureCanvasHeight(matrix.length);
    } else {
      this.ensureCanvasHeight(this.baseRows);
    }
    this.clear();
    if (!snapshot) return;
    const rows = this.totalRows;
    for (let y = 0; y < rows; y++) {
      const row = matrix[y] || [];
      for (let x = 0; x < this.width; x++) {
        const cell = row[x];
        if (cell) this.drawBlock(x, y, COLORS[cell] || '#f8f9ff');
      }
    }
    if (Array.isArray(snapshot.ghostCells)) {
      this.drawCells(snapshot.ghostCells, COLORS.ghost);
    }
    if (snapshot.active && Array.isArray(snapshot.active.cells)) {
      const color = COLORS[snapshot.active.type] || '#f8f9ff';
      this.drawCells(snapshot.active.cells, color);
    }
  }
  drawCells(cells, color) {
    if (!Array.isArray(cells)) return;
    for (const cell of cells) {
      if (typeof cell.x !== 'number' || typeof cell.y !== 'number') continue;
      if (cell.y < 0 || cell.y >= this.totalRows) continue;
      if (cell.x < 0 || cell.x >= this.width) continue;
      this.drawBlock(cell.x, cell.y, color);
    }
  }
  drawBlock(x, y, color) {
    const size = this.blockSize;
    const margin = 1;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * size + margin, y * size + margin, size - margin * 2, size - margin * 2);
  }
}

class Renderer {
  constructor(elements) {
    this.boardCanvas = elements.board;
    this.boardCtx = this.boardCanvas.getContext('2d');
    this.holdCtx = elements.hold.getContext('2d');
    this.nextCtx = elements.next.getContext('2d');
    this.hud = elements.hud;
    this.config = elements.config;
    this.cols = this.config.boardWidth;
    this.blockSize = Math.floor(this.boardCanvas.width / this.cols);
    this.baseRows = this.config.boardHeight + (this.config.hiddenRows || 0);
    this.ensureBoardCanvasHeight(this.baseRows);
  }
  ensureBoardCanvasHeight(rows) {
    if (rows <= 0) return;
    const targetRows = Math.max(rows, this.baseRows);
    const requiredHeight = targetRows * this.blockSize;
    if (this.boardCanvas.height !== requiredHeight) {
      this.boardCanvas.height = requiredHeight;
    }
    const cssHeight = `${requiredHeight}px`;
    if (this.boardCanvas.style.height !== cssHeight) {
      this.boardCanvas.style.height = cssHeight;
    }
    this.currentRows = targetRows;
  }
  render(game) {
    const state = game.getRenderState();
    this.drawBoard(state);
    this.drawHold(state.hold);
    this.drawNext(state.queue);
    this.updateHud(state.stats);
  }
  drawBoard(state) {
    const ctx = this.boardCtx;
    const cell = this.blockSize;
    const rows = state.grid.length;
    this.ensureBoardCanvasHeight(rows);
    const totalRows = this.currentRows || rows;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = '#0b1324';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let y = 0; y < totalRows; y++) {
      for (let x = 0; x < this.cols; x++) {
        ctx.strokeRect(x * cell, y * cell, cell, cell);
      }
    }
    const drawCells = (cells, color, alpha = 1) => {
      if (!Array.isArray(cells)) return;
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      for (const c of cells) {
        if (!c) continue;
        if (c.y < 0 || c.y >= totalRows) continue;
        if (c.x < 0 || c.x >= this.cols) continue;
        ctx.fillRect(c.x * cell, c.y * cell, cell, cell);
      }
      ctx.globalAlpha = 1;
    };
    for (let y = 0; y < totalRows; y++) {
      const row = state.grid[y] || [];
      const cols = Math.min(row.length, this.cols);
      for (let x = 0; x < cols; x++) {
        const type = row[x];
        if (type) {
          ctx.fillStyle = COLORS[type];
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }
    if (state.ghost) drawCells(state.ghost, COLORS.ghost, 1);
    if (state.active) drawCells(state.active.cells(), COLORS[state.active.type]);
  }
  drawHold(type) {
    const ctx = this.holdCtx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (!type) return;
    ctx.save();
    this.drawMini(ctx, type, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }
  drawNext(queue) {
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    queue.forEach((type, index) => {
      ctx.save();
      ctx.translate(0, index * 80);
      this.drawMini(ctx, type, ctx.canvas.width, 80);
      ctx.restore();
    });
  }
  drawMini(ctx, type, boxWidth = ctx.canvas.width, boxHeight = ctx.canvas.height) {
    const size = 28;
    const shape = TETROMINO_SHAPES[type][0];
    const minX = Math.min(...shape.map(c => c[0]));
    const maxX = Math.max(...shape.map(c => c[0]));
    const minY = Math.min(...shape.map(c => c[1]));
    const maxY = Math.max(...shape.map(c => c[1]));
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const offsetX = (boxWidth - width * size) / 2;
    const offsetY = (boxHeight - height * size) / 2;
    ctx.fillStyle = COLORS[type];
    for (const [dx, dy] of shape) {
      ctx.fillRect(offsetX + (dx - minX) * size, offsetY + (dy - minY) * size, size - 2, size - 2);
    }
  }
  updateHud(stats) {
    const { lines, time, apm, pps } = stats;
    this.hud.lines.textContent = lines;
    this.hud.time.textContent = formatTime(time);
    this.hud.apm.textContent = apm.toFixed(2);
    this.hud.pps.textContent = pps.toFixed(2);
  }
}

class InputManager {
  constructor(game, settingsStore) {
    this.game = game;
    this.config = game.config;
    this.store = settingsStore;
    this.bindings = {};
    this.left = false;
    this.right = false;
    this.lastDir = 0;
    this.dasTimer = 0;
    this.arrTimer = 0;
    this.softDrop = false;
    this.refreshBindings();
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }
  refreshBindings() {
    const bindings = this.store.getBindings();
    this.bindingsByKey = {};
    Object.entries(bindings).forEach(([action, code]) => {
      if (code) this.bindingsByKey[code] = action;
    });
  }
  onKeyDown(e) {
    const action = this.bindingsByKey[e.code];
    if (!action) return;
    e.preventDefault();
    switch (action) {
      case 'moveLeft':
        if (e.repeat) return;
        this.left = true;
        this.lastDir = -1;
        this.dasTimer = 0;
        this.arrTimer = 0;
        if (this.game.move(-1)) incrementInputCount();
        break;
      case 'moveRight':
        if (e.repeat) return;
        this.right = true;
        this.lastDir = 1;
        this.dasTimer = 0;
        this.arrTimer = 0;
        if (this.game.move(1)) incrementInputCount();
        break;
      case 'softDrop':
        this.softDrop = true;
        this.game.setSoftDrop(true);
        break;
      case 'hardDrop':
        if (e.repeat) return;
        const hadActive = !!(this.game && this.game.active);
        this.game.hardDrop();
        if (hadActive) incrementInputCount();
        break;
      case 'rotateCW':
        if (e.repeat) return;
        if (this.game.rotateCW()) incrementInputCount();
        break;
      case 'rotateCCW':
        if (e.repeat) return;
        if (this.game.rotateCCW()) incrementInputCount();
        break;
      case 'rotate180':
        if (e.repeat) return;
        if (this.game.rotate180()) incrementInputCount();
        break;
      case 'hold':
        if (e.repeat) return;
        this.game.hold();
        break;
      default:
        break;
    }
  }
  onKeyUp(e) {
    const action = this.bindingsByKey[e.code];
    if (!action) return;
    switch (action) {
      case 'moveLeft':
        this.left = false;
        this.dasTimer = 0;
        this.arrTimer = 0;
        break;
      case 'moveRight':
        this.right = false;
        this.dasTimer = 0;
        this.arrTimer = 0;
        break;
      case 'softDrop':
        this.softDrop = false;
        this.game.setSoftDrop(false);
        break;
      default:
        break;
    }
  }
  update(dt) {
    this.game.setSoftDrop(this.softDrop);
    const dir = this.getHorizontalDir();
    if (dir === 0) {
      this.dasTimer = 0;
      this.arrTimer = 0;
      return;
    }
    this.dasTimer += dt;
    if (this.dasTimer < this.config.das) return;
    if (this.config.arr === 0) {
      if (this.game.move(dir)) incrementInputCount();
      return;
    }
    this.arrTimer += dt;
    while (this.arrTimer >= this.config.arr) {
      if (!this.game.move(dir)) {
        this.arrTimer = 0;
        break;
      }
      incrementInputCount();
      this.arrTimer -= this.config.arr;
    }
  }
  getHorizontalDir() {
    if (this.left && this.right) return this.lastDir;
    if (this.left) return -1;
    if (this.right) return 1;
    return 0;
  }
}

function formatTime(seconds) {
  const total = Math.max(0, seconds);
  const minutes = Math.floor(total / 60);
  const secs = total - minutes * 60;
  const whole = Math.floor(secs);
  const cent = Math.floor((secs - whole) * 100);
  return `${String(minutes).padStart(2, '0')}:${String(whole).padStart(2, '0')}.${String(cent).padStart(2, '0')}`;
}
class MatchmakingUI {
  constructor({ locale, client, game, config }) {
    this.locale = locale;
    this.client = client;
    this.game = game;
    this.config = config;
    this.elements = {
      description: document.getElementById('matchDescription'),
      input: document.getElementById('roomCodeInput'),
      joinBtn: document.getElementById('joinRoomBtn'),
      createBtn: document.getElementById('createRoomBtn'),
      readyBtn: document.getElementById('readyBtn'),
      roomCode: document.getElementById('matchRoomCode'),
      boards: document.getElementById('matchBoards'),
      localTitle: document.getElementById('localBoardTitle'),
      remoteTitle: document.getElementById('remoteBoardTitle'),
      localCanvas: document.getElementById('localMatchBoard'),
      remoteCanvas: document.getElementById('remoteMatchBoard'),
      localStats: document.getElementById('localBoardStats'),
      remoteStats: document.getElementById('remoteBoardStats')
    };
    this.roomCode = null;
    this.roomMode = 'idle';
    this.remoteState = null;
    this.startAt = null;
    this.readyState = {};
    this.isReady = false;
    this.roundActive = false;
    this.localRenderer = new BoardSnapshotRenderer(this.elements.localCanvas, config);
    this.remoteRenderer = new BoardSnapshotRenderer(this.elements.remoteCanvas, config);
    this.attachEvents();
    this.client.onRemoteState((state) => {
      this.remoteState = state;
      this.renderRemote();
    });
    this.client.onGarbage((lines) => {
      this.game.receiveGarbage(lines);
    });
    this.client.onRoomInfo((info) => {
      this.startAt = info && typeof info.startAt === 'number' ? info.startAt : null;
      this.readyState = (info && info.ready) ? info.ready : {};
      this.roundActive = !!(info && info.roundActive);
      const currentlyReady = this.client.isLocalReady();
      if (this.isReady !== currentlyReady) {
        this.isReady = currentlyReady;
      }
      this.updateReadyButton();
      this.updateStatusText();
    });
    this.refreshText();
    this.updateStatusText();
  }
  attachEvents() {
    this.elements.joinBtn.addEventListener('click', () => this.handleJoin());
    this.elements.createBtn.addEventListener('click', () => this.handleCreate());
    this.elements.readyBtn.addEventListener('click', () => this.handleReadyToggle());
    this.elements.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.handleJoin();
      }
    });
  }
  refreshText() {
    this.elements.joinBtn.textContent = this.locale.t('match.join');
    this.elements.createBtn.textContent = this.locale.t('match.create');
    this.updateReadyButton();
    this.elements.input.placeholder = this.locale.t('match.placeholder');
    this.elements.localTitle.textContent = this.locale.t('match.localPlayer');
    this.elements.remoteTitle.textContent = this.locale.t('match.remotePlayer');
    if (this.roomCode) {
      this.elements.roomCode.textContent = this.locale.t(
        this.roomMode === 'created' ? 'match.createSuccess' : 'match.joinSuccess',
        { code: this.roomCode }
      );
    }
    this.updateStatusText();
    this.renderRemote();
  }
  handleJoin() {
    const code = this.elements.input.value.trim().toUpperCase();
    if (!code) {
      this.roomMode = 'needCode';
      this.updateStatusText();
      return;
    }
    this.roomMode = 'connecting';
    this.updateStatusText();
    this.client.joinRoom(code)
      .then((data) => {
        this.roomCode = data.roomCode;
        this.elements.input.value = data.roomCode;
        this.roomMode = 'joined';
        this.isReady = false;
        this.startAt = null;
        this.readyState = {};
        this.roundActive = false;
        this.onRoomReady();
      })
      .catch(() => {
        this.roomMode = 'error';
        this.isReady = false;
        this.startAt = null;
        this.readyState = {};
        this.updateReadyButton();
        this.updateStatusText();
      });
  }
  handleCreate() {
    this.roomMode = 'connecting';
    this.updateStatusText();
    this.client.createRoom()
      .then((data) => {
        this.roomCode = data.roomCode;
        this.elements.input.value = data.roomCode;
        this.roomMode = 'created';
        this.isReady = false;
        this.startAt = null;
        this.readyState = {};
        this.roundActive = false;
        this.onRoomReady();
      })
      .catch(() => {
        this.roomMode = 'error';
        this.isReady = false;
        this.startAt = null;
        this.readyState = {};
        this.updateReadyButton();
        this.updateStatusText();
      });
  }
  onRoomReady() {
    this.elements.roomCode.textContent = this.locale.t(
      this.roomMode === 'created' ? 'match.createSuccess' : 'match.joinSuccess',
      { code: this.roomCode }
    );
    this.elements.boards.classList.remove('hidden');
    this.elements.readyBtn.style.display = '';
    this.elements.readyBtn.disabled = false;
    this.renderLocal(this.game);
    this.remoteState = null;
    this.renderRemote();
    this.updateReadyButton();
    this.updateStatusText();
    if (window.__appInstance && typeof window.__appInstance.setGameMode === 'function') {
      window.__appInstance.setGameMode('multi');
    }
  }
  leaveRoom() {
    if (this.roomCode) {
      this.client.setReady(false);
    }
    this.roomCode = null;
    this.roomMode = 'idle';
    this.remoteState = null;
    this.isReady = false;
    this.startAt = null;
    this.readyState = {};
    this.roundActive = false;
    this.elements.roomCode.textContent = '';
    this.elements.boards.classList.add('hidden');
    this.elements.readyBtn.style.display = 'none';
    this.elements.readyBtn.disabled = true;
    this.elements.readyBtn.classList.remove('ready-active');
    this.client.disconnect();
    this.updateStatusText();
    this.renderRemote();
    if (window.__appInstance && typeof window.__appInstance.setGameMode === 'function') {
      window.__appInstance.setGameMode('sprint');
    }
  }
  updateStatusText() {
    if (this.roomMode === 'created' || this.roomMode === 'joined') {
      let messageKey = 'match.statusPromptReady';
      const now = Date.now();
      if (this.roundActive) {
        if (this.startAt && now < this.startAt) {
          messageKey = 'match.statusCountdown';
        } else {
          messageKey = 'match.statusInGame';
        }
      } else if (!this.isReady) {
        messageKey = 'match.statusPromptReady';
      } else if (!this.startAt) {
        messageKey = 'match.statusWaitingOpponentReady';
      } else if (now < this.startAt) {
        messageKey = 'match.statusCountdown';
      } else if (this.client.gameStarted) {
        messageKey = 'match.statusInGame';
      }
      this.elements.description.textContent = this.locale.t(messageKey);
      return;
    }

    let key = 'match.statusIdle';
    switch (this.roomMode) {
      case 'connecting':
        key = 'match.statusConnecting';
        break;
      case 'needCode':
        key = 'match.statusNeedCode';
        break;
      case 'error':
        key = 'match.statusError';
        break;
      default:
        key = 'match.statusIdle';
        break;
    }
    const params = this.roomCode ? { code: this.roomCode } : {};
    this.elements.description.textContent = this.locale.t(key, params);
  }
  handleReadyToggle() {
    if (!(this.roomMode === 'created' || this.roomMode === 'joined')) return;
    const nextState = !this.client.isLocalReady();
    this.elements.readyBtn.disabled = true;
    this.client.setReady(nextState).finally(() => {
      this.isReady = this.client.isLocalReady();
      this.elements.readyBtn.disabled = false;
      this.updateReadyButton();
      this.updateStatusText();
    });
  }
  updateReadyButton() {
    const btn = this.elements.readyBtn;
    if (!btn) return;
    const inRoom = this.roomMode === 'created' || this.roomMode === 'joined';
    if (!inRoom) {
      btn.style.display = 'none';
      btn.disabled = true;
      btn.classList.remove('ready-active');
      btn.textContent = this.locale.t('match.ready');
      return;
    }
    btn.style.display = '';
    const localReady = this.client.isLocalReady();
    btn.textContent = this.locale.t(localReady ? 'match.notReady' : 'match.ready');
    if (localReady) {
      btn.classList.add('ready-active');
    } else {
      btn.classList.remove('ready-active');
    }
  }
  renderLocal(game) {
    const state = game.getRenderState();
    this.localRenderer.render({
      matrix: state.grid,
      active: state.active
        ? { type: state.active.type, cells: state.active.cells() }
        : null,
      ghostCells: state.ghost
    });
    this.elements.localStats.textContent = this.formatStats(state.stats);
  }
  renderRemote() {
    if (!this.remoteState) {
      this.remoteRenderer.clear();
      this.elements.remoteStats.textContent = this.locale.t('match.waitingOpponent');
      return;
    }
    this.remoteRenderer.render({
      matrix: this.remoteState.matrix,
      active: this.remoteState.active,
      ghostCells: this.remoteState.ghost || null
    });
    this.elements.remoteStats.textContent = this.formatStats(this.remoteState.stats);
  }
  formatStats(stats) {
    if (!stats) return '—';
    const lines = Number.isFinite(stats.lines) ? stats.lines : 0;
    const time = Number.isFinite(stats.time) ? stats.time : 0;
    const apm = Number.isFinite(stats.apm) ? stats.apm : 0;
    const pps = Number.isFinite(stats.pps) ? stats.pps : 0;
    return `LINES: ${lines} | TIME: ${formatTime(time)} | APM: ${apm.toFixed(1)} | PPS: ${pps.toFixed(2)}`;
  }
}
class App {
  constructor() {
    const initialMode = getCurrentGameMode();
    this.locale = new Localization(i18n, 'ru');
    this.settingsStore = new SettingsStore('ru-tetris-binds', DEFAULT_BINDINGS);
    this.screenManager = new ScreenManager();
    this.game = new Game(CONFIG);
    this.game.setMode(initialMode);
    const g = window.__gameInstance;
    g.game = this.game;
    g.getNetworkState = this.game.getNetworkState.bind(this.game);
    g.getLastFinishReason = this.game.getLastFinishReason.bind(this.game);
    g.stopGameLoop = this.game.stopGameLoop.bind(this.game);
    g.applyIncomingGarbage = (lines) => {
      this.game.receiveGarbage(lines);
    };
    g.finish = this.game.finish.bind(this.game);
    g.startSprintRun = () => this.startSprintRun();
    g.startMultiplayerRoundFromServer = (data) => this.startMultiplayerRoundFromServer(data);
    g.startNewRound = () => this.startMultiplayerRoundFromServer({ bag: g.sharedBag, bagVersion: g.bagVersion });
    g.start = this.game.start.bind(this.game);
    g.showLobbyScreen = this.game.showLobbyScreen.bind(this.game);
    Object.defineProperty(g, 'state', {
      configurable: true,
      get: () => this.game.state
    });
    Object.defineProperty(g, 'isRunning', {
      configurable: true,
      get: () => this.game.isRunning,
      set: (value) => {
        this.game.isRunning = !!value;
      }
    });
    g.renderOpponent = function renderOpponent(matrix) {
      const canvas = document.getElementById('enemyBoard');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0b1324';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!Array.isArray(matrix) || matrix.length === 0) {
        return;
      }

      const rows = matrix.length;
      const cols = Array.isArray(matrix[0]) ? matrix[0].length : 0;
      if (!rows || !cols) {
        return;
      }

      const cellW = canvas.width / cols;
      const cellH = canvas.height / rows;

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';

      for (let y = 0; y < rows; y++) {
        const row = Array.isArray(matrix[y]) ? matrix[y] : [];
        for (let x = 0; x < cols; x++) {
          const cell = row[x];
          if (cell) {
            ctx.fillStyle = COLORS[cell] || '#666';
            ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
          }
          ctx.strokeRect(x * cellW, y * cellH, cellW, cellH);
        }
      }
    };
    g.renderOpponent(null);
    this.multiplayer = new MultiplayerClient();
    this.multiplayer.configure(CONFIG);
    this.game.attachMultiplayer(this.multiplayer);
    window.__multiplayerClient = this.multiplayer;
    window.__appInstance = this;
    this.gameMode = initialMode;
    window.__appInstance.gameMode = initialMode;
    this.currentScreenId = null;
    g.sendReadyToServer = (ready) => this.multiplayer.setReady(ready);
    const hud = {
      lines: document.getElementById('linesVal'),
      time: document.getElementById('timeVal'),
      apm: document.getElementById('apmVal'),
      pps: document.getElementById('ppsVal')
    };
    this.renderer = new Renderer({
      board: document.getElementById('boardCanvas'),
      hold: document.getElementById('holdCanvas'),
      next: document.getElementById('nextCanvas'),
      hud,
      config: CONFIG
    });
    this.matchmaking = new MatchmakingUI({
      locale: this.locale,
      client: this.multiplayer,
      game: this.game,
      config: CONFIG
    });
    this.input = new InputManager(this.game, this.settingsStore);
    this.settingsUI = new SettingsUI(
      document.getElementById('settingsList'),
      this.settingsStore,
      this.locale,
      () => this.input.refreshBindings()
    );
    this.bindUI();
    this.setGameMode(initialMode);
    this.game.setCallbacks({
      finish: (summary) => this.showResults(summary)
    });
    this.lastFrame = performance.now();
    requestAnimationFrame((ts) => this.loop(ts));
  }
  setGameMode(mode) {
    const normalized = mode === 'multi' ? 'multi' : 'sprint';
    this.gameMode = normalized;
    if (window.__appInstance !== this) {
      window.__appInstance = this;
    }
    window.__appInstance.gameMode = normalized;
    if (this.game && typeof this.game.setMode === 'function') {
      this.game.setMode(normalized);
    }
    applyUIMode();
    if (normalized === 'sprint') {
      const g = window.__gameInstance;
      if (g && typeof g.renderOpponent === 'function') {
        g.renderOpponent(null);
      }
    }
  }
  startSprintRun() {
    this.setGameMode('sprint');
    const g = window.__gameInstance;
    if (g) {
      g.linesCleared = 0;
      g.pendingAttackToSend = 0;
      g.garbageQueue = 0;
      g.isRunning = true;
      g.isDead = false;
      g.bagIndex = 0;
    }
    this.game.startSprintRound();
  }
  startMultiplayerRoundFromServer(data) {
    this.setGameMode('multi');
    const g = window.__gameInstance;
    if (g) {
      if (data && Array.isArray(data.bag)) {
        g.sharedBag = data.bag.slice();
      }
      if (data && typeof data.bagVersion === 'number') {
        g.bagVersion = data.bagVersion;
      }
      g.bagIndex = 0;
      g.pendingAttackToSend = 0;
      g.garbageQueue = 0;
      g.isRunning = true;
      g.isDead = false;
      g.linesCleared = 0;
      g.totalPiecesPlaced = 0;
      g.inputsCount = 0;
      g.startTimestampMs = Date.now();
      g.matchFinished = false;
      g.oppPps = 0;
      g.oppApm = 0;
      const overlay = document.getElementById('postMatchOverlay');
      if (overlay) {
        overlay.classList.add('hidden');
      }
    }
    this.game.startMultiplayerRound();
  }
  bindUI() {
    const menuPlayBtn = document.getElementById('menuPlayBtn');
    const menuMatchBtn = document.getElementById('menuMatchBtn');
    const menuSettingsBtn = document.getElementById('menuSettingsBtn');
    const menuLoginBtn = document.getElementById('menuLoginBtn');
    const gameBackBtn = document.getElementById('gameBackBtn');
    const settingsBackBtn = document.getElementById('settingsBackBtn');
    const matchBackBtn = document.getElementById('matchBackBtn');
    const loginBackBtn = document.getElementById('loginBackBtn');
    const menuHint = document.getElementById('menuHint');

    menuPlayBtn.textContent = this.locale.t('menu.play40');
    menuMatchBtn.textContent = this.locale.t('menu.matchmaking');
    menuSettingsBtn.textContent = this.locale.t('menu.settings');
    menuLoginBtn.textContent = this.locale.t('menu.login');
    menuHint.textContent = this.locale.t('menu.hint');

    document.getElementById('settingsTitle').textContent = this.locale.t('settings.title');
    document.getElementById('settingsHint').textContent = this.locale.t('settings.hint');
    settingsBackBtn.textContent = this.locale.t('match.back');

    document.getElementById('matchTitle').textContent = this.locale.t('match.title');
    document.getElementById('matchDescription').textContent = this.locale.t('match.description');
    matchBackBtn.textContent = this.locale.t('match.back');

    document.getElementById('loginTitle').textContent = this.locale.t('login.title');
    document.getElementById('loginDescription').textContent = this.locale.t('login.description');
    loginBackBtn.textContent = this.locale.t('login.back');

    gameBackBtn.textContent = this.locale.t('game.back');

    menuPlayBtn.addEventListener('click', () => this.startFortyLines());
    menuMatchBtn.addEventListener('click', () => {
      this.matchmaking.refreshText();
      this.openScreen('matchScreen');
    });
    menuSettingsBtn.addEventListener('click', () => {
      this.settingsUI.refresh();
      this.openScreen('settingsScreen');
    });
    menuLoginBtn.addEventListener('click', () => {
      // TODO: авторизация по нику и синхронизация профиля через backend
      this.openScreen('loginScreen');
    });

    settingsBackBtn.addEventListener('click', () => this.openScreen('mainMenu'));
    matchBackBtn.addEventListener('click', () => {
      this.matchmaking.leaveRoom();
      this.openScreen('mainMenu');
    });
    loginBackBtn.addEventListener('click', () => this.openScreen('mainMenu'));
    gameBackBtn.addEventListener('click', () => this.openScreen('mainMenu'));

    document.getElementById('resultMenuBtn').textContent = this.locale.t('result.toMenu');
    document.getElementById('resultTitle').textContent = this.locale.t('result.title');
    document.getElementById('resultMenuBtn').addEventListener('click', () => {
      this.hideOverlay();
      this.openScreen('mainMenu');
    });
  }
  openScreen(id) {
    const element = document.getElementById(id);
    this.screenManager.show(element);
    this.currentScreenId = id;
    if (id !== 'gameScreen' && this.game.state === 'running') {
      this.game.finish('aborted');
      this.hideOverlay();
    }
    if (id === 'gameScreen') {
      this.hideOverlay();
    }
  }
  startFortyLines() {
    this.startSprintRun();
    this.openScreen('gameScreen');
  }
  showResults(summary) {
    if (this.gameMode === 'multi') {
      return;
    }
    const overlay = document.getElementById('resultOverlay');
    const resultStats = document.getElementById('resultStats');
    resultStats.innerHTML = `LINES: ${summary.lines}<br>TIME: ${formatTime(summary.time)}<br>APM: ${summary.apm.toFixed(2)}<br>PPS: ${summary.pps.toFixed(2)}`;
    overlay.classList.remove('hidden');
  }
  hideOverlay() {
    document.getElementById('resultOverlay').classList.add('hidden');
  }
  loop(timestamp) {
    const dt = (timestamp - this.lastFrame) / 1000;
    this.lastFrame = timestamp;
    this.input.update(dt);
    this.game.update(dt);
    this.renderer.render(this.game);
    this.matchmaking.renderLocal(this.game);
    requestAnimationFrame((ts) => this.loop(ts));
  }
}

new App();
})();
