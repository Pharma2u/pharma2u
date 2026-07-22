import { Router } from "express";
import { listRoleUsers, setUserAccess } from "../controllers/access-management.controller";
import {
  createAnnouncement,
  createEmployee,
  createLedgerEntry,
  getAdminWorkspace,
  saveCompany,
  updateSubscription,
  updateTicket,
} from "../controllers/admin-workspace.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePasswordChanged } from "../middleware/requirePasswordChanged.middleware";

const router = Router();
router.use("/admin", authMiddleware("admin"), requirePasswordChanged);
router.get("/admin/workspace", getAdminWorkspace);
router.get("/admin/access/users", listRoleUsers);
router.patch("/admin/access/users/:id", setUserAccess);
router.put("/admin/company", saveCompany);
router.post("/admin/ledger", createLedgerEntry);
router.post("/admin/announcements", createAnnouncement);
router.post("/admin/employees", createEmployee);
router.patch("/admin/support-tickets/:id", updateTicket);
router.patch("/admin/subscriptions/:pharmacyId", updateSubscription);


export default router;
