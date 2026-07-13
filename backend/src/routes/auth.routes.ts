// Declares public, authenticated, and admin authentication endpoints.
import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  changePassword,
  login,
  me,
  provisionAdmin,
  provisionStaff,
  register,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePasswordChanged } from "../middleware/requirePasswordChanged.middleware";

const router = Router();
const credentialLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please retry after one minute." },
});

router.post("/register", credentialLimiter, register);
router.post("/login", credentialLimiter, login);
router.post("/change-password", authMiddleware(), changePassword);
router.get("/me", authMiddleware(), me);
router.post(
  "/admin/provision-staff",
  authMiddleware("admin"),
  requirePasswordChanged,
  provisionStaff,
);

router.post(
  "/admin/provision-admin",
  authMiddleware("admin"),
  requirePasswordChanged,
  provisionAdmin,
);

export default router;
