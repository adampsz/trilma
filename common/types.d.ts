type Id<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;
type Tagged<T> = { [K in keyof T]: Id<{ type: K } & T[K]> }[keyof T];

export type Vec2 = [number, number];

export interface Player {
  id: string;
  name: string;
  color: number;
  active: boolean;
  finished: number;
  disconnected: Date | null;
}

export interface Players {
  all: Player[];
}

export interface Board {
  size: number;
  data: Uint8Array;
  homes: Uint8Array;
}

export type State = Tagged<{
  waiting: { ready: string[] };
  select: { player: string };
  selected: { player: string; piece: [number, number] };
  jumped: { player: string; piece: [number, number] };
  stepped: { player: string };
  finished: {};
}>;

export interface Game {
  state: State;
  board: Board;
  players: Players;
}

export type Action = Tagged<{
  join: { player: Player };
  ready: { player: string };
  leave: { player: string };
  disconnect: { player: string };

  init: { players: string[]; colors: number[] };
  select: { player: string; piece: Vec2 };
  step: { player: string; to: Vec2 };
  jump: { player: string; to: Vec2 };
  next: { player: string };
}>;

export type BoardAction = Tagged<{
  init: { colors: number[] };
  step: { color: number; from: Vec2; to: Vec2 };
  jump: { color: number; from: Vec2; to: vec2 };
}>;

export interface ServerEvents {
  'game:init': (player: string, data: Game) => void;
  'game:sync': (data: Game) => void;
  'game:action': (action: Action) => void;
}

export interface ClientEvents {
  'player:action': (action: Action) => void;
}
