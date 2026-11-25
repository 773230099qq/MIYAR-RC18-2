# B-101: مقدمة في الوبائيات (Introduction to Epidemiology)
# يحسب مقياس الخطر النسبي RR وق Odds Ratio داخل تجربة كوهورت محاكاة

set.seed(421)

n <- 5000
exposed_prob_disease <- 0.20   # احتمال المرض بين المعرضين
unexposed_prob_disease <- 0.05 # احتمال المرض بين غير المعرضين

exposed <- rbinom(n, 1, 0.4)                       # 40% معرضون
disease_exposed <- rbinom(n, 1, ifelse(exposed == 1, exposed_prob_disease, unexposed_prob_disease))

# جدول الطوارئ 2x2
a <- sum(exposed == 1 & disease_exposed == 1)  # معرضون + مرض
b <- sum(exposed == 1 & disease_exposed == 0)  # معرضون + سالمون
c_ <- sum(exposed == 0 & disease_exposed == 1) # غير معرضين + مرض
d <- sum(exposed == 0 & disease_exposed == 0)  # غير معرضين + سالمون

cat("=== جدول الطوارئ 2x2 ===\n")
print(matrix(c(a, b, c_, d), nrow = 2, byrow = TRUE,
             dimnames = list(c("معرض", "غير معرض"), c("مرض", "سالم"))))

RR <- (a / (a + b)) / (c_ / (c_ + d))
OR <- (a * d) / (b * c_)

cat("\nمعدل الإصابة بين المعرضين:", round(a / (a + b), 4), "\n")
cat("معدل الإصابة بين غير المعرضين:", round(c_ / (c_ + d), 4), "\n")
cat("الخطر النسبي (RR):", round(RR, 3), "\n")
cat("نسبة الأرجحية (OR):", round(OR, 3), "\n")
cat("الفرق في الخطر (Risk Difference):", round(a / (a + b) - c_ / (c_ + d), 4), "\n")

# فاصل الثقة 95% للخطر النسبي (طريقة Katz)
se_log_rr <- sqrt(1 / a - 1 / (a + b) + 1 / c_ - 1 / (c_ + d))
ci_low <- exp(log(RR) - 1.96 * se_log_rr)
ci_high <- exp(log(RR) + 1.96 * se_log_rr)
cat("فاصل الثقة 95% للخطر النسبي: [", round(ci_low, 3), ",", round(ci_high, 3), "]\n")
