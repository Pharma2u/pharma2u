import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createOrder,
  listMyOrders,
  getMyOrder,
  cancelMyOrder,
  uploadPrescription,
  razorpayWebhook,
} from "../controllers/order.controller";

const router = Router(),
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_r, f, cb) =>
      cb(
        null,
        ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
          f.mimetype,
        ),
      ),
  });


router.post("/payments/razorpay/webhook", razorpayWebhook);
router.use(authMiddleware("customer"));
router.post("/orders", createOrder);
router.get("/orders", listMyOrders);
router.get("/orders/:id", getMyOrder);
router.post("/orders/:id/cancel", cancelMyOrder);
router.post(
  "/orders/:id/prescription",
  upload.single("prescription"),
  uploadPrescription,
);


export default router;
