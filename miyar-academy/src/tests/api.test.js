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

describe("GET /api/health", () => {
  test("يعيد الحالة الصحية", async () => {
    const res = await fetch(`${baseUrl(server)}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "healthy");
    assert.equal(body.academy, "MIYAR");
  });
});

describe("المصادقة /api/auth", () => {
  test("تسجيل مستخدم جديد يعيد رمز JWT", async () => {
    const res = await fetch(`${baseUrl(server)}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "student1", email: "s1@miyar.edu", password: "Passw0rd!" }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.user.role, "Student");
    assert.ok(body.token.split(".").length === 3);
  });

  test("يرفض كلمة المرور القصيرة", async () => {
    const res = await fetch(`${baseUrl(server)}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "student2", email: "s2@miyar.edu", password: "short" }),
    });
    assert.equal(res.status, 400);
  });

  test("يرفض تكرار البريد الإلكتروني", async () => {
    const res = await fetch(`${baseUrl(server)}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "student1b", email: "s1@miyar.edu", password: "Passw0rd!" }),
    });
    assert.equal(res.status, 409);
  });

  test("تسجيل الدخول بنجاح يعيد رمزًا", async () => {
    const res = await fetch(`${baseUrl(server)}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "s1@miyar.edu", password: "Passw0rd!" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.token);
  });

  test("يرفض كلمة مرور خاطئة", async () => {
    const res = await fetch(`${baseUrl(server)}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "s1@miyar.edu", password: "WrongPass1" }),
    });
    assert.equal(res.status, 401);
  });
});

describe("المقررات /api/courses", () => {
  test("يعرض المقررات دون مصادقة", async () => {
    const res = await fetch(`${baseUrl(server)}/api/courses`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.courses.length, 4);
  });

  test("يجلب مقررًا برمزه", async () => {
    const res = await fetch(`${baseUrl(server)}/api/courses/A-301`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.course.title_en, "Advanced Causal Inference");
  });

  test("يرفض إنشاء مقرر دون مصادقة", async () => {
    const res = await fetch(`${baseUrl(server)}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_code: "A-999", title_ar: "x", title_en: "y", level: "Advanced" }),
    });
    assert.equal(res.status, 401);
  });

  test("المدرّس ينشئ مقررًا جديدًا", async () => {
    const reg = await fetch(`${baseUrl(server)}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "teach1", email: "t1@miyar.edu", password: "Passw0rd!", role: "Instructor" }),
    });
    const { token } = await reg.json();
    const res = await fetch(`${baseUrl(server)}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ course_code: "A-308", title_ar: "مقرر جديد", title_en: "New Course", level: "Intermediate" }),
    });
    assert.equal(res.status, 201);
  });

  test("الطالب لا يستطيع إنشاء مقرر", async () => {
    const reg = await fetch(`${baseUrl(server)}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "student3", email: "s3@miyar.edu", password: "Passw0rd!" }),
    });
    const { token } = await reg.json();
    const res = await fetch(`${baseUrl(server)}/api/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ course_code: "A-999", title_ar: "x", title_en: "y", level: "Advanced" }),
    });
    assert.equal(res.status, 403);
  });
});

describe("التسجيلات /api/enrollments", () => {
  let studentToken;

  before(async () => {
    const reg = await fetch(`${baseUrl(server)}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "student4", email: "s4@miyar.edu", password: "Passw0rd!" }),
    });
    studentToken = (await reg.json()).token;
  });

  test("يرفض التسجيل دون مصادقة", async () => {
    const res = await fetch(`${baseUrl(server)}/api/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: 1 }),
    });
    assert.equal(res.status, 401);
  });

  test("يسجل الطالب في مقرر", async () => {
    const res = await fetch(`${baseUrl(server)}/api/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ course_id: 1 }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(Number(body.enrollment.progress), 0);
  });

  test("يرفض التسجيل المكرر", async () => {
    const res = await fetch(`${baseUrl(server)}/api/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ course_id: 1 }),
    });
    assert.equal(res.status, 409);
  });

  test("يرفض مقررًا غير موجود", async () => {
    const res = await fetch(`${baseUrl(server)}/api/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ course_id: 999 }),
    });
    assert.equal(res.status, 404);
  });

  test("يحدث نسبة التقدم", async () => {
    const res = await fetch(`${baseUrl(server)}/api/enrollments/1/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ progress: 42.5 }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(Number(body.enrollment.progress), 42.5);
  });

  test("يرفض قيمة تقدم غير صالحة", async () => {
    const res = await fetch(`${baseUrl(server)}/api/enrollments/1/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ progress: 150 }),
    });
    assert.equal(res.status, 400);
  });

  test("يعرض تسجيلاتي", async () => {
    const res = await fetch(`${baseUrl(server)}/api/enrollments/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.enrollments.length, 1);
    assert.equal(body.enrollments[0].course_code, "A-301");
  });
});

describe("مختبر R /api/rlab", () => {
  test("يرفض الطلب دون مصادقة", async () => {
    const res = await fetch(`${baseUrl(server)}/api/rlab/scripts`);
    assert.equal(res.status, 401);
  });

  test("يعرض قائمة السكربتات المسموحة", async () => {
    const reg = await fetch(`${baseUrl(server)}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "s4@miyar.edu", password: "Passw0rd!" }),
    });
    const { token } = await reg.json();
    const res = await fetch(`${baseUrl(server)}/api/rlab/scripts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.scripts.includes("A304_machine_learning.R"));
    assert.ok(body.scripts.includes("A306_surveillance.R"));
  });

  test("يرفض سكربتًا غير مسموح", async () => {
    const reg = await fetch(`${baseUrl(server)}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "s4@miyar.edu", password: "Passw0rd!" }),
    });
    const { token } = await reg.json();
    const res = await fetch(`${baseUrl(server)}/api/rlab/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ script: "../../etc/passwd" }),
    });
    assert.equal(res.status, 400);
  });
});
