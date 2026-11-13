# مقرر A-306: هندسة أنظمة الترصد المتقدمة واللوائح الصحية الدولية (IHR 2005, JEE)
library(surveillance)

set.seed(306)
weeks <- 260
baseline <- 40 + 8 * sin(2 * pi * seq_len(weeks) / 52)
outbreak_week <- 200
counts <- round(baseline + rnorm(weeks, 0, 4))
counts[outbreak_week:(outbreak_week + 4)] <- counts[outbreak_week:(outbreak_week + 4)] + c(15, 30, 45, 35, 20)

sts <- sts(observed = counts, start = c(2020, 1), frequency = 52)
plot(sts, main = "سلسلة الترصد الأسبوعية للحالات")

control <- list(range = 150:weeks, noPeriods = 1, b = 3, w = 3, pastWeeksNotAffected = 4)
farrington <- farringtonFlexible(sts, control)
plot(farrington, main = "خوارزمية Farrington لاكتشاف الشذوذ الوبائي")

alarm_weeks <- which(farrington@alarm == TRUE)
cat(sprintf("أسابيع الإنذار المكتشفة: %s\n", paste(alarm_weeks, collapse = ", ")))
cat(sprintf("أسبوع بداية الفاشية الحقيقي: %d\n", outbreak_week))

cusum <- cusum(sts, control = list(range = 150:weeks, k = 1.04, h = 2.26))
alarms_cusum <- which(cusum@alarm == TRUE)
cat(sprintf("أسابيع إنذار CUSUM: %s\n", paste(alarms_cusum, collapse = ", ")))

ihr_capacities <- data.frame(
  capacity = c("الترصد الوبائي الوطني", "المخبر المرجعي", "الاستجابة الطارئة", "نقاط التفتيش الحدودية", "التواصل عن المخاطر"),
  score_jee = c(4, 3, 2, 3, 2),
  target = 5
)
ihr_capacities$gap <- ihr_capacities$target - ihr_capacities$score_jee
ihr_capacities <- ihr_capacities[order(-ihr_capacities$gap), ]
cat("\nفجوات القدرات وفق JEE (الأولوية للفجوة الأكبر):\n")
print(ihr_capacities)
