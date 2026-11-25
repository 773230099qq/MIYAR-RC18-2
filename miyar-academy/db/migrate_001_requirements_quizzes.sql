-- MIYAR ترقية 001 (متسامحة/قابلة لإعادة التشغيل بأمان): جداول المتطلبات السابقة + الاختبارات الآلية
-- آمنة 100% على قاعدة بيانات قائمة أو جديدة — لا تحذف ولا تفقد أي بيانات (IF NOT EXISTS فقط)
-- الترتيب الموصى به على قاعدة قائمة (مثل هاتفك في Termux):
--   psql -U $(whoami) -d miyar -f db/migrate_001_requirements_quizzes.sql
--   psql -U $(whoami) -d miyar -f db/migrate_002_course_content.sql
--   psql -U $(whoami) -d miyar -f db/seed_curriculum.sql
--   psql -U $(whoami) -d miyar -f db/seed.sql   (بيانات اختبارات تجريبية اختيارية)

-- 1) المتطلبات السابقة (نظام المستويات الثلاثية)
CREATE TABLE IF NOT EXISTS requirements (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id),
    required_course_id INT REFERENCES courses(id),
    UNIQUE (course_id, required_course_id)
);

CREATE INDEX IF NOT EXISTS idx_requirements_course ON requirements(course_id);
CREATE INDEX IF NOT EXISTS idx_requirements_required_course ON requirements(required_course_id);

-- 2) نظام الاختبارات الآلية (REQ-003)
CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id),
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    quiz_id INT REFERENCES quizzes(id),
    question_text VARCHAR(500) NOT NULL,
    correct_index INT NOT NULL CHECK (correct_index >= 0),
    points INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS answers (
    id SERIAL PRIMARY KEY,
    question_id INT REFERENCES questions(id),
    idx INT NOT NULL,
    text VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS attempts (
    id SERIAL PRIMARY KEY,
    quiz_id INT REFERENCES quizzes(id),
    user_id INT REFERENCES users(id),
    score INT NOT NULL,
    total INT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
