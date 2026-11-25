# B-103: الصحة العامة ومؤشراتها (Public Health Basics)
# حساب مؤشرات الصحة العامة من بيانات اصطناعية لمنطقة يبلغ سكانها 500000 نسمة

population <- 500000
live_births <- 9800
deaths_all <- 3900
deaths_infant <- 68
deaths_under5 <- 89
new_cases <- 1240

cat("=== مؤشرات الوفيات العامة ===\n")
crude_death_rate <- deaths_all / population * 1000
cat("معدل الوفيات الخام لكل 1000 من السكان:", round(crude_death_rate, 2), "\n")

infant_mortality_rate <- deaths_infant / live_births * 1000
cat("معدل وفيات الرضع لكل 1000 مولود حي:", round(infant_mortality_rate, 2), "\n")

under5_mortality_rate <- deaths_under5 / live_births * 1000
cat("معدل وفيات الأطفال دون الخامسة لكل 1000 مولود حي:", round(under5_mortality_rate, 2), "\n")

cat("\n=== مؤشرات المردود السكاني ===\n")
crude_birth_rate <- live_births / population * 1000
cat("معدل المواليد الخام لكل 1000 من السكان:", round(crude_birth_rate, 2), "\n")

rate_of_natural_increase <- crude_birth_rate - crude_death_rate
cat("معدل النمو الطبيعي (لكل 1000):", round(rate_of_natural_increase, 2), "\n")
cat("زمن تضاعف السكان التقريبي (سنة):", round(70 / rate_of_natural_increase, 1), "\n")

cat("\n=== مؤشرات المراضة ===\n")
incidence_rate <- new_cases / population * 100000
cat("معدل الحدوث لكل 100000 شخص سنويًا:", round(incidence_rate, 1), "\n")

# جدول ملخص بالمقارنة مع المرجعية العالمية (نموذج تعليمي)
indicators <- data.frame(
  المؤشر = c("معدل الوفيات الخام", "وفيات الرضع", "معدل الحدوث"),
  القيمة = c(crude_death_rate, infant_mortality_rate, incidence_rate),
  الوحدة = c("لكل 1000", "لكل 1000 مولود", "لكل 100000"),
  مرجع_توضيحي = c(7.5, 17.0, 130.0)
)
print(indicators, row.names = FALSE)
cat("\nالقيم مرجعية تعليمية فقط (بيانات اصطناعية).\n")
