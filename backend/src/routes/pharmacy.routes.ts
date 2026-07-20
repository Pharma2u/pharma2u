// Registers pharmacy administration and vendor pharmacy endpoints.
import { Router } from "express";
import {
  createPharmacy,
  listPharmacies,
  myPharmacy,
  setMyPharmacyOpenStatus,
  updatePharmacy,
} from "../controllers/pharmacy.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePasswordChanged } from "../middleware/requirePasswordChanged.middleware";

const router = Router(),
  admin = [authMiddleware("admin"), requirePasswordChanged] as const,
  vendor = [authMiddleware("vendor"), requirePasswordChanged] as const;

router.post("/admin/pharmacies", ...admin, createPharmacy);
router.get("/admin/pharmacies", ...admin, listPharmacies);
router.patch("/admin/pharmacies/:id", ...admin, updatePharmacy);
router.get("/vendor/pharmacy/me", ...vendor, myPharmacy);
router.patch("/vendor/pharmacy/me", ...vendor, setMyPharmacyOpenStatus);

export default router;
