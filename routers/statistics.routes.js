import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";

export default (container) => {
  const router = Router();

  const statisticsController = container.resolve("statisticsController");

  router.get("/indicators", authMiddleware, statisticsController.getIndicatorsWithData);
  router.get("/percentage", authMiddleware, statisticsController.getPercentageCaptured);
  router.get("/last-update", authMiddleware, statisticsController.getLastUpdate);
  router.get("/capture-progress", authMiddleware, statisticsController.getCaptureProgressByDepartment);
  router.get("/graphic-data", authMiddleware, statisticsController.getStatisticsIndicatorData);
  
  return router;
};
