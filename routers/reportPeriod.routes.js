import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";

export default (container) => {
  const router = Router();

  const reportPeriodController = container.resolve("reportPeriodController");

  router.post("/", authMiddleware, reportPeriodController.create);
  router.get("/all", authMiddleware, reportPeriodController.getAll);
  router.get("/all-by-department/:departmentId", authMiddleware, reportPeriodController.getAllByDepartment);
  router.get("/all-no-expired", authMiddleware, reportPeriodController.getAllNoExpired);
  router.get("/all-no-expired-by-department/:departmentId", authMiddleware, reportPeriodController.getAllNoExpiredByDepartment);
  router.get("/all-info-no-expired", authMiddleware, reportPeriodController.getAllInfoNoExpired);
  router.get("/all-info", authMiddleware, reportPeriodController.getAllInfo);
  router.get("/all-with-data-captured", authMiddleware, reportPeriodController.getAllWithCapturedIndicators);
  router.get("/all-with-data-captured-by-department/:departmentId", authMiddleware, reportPeriodController.getAllWithCapturedIndicatorsByDepartment);
  router.get("/:id", authMiddleware, reportPeriodController.getById);
  router.put("/:id", authMiddleware, reportPeriodController.update);

  return router;
}