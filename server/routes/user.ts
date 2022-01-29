import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  if (req.session.name) return res.redirect('/join');
  res.render('login', { req });
});

router.post('/', (req, res) => {
  req.session.name = req.body.name;
  res.redirect('/');
});

export default router;
