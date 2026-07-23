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
import {
  requestRiderOtp,
  verifyRiderOtp,
} from "../controllers/rider-auth.controller";

const router = Router();
const credentialLimiter = rateLimit({
  windowMs: 60_000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please retry after one minute." },
});

const provisioningLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many provisioning attempts. Please retry later." },
});

router.post("/register", credentialLimiter, register);
router.post("/login", credentialLimiter, login);
router.post("/rider/request-otp", credentialLimiter, requestRiderOtp);
router.post("/rider/verify-otp", credentialLimiter, verifyRiderOtp);
router.post("/change-password", authMiddleware(), changePassword);
router.get("/me", authMiddleware(), me);

router.post(
  "/admin/provision-staff",
  provisioningLimiter,
  authMiddleware("admin"),
  requirePasswordChanged,
  provisionStaff,
);
router.post(
  "/admin/provision-admin",
  provisioningLimiter,
  authMiddleware("admin"),
  requirePasswordChanged,
  provisionAdmin,
);

export default router;
