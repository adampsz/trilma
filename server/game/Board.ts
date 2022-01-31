import Base, { CELL_NONE } from '@/common/Board';
import type { Board as Data } from '@/common/types';

const NORMAL = `
    1
    11
    111
    1111
6666.....2222
 666......222
  66.......22
   6........2
    .........
    5........3
    55.......33
    555......333
    5555.....3333
         4444
          444
           44
            4
`;

const MEDIUM = `
   1
   11
   111
666....222
 66.....22
  6......2
   .......
   5......3
   55.....33
   555....333
       444
        44
         4
`;

const MINI = `
  1
  11
66...22
 6....2
  .....
  5....3
  55...33
     44
      4
`;

export default class Board extends Base {
  constructor(tpl = NORMAL) {
    super();

    const lines = tpl.split('\n').filter((l) => l);

    this.size = lines.reduce((len, line) => Math.max(len, line.length), 0) + 2;

    this.data = new Uint8Array(this.size * this.size);
    this.data.fill(CELL_NONE);

    for (const [y, line] of lines.entries())
      for (const [x, c] of line.split('').entries()) {
        const i = '.123456'.indexOf(c);
        this.set([x + 1, y + 1], i < 0 ? CELL_NONE : i);
      }

    this.homes = this.data.slice();
  }

  toJSON(): Data {
    return { size: this.size, data: new Uint8Array(this.data), homes: new Uint8Array(this.homes) };
  }
}
