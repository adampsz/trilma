import { Router } from "express";
import io from "../socket";
import Game from "../game/Game";
import type { Request, Response } from "express";

const router = Router();

router.get("/join", (req: Request, res: Response) => {
  if (!req.session.name) return res.redirect("/");
  res.render("join", { req, games: Game.waiting() });
});

router.post("/join", (req: Request, res: Response) => {
  if (typeof req.body.name !== "string") return res.redirect("/join");
  req.session.room = Game.create(io, req.body.name.slice(0, 16));
  res.redirect("/game");
});

router.get("/join/:id", (req: Request, res: Response) => {
  if (!Game.all.has(req.params.id)) return res.redirect("/join");
  req.session.room = req.params.id;
  res.redirect("/game");
});

router.get("/game", (req: Request, res: Response) => {
  const game = Game.all.get(req.session.room || "");
  if (!game) return res.redirect("/join");
  res.render("game", { req, game });
});

export default router;
