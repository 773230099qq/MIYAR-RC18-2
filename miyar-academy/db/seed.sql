-- MIYAR: بيانات أولية تجريبية (اختياري — للتشغيل المحلي)
-- يُنفذ بعد schema.sql إذا أردت اختبارًا جاهزًا للتجربة:
--   psql -U $(whoami) -d miyar -f db/seed.sql

INSERT INTO courses (course_code, title_ar, title_en, level) VALUES
  ('A-301', 'الاستدلال السببي المتقدم', 'Advanced Causal Inference', 'Advanced'),
  ('A-302', 'تحليل البقاء', 'Survival Analysis', 'Advanced'),
  ('A-303', 'السلاسل الزمنية والتنبؤ SARIMA', 'Time Series & SARIMA Forecasting', 'Advanced'),
  ('A-304', 'التعلم الآلي والإحصاء البايزي', 'Machine Learning & Bayesian Statistics', 'Advanced'),
  ('A-305', 'المراجعات المنهجية والتحليل التلوي', 'Systematic Reviews & Meta-Analysis', 'Advanced'),
  ('A-306', 'هندسة أنظمة الترصد المتقدمة', 'Surveillance Systems Engineering', 'Advanced'),
  ('A-307', 'الاقتصاد الصحي وتحليل ICER', 'Health Economics & ICER', 'Advanced');

INSERT INTO quizzes (course_id, title_ar, title_en) VALUES (1, 'اختبار IPW الأساسي', 'IPW Basics Quiz');
INSERT INTO questions (quiz_id, question_text, correct_index) VALUES
  (1, 'ما الهدف من توزين الاحتمال العكسي؟', 1),
  (1, 'يبني IPW عينة شبه مستقلة عن:', 0);
INSERT INTO answers (question_id, idx, text) VALUES
  (1, 0, 'تصحيح التحيز الانتقائي'),
  (1, 1, 'محاكاة تعميم النتائج'),
  (1, 2, 'تقليل تكلفة الدراسة'),
  (2, 0, 'توزيع العلاج المرصود'),
  (2, 1, 'النتيجة الصحية'),
  (2, 2, 'العمر فقط');

-- ضبط تسلسل المعرفات بعد الإدراج اليدوي
SELECT setval(pg_get_serial_sequence('courses', 'id'), (SELECT MAX(id) FROM courses));
SELECT setval(pg_get_serial_sequence('quizzes', 'id'), (SELECT MAX(id) FROM quizzes));
SELECT setval(pg_get_serial_sequence('questions', 'id'), (SELECT MAX(id) FROM questions));
SELECT setval(pg_get_serial_sequence('answers', 'id'), (SELECT MAX(id) FROM answers));
