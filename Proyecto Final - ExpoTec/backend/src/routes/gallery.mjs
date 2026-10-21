import { Router } from 'express';
import { requireSession, requireAdmin, rateLimit } from '../middleware/auth.mjs';
import { userId } from '../validators/auth.mjs';
import { galleryQuery, galleryPhoto, galleryReview } from '../validators/gallery.mjs';

export function galleryRoutes(repository, authRepository, service, config) {
  const router = Router();
  router.post('/public/query', async (req, res) => {
    res.json({ photos: await repository.publicList(galleryQuery(req.body)) });
  });
  router.use(requireSession(service));
  router.post('/mine/query', async (req, res) => {
    res.json({ photos: await repository.mine(galleryQuery(req.body), req.auth.user.id) });
  });
  router.post('/submit', rateLimit(authRepository, config, { scope: 'gallery-submit', limit: 10, seconds: 3600, byUser: true }), async (req, res) => {
    res.status(201).json({ photo: await repository.submit(galleryPhoto(req.body), req.auth.user.id) });
  });
  router.use(requireAdmin);
  router.post('/moderation/query', async (req, res) => {
    res.json({ photos: await repository.moderation(galleryQuery(req.body, true)) });
  });
  router.post('/:id/review', rateLimit(authRepository, config, { scope: 'gallery-review', limit: 120, seconds: 900, byUser: true }), async (req, res) => {
    res.json({ photo: await repository.review(userId(req.params.id), galleryReview(req.body), req.auth.user.id) });
  });
  return router;
}
