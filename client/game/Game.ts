import Board from "./Board";
import Players from "./Players";
import Base from "@/common/Game";

import type { Socket } from "@/client/types";
import type { Game as Data, Action } from "@/common/types";
import { assume } from "@/common/utils";

export default class Game extends Base {
  id: string;
  socket: Socket;
  root: Element;

  board: Board;
  players: Players;

  constructor(socket: Socket, id: string, data: Data) {
    super();

    this.root = document.querySelector("#game") as Element;
    this.id = id;
    this.socket = socket;

    this.state = data.state;

    const players = this.root.querySelector(".players") as Element;
    const board = this.root.querySelector(".board") as Element;

    this.players = new Players(players, data.players);
    this.board = new Board(board, data.board);

    this.socket.on("game:sync", (data) => this.sync(data));
    this.socket.on("game:action", (action) => this.commit(action));

    this.board.onPieceClick = (xy) => {
      this.intend({ type: "select", player: this.id, piece: xy });
    };

    this.board.onDotClick = (xy) => {
      this.intend({ type: "step", player: this.id, to: xy }) ||
        this.intend({ type: "jump", player: this.id, to: xy });
    };

    this.root
      .querySelector('button[name="ready"]')
      ?.addEventListener("click", () => {
        this.intend({ type: "ready", player: this.id });
      });

    this.root
      .querySelector('button[name="next"]')
      ?.addEventListener("click", () => {
        this.intend({ type: "next", player: this.id });
      });

    if (process.env.NODE_ENV === "development")
      this.socket.onAny(console.debug);

    document.onkeydown = (e) => {
      if (e.key === " " || e.key === "Enter")
        this.intend({ type: "next", player: this.id });
    };

    this.update();
  }

  intend(a: Action): boolean {
    if (!this.verify(a)) return false;
    this.socket.emit("player:action", a);

    if (a.type === "select") {
      this.board.select(a.piece);
      return true;
    }

    if (a.type === "jump" || a.type === "step") {
      assume(this.state.type === "selected" || this.state.type === "jumped");
      const color = this.player(this.id)?.color;
      return (
        !!color && this.board.intend({ ...a, color, from: this.state.piece })
      );
    }

    return false;
  }

  commit(a: Action) {
    super.commit(a);
    this.update();
  }

  sync(data: Data) {
    this.state = data.state;
    this.players.sync(data.players);
    this.board.sync(data.board);
    this.update();
  }

  update() {
    this.players.sync({ all: this.players.all.slice() });
    this.players.active("player" in this.state ? this.state.player : null);

    const ready = this.root.querySelector('[name="ready"]');
    if (this.state.type !== "waiting" || this.state.ready.includes(this.id))
      ready?.setAttribute("hidden", "true");
    else ready?.removeAttribute("hidden");

    const next = this.root.querySelector('[name="next"]');
    if ("player" in this.state && this.state.player === this.id)
      next?.removeAttribute("hidden");
    else next?.setAttribute("hidden", "true");

    const finish = this.root.querySelector('[name="finish"]');
    if (this.state.type === "finished") finish?.removeAttribute("hidden");
    else finish?.setAttribute("hidden", "true");

    if (
      !("player" in this.state) ||
      this.state.player !== this.id ||
      this.state.type === "stepped"
    ) {
      this.board.select(null);
      this.board.hint();
      return;
    }

    const color = this.player(this.id)?.color;
    if (!color) return;

    if (this.state.type === "select") {
      this.board.select(null);
      const moves = [...this.board.steps(color), ...this.board.jumps(color)];
      this.board.hint(...moves.map(([from]) => from));
    }

    if (this.state.type === "selected") {
      this.board.select(this.state.piece);
      const moves = [
        ...this.board.steps(color, this.state.piece),
        ...this.board.jumps(color, this.state.piece),
      ];
      this.board.hint(...moves.map(([, to]) => to));
    }

    if (this.state.type === "jumped") {
      this.board.select(this.state.piece);
      const moves = [...this.board.jumps(color, this.state.piece)];
      this.board.hint(...moves.map(([, to]) => to));
    }
  }
}
