// Registers pharmacy administration and vendor pharmacy endpoints.
import { Router } from "express";
import multer from "multer";
import {
  createPharmacy,
  getPublicPharmacy,
  listNearbyPharmacies,
  listPharmacies,
  listPublicPharmacies,
  myPharmacy,
  setMyPharmacyOpenStatus,
  updateMyPharmacyProfile,
  updatePharmacy,
} from "../controllers/pharmacy.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePasswordChanged } from "../middleware/requirePasswordChanged.middleware";
import { createHomepageBanner, deleteHomepageBanner, listHomepageBanners, listPublicHomepageBanners, updateHomepageBanner, uploadHomepageBannerImage } from "../controllers/homepage-banner.controller";

const router = Router();
const pharmacyImageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, callback) => callback(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) });

router.get("/pharmacies", listPublicPharmacies);
router.get("/pharmacies/nearby", listNearbyPharmacies);
router.get("/pharmacies/:id", getPublicPharmacy);
router.get("/homepage-banners", listPublicHomepageBanners);

const admin = [authMiddleware("admin"), requirePasswordChanged] as const;
const vendor = [authMiddleware("vendor"), requirePasswordChanged] as const;

router.post("/admin/pharmacies", ...admin, createPharmacy);
router.get("/admin/pharmacies", ...admin, listPharmacies);
router.patch("/admin/pharmacies/:id", ...admin, updatePharmacy);
router.get("/admin/homepage-banners", ...admin, listHomepageBanners);
router.post("/admin/homepage-banners/image", ...admin, pharmacyImageUpload.single("image"), uploadHomepageBannerImage);
router.post("/admin/homepage-banners", ...admin, createHomepageBanner);
router.patch("/admin/homepage-banners/:id", ...admin, updateHomepageBanner);
router.delete("/admin/homepage-banners/:id", ...admin, deleteHomepageBanner);
router.get("/vendor/pharmacy/me", ...vendor, myPharmacy);
router.patch("/vendor/pharmacy/me/profile", ...vendor, pharmacyImageUpload.fields([{ name: "logo", maxCount: 1 }, { name: "banner", maxCount: 1 }]), updateMyPharmacyProfile);
router.patch("/vendor/pharmacy/me", ...vendor, setMyPharmacyOpenStatus);

export default router;

