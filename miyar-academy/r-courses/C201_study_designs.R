# C-201: تصميمات الدراسات (Study Designs)
# مقارنة بين تجربة كوهورت (تحسب RR مباشرة)
# ودراسة الحالات والشواهد (تحسب OR كتقريب للـ RR في الأمراض النادرة)

set.seed(521)

n_pop <- 20000
disease_prob_exposed <- 0.06
disease_prob_unexposed <- 0.015
exposure_prevalence <- 0.3

## ===== تجربة الكوهورت =====
exposed <- rbinom(n_pop, 1, exposure_prevalence)
disease <- rbinom(n_pop, 1, ifelse(exposed == 1, disease_prob_exposed, disease_prob_unexposed))

a <- sum(exposed == 1 & disease == 1)
b <- sum(exposed == 1 & disease == 0)
c_ <- sum(exposed == 0 & disease == 1)
d <- sum(exposed == 0 & disease == 0)

rr_cohort <- (a / (a + b)) / (c_ / (c_ + d))
cat("=== الكوهورت: الخطر النسبي RR مباشرة ===\n")
cat("RR =", round(rr_cohort, 3), "\n")
cat("التفسير: المعرضون لديهم خطر أعلى",(round((rr_cohort - 1) * 100, 1)), "% من غير المعرضين\n")

## ===== الحالات والشواهد =====
n_cases <- 400                       # نختار كل الحالات
cases_exposed <- rbinom(n_cases, 1, 0.55)
controls_exposed <- rbinom(n_cases * 4, 1, 0.30)  # نسبة 1:4 شواهد

or_cc <- (sum(cases_exposed) / (n_cases - sum(cases_exposed))) /
  (sum(controls_exposed) / (length(controls_exposed) - sum(controls_exposed)))
cat("\n=== الحالات والشواهد: نسبة الأرجحية OR ===\n")
cat("OR =", round(or_cc, 3), "(تقريب جيد للـ RR في الأمراض النادرة)\n")

## ===== المقارنة =====
cat("\n=== الخلاصة ===\n")
cat("الخطر النسبي من الكوهورت:", round(rr_cohort, 3), "\n")
cat("نسبة الأرجحية من حالة/شاهد:", round(or_cc, 3), "\n")
cat("الفرق نسبةً إلى RR:", round(abs(or_cc - rr_cohort) / rr_cohort * 100, 1), "%\n")
cat("الدراسات الرصدية أرخص وأسرع، لكن الكوهورت يقيس الخطر مباشرة.\n")
