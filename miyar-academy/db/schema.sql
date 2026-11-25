-- MIYAR Database Schema (PostgreSQL)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL,
    source_ref VARCHAR(20),
    blurb_ar TEXT,
    blurb_en TEXT,
    approval_status VARCHAR(20) NOT NULL DEFAULT 'draft'
);

CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    course_id INT REFERENCES courses(id),
    progress DECIMAL(5,2) DEFAULT 0.00 CHECK (progress >= 0 AND progress <= 100),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, course_id)
);

CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- المتطلبات السابقة: مقرر لا يمكن التسجيل فيه قبل إكمال مقرر آخر بنسبة 80%
CREATE TABLE requirements (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id),
    required_course_id INT REFERENCES courses(id),
    UNIQUE (course_id, required_course_id)
);

CREATE INDEX idx_requirements_course ON requirements(course_id);
CREATE INDEX idx_requirements_required_course ON requirements(required_course_id);

-- المحاضرات المفصلة (محتوى ثنائي اللغة من EPIACADEMY Update 32)
CREATE TABLE lectures (
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
