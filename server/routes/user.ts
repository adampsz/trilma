import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

router.get("/", (req, res) => {
  if (req.session.name) return res.redirect("/join");
  res.render("login", { req });
});

router.post("/", (req: Request, res: Response) => {
  if (typeof req.body.name === "string")
    req.session.name = req.body.name.slice(0, 16);
  res.redirect("/");
});

export default router;
