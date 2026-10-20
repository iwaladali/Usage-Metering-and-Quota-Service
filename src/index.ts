
import "dotenv/config";
import { buildApp } from "./app.js";
import { runMigrations } from "./db/migrate.js";
import { seedPredefinedPlans } from "./db/seed.js";


async function main() {
  await runMigrations();
  await seedPredefinedPlans();

  const app = buildApp();
  const port = Number(process.env.PORT ?? 3000);

  app.listen(port, "0.0.0.0", () => {
    console.log(`Listening on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});