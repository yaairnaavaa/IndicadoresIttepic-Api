import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";

export default (container) => {
    const router = Router();

    const userCtrl = container.resolve("userController"); // Inyecta el controlador

    router.post("/login", userCtrl.login);
    router.get("/me", userCtrl.isAuthenticated);
    router.post("/logout", userCtrl.logout);
    router.get("/",authMiddleware, userCtrl.getAll);
    router.get("/getUser/:employeeId",authMiddleware, userCtrl.getUser);
    router.get("/employee/:email",authMiddleware, userCtrl.getDataEmployee);
    router.post("/change/password",authMiddleware, userCtrl.updatePassword);

    return router;
};

