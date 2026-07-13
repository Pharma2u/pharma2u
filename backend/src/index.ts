// Starts the Express API and registers global error handling.
import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";
import authRoutes from "./routes/auth.routes";
import pharmacyRoutes from "./routes/pharmacy.routes";
import riderRoutes from "./routes/rider.routes";
import productRoutes from "./routes/product.routes";
import { assertJwtSecret } from "./utils/jwt";
import { ValidationError } from "./validators/auth.validator";
import { PharmacyValidationError } from "./validators/pharmacy.validator";
import { RiderValidationError } from "./validators/rider.validator";
import { ProductValidationError } from "./validators/product.validator";
assertJwtSecret();
const app = express();
const allowedOrigins = (
  process.env.FRONTEND_ORIGINS ??
  "http://localhost:3000,http://localhost:3001,http://localhost:3002"
).split(",");
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", pharmacyRoutes);
app.use("/api", riderRoutes);
app.use("/api", productRoutes);
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof multer.MulterError) {
      res.status(400).json({ error: "Invalid KYC image upload." });
      return;
    }
    if (
      error instanceof ValidationError ||
      error instanceof PharmacyValidationError ||
      error instanceof RiderValidationError ||
      error instanceof ProductValidationError ||
      (error instanceof Error &&
        (error as Error & { status?: number }).status === 400)
    ) {
      res.status(400).json({ error: (error as Error).message });
      return;
    }
    res.status(500).json({ error: "An unexpected error occurred." });
  },
);
app.listen(Number(process.env.PORT_NO ?? 5000), () =>
  console.info(`API listening on port ${process.env.PORT_NO ?? 5000}`),
);
