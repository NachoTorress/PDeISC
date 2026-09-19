import { Router } from 'express';
import { destroy, index, show, store, update } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

export const userRoutes = Router();

userRoutes.use(protect);
userRoutes.get('/', index);
userRoutes.get('/:id', show);
userRoutes.post('/', store);
userRoutes.put('/:id', update);
userRoutes.delete('/:id', destroy);

