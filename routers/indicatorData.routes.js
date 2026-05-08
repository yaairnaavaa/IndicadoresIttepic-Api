import { Router } from 'express';
import authMiddleware from "../middlewares/authMiddleware.js";

export default (container) => {
  const router = Router();

  const indicatorDataController = container.resolve("indicatorDataController");

  router.post('/', authMiddleware, indicatorDataController.create);
  router.get('/all', authMiddleware, indicatorDataController.getAll);
  router.get('/by-definition/:definitionId', authMiddleware, indicatorDataController.getByDefinition);
  router.get('/by-report-period/:reportPeriodId', authMiddleware, indicatorDataController.getByReportPeriod);
  router.get('/by-report-period/:reportPeriodId/department/:departmentId', authMiddleware, indicatorDataController.getByReportPeriodAndDepartment);
  router.put('/:id', authMiddleware, indicatorDataController.update);
  router.delete('/:id', authMiddleware, indicatorDataController.delete);
  router.get('/by-department/:departmentId', authMiddleware, indicatorDataController.getByDepartment);

  return router;
};
