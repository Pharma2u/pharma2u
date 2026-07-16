import { Router } from "express";
import {
  createMyAddress,
  deleteMyAddress,
  listMyAddresses,
  updateMyAddress,
} from "../controllers/address.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
router.get("/addresses", authMiddleware("customer", "admin"), listMyAddresses);
router.post("/addresses", authMiddleware("customer", "admin"), createMyAddress);
router.patch(
  "/addresses/:id",
  authMiddleware("customer", "admin"),
  updateMyAddress,
);
router.delete(
  "/addresses/:id",
  authMiddleware("customer", "admin"),
  deleteMyAddress,
);
export default router;
