import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';

export default (container) => {
  const router = Router();

  const reportController = container.resolve('reportController');

  router.post('/', authMiddleware, reportController.create);
  router.get('/all', authMiddleware, reportController.getAll);
  router.get('/:id', authMiddleware, reportController.getById);
  router.put('/:id', authMiddleware, reportController.update);

  return router;
};
