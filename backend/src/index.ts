// Starts the Express API and registers global error handling.
import "dotenv/config";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.routes";
import { assertJwtSecret } from "./utils/jwt";
import { ValidationError } from "./validators/auth.validator";

assertJwtSecret();

const app = express();
const allowedOrigins = (
  process.env.FRONTEND_ORIGINS ??
  "http://localhost:3000,http://localhost:3001,http://localhost:3002"
).split(",");

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof ValidationError) {
      response.status(400).json({ message: error.message });
      return;
    }

    response.status(500).json({ message: "An unexpected error occurred." });
  },
);

const port = Number(process.env.PORT_NO ?? 5000);
app.listen(port, () => {
  console.info(`API listening on port ${port}`);
});
