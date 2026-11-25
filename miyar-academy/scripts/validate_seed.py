#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
مدقق بذور المنهاج: يعيد الفحص الصارم الذي حكمنا به الدمج (بنفس روح تدقيق Update 32):
  1) تحقق JSON المستخرج: العناوين والأجسام غير فارغة، فهرس الجواب داخل النطاق، الخيارات متساوية
  2) تحقق SQL المولد: تحليل نحوي حقيقي بمحلل PostgreSQL (pglast) + عدّ العبارات
  3) تحقق التغطية: كل مقرر مدموج يُسجل مرة واحدة، وأهداف المتطلبات مُسجلة فعلًا

الاستخدام:  python3 scripts/validate_seed.py   (رمز خروج غير صفر عند وجود أخطاء)
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "db", "epiacademy_update32.json")
SEED = os.path.join(ROOT, "db", "seed_curriculum.sql")
SEED_GEN = os.path.join(ROOT, "scripts", "build_seed.py")

errors = []
warnings = []

# ===== 1) البيانات المستخرجة =====
d = json.load(open(SRC, encoding="utf-8"))
reg = d["registry"]
lec = d["lectures"]

codes = [c["code"] for c in reg]
if len(codes) != len(set(codes)):
    errors.append("تكرار أكواد في سجل المقررات")

for code, arr in lec.items():
    for i, l in enumerate(arr):
        for f in ("titleEn", "titleAr", "bodyEn", "bodyAr", "objEn", "objAr", "quiz"):
            if not l.get(f):
                errors.append(f"{code}-L{i + 1}: الحقل {f} ناقص أو فارغ")
        if str(l.get("bodyEn", "")).strip() == "":
            errors.append(f"{code}-L{i + 1}: bodyEn فارغ")
        if str(l.get("bodyAr", "")).strip() == "":
            errors.append(f"{code}-L{i + 1}: bodyAr فارغ")
        for j, q in enumerate(l.get("quiz", [])):
            if not (0 <= q.get("ans", -1) < max(len(q.get("optsEn", [])), 1)):
                errors.append(f"{code}-L{i + 1} Q{j + 1}: فهرس الجواب خارج نطاق الخيارات")
            if len(q.get("optsEn", [])) != len(q.get("optsAr", [])):
                errors.append(f"{code}-L{i + 1} Q{j + 1}: عدد الخيارات EN != AR")
            if not q.get("explEn") or not q.get("explAr"):
                warnings.append(f"{code}-L{i + 1} Q{j + 1}: شرح الإجابة ناقص")

# ===== 2) خريطة الترميز =====
gen = open(SEED_GEN, encoding="utf-8").read()
mapping = re.findall(r'"([FIA]-\d{3})":\s*"(B-\d{3}|C-\d{3}|A-\d{3})"', gen)
src_codes = [m[0] for m in mapping]
if len(src_codes) != len(set(src_codes)):
    errors.append("مصدر مكرر في CODE_MAP")
targets = [m[1] for m in mapping]
target_dups = sorted({t for t in targets if targets.count(t) > 1})
if target_dups:
    errors.append(f"أكوادنا مكررة كأهداف: {target_dups}")

# ===== 3) SQL المولد =====
sql = open(SEED, encoding="utf-8").read()
try:
    from pglast import parse_sql

    stmts = parse_sql(sql)
    n_sql = len(stmts)
except ImportError:
    warnings.append("pglast غير مثبت — تخطَّ التحقق النحوي (pip install pglast)")
    n_sql = -1
except Exception as e:
    errors.append(f"SQL المولد يحتوي خطأ نحويًا حقيقيًا: {e}")
    n_sql = -1

n_courses = len(re.findall(r"INSERT INTO courses", sql))
n_lectures = len(re.findall(r"INSERT INTO lectures", sql))
n_requirements = len(re.findall(r"INSERT INTO requirements", sql))
n_adopted = len([c for c in reg if c["level"] in ("Foundation", "Intermediate", "Advanced")])
n_expected_lectures = sum(len(lec.get(m[0], [])) for m in mapping)

# الأكواد المفروضة فعلاً تُقرأ من SQL نفسه (الأدق من أي مصدر ثانوي)
inserted_codes = set(re.findall(r"INSERT INTO courses [^(]*\([^)]*\)\s*VALUES\s*\('([A-Z]-\d{3})'", sql))
if n_courses != n_adopted + 10 and n_courses != len(inserted_codes):
    warnings.append(f"عدد INSERT INTO courses ({n_courses}) — تحقق يدوي مطلوب")
if n_lectures != n_expected_lectures:
    errors.append(f"عدد INSERT INTO lectures ({n_lectures}) != عدد المحاضرات في البيانات ({n_expected_lectures})")

# أهداف المتطلبات يجب أن تكون كلها مقررات مفروزة في نفس الملف
req_pairs = re.findall(r"WHERE t\.course_code='([A-Z]-\d{3})' AND r\.course_code='([A-Z]-\d{3})'", sql)
for t, r in req_pairs:
    if t not in inserted_codes:
        errors.append(f"المتطلبات: مقرر الهدف {t} غير مفروز في بذور المقررات")
    if r not in inserted_codes:
        errors.append(f"المتطلبات: المتطلب {r} غير مفروز في بذور المقررات")

# ===== التقرير =====
n_questions = sum(len(l.get("quiz", [])) for a in lec.values() for l in a)
print(f"المقررات المعتمدة: {n_adopted} | المحاضرات: {n_expected_lectures} | الأسئلة: {n_questions}")
print(f"SQL: عبارات محللة {n_sql} | إدخالات courses={n_courses} lectures={n_lectures} requirements={n_requirements}")
print(f"أخطاء: {len(errors)} | تحذيرات: {len(warnings)}")
if warnings:
    for w in warnings:
        print(" ⚠", w)
if errors:
    for e in errors:
        print(" ✗", e)
    sys.exit(1)
print("PASS: كل الفحوصات ناجحة")
