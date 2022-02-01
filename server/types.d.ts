import { Session, SessionData } from "express-session";
import { Socket as SocketBase, Server as ServerBase } from "socket.io";
import { ClientEvents, ServerEvents } from "@/common/types";

export type Io = ServerBase<ClientEvents, ServerEvents>;
export type Socket = SocketBase<ClientEvents, ServerEvents>;

declare module "express" {
  interface Request {
    body: Record<string, unknown>;
  }
}

declare module "express-session" {
  interface SessionData {
    name: string;
    room: ?string;
  }
}

declare module "http" {
  interface IncomingMessage {
    session: Session & Partial<SessionData>;
  }
}
