import { Router } from "express";
import error from "http-errors";
import Game from "../game/Game";
import type { Request, Response } from "express";

const router = Router();

router.get("/join", (req: Request, res: Response, next) => {
  if (!req.session.name) return next(new error.Unauthorized());

  res.render("join", { req, games: Game.waiting() });
});

router.post("/join", (req: Request, res: Response, next) => {
  if (typeof req.body.name !== "string" || req.body.name.length > 16)
    return next(new error.BadRequest());

  req.session.room = Game.create(req.body.name);
  res.redirect("/game");
});

router.get("/join/:id", (req: Request, res: Response, next) => {
  if (!Game.all.has(req.params.id)) return next(new error.NotFound());

  req.session.room = req.params.id;
  res.redirect("/game");
});

router.get("/game", (req: Request, res: Response, next) => {
  const game = Game.all.get(req.session.room || "");

  if (!game) return next(new error.NotFound());

  res.render("game", { req, game });
});

export default router;
