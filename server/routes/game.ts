import { Router } from "express";
import error from "http-errors";

import Game from "../game/Game";

import type { Request } from "express";

const router = Router();

router.get("/about", (req, res) => res.render("about"));

router.get("/join", (req, res, next) => {
  if (!req.session.name) return next(new error.Unauthorized());

  res.render("join", { req, games: Game.waiting() });
});

router.post("/join", (req: Request, res, next) => {
  if (typeof req.body.name !== "string" || req.body.name.length > 16)
    return next(new error.BadRequest());

  req.session.room = Game.create(req.body.name);
  res.redirect("/game");
});

router.get("/join/:id", (req, res, next) => {
  if (!Game.all.has(req.params.id)) return next(new error.NotFound());

  req.session.room = req.params.id;
  res.redirect("/game");
});

router.get("/game", (req, res, next) => {
  const game = Game.all.get(req.session.room || "");

  if (!game) return next(new error.NotFound());

  res.render("game", { req, game });
});

export default router;
