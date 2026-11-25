# C-203: تحليل البيانات الصحية (Health Data Analysis)
# تنظيف بيانات مسجلة اصطناعية والتعامل مع القيم الشاذة والقيم المفقودة

set.seed(523)

n <- 500
height <- rnorm(n, 168, 9)   # سم
weight <- rnorm(n, 74, 13)   # كغ
systolic <- rnorm(n, 126, 14)

# إدخال قيم شاذة وأخطاء قياس تلوي
height[c(10, 200)] <- c(15, 265)      # طول مستحيل
systolic[c(55, 310)] <- c(-20, 320)   # ضغط مستحيل
weight[30:39] <- NA                    # قياسات مفقودة

raw_bmi <- weight / (height / 100)^2
cat("=== قبل التنظيف ===\n")
cat("عدد القياسات:", n, "\n")
cat("مؤشر كتلة الجسم المتوسط (غير موثوق):", round(mean(raw_bmi, na.rm = TRUE), 2), "\n")

## ===== التنظيف =====
clean <- data.frame(height, weight, systolic)
clean$height[clean$height < 100 | clean$height > 230] <- NA
clean$systolic[clean$systolic < 60 | clean$systolic > 260] <- NA

# القيم الشاذة الإحصائية ضمن الحدود الممكنة: طريقة IQR
clean_bmi_premiss <- clean$weight / (clean$height / 100)^2
q <- quantile(clean_bmi_premiss, c(0.25, 0.75), na.rm = TRUE)
iqr_bounds <- c(q[1] - 3 * (q[2] - q[1]), q[2] + 3 * (q[2] - q[1]))
clean_bmi_premiss[clean_bmi_premiss < iqr_bounds[1] | clean_bmi_premiss > iqr_bounds[2]] <- NA

cat("\n=== بعد التنظيف ===\n")
cat("مؤشر كتلة الجسم المتوسط:", round(mean(clean_bmi_premiss, na.rm = TRUE), 2), "\n")
cat("الوسيط:", round(median(clean_bmi_premiss, na.rm = TRUE), 2), "\n")
cat("الانحراف المعياري:", round(sd(clean_bmi_premiss, na.rm = TRUE), 2), "\n")
cat("عدد القيم المفقودة لمؤشر الكتلة:", sum(is.na(clean_bmi_premiss)), "\n")

# استبدال القيم المفقودة بالوسيط (تعويض بسيط للتعليم فقط)
clean_bmi_imputed <- ifelse(is.na(clean_bmi_premiss),
                            median(clean_bmi_premiss, na.rm = TRUE),
                            clean_bmi_premiss)
cat("بعد التعويض بالوسيط: المتوسط =", round(mean(clean_bmi_imputed), 2), "\n")

cat("\nالدروس: تحقق دائمًا من الحدود الممكنة قبل التحليل،\n")
cat("وقارن المتوسط قبل وبعد تنظيف القيم الشاذة.\n")
