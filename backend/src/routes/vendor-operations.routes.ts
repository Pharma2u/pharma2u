import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePasswordChanged } from "../middleware/requirePasswordChanged.middleware";
import {
  createCounterBill,
  createPayoutRequest,
  createVendorPromotion,
  getVendorFinancialSummary,
  getVendorSettings,
  listPayoutRequests,
  listVendorPromotions,
  updateVendorSettings,
} from "../controllers/vendor-operations.controller";

const router = Router();
const vendor = [authMiddleware("vendor"), requirePasswordChanged] as const;
router.get("/vendor/operations/summary", ...vendor, getVendorFinancialSummary);
router.post("/vendor/counter-bills", ...vendor, createCounterBill);
router.get("/vendor/promotions", ...vendor, listVendorPromotions);
router.post("/vendor/promotions", ...vendor, createVendorPromotion);
router.get("/vendor/payout-requests", ...vendor, listPayoutRequests);
router.post("/vendor/payout-requests", ...vendor, createPayoutRequest);
router.get("/vendor/settings", ...vendor, getVendorSettings);
router.patch("/vendor/settings", ...vendor, updateVendorSettings);

export default router;
