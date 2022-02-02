import "dotenv/config";

import express, { urlencoded, static as serve } from "express";
import { Server as Sockets } from "socket.io";

import path from "path";

import morgan from "morgan";
import helmet from "helmet";
import session from "express-session";
import compression from "compression";

import type { Request, Response, RequestHandler, NextFunction } from "express";
import type { Io } from "./types";

// Initialization

export const app = express();
export const io: Io = new Sockets({ serveClient: false });

use(morgan(process.env.NODE_ENV === "development" ? "dev" : "common"));

use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SECRET ?? "",
  })
);

// Express.js

app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));

app.use(urlencoded({ extended: false }));
app.use("/static", serve(path.join(__dirname, "../client")));

// Utilities

function use(fn: RequestHandler) {
  app.use(fn);

  io.use((socket, next) =>
    fn(socket.request as Request, {} as Response, next as NextFunction)
  );
}
