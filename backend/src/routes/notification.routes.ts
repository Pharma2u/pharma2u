import { Router } from "express";
import { listNotifications } from "../controllers/notification.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePasswordChanged } from "../middleware/requirePasswordChanged.middleware";

const router = Router();
router.get("/notifications", authMiddleware(), requirePasswordChanged, listNotifications);
export default router;