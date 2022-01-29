import { Router } from 'express';
import io from '../socket';
import Game from '../game/Game';

const router = Router();

router.get('/join', (req, res) => {
  if (!req.session.name) return res.redirect('/');
  res.render('join', { req, games: Game.waiting() });
});

router.post('/join', (req, res) => {
  if (!req.body.name) return res.redirect('/join');
  req.session.room = Game.create(io, req.body.name);
  res.redirect('/game');
});

router.get('/join/:id', (req, res) => {
  if (!Game.all.has(req.params.id)) return res.redirect('/join');
  req.session.room = req.params.id;
  res.redirect('/game');
});

router.get('/game', (req, res) => {
  const game = Game.all.get(req.session.room || '');
  if (!game) return res.redirect('/join');
  res.render('game', { req, game });
});

export default router;
