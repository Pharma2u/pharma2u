import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import {
  getLoyaltySetting,
  getMyLoyalty,
  listAdminFeedback,
  listMyFeedback,
  markRewardNotificationRead,
  reviewFeedback,
  submitFeedback,
  updateLoyaltySetting,
} from "../controllers/feedback-loyalty.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePasswordChanged } from "../middleware/requirePasswordChanged.middleware";

const router = Router();
const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many feedback submissions. Please try again later." },
});
const feedbackImages = multer({
  storage: multer.memoryStorage(),
  limits: { files: 5, fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      callback(null, true);
      return;
    }
    callback(
      Object.assign(
        new Error("Feedback screenshots must be JPEG, PNG, or WebP images."),
        { status: 400 },
      ),
    );
  },
});

router.post(
  "/feedback",
  authMiddleware("customer"),
  feedbackLimiter,
  feedbackImages.array("images", 5),
  submitFeedback,
);
router.get("/feedback/mine", authMiddleware("customer"), listMyFeedback);
router.get("/loyalty/me", authMiddleware("customer"), getMyLoyalty);
router.patch("/loyalty/notifications/:id/read", authMiddleware("customer"), markRewardNotificationRead);
router.get("/admin/feedback", authMiddleware("admin"), requirePasswordChanged, listAdminFeedback);
router.patch("/admin/feedback/:id/review", authMiddleware("admin"), requirePasswordChanged, reviewFeedback);
router.get("/admin/loyalty-settings", authMiddleware("admin"), requirePasswordChanged, getLoyaltySetting);
router.put("/admin/loyalty-settings", authMiddleware("admin"), requirePasswordChanged, updateLoyaltySetting);

export default router;
