import { Router } from "express";
import multer from "multer";
import {
  applyForPharmacy,
  approvePharmacyApplication,
  pendingPharmacyApplications,
  rejectPharmacyApplication,
} from "../controllers/pharmacy-application.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePasswordChanged } from "../middleware/requirePasswordChanged.middleware";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, cb) =>
    cb(
      null,
      ["image/jpeg", "image/png", "application/pdf"].includes(file.mimetype),
    ),
});

router.post(
  "/pharmacies/apply",
  upload.fields([
    { name: "drugLicense", maxCount: 1 },
    { name: "pharmacistLicense", maxCount: 1 },
  ]),
  applyForPharmacy,
);

router.get(
  "/admin/pharmacy-applications/pending",
  authMiddleware("admin"),
  requirePasswordChanged,
  pendingPharmacyApplications,
);
router.post(
  "/admin/pharmacy-applications/:id/approve",
  authMiddleware("admin"),
  requirePasswordChanged,
  approvePharmacyApplication,
);
router.post(
  "/admin/pharmacy-applications/:id/reject",
  authMiddleware("admin"),
  requirePasswordChanged,
  rejectPharmacyApplication,
);


export default router;
