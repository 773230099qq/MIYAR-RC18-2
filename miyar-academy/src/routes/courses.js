const express = require("express");
const { query } = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id, course_code, title_ar, title_en, level FROM courses ORDER BY id"
    );
    res.json({ courses: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:code", async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id, course_code, title_ar, title_en, level FROM courses WHERE course_code = $1",
      [req.params.code]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "المقرر غير موجود" });
    }
    res.json({ course: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post("/", authenticate, requireRole("Admin", "Instructor"), async (req, res, next) => {
  try {
    const { course_code, title_ar, title_en, level } = req.body || {};
    if (!course_code || !title_ar || !title_en || !level) {
      return res.status(400).json({ error: "جميع الحقول مطلوبة: course_code, title_ar, title_en, level" });
    }
    const allowedLevels = ["Foundational", "Intermediate", "Advanced"];
    if (!allowedLevels.includes(level)) {
      return res.status(400).json({ error: "المستوى يجب أن يكون: Foundational, Intermediate, Advanced" });
    }
    const { rows } = await query(
      `INSERT INTO courses (course_code, title_ar, title_en, level)
       VALUES ($1, $2, $3, $4)
       RETURNING id, course_code, title_ar, title_en, level`,
      [course_code, title_ar, title_en, level]
    );
    res.status(201).json({ course: rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "رمز المقرر مستخدم مسبقًا" });
    }
    next(err);
  }
});

module.exports = router;
