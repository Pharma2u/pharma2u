import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePasswordChanged } from "../middleware/requirePasswordChanged.middleware";
import {
  listMyOrders,
  getMyOrder,
  getVendorPrescriptionUrl,
  cancelMyOrder,
  markRazorpayPaymentFailed,
  uploadPrescription,
  verifyRazorpayPayment,
} from "../controllers/order.controller";
import {
  acceptRiderTask,
  completeRelayHandoff,
  markVendorOrderPacked,
  placeMatchedOrder,
  riderAvailableTasks,
  riderMyTasks,
  updateRiderDelivery,
  vendorOrderQueue,
  verifyVendorOrder,
} from "../controllers/order.operations.controller";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) =>
    callback(
      null,
      ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
        file.mimetype,
      ),
    ),
});
router.post("/orders", authMiddleware("customer"), placeMatchedOrder);

// Static sub-paths MUST come before /:id to avoid route shadowing
router.get(
  "/orders/customer/mine",
  authMiddleware("customer", "admin"),
  listMyOrders,
);
router.get(
  "/orders/vendor/queue",
  authMiddleware("vendor"),
  requirePasswordChanged,
  vendorOrderQueue,
);
router.get(
  "/orders/rider/available",
  authMiddleware("rider"),
  requirePasswordChanged,
  riderAvailableTasks,
);
router.get(
  "/orders/rider/mine",
  authMiddleware("rider"),
  requirePasswordChanged,
  riderMyTasks,
);

// Wildcard route — must be after all static GET routes
router.get("/orders", authMiddleware("customer", "admin"), listMyOrders);
router.get("/orders/:id", authMiddleware("customer", "admin"), getMyOrder);

router.post(
  "/orders/:id/cancel",
  authMiddleware("customer", "admin"),
  cancelMyOrder,
);
router.post(
  "/orders/:id/payments/razorpay/verify",
  authMiddleware("customer", "admin"),
  verifyRazorpayPayment,
);
router.post(
  "/orders/:id/payments/razorpay/failed",
  authMiddleware("customer", "admin"),
  markRazorpayPaymentFailed,
);
router.post(
  "/orders/:id/prescription",
  authMiddleware("customer", "admin"),
  upload.single("prescription"),
  uploadPrescription,
);
router.post(
  "/orders/:id/verify",
  authMiddleware("vendor"),
  requirePasswordChanged,
  verifyVendorOrder,
);
router.post(
  "/orders/:id/ready",
  authMiddleware("vendor"),
  requirePasswordChanged,
  markVendorOrderPacked,
);
router.post(
  "/orders/:id/accept",
  authMiddleware("rider"),
  requirePasswordChanged,
  acceptRiderTask,
);
router.post(
  "/orders/:id/status",
  authMiddleware("rider"),
  requirePasswordChanged,
  updateRiderDelivery,
);
router.post(
  "/orders/:id/relay-handoff",
  authMiddleware("rider"),
  requirePasswordChanged,
  completeRelayHandoff,
);

export default router;
