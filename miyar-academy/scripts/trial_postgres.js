// MIYAR trial test on REAL PostgreSQL 16.4 — isolated scratch databases only
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB = '/tmp/pgrun';
const APP = '/workspace/github__773230099qq__MIYAR-RC18-2/miyar-academy';

function mk(db) {
  return new Client({ host: DB, port: 55432, user: 'appuser', database: db });
}
const sql = (f) => fs.readFileSync(path.join(APP, f), 'utf8');
let step = 0;
const ok = (msg, extra = '') => console.log(`  ✅ STEP ${++step} OK: ${msg}${extra ? ' — ' + extra : ''}`);

async function runFile(client, file, label) {
  const before = Date.now();
  await client.query(sql(file));
  ok(label || file, `${Date.now() - before}ms`);
}

async function initEmptyDB(server, db) {
  await server.query(`DROP DATABASE IF EXISTS ${db}`);
  await server.query(`CREATE DATABASE ${db}`);
}

async function counts(client, name) {
  const q = async (s) => (await client.query(s)).rows[0].c;
  return {
    courses: await q('SELECT count(*)::int c FROM courses'),
    lectures: await q('SELECT count(*)::int c FROM lectures'),
    requirements: await q('SELECT count(*)::int c FROM requirements'),
    reqDistinct: await q('SELECT count(*)::int c FROM (SELECT DISTINCT course_id, required_course_id FROM requirements) t'),
    draftCourses: await q("SELECT count(*)::int c FROM courses WHERE approval_status='draft'"),
    users: await q('SELECT count(*)::int c FROM users'),
    enrollments: await q('SELECT count(*)::int c FROM enrollments'),
  };
}
const fmt = (c) => `courses=${c.courses} lectures=${c.lectures} requirements=${c.requirements} (distinct=${c.reqDistinct}) draft=${c.draftCourses} users=${c.users} enrollments=${c.enrollments}`;

(async () => {
  const server = mk('postgres');
  await server.connect();

  // ===== SCENARIO A: fresh database (schema path) =====
  console.log('\n=== SCENARIO A: fresh DB miyar_check (schema.sql full path) ===');
  await initEmptyDB(server, 'miyar_check');
  const db = mk('miyar_check');
  await db.connect();

  await runFile(db, 'db/schema.sql', 'schema.sql (7 tables incl. requirements + quizzes)');
  await runFile(db, 'db/migrate_002_course_content.sql', 'migrate_002 on fresh DB (idempotent)');
  await runFile(db, 'db/seed_curriculum.sql', 'seed_curriculum.sql (1st run)');

  const c1 = await counts(db);
  console.log('  COUNTS 1st seed:', fmt(c1));

  // user-data safety probe: insert a user + enrollment + attempt before re-run
  await db.query("INSERT INTO users (username, email, password_hash, role) VALUES ('trial_user','trial@test.local','x','Student')");
  const uid = (await db.query("SELECT id FROM users WHERE username='trial_user'")).rows[0].id;
  await db.query("INSERT INTO enrollments (user_id, course_id) SELECT $1, id FROM courses WHERE course_code='B-101'", [uid]);
  const quiz = (await db.query('SELECT id FROM quizzes LIMIT 1'));
  if (quiz.rows[0]) {
    await db.query("INSERT INTO attempts (quiz_id, user_id, score, total) VALUES ($1,$2,1,5)", [quiz.rows[0].id, uid]);
  }

  // ===== IDEMPOTENCY: migrations + seed AGAIN =====
  console.log('\n=== IDEMPOTENCY: re-run all migrations + seed (2nd run) ===');
  await runFile(db, 'db/migrate_002_course_content.sql', 'migrate_002 (2nd run)');
  await runFile(db, 'db/seed_curriculum.sql', 'seed_curriculum.sql (2nd run)');
  const c2 = await counts(db);
  console.log('  COUNTS after re-run:', fmt(c2));

  const seedKeys = ['courses','lectures','requirements','reqDistinct','draftCourses'];
  const same = seedKeys.every(k => c1[k] === c2[k]) && c2.users === 1 && c2.enrollments === 1;
  console.log(`  ➜ IDEMPOTENT: ${same ? 'YES ✅ (seed entities identical 1st vs 2nd run, zero duplication)' : 'NO ❌'}`);
  await db.query('DELETE FROM attempts WHERE user_id=' + uid);
  await db.query('DELETE FROM enrollments WHERE user_id=' + uid);
  await db.query('DELETE FROM users WHERE id=' + uid);
  console.log(`  ➜ USER DATA SURVIVED 2nd seed: users=${c2.users} (probe row present then cleaned) ✅`);

  // content sanity
  const sample = await db.query(`SELECT c.course_code, l.lecture_no, length(l.body_ar) ba, length(l.body_en) be, length(l.quiz_json) qz FROM lectures l JOIN courses c ON c.id=l.course_id ORDER BY c.course_code, l.lecture_no LIMIT 4`);
  console.log('  CONTENT SAMPLE (real lengths):');
  sample.rows.forEach(r => console.log(`   ${r.course_code} محاضرة${r.lecture_no}: body_ar=${r.ba}B body_en=${r.be}B quiz=${r.qz}B`));
  const reqSample = await db.query(`SELECT t.course_code tgt, r.course_code req FROM requirements rq JOIN courses t ON t.id=rq.course_id JOIN courses r ON r.id=rq.required_course_id ORDER BY 1 LIMIT 5`);
  console.log('  REQUIREMENTS SAMPLE:', reqSample.rows.map(r => `${r.tgt}←${r.req}`).join(' , '));
  const draft = await db.query(`SELECT count(*)::int c FROM courses WHERE source_ref IS NOT NULL AND approval_status='draft'`);
  console.log(`  EPIACADEMY draft-badged courses: ${draft.rows[0].c}`);

  await db.end();

  // ===== SCENARIO B: OLD phone-like DB (3 tables only) upgrade path =====
  console.log('\n=== SCENARIO B: old phone-style DB (users/courses/enrollments only) ===');
  await initEmptyDB(server, 'miyar_old_check');
  const old = mk('miyar_old_check');
  await old.connect();
  const oldSchema = sql('db/schema.sql').split(/-- المتطلبات السابقة/)[0];
  await old.query(oldSchema);
  ok('old 3-table schema recreated');
  const oc = (await old.query('SELECT tablename c FROM pg_tables WHERE schemaname=\'public\' ORDER BY 1')).rows.map(r => r.c).join(',');
  console.log('  tables before upgrade:', oc);

  await runFile(old, 'db/migrate_001_requirements_quizzes.sql', 'migrate_001 (idempotent upgrade)');
  await runFile(old, 'db/migrate_002_course_content.sql', 'migrate_002');
  await runFile(old, 'db/seed_curriculum.sql', 'seed_curriculum.sql on upgraded old DB');
  const c3 = await counts(old);
  console.log('  COUNTS:', fmt(c3));
  await old.end();

  // ===== SUCCESS criteria =====
  console.log('\n=== VERDICT ===');
  const passA = c1.courses === 32 && c1.lectures === 24 && c1.requirements === 14 && c1.reqDistinct === 14 && c1.draftCourses === 32;
  const passB = c3.courses === 32 && c3.lectures === 24 && c3.requirements === 14;
  console.log(`Scenario A (fresh):     ${passA ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`Idempotency (2nd run):  ${same ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`Scenario B (old DB):    ${passB ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log((passA && same && passB) ? '\nALL REAL-POSTGRES TESTS PASSED 🎉' : '\nFAILURES — DO NOT MERGE ❌');

  await server.query('DROP DATABASE IF EXISTS miyar_check');
  await server.query('DROP DATABASE IF EXISTS miyar_old_check');
  console.log('scratch databases cleaned (miyar_check & miyar_old_check dropped)');
  await server.end();
  process.exit((passA && same && passB) ? 0 : 1);
})().catch(e => { console.error('TRIAL FAILED ❌:', e.message); process.exit(1); });
