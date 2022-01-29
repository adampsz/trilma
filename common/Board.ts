import type { Board as Data, BoardAction, Vec2 } from './types';

export const STEPS: Vec2[] = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
];

export const CELL_EMPTY = 0;
export const CELL_NONE = 255;

export default class Board implements Data {
  size: number;
  data: Uint8Array;
  homes: Uint8Array;

  constructor() {
    this.data = new Uint8Array([CELL_NONE]);
    this.homes = new Uint8Array([CELL_NONE]);
    this.size = 1;
  }

  static isPiece(x: number) {
    return x !== CELL_EMPTY && x !== CELL_NONE;
  }

  contains([x, y]: Vec2) {
    return 0 <= x && x < this.size && 0 <= y && y < this.size;
  }

  get([x, y]: Vec2) {
    return this.contains([x, y]) ? this.data[y * this.size + x] : CELL_NONE;
  }

  set([x, y]: Vec2, color: number) {
    if (this.contains([x, y])) this.data[y * this.size + x] = color;
  }

  verify(a: BoardAction): boolean {
    if (a.type === 'init') return true;

    if (a.type === 'step') {
      if (this.get(a.from) !== a.color || this.get(a.to) !== CELL_EMPTY) return false;
      for (const [dx, dy] of STEPS) if (a.from[0] + dx === a.to[0] && a.from[1] + dy === a.to[1]) return true;
      return false;
    }

    if (a.type === 'jump') {
      if (this.get(a.from) !== a.color || this.get(a.to) !== CELL_EMPTY) return false;

      for (const [dx, dy] of STEPS)
        if (a.from[0] + 2 * dx === a.to[0] && a.from[1] + 2 * dy === a.to[1])
          return Board.isPiece(this.get([a.from[0] + dx, a.from[1] + dy]));

      return false;
    }

    return false;
  }

  commit(a: BoardAction) {
    if (a.type === 'init') {
      const colors = this.colors();
      const map = new Array(colors.length).fill(CELL_EMPTY);
      a.colors.forEach((c, i) => (map[Math.floor((i / a.colors.length) * map.length)] = c));

      for (let i = 0; i < this.data.length; i++) {
        if (Board.isPiece(this.data[i])) {
          this.data[i] = map[colors.indexOf(this.data[i])];
          this.homes[i] = map[(colors.indexOf(this.homes[i]) + Math.floor(map.length / 2)) % map.length];
        }
      }
    }

    if (a.type === 'step' || a.type === 'jump') {
      this.set(a.from, CELL_EMPTY);
      this.set(a.to, a.color);
    }
  }

  colors() {
    const colors = new Set(this.data);
    colors.delete(CELL_NONE);
    colors.delete(CELL_EMPTY);
    return [...colors].sort((a, b) => a - b);
  }

  steps(color: number, from?: Vec2): [Vec2, Vec2][] {
    if (!from) {
      return new Array(this.data.length)
        .fill(0)
        .flatMap((_, i) => this.steps(color, [Math.floor(i / this.size), i % this.size]));
    }

    if (this.get(from) !== color) return [];

    const all: [Vec2, Vec2][] = [];

    for (const [dx, dy] of STEPS)
      if (this.get([from[0] + dx, from[1] + dy]) === CELL_EMPTY) {
        all.push([from, [from[0] + dx, from[1] + dy]]);
      }

    return all;
  }

  jumps(color: number, from?: Vec2): [Vec2, Vec2][] {
    if (!from) {
      return new Array(this.data.length)
        .fill(0)
        .flatMap((_, i) => this.jumps(color, [Math.floor(i / this.size), i % this.size]));
    }

    if (this.get(from) !== color) return [];

    const all: [Vec2, Vec2][] = [];

    for (const [dx, dy] of STEPS)
      if (
        this.get([from[0] + 2 * dx, from[1] + 2 * dy]) === CELL_EMPTY &&
        Board.isPiece(this.get([from[0] + dx, from[1] + dy]))
      ) {
        all.push([from, [from[0] + 2 * dx, from[1] + 2 * dy]]);
      }

    return all;
  }

  winners() {
    const FILLED: boolean[] = [];
    const TARGET: boolean[] = [];

    const homes = this.homes;

    for (let i = 0; i < homes.length; i++) {
      if (homes[i] === CELL_EMPTY || homes[i] === CELL_NONE) continue;

      FILLED[homes[i]] ??= true;
      FILLED[homes[i]] &&= Board.isPiece(this.data[i]);
      TARGET[homes[i]] ||= this.data[i] === homes[i];
    }

    const winners = new Set<number>();
    for (let i = 0; i < FILLED.length; i++) if (FILLED[i] && TARGET[i]) winners.add(i);
    return winners;
  }
}
