import { SPAWN_POS, TETROMINO_SHAPES } from './constants.js';

export class Tetromino {
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
