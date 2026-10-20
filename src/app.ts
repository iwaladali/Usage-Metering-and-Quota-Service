
import express from "express";

import userRoutes from "./routes/userRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import consumeRoutes from "./routes/consumeRoutes.js";
import usageRoutes from "./routes/usageRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import path from "node:path";
import { fileURLToPath } from "node:url";



const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const publicDirectory = path.resolve(currentDirectory, "../public");
export function buildApp() {
  const app = express();

  app.use(express.json());
  app.use(express.static(publicDirectory));
  app.use("/api/users", userRoutes);
  app.use("/api/accounts", accountRoutes);
  app.use("/api/usage/consume", consumeRoutes);
  app.use("/api/usage", usageRoutes);
  app.use("/api/plans", planRoutes);
  app.use((req, res) => {
    res.status(404).json({
      message: "Route not found",
    });
  });

  app.use(
    (
      error: unknown,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error(error);

      if (res.headersSent) {
        next(error);
        return;
      }

      res.status(500).json({
        message: "Internal server error",
      });
    },
  );

  return app;
}