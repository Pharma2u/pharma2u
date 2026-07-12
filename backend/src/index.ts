// Starts the Express API and registers global error handling.
import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth.routes";
import { assertJwtSecret } from "./utils/jwt";
import { ValidationError } from "./validators/auth.validator";

assertJwtSecret();
const app = express();
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
