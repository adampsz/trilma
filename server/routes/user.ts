import { Router } from "express";
import error from "http-errors";
import type { Request, Response } from "express";

const router = Router();

router.get("/", (req, res) => {
  if (req.session.name) return res.redirect("/join");
  res.render("login", { req });
});

router.post("/", (req: Request, res: Response, next) => {
  if (typeof req.body.name !== "string" || req.body.name.length > 16)
    return next(new error.BadRequest());

  req.session.name = req.body.name;
  req.session.save(() => res.redirect("/"));
});

export default router;
