# B-102: أساسيات الإحصاء الحيوي (Biostatistics Fundamentals)
# اختبارات مقارنة المتوسطات والجداول الفئوية وفحص الاعتدالية

set.seed(422)

# مقارنة ضغط الدم الانقباضي بين مجموعتين (دواء جديد مقابل دواء Placebo)
new_drug <- rnorm(60, mean = 125, sd = 12)
placebo <- rnorm(60, mean = 133, sd = 14)

cat("=== اختبار t لعينتين مستقلتين ===\n")
t_res <- t.test(new_drug, placebo, var.equal = TRUE)
print(t_res)
cat("متوسط مجموعة الدواء الجديد:", round(mean(new_drug), 2), "mmHg\n")
cat("متوسط مجموعة الدواء الوهمي:", round(mean(placebo), 2), "mmHg\n")
cat("الفرق الوسطي:", round(mean(placebo) - mean(new_drug), 2), "mmHg\n")

# فحص الاعتدالية (شابيرو-ويلك)
cat("\n=== فحص الاعتدالية Shapiro-Wilk ===\n")
print(shapiro.test(residuals(lm(c(new_drug, placebo) ~ rep(c("new", "placebo"), each = 60)))))

# جدول 2x2: العلاقة بين التدخين وارتفاع ضغط الدم
smoker <- sample(c("مدخن", "غير مدخن"), 400, replace = TRUE, prob = c(0.35, 0.65))
high_bp <- ifelse(smoker == "مدخن", rbinom(400, 1, 0.45), rbinom(400, 1, 0.20))
tab <- table(smoker, factor(high_bp, levels = c(0, 1), labels = c("طبيعي", "مرتفع")))

cat("\n=== اختبار مربع كاي للجدول الفئوي ===\n")
print(tab)
chisq_res <- chisq.test(tab, correct = FALSE)
print(chisq_res)

# معامل الارتباط بين العمر وضغط الدم
age <- runif(100, 30, 75)
bp <- 100 + 0.7 * age + rnorm(100, 0, 8)
cor_res <- cor.test(age, bp)
cat("\n=== الارتباط بين العمر وضغط الدم ===\n")
cat("معامل Pearson:", round(cor_res$estimate, 3), " p =", format.pval(cor_res$p.value), "\n")
