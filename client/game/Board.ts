import Base, { CELL_NONE } from "@/common/Board";

import type { Board as Data, BoardAction, Vec2 } from "@/common/types";

const S3 = Math.sqrt(3) / 2;
const NS = "http://www.w3.org/2000/svg" as const;

const SCALE = 50;

export default class Board extends Base {
  root: Element;

  onPieceClick?: (xy: Vec2) => void;
  onDotClick?: (xy: Vec2) => void;

  constructor(root: Element, data: Data) {
    super();

    this.root = root;
    this.size = data.size;
    this.data = new Uint8Array(data.data);
    this.homes = new Uint8Array(data.homes);

    const scale = (this.size / 2 + 0.5) * (SCALE * S3);

    this.root.setAttribute(
      "viewBox",
      `${-scale} ${-scale} ${2 * scale} ${2 * scale}`
    );
    this.makeBoard();

    this.root.addEventListener("click", (e) => {
      const target = e.target as SVGElement;
      if (target.tagName !== "use") return;

      const [x, y] = (target.getAttribute("data-xy") as string)
        .split(",")
        .map(Number);

      const href = target.getAttribute("href") as string;
      if (href.includes("piece") && this.onPieceClick)
        this.onPieceClick([x, y]);
      if (href.includes("dot") && this.onDotClick) this.onDotClick([x, y]);
    });
  }

  intend(action: BoardAction): boolean {
    if (action.type === "jump" || action.type === "step") {
      const piece = this.root.querySelector(
        `.pieces [data-xy="${action.from[0]},${action.from[1]}"]`
      );
      if (!piece) return true;

      this.root.querySelector(".pieces")?.appendChild(piece);
      piece.getBoundingClientRect();

      const [gx, gy] = this.localToGlobal(action.to);
      piece?.setAttribute("x", `${gx}`);
      piece?.setAttribute("y", `${gy}`);
      return true;
    }

    return false;
  }

  commit(action: BoardAction) {
    super.commit(action);

    if (action.type === "init") {
      this.sync(this);
    }

    if (action.type === "jump" || action.type === "step") {
      const piece = this.root.querySelector(
        `.pieces [data-xy="${action.from[0]},${action.from[1]}"]`
      );
      const [gx, gy] = this.localToGlobal(action.to);

      piece?.setAttribute("data-xy", `${action.to[0]},${action.to[1]}`);
      piece?.setAttribute("x", `${gx}`);
      piece?.setAttribute("y", `${gy}`);
    }
  }

  hint(...xys: Vec2[]) {
    for (const hinted of this.root.querySelectorAll(".hinted"))
      hinted.classList.remove("hinted");

    for (const xy of xys) {
      const dot = this.root.querySelector(
        `.dots [data-xy="${xy[0]},${xy[1]}"]`
      );
      dot?.classList.add("hinted");
    }
  }

  select(xy: Vec2 | null) {
    this.root.querySelector(".selected")?.classList.remove("selected");
    if (!xy) return;

    const piece = this.root.querySelector(
      `.pieces [data-xy="${xy[0]},${xy[1]}"]`
    );
    piece?.classList.add("selected");
  }

  sync(data: Data) {
    this.data = new Uint8Array(data.data);
    this.homes = new Uint8Array(data.homes);

    const present = new Uint8Array(this.data.length);

    const pieces = this.root.querySelector(".pieces");
    if (!pieces) return;

    for (const piece of this.root.querySelectorAll(".pieces [data-xy]")) {
      const xy = piece.getAttribute("data-xy") as string;
      const [x, y] = xy.split(",").map(Number);
      const i = y * this.size + x;

      if (!Board.isPiece(this.data[i])) {
        piece.parentElement?.removeChild(piece);
        continue;
      }

      present[i] = 1;

      const [gx, gy] = this.localToGlobal([x, y]);
      piece.setAttribute("x", `${gx}`);
      piece.setAttribute("y", `${gy}`);
      piece.setAttribute("data-color", `${this.data[i]}`);
    }

    for (let i = 0; i < this.data.length; i++) {
      const [x, y] = [i % this.size, Math.floor(i / this.size)];

      const dot = this.root.querySelector(`.dots [data-xy="${x},${y}"]`);
      if (!dot) continue;

      if (this.homes[i] === CELL_NONE) dot.removeAttribute("data-color");
      else dot.setAttribute("data-color", `${this.homes[i]}`);

      if (!present[i] && Board.isPiece(this.data[i]))
        pieces.appendChild(this.makePiece(x, y, this.data[i]));
    }
  }

  private localToGlobal([x, y]: Vec2): Vec2 {
    [x, y] = [x - (this.size - 1) / 2, y - (this.size - 1) / 2];
    [x, y] = [x - y / 2, y * S3];

    return [x * SCALE, y * SCALE];
  }

  private makeBoard() {
    const W = this.size;
    const data = this.data;
    const homes = this.homes;

    const path = this.root.querySelector(".outline");
    const dots = this.root.querySelector(".dots");
    const pieces = this.root.querySelector(".pieces");

    if (!path || !dots || !pieces) return;

    let d = "";

    const segment = (a: Vec2, b: Vec2) => {
      const [gx1, gy1] = this.localToGlobal(a);
      const [gx2, gy2] = this.localToGlobal(b);

      d += `M${gx1},${gy1}L${gx2},${gy2}`;
    };

    for (let y = 0; y < W; y++)
      for (let x = 0; x < W; x++)
        for (let i = 0; x + i < W; i++)
          if (data[y * W + x + i] === CELL_NONE) {
            i > 1 && segment([x, y], [x + i - 1, y]);
            x += i;
            break;
          }

    for (let x = 0; x < W; x++)
      for (let y = 0; y < W; y++)
        for (let i = 0; y + i < W; i++)
          if (data[(y + i) * W + x] === CELL_NONE) {
            i > 1 && segment([x, y], [x, y + i - 1]);
            y += i;
            break;
          }

    for (let x = -W + 1; x < W; x++)
      for (let y = Math.max(-x, 0); x + y < W; y++)
        for (let i = 0; x + y + i < W; i++)
          if (data[(y + i) * W + x + y + i] === CELL_NONE) {
            i > 1 && segment([x + y, y], [x + y + i - 1, y + i - 1]);
            y += i;
            break;
          }

    for (let i = 0; i < homes.length; i++) {
      if (homes[i] === CELL_NONE) continue;

      const [x, y] = [Math.floor(i % W), Math.floor(i / W)];
      const [gx, gy] = this.localToGlobal([x, y]);

      const dot = document.createElementNS(NS, "use");
      dot.setAttribute("href", "#dot");
      dot.setAttribute("x", `${gx}`);
      dot.setAttribute("y", `${gy}`);
      dot.setAttribute("data-xy", `${x},${y}`);
      dots.appendChild(dot);

      if (data[i] !== 0) pieces.appendChild(this.makePiece(x, y, data[i]));
      if (homes[i] !== 0) dot.setAttribute("data-color", `${homes[i]}`);
    }

    path.setAttribute("d", d);
  }

  private makePiece(x: number, y: number, color: number) {
    const [gx, gy] = this.localToGlobal([x, y]);

    const piece = document.createElementNS(NS, "use");
    piece.setAttribute("href", "#piece");
    piece.setAttribute("x", `${gx}`);
    piece.setAttribute("y", `${gy}`);
    piece.setAttribute("data-color", `${color}`);
    piece.setAttribute("data-xy", `${x},${y}`);

    return piece;
  }
}
