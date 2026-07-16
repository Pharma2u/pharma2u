// Registers vendor-scoped inventory endpoints.
import { Router } from "express";
import multer from "multer";
import {
  createProduct,
  listPublicProducts,
  listProductAvailability,
  deleteProduct,
  listProducts,
  updateProduct,
  updateStock,
} from "../controllers/product.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePasswordChanged } from "../middleware/requirePasswordChanged.middleware";

const router = Router();
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, callback) =>
    callback(
      null,
      ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype),
    ),
});

router.get("/products", listPublicProducts);
router.get("/products/:id/availability", listProductAvailability);

router.use(
  "/vendor/products",
  authMiddleware("vendor"),
  requirePasswordChanged,
);
router.post("/vendor/products", imageUpload.array("images", 10), createProduct);
router.get("/vendor/products", listProducts);
router.patch(
  "/vendor/products/:id",
  imageUpload.array("images", 10),
  updateProduct,
);
router.patch("/vendor/products/:id/stock", updateStock);
router.delete("/vendor/products/:id", deleteProduct);

export default router;
