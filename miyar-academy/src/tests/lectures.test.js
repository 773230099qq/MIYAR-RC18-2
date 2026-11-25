const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const { setupDb, startServer, baseUrl } = require("./helpers");
const db = require("../db");

let server;
let b101Id;

before(async () => {
  await setupDb();
  const app = require("../app");
  server = await startServer(app);

  await db.query(
    "INSERT INTO courses (course_code, title_ar, title_en, level, source_ref, blurb_ar, blurb_en, approval_status) VALUES ('B-101', 'مقدمة في الوبائيات', 'Introduction to Epidemiology', 'Foundational', 'F-101', 'وصف المقرر', 'blurb', 'draft')"
  );
  const r = await db.query("SELECT id FROM courses WHERE course_code = 'B-101'");
  b101Id = r.rows[0].id;

  await db.query(
    `INSERT INTO lectures (course_id, lecture_no, title_ar, title_en, objectives_ar, objectives_en, body_ar, body_en, payload, quiz_json)
     VALUES ($1, 1, 'ماذا يدرس علم الأوبئة', 'What epidemiology studies', 'هدف', 'objective', 'جسم المحاضرة', 'lecture body', '{"fieldEn":"prompt"}',
     '[{"qEn":"Epi studies ...?","qAr":"يدرس ...","optsEn":["a","b"],"optsAr":["أ","ب"],"ans":0,"explEn":"because","explAr":"لأن"}]')`,
    [b101Id]
  );
  await db.query(
    `INSERT INTO lectures (course_id, lecture_no, title_ar, title_en, objectives_ar, objectives_en, body_ar, body_en, payload, quiz_json)
     VALUES ($1, 2, 'التحليل الوصفي', 'Descriptive vs analytic', NULL, NULL, NULL, NULL, NULL, NULL)`,
    [b101Id]
  );
});

after(() => {
  server.close();
  db.__resetPool();
});

describe("GET /api/courses", () => {
  test("يعيد المقرر مع حالة الموافقة والمرجع الأصلي", async () => {
    const res = await fetch(`${baseUrl(server)}/api/courses`);
    const body = await res.json();
    const b101 = body.courses.find((c) => c.course_code === "B-101");
    assert.equal(b101.approval_status, "draft");
    assert.equal(b101.source_ref, "F-101");
  });
});

describe("GET /api/courses/:code/lectures", () => {
  test("يعيد فهرس المحاضرات بالترتيب", async () => {
    const res = await fetch(`${baseUrl(server)}/api/courses/B-101/lectures`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.course_code, "B-101");
    assert.equal(body.lectures.length, 2);
    assert.equal(body.lectures[0].lecture_no, 1);
    assert.equal(body.lectures[0].title_ar, "ماذا يدرس علم الأوبئة");
  });

  test("يرفض 404 لمقرر غير موجود", async () => {
    const res = await fetch(`${baseUrl(server)}/api/courses/X-999/lectures`);
    assert.equal(res.status, 404);
  });
});

describe("GET /api/courses/:code/lectures/:no", () => {
  test("يعيد المحاضرة الكاملة مع الاختبار المفسر", async () => {
    const res = await fetch(`${baseUrl(server)}/api/courses/B-101/lectures/1`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.lecture.title_en, "What epidemiology studies");
    assert.equal(body.lecture.body_en, "lecture body");
    assert.equal(body.approval_status, "draft");
    assert.ok(Array.isArray(body.lecture.quiz));
    assert.equal(body.lecture.quiz.length, 1);
    assert.equal(body.lecture.quiz[0].ans, 0);
    assert.deepEqual(body.lecture.quiz[0].optsEn, ["a", "b"]);
  });

  test("يعيد محاضرة بلا محتوى (empty fields null)", async () => {
    const res = await fetch(`${baseUrl(server)}/api/courses/B-101/lectures/2`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.lecture.quiz.length, 0);
    assert.equal(body.lecture.body_en, null);
  });

  test("يرفض 404 لمحاضرة غير موجودة", async () => {
    const res = await fetch(`${baseUrl(server)}/api/courses/B-101/lectures/99`);
    assert.equal(res.status, 404);
  });

  test("يرفض 400 لرقم غير صالح", async () => {
    const res = await fetch(`${baseUrl(server)}/api/courses/B-101/lectures/abc`);
    assert.equal(res.status, 400);
  });
});
