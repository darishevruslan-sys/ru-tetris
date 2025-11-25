export class Board {
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
