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
    level VARCHAR(50) NOT NULL
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

-- نظام الاختبارات الآلية (REQ-003)
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id),
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    quiz_id INT REFERENCES quizzes(id),
    question_text VARCHAR(500) NOT NULL,
    correct_index INT NOT NULL CHECK (correct_index >= 0),
    points INT NOT NULL DEFAULT 1
);

CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    question_id INT REFERENCES questions(id),
    idx INT NOT NULL,
    text VARCHAR(255) NOT NULL
);

CREATE TABLE attempts (
    id SERIAL PRIMARY KEY,
    quiz_id INT REFERENCES quizzes(id),
    user_id INT REFERENCES users(id),
    score INT NOT NULL,
    total INT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_quiz ON questions(quiz_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_attempts_user ON attempts(user_id);
