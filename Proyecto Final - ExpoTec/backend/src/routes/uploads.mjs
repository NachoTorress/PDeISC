import { Router } from 'express';
import { requireSession, rateLimit } from '../middleware/auth.mjs';
import { createUploadsService } from '../services/uploads.mjs';

export function uploadsRoutes(repository, authRepository, authService, config, storage) {
  const router = Router(), service = createUploadsService(repository, config, storage);
  router.get('/:id/image', async (req, res) => {
    const image = await service.publicImage(req.params.id);
    res.set({ 'Content-Type': 'image/jpeg', 'Content-Disposition': 'inline; filename="expotec.jpg"', 'Cross-Origin-Resource-Policy': 'cross-origin', 'Cache-Control': 'no-store' });
    res.send(image);
  });
  router.use(requireSession(authService));
  router.post('/prepare', rateLimit(authRepository, config, { scope: 'image-upload', limit: 20, seconds: 3600, byUser: true }), async (req, res) => {
    res.status(201).json(await service.prepare(req.body, req.auth.user));
  });
  router.post('/complete', rateLimit(authRepository, config, { scope: 'image-complete', limit: 40, seconds: 3600, byUser: true }), async (req, res) => {
    res.json(await service.complete(req.body, req.auth.user));
  });
  router.post('/preview', rateLimit(authRepository, config, { scope: 'image-preview', limit: 200, seconds: 900, byUser: true }), async (req, res) => {
    res.json(await service.preview(req.body, req.auth.user));
  });
  return router;
}
