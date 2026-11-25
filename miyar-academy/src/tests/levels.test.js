const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const { setupDb, startServer, baseUrl } = require("./helpers");
const db = require("../db");

let server;
let token;        // رمز طالب الاختبار
let b101Id;       // معرف مقرر B-101 (يُستعلم ديناميكيًا)
let c201Id;

async function registerToken(username, email) {
  const res = await fetch(`${baseUrl(server)}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password: "Passw0rd!" }),
  });
  const body = await res.json();
  return body.token;
}

before(async () => {
  await setupDb();
  const app = require("../app");
  server = await startServer(app);

  // بذر مقررات المستويين التأسيسي والمتوسط
  const seed = [
    ["B-101", "مقدمة في الوبائيات", "Introduction to Epidemiology", "Foundational"],
    ["B-102", "أساسيات الإحصاء الحيوي", "Biostatistics Fundamentals", "Foundational"],
    ["B-103", "الصحة العامة ومؤشراتها", "Public Health Basics", "Foundational"],
    ["C-201", "تصاميم الدراسات الوبائية", "Epidemiologic Study Designs", "Intermediate"],
    ["C-202", "الانحدار في الإحصاء الحيوي", "Regression in Biostatistics", "Intermediate"],
    ["C-203", "تحليل البيانات الصحية", "Health Data Analysis", "Intermediate"],
  ];
  for (const [code, ar, en, level] of seed) {
    await db.query(
      "INSERT INTO courses (course_code, title_ar, title_en, level) VALUES ($1, $2, $3, $4)",
      [code, ar, en, level]
    );
  }
  // المتطلب السابق: التسجيل في C-201 يتطلب إتمام B-101 بنسبة 80%
  await db.query(
    `INSERT INTO requirements (course_id, required_course_id)
     SELECT c.id AS target_course_id, r.id AS required_course_id FROM courses c, courses r
     WHERE c.course_code = 'C-201' AND r.course_code = 'B-101'`
  );

  const ids = await db.query("SELECT id, course_code FROM courses");
  b101Id = ids.rows.find((r) => r.course_code === "B-101").id;
  c201Id = ids.rows.find((r) => r.course_code === "C-201").id;

  token = await registerToken("lvl_user", "lvl@miyar.edu");
});

after(() => {
  server.close();
  db.__resetPool();
});

function authed(extra = {}) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...extra };
}

describe("GET /api/courses/levels", () => {
  test("يعيد مقررات المستويات الثلاثة مرتبة: تأسيسي ثم متوسط ثم متقدم", async () => {
    const res = await fetch(`${baseUrl(server)}/api/courses/levels`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.levels));
    assert.equal(body.levels.length, 10); // 4 متقدمة (من البذر الأساسي) + 6 جديدة
    assert.equal(body.levels[0].level, "Foundational");
    const intermediateIdx = body.levels.findIndex((c) => c.level === "Intermediate");
    const advancedIdx = body.levels.findIndex((c) => c.level === "Advanced");
    assert.ok(intermediateIdx >= 0 && advancedIdx > intermediateIdx);
  });

  test("يعرض C-201 مع المتطلب السابق B-101", async () => {
    const res = await fetch(`${baseUrl(server)}/api/courses/levels`);
    const body = await res.json();
    const c201 = body.levels.find((c) => c.course_code === "C-201");
    assert.equal(c201.required_course_code, "B-101");
    const b101 = body.levels.find((c) => c.course_code === "B-101");
    assert.equal(b101.required_course_code, null);
  });
});

describe("فرض المتطلبات السابقة عند التسجيل", () => {
  test("يرفض التسجيل في C-201 قبل إتمام B-101 برمز 403", async () => {
    const res = await fetch(`${baseUrl(server)}/api/enrollments`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ course_id: c201Id }),
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.missing.length, 1);
    assert.equal(body.missing[0].course_code, "B-101");
    assert.equal(body.missing[0].required, 80);
  });

  test("يسمح بالتسجيل في B-101 (بلا متطلبات)", async () => {
    const res = await fetch(`${baseUrl(server)}/api/enrollments`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ course_id: b101Id }),
    });
    assert.equal(res.status, 201);
  });

  test("يتحقق الأهلية قبل الإكمال: غير مؤهل", async () => {
    const res = await fetch(`${baseUrl(server)}/api/courses/C-201/eligibility`, {
      headers: authed(),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.eligible, false);
    assert.equal(body.missing[0].course_code, "B-101");
  });

  test("بعد إتمام B-101 بنسبة 85% يصبح التسجيل في C-201 ممكنًا (201)", async () => {
    const list = await fetch(`${baseUrl(server)}/api/enrollments/me`, { headers: authed() });
    const { enrollments } = await list.json();
    const myB101 = enrollments.find((e) => e.course_code === "B-101");
    const patch = await fetch(`${baseUrl(server)}/api/enrollments/${myB101.id}/progress`, {
      method: "PATCH",
      headers: authed(),
      body: JSON.stringify({ progress: 85 }),
    });
    assert.equal(patch.status, 200);

    const elig = await fetch(`${baseUrl(server)}/api/courses/C-201/eligibility`, { headers: authed() });
    const eligBody = await elig.json();
    assert.equal(eligBody.eligible, true);

    const res = await fetch(`${baseUrl(server)}/api/enrollments`, {
      method: "POST",
      headers: authed(),
      body: JSON.stringify({ course_id: c201Id }),
    });
    assert.equal(res.status, 201);
  });

  test("التقدم أقل من 80% لا يكفي لفتح المقرر", async () => {
    const t2 = await registerToken("lvl_user2", "lvl2@miyar.edu");
    const enr = await fetch(`${baseUrl(server)}/api/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t2}` },
      body: JSON.stringify({ course_id: b101Id }),
    });
    assert.equal(enr.status, 201);
    const { enrollment } = await enr.json();
    await fetch(`${baseUrl(server)}/api/enrollments/${enrollment.id}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t2}` },
      body: JSON.stringify({ progress: 70 }),
    });
    const blocked = await fetch(`${baseUrl(server)}/api/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t2}` },
      body: JSON.stringify({ course_id: c201Id }),
    });
    assert.equal(blocked.status, 403);
  });
});
