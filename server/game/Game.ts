import { sync as uid } from 'uid-safe';
import Base from '@/common/Game';
import Board from './Board';

import type { Game as Data, Action } from '@/common/types';
import type { Io, Socket } from '@/server/types';

const FLUSH_INTERVAL = process.env.NODE_ENV === 'development' ? 10 * 1000 : 2 * 60 * 1000;

setInterval(() => Game.flush(), FLUSH_INTERVAL);

export default class Game extends Base {
  io: Io;
  id: string;
  name: string;

  board: Board;

  static all = new Map<string, Game>();

  constructor(io: Io, name: string) {
    super();

    this.io = io;
    this.id = uid(24);
    this.name = name;

    this.board = new Board();
  }

  static waiting() {
    return [...this.all.values()].filter((game) => game.state.type === 'waiting' && game.players.all.length < 6);
  }

  static create(io: Io, name: string) {
    const game = new this(io, name);
    this.all.set(game.id, game);
    return game.id;
  }

  static join(socket: Socket) {
    const req = socket.request;
    if (!req.session.name || !req.session.room) return false;

    const game = this.all.get(req.session.room);
    if (!game) return false;

    return game.join(socket);
  }

  static flush() {
    const stale = new Set<string>();

    for (const [id, game] of this.all) {
      for (const player of game.players.all)
        if (player.disconnected && player.disconnected.getTime() + FLUSH_INTERVAL < Date.now())
          game.commit({ type: 'leave', player: player.id });

      if (game.state.type === 'finished' || game.players.all.length === 0) stale.add(id);
    }

    for (const id of stale) this.all.delete(id);
  }

  join(socket: Socket) {
    const req = socket.request;
    if (!req.session.name) return false;

    const action: Action = {
      type: 'join',
      player: { id: req.session.id, name: req.session.name, color: 0, active: true, finished: 0, disconnected: null },
    };

    if (!this.verify(action)) return false;

    this.commit(action);

    socket.emit('game:init', req.session.id, this.toJSON());
    socket.join(this.id);

    this.joined(socket);

    return true;
  }

  private joined(socket: Socket) {
    const id = socket.request.session.id;

    socket.on('player:action', (action) => {
      if (!('player' in action) || action.player !== id) return;
      if (!this.verify(action)) return;
      return this.commit(action);
    });

    socket.on('disconnect', () => {
      const action: Action = { type: 'disconnect', player: id };
      this.verify(action) && this.commit(action);
    });
  }

  try_init() {
    const players = this.players.all.map((p) => p.id).sort(() => Math.random() - 0.5);
    const colors = [...this.board.colors()].sort(() => Math.random() - 0.5).slice(0, players.length);
    const action: Action = { type: 'init', colors, players };
    this.verify(action) && this.commit(action);
  }

  verify(a: Action) {
    if (!super.verify(a)) return false;

    if (a.type === 'init') return [2, 3, 4, 6].includes(this.players.all.length);
    if (a.type === 'join') return !!this.player(a.player.id) || this.players.all.length < 6;

    return true;
  }

  commit(a: Action) {
    super.commit(a);
    this.io.to(this.id).emit('game:action', a);

    if (a.type === 'ready') this.try_init();
  }

  toJSON(): Data {
    return {
      state: this.state,
      players: this.players,
      board: this.board.toJSON(),
    };
  }
}

Game.all.delete = function (...args) {
  debugger;
  return Map.prototype.delete.call(this, ...args);
};
