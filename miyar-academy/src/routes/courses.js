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
      `SELECT c.id, c.course_code, c.title_ar, c.title_en, c.level, c.blurb_ar, c.blurb_en, c.approval_status,
              c2.course_code AS required_course_code
       FROM courses c
       LEFT JOIN requirements rq ON rq.course_id = c.id
       LEFT JOIN courses c2 ON c2.id = rq.required_course_id
       ORDER BY CASE c.level WHEN 'Foundational' THEN 0 WHEN 'Intermediate' THEN 1 ELSE 2 END,
                c.course_code`
    );
    // دمج الصفوف المكررة للمقرر الواحد (في حال تعدد المتطلبات السابقة)
    const merged = new Map();
    for (const r of rows) {
      if (!merged.has(r.course_code)) {
        merged.set(r.course_code, { ...r, required_course_codes: [] });
      }
      if (r.required_course_code) {
        merged.get(r.course_code).required_course_codes.push(r.required_course_code);
      }
    }
    const levels = [...merged.values()].map((c) => (c.required_course_codes.length === 1
      ? { ...c, required_course_code: c.required_course_codes[0] }
      : c));
    res.json({ levels });
  } catch (err) {
    next(err);
  }
});

// فهرس محاضرات مقرر (عناوين فقط + حالة الموافقة)
router.get("/:code/lectures", async (req, res, next) => {
  try {
    const { rows: course } = await query(
      "SELECT id, course_code FROM courses WHERE course_code = $1",
      [req.params.code]
    );
    if (course.length === 0) {
      return res.status(404).json({ error: "المقرر غير موجود" });
    }
    const { rows } = await query(
      "SELECT lecture_no, title_ar, title_en, objectives_ar, objectives_en FROM lectures WHERE course_id = $1 ORDER BY lecture_no",
      [course[0].id]
    );
    res.json({ course_code: course[0].course_code, lectures: rows });
  } catch (err) {
    next(err);
  }
});

// محاضرة مفردة بمحتواها الكامل واختبارها التكويني
router.get("/:code/lectures/:no", async (req, res, next) => {
  try {
    const no = parseInt(req.params.no, 10);
    if (!Number.isInteger(no) || no < 1) {
      return res.status(400).json({ error: "رقم المحاضرة غير صالح" });
    }
    const { rows: course } = await query(
      "SELECT id, course_code, approval_status FROM courses WHERE course_code = $1",
      [req.params.code]
    );
    if (course.length === 0) {
      return res.status(404).json({ error: "المقرر غير موجود" });
    }
    const { rows } = await query(
      `SELECT lecture_no, title_ar, title_en, objectives_ar, objectives_en, body_ar, body_en, payload, quiz_json
       FROM lectures WHERE course_id = $1 AND lecture_no = $2`,
      [course[0].id, no]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "المحاضرة غير موجودة" });
    }
    const lec = rows[0];
    res.json({
      course_code: course[0].course_code,
      approval_status: course[0].approval_status,
      lecture: {
        ...lec,
        payload: lec.payload ? JSON.parse(lec.payload) : null,
        quiz: lec.quiz_json ? JSON.parse(lec.quiz_json) : [],
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id, course_code, title_ar, title_en, level, source_ref, blurb_ar, blurb_en, approval_status FROM courses ORDER BY id"
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
      "SELECT id, course_code, title_ar, title_en, level, source_ref, blurb_ar, blurb_en, approval_status FROM courses WHERE course_code = $1",
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
