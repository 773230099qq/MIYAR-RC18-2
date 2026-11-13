const { newDb } = require("pg-mem");
const fs = require("fs");
const path = require("path");
const db = require("../db");

async function setupDb() {
  const mem = newDb();
  const schema = fs
    .readFileSync(path.join(__dirname, "../../db/schema.sql"), "utf8")
    .replace(/DECIMAL\(5,\s*2\)/gi, "DECIMAL");
  mem.public.none(schema);
  const { Pool } = mem.adapters.createPg();
  db.__setPool(new Pool());

  const seed = [
    "INSERT INTO courses (course_code, title_ar, title_en, level) VALUES ('A-301', 'الاستدلال السببي المتقدم', 'Advanced Causal Inference', 'Advanced')",
    "INSERT INTO courses (course_code, title_ar, title_en, level) VALUES ('A-302', 'تحليل البقاء', 'Survival Analysis', 'Advanced')",
    "INSERT INTO courses (course_code, title_ar, title_en, level) VALUES ('A-304', 'التعلم الآلي والإحصاء البايزي', 'Machine Learning & Bayesian Statistics', 'Advanced')",
    "INSERT INTO courses (course_code, title_ar, title_en, level) VALUES ('A-306', 'هندسة أنظمة الترصد', 'Surveillance Systems Engineering', 'Advanced')",
  ];
  for (const s of seed) await db.query(s);
  return mem;
}

async function startServer(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

function baseUrl(server) {
  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

module.exports = { setupDb, startServer, baseUrl };
