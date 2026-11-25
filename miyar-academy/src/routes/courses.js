const express = require("express");
const { query } = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// نسبة الإكمال المطلوبة في كل متطلب سابق حتى يصبح الطالب مؤهلاً
const COURSE_COMPLETION_THRESHOLD = 80;

// يعيد قائمة المتطلبات السابقة غير المكتملة: كل صف يحتوي المتطلب ونسبة تقدم الطالب فيه
async function unmetRequirements(courseId, userId) {
  const { rows } = await query(
    `SELECT c.course_code, COALESCE(e.progress, 0) AS progress
     FROM requirements rq
     JOIN courses c ON c.id = rq.required_course_id
     LEFT JOIN enrollments e ON e.course_id = rq.required_course_id AND e.user_id = $2
     WHERE rq.course_id = $1
       AND COALESCE(e.progress, 0) < $3
     ORDER BY c.course_code`,
    [courseId, userId, COURSE_COMPLETION_THRESHOLD]
  );
  return rows;
}

router.get("/levels", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT c.id, c.course_code, c.title_ar, c.title_en, c.level, c2.course_code AS required_course_code
       FROM courses c
       LEFT JOIN requirements rq ON rq.course_id = c.id
       LEFT JOIN courses c2 ON c2.id = rq.required_course_id
       ORDER BY CASE c.level WHEN 'Foundational' THEN 0 WHEN 'Intermediate' THEN 1 ELSE 2 END,
                c.course_code`
    );
    res.json({ levels: rows });
  } catch (err) {
    next(err);
  }
});

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

router.get("/:code/eligibility", authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id, course_code, title_ar, title_en, level FROM courses WHERE course_code = $1",
      [req.params.code]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "المقرر غير موجود" });
    }
    const missing = await unmetRequirements(rows[0].id, req.user.sub);
    res.json({ course: rows[0], eligible: missing.length === 0, missing });
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

// إرفاق الدوال المساعدة على الراوتر ليظل التصدير router مباشرة (متوافق مع app.js)
router.unmetRequirements = unmetRequirements;
router.COURSE_COMPLETION_THRESHOLD = COURSE_COMPLETION_THRESHOLD;

module.exports = router;
