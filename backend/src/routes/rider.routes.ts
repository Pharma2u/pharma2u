// Registers the public multipart rider application and protected review endpoints.
import { Router } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import {
  apply,
  approve,
  pending,
  reject,
  updateMyLocation,
} from "../controllers/rider.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePasswordChanged } from "../middleware/requirePasswordChanged.middleware";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, cb) =>
    cb(null, file.mimetype === "image/jpeg" || file.mimetype === "image/png"),
});

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many applications. Please retry later." },
});

router.post(
  "/riders/apply",
  limiter,
  upload.fields([
    { name: "aadharImage", maxCount: 1 },
    { name: "panImage", maxCount: 1 },
    { name: "dlImage", maxCount: 1 },
  ]),
  apply,
);

router.post(
  "/riders/location",
  authMiddleware("rider"),
  requirePasswordChanged,
  updateMyLocation,
);

router.get(
  "/admin/riders/pending",
  authMiddleware("admin"),
  requirePasswordChanged,
  pending,
);
router.post(
  "/admin/riders/:id/approve",
  authMiddleware("admin"),
  requirePasswordChanged,
  approve,
);
router.post(
  "/admin/riders/:id/reject",
  authMiddleware("admin"),
  requirePasswordChanged,
  reject,
);

export default router;
