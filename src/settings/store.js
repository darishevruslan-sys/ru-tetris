export const DEFAULT_BINDINGS = {
  moveLeft: 'ArrowLeft',
  moveRight: 'ArrowRight',
  softDrop: 'ArrowDown',
  hardDrop: 'Space',
  rotateCW: 'KeyX',
  rotateCCW: 'KeyZ',
  rotate180: 'KeyA',
  hold: 'ShiftLeft'
};

export class SettingsStore {
  constructor(storageKey, defaults = DEFAULT_BINDINGS) {
    this.storageKey = storageKey;
    this.defaults = { ...defaults };
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
    return { ...this.defaults, ...this.data };
  }

  get(action) {
    const bindings = this.getBindings();
    return bindings[action] ?? null;
  }

  set(action, keyCode) {
    this.data[action] = keyCode;
    this.save();
  }

  getKeyForAction(action) {
    return this.get(action);
  }

  setBinding(action, keyCode) {
    this.set(action, keyCode);
  }
}
