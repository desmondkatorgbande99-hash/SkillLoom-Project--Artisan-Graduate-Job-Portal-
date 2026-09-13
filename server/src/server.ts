import "dotenv/config";

import app from "./app";

const PORT = Number(process.env.PORT || 5550);
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`SkillLoom API running on http://${HOST}:${PORT}`);
  console.log("Weaving skills into opportunity.");
});