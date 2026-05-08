import { Router } from 'express';
import authMiddleware from "../middlewares/authMiddleware.js";

export default (container) => {
  const router = Router();

  const indicatorDefinitionController = container.resolve("indicatorDefinitionController");

  router.post('/', authMiddleware, indicatorDefinitionController.create);
  router.get('/all', authMiddleware, indicatorDefinitionController.getAll);
  router.post('/departments', authMiddleware, indicatorDefinitionController.getByDepartments);
  router.get('/:id', authMiddleware, indicatorDefinitionController.getById);
  router.put('/:id', authMiddleware, indicatorDefinitionController.update);
  router.post('/bulk', authMiddleware, indicatorDefinitionController.bulkCreate);
  router.post('/check-existing', authMiddleware, indicatorDefinitionController.checkExisting);

  return router;
};
