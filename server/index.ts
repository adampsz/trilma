import http from "http";
import path from "path";

import { app, io } from "./bootstrap";

import Game from "./game/Game";
import user from "./routes/user";
import game from "./routes/game";

import type { Socket } from "./types";

// Express.js

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../views"));

app.use("/", user);
app.use("/", game);

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
  console.log(`Listening on http://localhost:${process.env.port ?? 3000}`);
});
