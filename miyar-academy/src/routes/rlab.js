const { spawn } = require("child_process");
const express = require("express");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const ALLOWED_SCRIPTS = new Set([
  "A301_ipw.R",
  "A302_survival.R",
  "A303_sarima.R",
  "A304_machine_learning.R",
  "A305_meta_analysis.R",
  "A306_surveillance.R",
  "A307_icer.R",
]);

const EXECUTION_TIMEOUT_MS = parseInt(process.env.R_TIMEOUT_MS || "60000", 10);

function runRScript(scriptName, onDone) {
  const mode = process.env.R_SANDBOX_MODE || "local";
  const scriptPath = `/r-lab/${scriptName}`;
  const cmd =
    mode === "docker"
      ? "docker"
      : "Rscript";
  const args =
    mode === "docker"
      ? ["run", "--rm", "--network", "none", "--memory", "512m", "--cpus", "1",
         "-v", `${process.env.R_LAB_HOST_DIR || "/opt/miyar/r-lab"}:/r-lab:ro`,
         process.env.R_SANDBOX_IMAGE || "miyar/r-sandbox:latest", "Rscript", scriptPath]
      : [scriptPath];

  const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  const timer = setTimeout(() => {
    child.kill("SIGKILL");
    onDone(new Error("تجاوز الحد الزمني لتنفيذ الكود"), stdout, stderr);
  }, EXECUTION_TIMEOUT_MS);

  child.stdout.on("data", (d) => (stdout += d));
  child.stderr.on("data", (d) => (stderr += d));
  child.on("error", (err) => {
    clearTimeout(timer);
    onDone(err, stdout, stderr);
  });
  child.on("close", (code) => {
    clearTimeout(timer);
    onDone(code === 0 ? null : new Error(`انتهى التنفيذ برمز الخروج ${code}`), stdout, stderr);
  });
}

router.post("/run", requireRole("Admin", "Instructor", "Student"), (req, res) => {
  const { script } = req.body || {};
  if (!ALLOWED_SCRIPTS.has(script)) {
    return res.status(400).json({ error: "اسم السكربت غير مسموح", allowed: [...ALLOWED_SCRIPTS] });
  }
  runRScript(script, (err, stdout, stderr) => {
    if (err && stderr === "" && stdout === "") {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      script,
      success: !err,
      error: err ? err.message : null,
      stdout,
      stderr,
    });
  });
});

router.get("/scripts", (req, res) => {
  res.json({ scripts: [...ALLOWED_SCRIPTS] });
});

module.exports = { router, runRScript };
