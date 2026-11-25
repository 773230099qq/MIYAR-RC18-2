const express = require("express");
const { query } = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

async function loadQuiz(quizId) {
  const { rows: quizzes } = await query(
    "SELECT id, course_id, title_ar, title_en FROM quizzes WHERE id = $1",
    [quizId]
  );
  if (quizzes.length === 0) return null;
  const quiz = quizzes[0];
  const { rows: questions } = await query(
    "SELECT id, question_text FROM questions WHERE quiz_id = $1 ORDER BY id",
    [quizId]
  );
  const quizQuestions = [];
  for (const q of questions) {
    const { rows: answers } = await query(
      "SELECT idx, text FROM answers WHERE question_id = $1 ORDER BY idx",
      [q.id]
    );
    quizQuestions.push({
      id: q.id,
      question_text: q.question_text,
      options: answers.map((a) => ({ idx: a.idx, text: a.text })),
    });
  }
  return {
    id: quiz.id,
    course_id: quiz.course_id,
    title_ar: quiz.title_ar,
    title_en: quiz.title_en,
    questions: quizQuestions,
  };
}

router.get("/", async (req, res, next) => {
  try {
    const { course } = req.query;
    if (!course) {
      return res.status(400).json({ error: "حدد المقرر: ?course=CODE" });
    }
    const { rows } = await query(
      `SELECT q.id FROM quizzes q JOIN courses c ON c.id = q.course_id
       WHERE c.course_code = $1 ORDER BY q.id`,
      [course]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "لا يوجد اختبار لهذا المقرر" });
    }
    const quizzes = [];
    for (const row of rows) {
      quizzes.push(await loadQuiz(row.id));
    }
    res.json({ quizzes });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  authenticate,
  requireRole("Admin", "Instructor"),
  async (req, res, next) => {
    try {
      const { course_id, title_ar, title_en, questions } = req.body || {};
      if (!course_id || !title_ar || !title_en || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          error: "مطلوب: course_id, title_ar, title_en, questions (مصفوفة غير فارغة)",
        });
      }
      const { rows: course } = await query("SELECT id FROM courses WHERE id = $1", [course_id]);
      if (course.length === 0) {
        return res.status(404).json({ error: "المقرر غير موجود" });
      }
      for (const q of questions) {
        if (!q.question_text || !Array.isArray(q.options) || q.options.length < 2) {
          return res.status(400).json({ error: "كل سؤال يحتاج نصًا وخيارين على الأقل" });
        }
        if (!Number.isInteger(q.correct_index) || q.correct_index < 0 || q.correct_index >= q.options.length) {
          return res.status(400).json({ error: "correct_index خارج نطاق الخيارات في أحد الأسئلة" });
        }
      }
      const { rows: quizRows } = await query(
        "INSERT INTO quizzes (course_id, title_ar, title_en) VALUES ($1, $2, $3) RETURNING id",
        [course_id, title_ar, title_en]
      );
      const quizId = quizRows[0].id;
      for (const q of questions) {
        const { rows: qRows } = await query(
          "INSERT INTO questions (quiz_id, question_text, correct_index) VALUES ($1, $2, $3) RETURNING id",
          [quizId, q.question_text, q.correct_index]
        );
        const questionId = qRows[0].id;
        for (let i = 0; i < q.options.length; i++) {
          await query("INSERT INTO answers (question_id, idx, text) VALUES ($1, $2, $3)", [
            questionId,
            i,
            q.options[i],
          ]);
        }
      }
      const quiz = await loadQuiz(quizId);
      res.status(201).json({ quiz });
    } catch (err) {
      next(err);
    }
  }
);

router.post("/:id/submit", authenticate, async (req, res, next) => {
  try {
    const submitted = req.body && req.body.answers;
    if (!submitted || typeof submitted !== "object" || Array.isArray(submitted)) {
      return res.status(400).json({ error: "مطلوب: answers بصيغة {\"رقم السؤال\": رقم الخيار}" });
    }
    const quizId = parseInt(req.params.id, 10);
    const { rows: questions } = await query(
      "SELECT id, correct_index FROM questions WHERE quiz_id = $1 ORDER BY id",
      [quizId]
    );
    if (questions.length === 0) {
      return res.status(404).json({ error: "الاختبار غير موجود" });
    }
    let score = 0;
    const results = questions.map((q) => {
      const chosen = submitted[String(q.id)];
      const chosenIdx = Number(chosen);
      const isDefined = chosen !== undefined && Number.isInteger(chosenIdx);
      const isCorrect = isDefined && chosenIdx === q.correct_index;
      if (isCorrect) score += 1;
      return { question_id: q.id, answered: isDefined, correct: isCorrect };
    });
    const total = questions.length;
    await query(
      "INSERT INTO attempts (quiz_id, user_id, score, total) VALUES ($1, $2, $3, $4)",
      [quizId, req.user.sub, score, total]
    );
    res.json({ score, total, results });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/attempts/me", authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT score, total, submitted_at FROM attempts WHERE quiz_id = $1 AND user_id = $2 ORDER BY submitted_at DESC",
      [req.params.id, req.user.sub]
    );
    res.json({ attempts: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
