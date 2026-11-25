# أكاديمية MIYAR التعليمية — MIYAR Complete Master Archive

منصة ويب أكاديمية ثنائية اللغة (عربي/إنجليزي) متخصصة في الوبائيات والإحصاء الحيوي والصحة العامة، مع دبلوم متقدم (A-301 إلى A-307) ومختبر R معزول التنفيذ.

> هذا المجلد (`miyar-academy/`) إضافة مستقلة لا تمس تطبيق 90D Learning الموجود في جذر المستودع.

## بنية المشروع

```
miyar-academy/
├── src/                  # الباك-إند (Node.js / Express)
│   ├── app.js            # تطبيق Express وجميع المسارات
│   ├── server.js         # نقطة التشغيل
│   ├── config.js         # الإعدادات (JWT_SECRET, DATABASE_URL)
│   ├── db.js             # طبقة قاعدة البيانات (pg Pool)
│   ├── middleware/auth.js# مصادقة JWT + تحكم بالأدوار
│   ├── routes/           # auth, courses, enrollments, rlab
│   └── tests/            # 21 اختبارًا آليًا (node:test + pg-mem)
├── db/schema.sql         # مخطط PostgreSQL (users, courses, enrollments)
├── frontend/             # الفرونت-إند (Next.js 14 / React 18)
│   └── app/              # الرئيسية، المقررات، تسجيل الدخول
├── r-courses/            # أكواد المقررات السبعة بلغة R
├── r-sandbox/            # صورة Docker معزولة لتنفيذ أكواد R
├── Dockerfile            # صورة الباك-إند
├── docker-compose.yml    # db + backend + frontend + r-sandbox
└── docs/                 # الأرشيف الرئيسي (HTML)
```

## واجهات API

| المسار | الطريقة | الوصف | المصادقة |
|---|---|---|---|
| `/api/health` | GET | فحص صحة الخدمة | لا |
| `/api/auth/register` | POST | تسجيل مستخدم (Student/Instructor/Admin) | لا |
| `/api/auth/login` | POST | تسجيل الدخول وإصدار JWT | لا |
| `/api/courses` | GET | قائمة المقررات | لا |
| `/api/courses/:code` | GET | مقرر برمزه | لا |
| `/api/courses` | POST | إنشاء مقرر | Admin/Instructor |
| `/api/enrollments` | POST | التسجيل في مقرر | نعم |
| `/api/enrollments/me` | GET | تسجيلات المستخدم وتقدمه | نعم |
| `/api/enrollments/:id/progress` | PATCH | تحديث نسبة التقدم (0-100) | نعم |
| `/api/rlab/scripts` | GET | السكربتات المسموحة | نعم |
| `/api/rlab/run` | POST | تنفيذ سكربت R من القائمة البيضاء | نعم |

## التشغيل عبر Docker (موصى به)

```bash
export POSTGRES_PASSWORD=<كلمة مرور قوية>
export JWT_SECRET=<مفتاح عشوائي طويل>
export R_LAB_HOST_DIR=$(pwd)/r-courses
docker compose up --build
```

- الباك-إند: http://localhost:3000/api/health
- الفرونت-إند: http://localhost:3001

## التشغيل المحلي للتطوير

```bash
# الباك-إند (يتطلب PostgreSQL محليًا)
npm install
npm test
DATABASE_URL=postgres://miyar:miyar@localhost:5432/miyar JWT_SECRET=dev-secret npm run dev

# الفرونت-إند
cd frontend && npm install && npm run dev
```

## مختبر R (REQ-011: الأمان والعزل)

تنفيذ أكواد الطلاب يتم عبر وضعين:

1. **docker** (الافتراضي في النشر): حاوية `miyar/r-sandbox` بلا شبكة (`--network none`)، بذاكرة 512MB ومعالج واحد، والسكربتات تركب للقراءة فقط.
2. **local**: `Rscript` مباشرة (للتطوير فقط).

التنفيذ مقيد بقائمة سكربتات بيضاء (`ALLOWED_SCRIPTS`) وحد زمني (`R_TIMEOUT_MS`، الافتراضي 60 ثانية).

## المنهاج الموحد (EPIACADEMY Update 32)

تمت المادة من مكتبة EPIACADEMY (تحديث 32 بتاريخ 2026-11-25) بعد تحليلها وتوحيد ترميزها مع منصتنا (قرارات 1ب و2ج):

- **22 مقررًا معتمدًا** في ملف `db/seed_curriculum.sql`: التأسيسي B-1xx (9 مقررات بعد الدمج)، المتوسط C-2xx (8 مقررات بعد الدمج)، والمتقدم: سلسلته الموازية A-40x (7 مقررات) إلى جانب مقرراتنا الأصلية A-301..307
- **24 محاضرة مفصلة ثنائية اللغة** مع أهداف وأمثلة وحسابات تطبيقية و **97 سؤالًا تكوينيًا** (توليد آلي عبر `scripts/build_seed.py` من `db/epiacademy_update32.json`)
- **شارة «مسودة بانتظار مراجعة»** تظهر على كل مقرر بحالة `approval_status = 'draft'` حتى مراجعة بشرية علمية (وفق تدقيق Update 32 r4)
- أرشيف الشفافية: `content/epiacademy_update32_source.html` (المصدر الأصلي الكامل) و`content/course_audit_update32_r4.md` (تدقيق المقررات)

نقاط نهاية المحتوى الجديدة:

| المسار | الوصف |
|---|---|
| `GET /api/courses/:code/lectures` | فهرس محاضرات المقرر |
| `GET /api/courses/:code/lectures/:no` | محاضرة كاملة: أهداف، جسم ثنائي اللغة، مثال تطبيقي، اختبار مفسّر |

ترقية قاعدة بيانات قائمة (مثل هاتفك في Termux):

```bash
psql -U $(whoami) -d miyar -f db/migrate_002_course_content.sql
psql -U $(whoami) -d miyar -f db/seed_curriculum.sql
ثم أعد تشغيل الخادم (Ctrl+C ثم npm start)
```

## المستويات الأكاديمية ونظام المتطلبات السابقة

ثلاثة مستويات مرتبة، والتسجيل في المقررات المتوسطة والمتقدمة يتطلب إكمال المتطلبات السابقة بنسبة **80%** على الأقل:

| المستوى | المقررات | المتطلبات السابقة |
|---|---|---|
| التأسيسي | B-101 مقدمة في الوبائيات، B-102 أساسيات الإحصاء الحيوي، B-103 الصحة العامة ومؤشراتها | بلا (متاح للتسجيل مباشرة) |
| المتوسط | C-201 تصاميم الدراسات، C-202 الانحدار، C-203 تحليل البيانات الصحية | C-201 يتطلب إتمام B-101 بنسبة ≥ 80% |
| المتقدم | A-301 إلى A-307 | يُفعل عبر جدول `requirements` |

نقاط النهاية الجديدة:

| المسار | الوصف |
|---|---|
| `GET /api/courses/levels` | كل المقررات مصنفة بحسب المستوى مع رمز المتطلب السابق لكل مقرر |
| `GET /api/courses/:code/eligibility` | (يتطلب مصادقة) هل الطالب مؤهل؟ وما المتطلبات الناقصة مع نسبة تقدمه |
| `POST /api/enrollments` | يرفض التسجيل برمز **403** ويعيد قائمة `missing` إذا لم تُستوفَ المتطلبات |

## المقررات (r-courses/)

| المستوى | الكود | المقرر | الحزم |
|---|---|---|---|
| تأسيسي | B-101 | مقدمة في الوبائيات: RR / OR / فاصل الثقة (base R) | base R |
| تأسيسي | B-102 | أساسيات الإحصاء الحيوي: t.test، مربع كاي، شابيرو | base R |
| تأسيسي | B-103 | الصحة العامة ومؤشراتها: الوفيات، المراضة، النمو السكاني | base R |
| متوسط | C-201 | تصاميم الدراسات: كوهورت (RR) مقابل حالات/شواهد (OR) | base R |
| متوسط | C-202 | الانحدار الخطي واللوجستي (lm / glm) | base R |
| متوسط | C-203 | تنظيف البيانات الصحية والقيم الشاذة (IQR) | base R |
| متقدم | A-301 | الاستدلال السببي المتقدم (IPW) | tidyverse, cobalt |
| A-302 | تحليل البقاء ونمذجة كوكس | survival, survminer |
| A-303 | السلاسل الزمنية والتنبؤ SARIMA | forecast, tseries |
| A-304 | التعلم الآلي والإحصاء البايزي | randomForest |
| A-305 | المراجعات المنهجية والتحليل التلوي | meta |
| A-306 | هندسة أنظمة الترصد وIHR 2005/JEE | surveillance |
| A-307 | الاقتصاد الصحي وحساب ICER | tidyverse |

## الاختبارات

```bash
npm test   # 35 اختبارًا: المصادقة، المقررات، المحاضرات، التسجيلات، مختبر R، نظام المستويات
```

تُنفذ الاختبارات على قاعدة بيانات في الذاكرة (pg-mem) دون الحاجة لخادم PostgreSQL.

## متغيرات البيئة

| المتغير | الوصف | الافتراضي |
|---|---|---|
| `JWT_SECRET` | مفتاح توقيع JWT (إلزامي) | — |
| `DATABASE_URL` | رابط PostgreSQL | postgres://miyar:miyar@localhost:5432/miyar |
| `PORT` | منفذ الباك-إند | 3000 |
| `R_SANDBOX_MODE` | docker أو local | local |
| `R_SANDBOX_IMAGE` | صورة حاوية R | miyar/r-sandbox:latest |
| `R_LAB_HOST_DIR` | مسار مجلد r-courses على المضيف | /opt/miyar/r-lab |
| `R_TIMEOUT_MS` | مهلة تنفيذ سكربت R | 60000 |
