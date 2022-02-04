import http from "http";
import path from "path";
import error from "http-errors";

import { app, io } from "./bootstrap";

import Game from "./game/Game";
import user from "./routes/user";
import game from "./routes/game";

import type { ErrorRequestHandler } from "express";
import type { Socket } from "./types";

// Express.js

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../views"));

app.use(user);
app.use(game);

app.use((req, res, next) => next(new error.NotFound()));

app.use(((e: unknown, req, res, _next) => {
  const msg = e instanceof Error ? e : String(e);
  const err = e instanceof error.HttpError ? e : error(msg);
  res.status(err.status);
  res.render("error", { err, req, res });
}) as ErrorRequestHandler);

// Socket.io

io.on("connection", (socket: Socket) => {
  const req = socket.request;

  if (!req.session.room) return socket.disconnect();
  if (!Game.join(socket)) return socket.disconnect();
});

// Startup

const server = http.createServer();
server.on("request", app);
io.attach(server);

server.listen(process.env.PORT ?? 3000, () => {
  console.debug(`Listening on http://localhost:${process.env.port ?? 3000}`);
});
