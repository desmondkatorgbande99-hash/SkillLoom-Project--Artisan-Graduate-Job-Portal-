import "dotenv/config";

import app from "./app";

const PORT = Number(process.env.PORT || 5550);

app.listen(PORT, () => {
  console.log(`SkillLoom API running on http://localhost:${PORT}`);
  console.log("Weaving skills into opportunity.");
});