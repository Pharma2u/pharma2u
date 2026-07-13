// Registers vendor-scoped inventory endpoints.
import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
  updateStock,
} from "../controllers/product.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePasswordChanged } from "../middleware/requirePasswordChanged.middleware";
const router = Router();

router.use(authMiddleware("vendor"), requirePasswordChanged);
router.post("/vendor/products", createProduct);
router.get("/vendor/products", listProducts);
router.patch("/vendor/products/:id", updateProduct);
router.patch("/vendor/products/:id/stock", updateStock);
router.delete("/vendor/products/:id", deleteProduct);

export default router;
