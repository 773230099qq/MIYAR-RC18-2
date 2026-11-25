# دليل النسخ الاحتياطي والاستعادة الآمنة — قاعدة miyar

> مبدأ ثابت: **لا DROP DATABASE miyar أبدًا**. جميع العمليات هنا تُنفَّذ على قواعد منفصلة أو بحذف محصور، ولا تلمس بيانات المستخدمين (users / enrollments / attempts) إلا في مسار الاستعادة الكامل القائم على نسخة احتياطية.

## 1) خد نسخة احتياطية قبل أي خطوة (أمر واحد، عدة ميغابايت فقط)

```bash
pg_dump -U $(whoami) miyar > ~/miyar_backup_$(date +%Y%m%d).sql
ls -la ~/miyar_backup_*.sql   # تأكد أن الملف غير فارغ
```

## 2) الاستعادة الكاملة (بدون DROP DATABASE miyar)

الطريقة الآمنة: تُنشأ قاعدة جديدة، تجري فيها الاستعادة، تُقارن، ثم تبادل الأسماء (ALTER DATABASE ... RENAME لا يفقد شيئًا):

```bash
# أ) استعِد النسخة في قاعدة جديدة اسمها miyar_restored
psql -U $(whoami) -d postgres -c "CREATE DATABASE miyar_restored"
psql -U $(whoami) -d miyar_restored -f ~/miyar_backup_YYYYMMDD.sql

# ب) قارن الأعداد قبل الاعتماد (يجب أن تطابق قاعدة القائمة وقت النسخ)
psql -U $(whoami) -d miyar_restored -ftc "SELECT count(*) FROM users"
psql -U $(whoami) -d miyar_restored -ftc "SELECT count(*) FROM enrollments"
psql -U $(whoami) -d miyar_restored -ftc "SELECT count(*) FROM courses"

# ج) التبادل الآمن
psql -U $(whoami) -d postgres -c "ALTER DATABASE miyar RENAME TO miyar_old_tmp"
psql -U $(whoami) -d postgres -c "ALTER DATABASE miyar_restored RENAME TO miyar"

# د) بعد يومين من التشغيل السليم احذف القديمة يدويًا واعلم أن هذا اختياري
psql -U $(whoami) -d postgres -c "DROP DATABASE miyar_old_tmp"
```

## 3) التراجع الجزئي (إزالة محتوى EPIACADEMY فقط دون فقدان أي مستخدم)

مُختبر فعلًا على PostgreSQL 16.4: صفر صفوف ضائعة من users/enrollments. تبقى 13 مقررًا قائمًا وكل بيانات المستخدمين:

```sql
DELETE FROM lectures;
DELETE FROM requirements;
DELETE FROM courses
 WHERE source_ref IS NOT NULL
   AND course_code NOT IN ('B-101','B-102','B-103','C-201','C-202','C-203',
                           'A-301','A-302','A-303','A-304','A-305','A-306','A-307');
```

## 4) الاختبار التجريبي المعتمد (قاعدة منفصلة miyar_check)

```bash
# اختبار كامل معزول، لا يمس miyar نهائيًا:
psql -U $(whoami) -d postgres -c "CREATE DATABASE miyar_check"
cd ~/MIYAR-RC18-2/miyar-academy
psql -U $(whoami) -d miyar_check -f db/schema.sql
psql -U $(whoami) -d miyar_check -f db/migrate_001_requirements_quizzes.sql
psql -U $(whoami) -d miyar_check -f db/migrate_002_course_content.sql
psql -U $(whoami) -d miyar_check -f db/seed_curriculum.sql
# الأعداد المتوقعة: courses=32 lectures=24 requirements=14
psql -U $(whoami) -d miyar_check -ftc "SELECT count(*) FROM courses"
psql -U $(whoami) -d miyar_check -ftc "SELECT count(*) FROM lectures"
psql -U $(whoami) -d miyar_check -ftc "SELECT count(*) FROM requirements"
# إعادة تشغيل الترقيات والبذور مرة ثانية: الأعداد تبقى نفسها (لا تكرار)
# ثم نرمي النسخة التجريبية:
psql -U $(whoami) -d postgres -c "DROP DATABASE miyar_check"
```

## 5) قواعد ذهبية

1. **كل ملفات migrate_*.sql متسامحة** (IF NOT EXISTS) — إعادة تشغيلها بأمان دائمًا.
2. **seed_curriculum.sql قابل لإعادة التشغيل** — المقررات UPSERT، المتطلبات NOT EXISTS، المحاضرات حذف-محصور ثم إعادة إدراج.
3. **بيانات المستخدمين لا تُمس** في أي ترقية أو إعادة بذور أو تراجع جزئي.
4. لا تستخدم أبدًا حذف قاعدة miyar الأساسية إلا عبر مسار الاستعادة في القسم 2 أعلاه.
