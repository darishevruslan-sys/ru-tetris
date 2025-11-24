export const i18n = {
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

export class Localization {
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
