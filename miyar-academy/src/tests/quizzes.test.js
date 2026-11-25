const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const { setupDb, startServer, baseUrl } = require("./helpers");
const db = require("../db");

let server;

before(async () => {
  await setupDb();
  const app = require("../app");
  server = await startServer(app);
});

after(() => {
  server.close();
  db.__resetPool();
});

describe("اختبارات الطلاب /api/quizzes", () => {
  test("يعرض قائمة اختبارات مقرر A-301 دون مصادقة", async () => {
    const res = await fetch(`${baseUrl(server)}/api/quizzes?course=A-301`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.quizzes.length, 2);
    assert.equal(body.quizzes[0].title_en, "IPW Basics Quiz");
    assert.equal(body.quizzes[0].questions.length, 2);
    assert.ok(!("correct_index" in body.quizzes[0].questions[0]));
  });

  test("يرفض الاستعلام دون تحديد المقرر", async () => {
    const res = await fetch(`${baseUrl(server)}/api/quizzes`);
    assert.equal(res.status, 400);
  });

  test("يُصحح إجابات الطالب ويحسب الدرجة", async () => {
    const reg = await fetch(`${baseUrl(server)}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "quizstudent", email: "quiz@miyar.edu", password: "Passw0rd!" }),
    });
    const { token } = await reg.json();
    const res = await fetch(`${baseUrl(server)}/api/quizzes/1/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ answers: { "1": 1, "2": 0 } }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.score, 2);
    assert.equal(body.total, 2);
    assert.ok(body.results.every((r) => r.correct === true));
  });

  test("يعطي صفرًا عند الإجابات الخاطئة", async () => {
    const reg = await fetch(`${baseUrl(server)}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "quiz@miyar.edu", password: "Passw0rd!" }),
    });
    const { token } = await reg.json();
    const res = await fetch(`${baseUrl(server)}/api/quizzes/1/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ answers: { "1": 0, "2": 2 } }),
    });
    const body = await res.json();
    assert.equal(body.score, 0);
  });

  test("يرفض تسليم الإجابات دون مصادقة", async () => {
    const res = await fetch(`${baseUrl(server)}/api/quizzes/1/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: { "1": 0 } }),
    });
    assert.equal(res.status, 401);
  });

  test("يعرض محاولاتي السابقة", async () => {
    const reg = await fetch(`${baseUrl(server)}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "quiz@miyar.edu", password: "Passw0rd!" }),
    });
    const { token } = await reg.json();
    const res = await fetch(`${baseUrl(server)}/api/quizzes/1/attempts/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.attempts.length, 2);
  });

  test("المدرّس ينشئ اختبارًا جديدًا بأكمله", async () => {
    const reg = await fetch(`${baseUrl(server)}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "quizteach", email: "qt@miyar.edu", password: "Passw0rd!", role: "Instructor" }),
    });
    const { token } = await reg.json();
    const res = await fetch(`${baseUrl(server)}/api/quizzes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        course_id: 2,
        title_ar: "اختبار كوكس",
        title_en: "Cox Model Quiz",
        questions: [
          { question_text: "من طوّر نموذج كوكس؟", options: ["David Cox", "Kaplan", "Meier"], correct_index: 0 },
        ],
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.quiz.questions[0].options.length, 3);
  });

  test("الطالب لا يستطيع إنشاء اختبار", async () => {
    const reg = await fetch(`${baseUrl(server)}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "quiz@miyar.edu", password: "Passw0rd!" }),
    });
    const { token } = await reg.json();
    const res = await fetch(`${baseUrl(server)}/api/quizzes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ course_id: 1, title_ar: "x", title_en: "y", questions: [{ question_text: "z", options: ["a", "b"], correct_index: 0 }] }),
    });
    assert.equal(res.status, 403);
  });
});
