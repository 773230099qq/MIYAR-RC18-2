const express = require("express");
const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");
const enrollmentRoutes = require("./routes/enrollments");
const { router: rlabRoutes } = require("./routes/rlab");
const { authenticate } = require("./middleware/auth");

const app = express();
app.use(express.json({ limit: "256kb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", academy: "MIYAR" });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/rlab", authenticate, rlabRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "المسار غير موجود" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "خطأ داخلي في الخادم" });
});

module.exports = app;
