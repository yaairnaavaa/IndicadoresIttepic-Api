import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";

export default (container) => {
  const router = Router();

  const departmentController = container.resolve("departmentController");

  router.get("/all", authMiddleware, departmentController.getAll);

  return router;
};  