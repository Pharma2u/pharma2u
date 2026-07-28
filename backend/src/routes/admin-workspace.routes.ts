import { Router } from "express";
import multer from "multer";
import {
  listRoleUsers,
  setUserAccess,
} from "../controllers/access-management.controller";
import {
  createAnnouncement,
  createEmployee,
  createLedgerEntry,
  getAdminWorkspace,
  saveCompany,
  updateSubscription,
  updateTicket,
  createVendorProfileType,
  updateVendorProfileType,
  uploadCompanyLogoImage,
} from "../controllers/admin-workspace.controller";
import { getLiveOperations } from "../controllers/live-operations.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePasswordChanged } from "../middleware/requirePasswordChanged.middleware";

const companyLogoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 },
  fileFilter: (_req, file, callback) =>
    callback(
      null,
      ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype),
    ),
});
const router = Router();
router.use("/admin", authMiddleware("admin"), requirePasswordChanged);
router.get("/admin/workspace", getAdminWorkspace);
router.get("/admin/live-operations", getLiveOperations);
router.get("/admin/access/users", listRoleUsers);
router.patch("/admin/access/users/:id", setUserAccess);
router.post("/admin/vendor-profile-types", createVendorProfileType);
router.patch("/admin/vendor-profile-types/:id", updateVendorProfileType);
router.put("/admin/company", saveCompany);
router.post(
  "/admin/company/logo",
  companyLogoUpload.single("logo"),
  uploadCompanyLogoImage,
);
router.post("/admin/ledger", createLedgerEntry);
router.post("/admin/announcements", createAnnouncement);
router.post("/admin/employees", createEmployee);
router.patch("/admin/support-tickets/:id", updateTicket);
router.patch("/admin/subscriptions/:pharmacyId", updateSubscription);

export default router;
