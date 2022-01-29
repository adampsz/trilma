import { Server as Io } from 'socket.io';
import { session } from './express';
import Game from './game/Game';

import type { Request, Response } from 'express';
import type { Socket } from '@/server/types';

const io = new Io({
  serveClient: false,
});

io.use((socket, next) => {
  session(socket.request as Request, {} as Response, (err) => next(err));
});

io.on('connection', (socket: Socket) => {
  const req = socket.request;

  if (!req.session.room) return socket.disconnect();
  if (!Game.join(socket)) return socket.disconnect();
});

export default io;
