import { Players as Data, Player } from '@/common/types';

export default class Players implements Data {
  root: HTMLElement;
  all: Player[];

  constructor(root: HTMLElement, data: Data) {
    this.root = root;
    this.all = data.all;
    this.sync(data);
  }

  sync(data: Data) {
    for (const li of [...this.root.children]) {
      const id = li.getAttribute('data-player');
      if (!data.all.some((p) => p.id == id)) this.root.removeChild(li);
    }

    data.all.forEach((data, i) => {
      const li = this.root.querySelector(`[data-player="${data.id}"]`) || this.makePlayer();
      if (this.root.children[i] != li) this.root.insertBefore(li, this.root.children[i]);

      const name = li.querySelector('.name')!;
      const color = li.querySelector('.color')!;

      li.setAttribute('data-player', `${data.id}`);

      name.textContent = data.name;
      color.innerHTML = data.finished > 0 ? `${data.finished}` : '';

      data.color ? color.setAttribute('data-color', `${data.color}`) : color.removeAttribute('data-color');
      data.active ? li.classList.remove('offline') : li.classList.add('offline');
    });

    this.all = data.all;
  }

  active(player: string | null) {
    for (const active of this.root.querySelectorAll('.active')) active.classList.remove('active');

    const active = this.root.querySelector(`[data-player="${player}"]`);
    if (active) active.classList.add('active');
  }

  private makePlayer() {
    const li = document.createElement('li');
    li.innerHTML = `<span class="color"></span><span class="name"></span>`;
    return li;
  }
}
