// Starts the Express API and registers global error handling.
import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import cookieParser from "cookie-parser";
import multer from "multer";
import authRoutes from "./routes/auth.routes";
import pharmacyRoutes from "./routes/pharmacy.routes";
import riderRoutes from "./routes/rider.routes";
import productRoutes from "./routes/product.routes";
import orderRoutes from "./routes/order.routes";
import vendorOperationsRoutes from "./routes/vendor-operations.routes";
import addressRoutes from "./routes/address.routes";
import pharmacyApplicationRoutes from "./routes/pharmacy-application.routes";
import { razorpayWebhook } from "./controllers/order.controller";
import { assertJwtSecret } from "./utils/jwt";
import { ValidationError } from "./validators/auth.validator";
import { PharmacyValidationError } from "./validators/pharmacy.validator";
import { RiderValidationError } from "./validators/rider.validator";
import { ProductValidationError } from "./validators/product.validator";
import { AddressValidationError } from "./validators/address.validator";
import { initializeRealtime } from "./realtime";
import { connectRedis } from "./config/redis";

assertJwtSecret();

const app = express();
const server = createServer(app);

const allowedOrigins = (
  process.env.FRONTEND_ORIGINS ??
  "http://localhost:3000,http://localhost:3001,http://localhost:3002"
).split(",");
app.use(cors({ origin: allowedOrigins }));

// Razorpay signs the exact request bytes, so this route must run before express.json().
app.post(
  "/api/payments/razorpay/webhook",
  express.raw({ type: "application/json", limit: "1mb" }),
  razorpayWebhook,
);

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api", pharmacyRoutes);
app.use("/api", riderRoutes);
app.use("/api", productRoutes);
app.use("/api", orderRoutes);
app.use("/api", vendorOperationsRoutes);
app.use("/api", addressRoutes);
app.use("/api", pharmacyApplicationRoutes);

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
      error instanceof AddressValidationError ||
      (error instanceof Error &&
        [400, 401, 404, 409, 502, 503].includes(
          (error as Error & { status?: number }).status ?? 500,
        ))
    ) {
      res
        .status((error as Error & { status?: number }).status ?? 400)
        .json({ error: (error as Error).message });
      return;
    }
    res.status(500).json({ error: "An unexpected error occurred." });
  },
);

async function start() {
  await connectRedis();
  await initializeRealtime(server, allowedOrigins);
  server.listen(Number(process.env.PORT_NO ?? 5000), () =>
    console.info(`API listening on port ${process.env.PORT_NO ?? 5000}`),
  );
}

start().catch((error) => {
  console.error("API startup failed:", error);
  process.exit(1);
});
