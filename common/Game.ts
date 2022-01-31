import Board from './Board';
import { assume, unreachable } from './utils';
import type { Game as Data, Action, Players, Player, State } from './types';

export default class Game implements Data {
  state: State;
  board: Board;
  players: Players;

  constructor() {
    this.state = { type: 'waiting', ready: [] };
    this.players = { all: [] };
    this.board = new Board();
  }

  verify(a: Action): boolean {
    const t = a.type;

    switch (t) {
      case 'join':
        return this.state.type === 'waiting' || this.players.all.some((p) => p.id === a.player.id);

      case 'ready':
        return this.state.type === 'waiting' && !!this.player(a.player) && !this.state.ready.includes(a.player);

      case 'leave':
        return true;

      case 'disconnect':
        return !!this.player(a.player);

      case 'init':
        return (
          this.state.type === 'waiting' &&
          this.players.all.length >= 1 &&
          this.players.all.every(({ id }) => a.players.includes(id)) &&
          a.players.every((id) => this.player(id)) &&
          new Set(this.state.ready).size === this.players.all.length
        );

      case 'next':
        if (
          this.state.type !== 'select' &&
          this.state.type !== 'selected' &&
          this.state.type !== 'stepped' &&
          this.state.type !== 'jumped'
        ) {
          return false;
        } else {
          return this.state.player === a.player;
        }

      case 'select': {
        if (this.state.type !== 'select' && this.state.type !== 'selected') return false;
        if (this.state.player !== a.player) return false;
        const color = this.player(a.player)?.color;
        return color === this.board.get(a.piece);
      }

      case 'step': {
        if (this.state.type !== 'selected') return false;
        if (this.state.player !== a.player) return false;
        const color = this.player(a.player)?.color;
        return !!color && this.board.verify({ ...a, color, from: this.state.piece });
      }

      case 'jump': {
        if (this.state.type !== 'selected' && this.state.type !== 'jumped') return false;
        if (this.state.player !== a.player) return false;
        const color = this.player(a.player)?.color;
        return !!color && this.board.verify({ ...a, color, from: this.state.piece });
      }

      default:
        unreachable(t);
    }
  }

  commit(a: Action): void {
    const t = a.type;

    switch (t) {
      case 'join': {
        const player = this.player(a.player.id) || this.players.all[this.players.all.push(a.player) - 1];

        player.name = a.player.name;
        player.active = this.state.type != 'waiting' || this.state.ready.includes(player.id);
        player.disconnected = null;

        break;
      }

      case 'ready':
        assume(this.state.type === 'waiting');
        this.state.ready.push(a.player);
        this.player(a.player)!.active = true;
        break;

      case 'leave':
        this.players.all = this.players.all.filter((p) => p.id !== a.player);
        break;

      case 'disconnect':
        const player = this.player(a.player)!;
        player.active = false;
        player.disconnected = new Date();
        break;

      case 'init':
        assume(this.state.type === 'waiting');

        const players = a.players.map((id, i) => ({
          ...this.player(id)!,
          color: a.colors[i],
        }));

        this.players.all = players;

        this.board.commit(a);
        this.state = { type: 'select', player: this.players.all[0].id };

        break;

      case 'next': {
        assume(
          this.state.type === 'select' ||
            this.state.type === 'selected' ||
            this.state.type === 'stepped' ||
            this.state.type === 'jumped'
        );

        const player = this.player(this.state.player)!;
        const winners = this.board.winners();

        if (winners.has(player.color)) {
          const place = Math.max(...this.players.all.map((p) => p.finished)) + 1;
          player.finished = place;
        }

        if (winners.size === this.players.all.length - 1) {
          for (const player of this.players.all) player.finished ||= this.players.all.length;
        }

        const players = this.players.all.filter((p) => p.finished === 0);
        const next = players[(players.indexOf(player) + 1) % players.length];

        this.state = next ? { type: 'select', player: next.id } : { type: 'finished' };

        break;
      }

      case 'select':
        this.state = { type: 'selected', player: a.player, piece: a.piece };
        break;

      case 'step': {
        assume(this.state.type === 'selected');

        const color = this.player(a.player)!.color;
        this.board.commit({ ...a, color, from: this.state.piece });
        this.state = { type: 'stepped', player: a.player };

        break;
      }

      case 'jump': {
        assume(this.state.type === 'selected' || this.state.type === 'jumped');

        const color = this.player(a.player)!.color;
        this.board.commit({ ...a, color, from: this.state.piece });
        this.state = { type: 'jumped', player: a.player, piece: a.to };

        break;
      }

      default:
        unreachable(t);
    }
  }

  player(id: string) {
    return this.players.all.find((p) => p.id === id);
  }
}
