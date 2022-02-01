import express from "express";
import path from "path";

import initLogger from "morgan";
import initSession from "express-session";
import { urlencoded as initBodyParser } from "body-parser";
import { sync as uid } from "uid-safe";

import user from "./routes/user";
import game from "./routes/game";

const app = express();

// Middleware'y

export const logger = initLogger(
  process.env.NODE_ENV === "development" ? "dev" : "common"
);

export const bodyParser = initBodyParser({ extended: false });

export const session = initSession({
  resave: false,
  saveUninitialized: false,
  secret: process.env.SECRET ?? "",
  genid: () => uid(24),
});

app.use(logger);
app.use(bodyParser);
app.use(session);

// Widoki
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../views"));

// Serwowanie plików statycznych
app.use("/static", express.static(path.join(__dirname, "../client")));

// Ścieżki
app.use("/", user);
app.use("/", game);

export default app;
