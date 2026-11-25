# C-202: الانحدار الخطي واللوجستي (Regression Models)
# نموذج انحدار خطي للتنبؤ بضغط الدم، ونموذج لوجستي لاحتمال ارتفاع الضغط

set.seed(522)

n <- 800
age <- runif(n, 25, 80)
bmi <- rnorm(n, 27, 4)
smoking <- rbinom(n, 1, 0.3)

# ضغط الدم الانقباضي: علاقة خطية + تشويش
bp <- 95 + 0.55 * age + 1.4 * bmi + 6 * smoking + rnorm(n, 0, 8)

## ===== الانحدار الخطي =====
fit <- lm(bp ~ age + bmi + smoking)
cat("=== الانحدار الخطي المتعدد ===\n")
print(summary(fit)$coefficients)
cat("\nR-squared:", round(summary(fit)$r.squared, 3), "\n")
cat("التفسير: كل سنة عمر إضافية ترتبط بزيادة", round(coef(fit)["age"], 2), "mmHg\n")
cat("كل وحدة مؤشر كتلة إضافية ترتبط بزيادة", round(coef(fit)["bmi"], 2), "mmHg\n")
cat("التدخين يرفع الضغط بمتوسط", round(coef(fit)["smoking"], 2), "mmHg\n")

## ===== الانحدار اللوجستي =====
high_bp <- as.integer(bp >= 140)
glm_fit <- glm(high_bp ~ age + bmi + smoking, family = binomial)
cat("\n=== الانحدار اللوجستي ===\n")
print(summary(glm_fit)$coefficients)

or_age <- exp(coef(glm_fit)["age"])
or_bmi <- exp(coef(glm_fit)["bmi"])
or_smoke <- exp(coef(glm_fit)["smoking"])
cat("\nأرجحية ارتفاع الضغط تتضاعف عند زيادة العمر سنة:", round(or_age, 3), "\n")
cat("لكل وحدة مؤشر كتلة:", round(or_bmi, 3), "\n")
cat("للمدخنين مقابل غير المدخنين:", round(or_smoke, 3), "\n")
