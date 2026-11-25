-- MIYAR ترقية 002: محتوى المنهاج من EPIACADEMY Update 32
-- تُطبق مرة واحدة على قاعدة بيانات قائمة (مثلاً على هاتفك في Termux):
--   psql -U $(whoami) -d miyar -f db/migrate_002_course_content.sql
--   psql -U $(whoami) -d miyar -f db/seed_curriculum.sql

ALTER TABLE courses ADD COLUMN IF NOT EXISTS source_ref VARCHAR(20);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS blurb_ar TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS blurb_en TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'draft';

CREATE TABLE IF NOT EXISTS lectures (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id),
    lecture_no INT NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    objectives_ar TEXT,
    objectives_en TEXT,
    body_ar TEXT,
    body_en TEXT,
    payload TEXT,
    quiz_json TEXT,
    UNIQUE (course_id, lecture_no)
);
