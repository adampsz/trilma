import { Socket as SocketBase, Server as ServerBase } from 'socket.io';
import { Session, SessionData } from 'express-session';
import { ClientEvents, ServerEvents } from '@/common/types';

declare module 'express-session' {
  interface SessionData {
    name: string;
    room: ?string;
  }
}

declare module 'http' {
  interface IncomingMessage {
    session: Session & Partial<SessionData>;
  }
}

export type Io = ServerBase<ClientEvents, ServerEvents>;
export type Socket = SocketBase<ClientEvents, ServerEvents>;
