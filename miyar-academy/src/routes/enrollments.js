const express = require("express");
const { query } = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

router.get("/me", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT e.id, e.progress, e.enrolled_at, c.course_code, c.title_ar, c.title_en, c.level
       FROM enrollments e JOIN courses c ON c.id = e.course_id
       WHERE e.user_id = $1 ORDER BY e.enrolled_at DESC`,
      [req.user.sub]
    );
    res.json({ enrollments: rows });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { course_id } = req.body || {};
    if (!course_id) {
      return res.status(400).json({ error: "course_id مطلوب" });
    }
    const { rows: course } = await query("SELECT id FROM courses WHERE id = $1", [course_id]);
    if (course.length === 0) {
      return res.status(404).json({ error: "المقرر غير موجود" });
    }
    const { rows } = await query(
      `INSERT INTO enrollments (user_id, course_id)
       VALUES ($1, $2)
       RETURNING id, user_id, course_id, progress, enrolled_at`,
      [req.user.sub, course_id]
    );
    res.status(201).json({ enrollment: rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "أنت مسجل في هذا المقرر مسبقًا" });
    }
    next(err);
  }
});

router.patch("/:id/progress", async (req, res, next) => {
  try {
    const progress = Number(req.body && req.body.progress);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      return res.status(400).json({ error: "progress يجب أن يكون رقمًا بين 0 و 100" });
    }
    const { rows } = await query(
      `UPDATE enrollments SET progress = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, progress`,
      [progress, req.params.id, req.user.sub]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "سجل التسجيل غير موجود" });
    }
    res.json({ enrollment: rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
