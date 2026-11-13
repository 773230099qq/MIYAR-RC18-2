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

## المقررات (r-courses/)

| الكود | المقرر | الحزم |
|---|---|---|
| A-301 | الاستدلال السببي المتقدم (IPW) | tidyverse, cobalt |
| A-302 | تحليل البقاء ونمذجة كوكس | survival, survminer |
| A-303 | السلاسل الزمنية والتنبؤ SARIMA | forecast, tseries |
| A-304 | التعلم الآلي والإحصاء البايزي | randomForest |
| A-305 | المراجعات المنهجية والتحليل التلوي | meta |
| A-306 | هندسة أنظمة الترصد وIHR 2005/JEE | surveillance |
| A-307 | الاقتصاد الصحي وحساب ICER | tidyverse |

## الاختبارات

```bash
npm test   # 21 اختبارًا: المصادقة، المقررات، التسجيلات، مختبر R
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
