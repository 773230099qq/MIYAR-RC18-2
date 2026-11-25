#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
يبني db/seed_curriculum.sql من db/epiacademy_update32.json الذي استُخرج من
وثيقة EPIACADEMY Update 32 الأصلية.

الترميز المعتمد (قرار 1ب و2ج):
  - المستوى التأسيسي: B-1xx (مexists + 6 جديدة من F-10x)
  - المستوى المتوسط: C-2xx (مexists + 6 جديدة من I-20x)
  - المستوى المتقدم: مقرراتنا الحالية A-301..307 + السلسلة الموازية A-40x محتوى EPIACADEMY
جميع المقررات المدموجة تُسجل بـ approval_status='draft' (شارة مسودة) حتى المراجعة البشرية.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "db", "epiacademy_update32.json")
OUT = os.path.join(ROOT, "db", "seed_curriculum.sql")


def sql_str(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def jtext(o):
    return sql_str(json.dumps(o, ensure_ascii=False))


data = json.load(open(SRC, encoding="utf-8"))
registry = {c["code"]: c for c in data["registry"]}
lectures = data["lectures"]

# خريطة الترميز: كود إيبياكاديمي -> كودنا (أو None إن كان نفسه)
CODE_MAP = {
    "F-101": "B-101",  # مقدمة في الوبائيات (مقررنا القائم)
    "F-102": "B-104",  # مقاييس التكرار
    "F-103": "B-105",  # مقاييس الارتباط والأثر
    "F-104": "B-106",  # الوبائيات الوصفية
    "F-105": "B-107",  # مصادر البيانات وجودتها والوعي بالتحيز
    "F-106": "B-102",  # مقدمة في الإحصاء الحيوي (مقررنا القائم)
    "F-107": "B-108",  # مبادئ الترصد
    "F-108": "B-109",  # الأخلاقيات والإنصاف والتواصل المسؤول
    "I-201": "C-201",  # تصاميم الدراسات التحليلية (مقررنا القائم)
    "I-202": "C-204",  # التحيز والارباك
    "I-203": "C-205",  # التقسيم الطبقي والتوحيد القياسي
    "I-204": "C-206",  # الإحصاء الحيوي المتوسط
    "I-205": "C-207",  # تحليل الترصد
    "I-206": "C-208",  # التحقيق في الفاشيات
    "I-207": "C-209",  # إيصال النتائج
    "A-301": "A-401",  # الأساليب الوبائية المتقدمة (سلسلة موازية)
    "A-302": "A-402",  # أساسيات الاستدلال السببي
    "A-303": "A-403",  # الإحصاء الحيوي المتقدم: الانحدار
    "A-304": "A-404",  # ديناميكا الأمراض المعدية
    "A-305": "A-405",  # وبائيات الأمراض المزمنة
    "A-306": "A-406",  # وبائيات البيئة والمهن
    "A-307": "A-407",  # المراجعة المنهجية وتوليف الأدلة
}

LEVEL_MAP = {"Foundation": "Foundational", "Intermediate": "Intermediate", "Advanced": "Advanced"}

# مقررات EPIACADEMY المراد دمجها: 22 (8 تأسيسي + 7 متوسط + 7 متقدم)
ADOPTED = [c["code"] for c in data["registry"] if c["level"] in LEVEL_MAP]

# متطلبات سابقة إضافية (بالترميز الموحد) — استكمال قاعدة الـ80%
EXTRA_REQUIREMENTS = [
    ("C-204", "B-101"),
    ("C-205", "B-101"),
    ("C-206", "B-102"),
    ("C-207", "B-103"),
    ("C-208", "B-101"),
    ("C-209", "B-103"),
    ("A-401", "C-201"),
    ("A-402", "C-201"),
    ("A-403", "C-202"),
    ("A-404", "C-201"),
    ("A-405", "B-102"),
    ("A-406", "B-101"),
    ("A-407", "B-102"),
]

lines = ["-- تم إنشاؤه آليًا بواسطة scripts/build_seed.py — لا تعدّله يدويًا",
         "-- بذور المنهاج الموحد: 22 مقررًا من EPIACADEMY Update 32 + متطلبات سابقة + محاضرات"]
lines.append("BEGIN;")
lines.append("")

# ===== المقررات =====
course_rows = []
for src_code in ADOPTED:
    c = registry[src_code]
    our = CODE_MAP[src_code]
    level = LEVEL_MAP[c["level"]]
    course_rows.append({
        "code": our, "source_ref": src_code,
        "title_ar": c["titleAr"], "title_en": c["titleEn"],
        "level": level, "blurb_ar": c.get("blurbAr"), "blurb_en": c.get("blurbEn"),
        "approval_status": "draft",
    })
    lines.append(
        f"INSERT INTO courses (course_code, title_ar, title_en, level, source_ref, blurb_ar, blurb_en, approval_status) "
        f"VALUES ({sql_str(our)}, {sql_str(c['titleAr'])}, {sql_str(c['titleEn'])}, {sql_str(level)}, "
        f"{sql_str(src_code)}, {sql_str(c.get('blurbAr'))}, {sql_str(c.get('blurbEn'))}, 'draft') "
        f"ON CONFLICT (course_code) DO UPDATE SET title_ar=EXCLUDED.title_ar, title_en=EXCLUDED.title_en, "
        f"source_ref=EXCLUDED.source_ref, blurb_ar=EXCLUDED.blurb_ar, blurb_en=EXCLUDED.blurb_en;"
    )
lines.append("")

# ===== المتطلبات السابقة =====
lines.append("-- المتطلبات السابقة (إضافة آمنة لا تكرر ما هو موجود)")
for course, req in EXTRA_REQUIREMENTS:
    lines.append(
        f"INSERT INTO requirements (course_id, required_course_id) "
        f"SELECT t.id AS target_course_id, r.id AS required_course_id FROM courses t, courses r "
        f"WHERE t.course_code={sql_str(course)} AND r.course_code={sql_str(req)} "
        f"AND NOT EXISTS (SELECT 1 FROM requirements q WHERE q.course_id=t.id AND q.required_course_id=r.id);"
    )
lines.append("")

# ===== المحاضرات (المحتوى المفصل: 24 محاضرة تأسيسية بأجسام كاملة واختبارات) =====
lines.append("-- محتوى المحاضرات المفصل لكل مقرر يحتوي سجلات محاضرات EPIACADEMY")
lines.append("DELETE FROM lectures WHERE course_id IN (SELECT id FROM courses WHERE course_code LIKE 'B-10%' OR course_code LIKE 'C-20%');")
for src_code in ADOPTED:
    arr = lectures.get(src_code)
    if not arr:
        continue
    our = CODE_MAP[src_code]
    for idx, lec in enumerate(arr, start=1):
        payload = {k: lec[k] for k in (
            "exampleEn", "exampleAr", "fieldEn", "fieldAr",
            "calcTitleEn", "calcTitleAr", "calcStepsEn", "calcStepsAr",
            "calcResultEn", "calcResultAr", "terms", "deepSections", "objEn", "objAr") if k in lec}
        lines.append(
            f"INSERT INTO lectures (course_id, lecture_no, title_ar, title_en, objectives_ar, objectives_en, body_ar, body_en, payload, quiz_json) "
            f"SELECT id, {idx}, {sql_str(lec['titleAr'])}, {sql_str(lec['titleEn'])}, "
            f"{sql_str(lec.get('objAr'))}, {sql_str(lec.get('objEn'))}, "
            f"{sql_str(lec.get('bodyAr'))}, {sql_str(lec.get('bodyEn'))}, "
            f"{jtext(payload)}, {jtext(lec.get('quiz', []))} "
            f"FROM courses WHERE course_code={sql_str(our)};"
        )
lines.append("")
lines.append("COMMIT;")

open(OUT, "w", encoding="utf-8").write("\n".join(lines) + "\n")
print("wrote", OUT, "-", len(lines), "lines")
courses_count = len(ADOPTED)
lec_count = sum(len(lectures.get(c, [])) for c in ADOPTED)
q_count = sum(len(l.get("quiz", [])) for c in ADOPTED for l in lectures.get(c, []))
print(f"courses: {courses_count}, lectures: {lec_count}, questions: {q_count}")
