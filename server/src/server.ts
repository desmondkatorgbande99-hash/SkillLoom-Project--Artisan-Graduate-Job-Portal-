import "dotenv/config";

import app from "./app";
import { ensureSeededJobs } from "./services/seed.service";

const PORT = Number(process.env.PORT || 5550);
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, async () => {
  console.log(`SkillLoom API running on http://${HOST}:${PORT}`);
  console.log("Weaving skills into opportunity.");

  // Automatically ensure tech and artisan jobs are seeded in the database
  try {
    await ensureSeededJobs();
  } catch (seedErr) {
    console.error("Auto-seed error on startup:", seedErr);
  }
});