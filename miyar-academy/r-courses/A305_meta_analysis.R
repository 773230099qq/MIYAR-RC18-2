# مقرر A-305: التحليل التلوي والرسوم الغابية
library(meta)
meta_data <- data.frame(
  study = c("Study A", "Study B", "Study C", "Study D"),
  e.treat = c(15, 30, 10, 45),
  n.treat = c(100, 150, 80, 200),
  e.control = c(25, 35, 18, 60),
  n.control = c(100, 150, 85, 200)
)
meta_result <- metabin(e.treat, n.treat, e.control, n.control, studlab = study, data = meta_data, sm = "OR", random = TRUE)
summary(meta_result)
forest(meta_result, main = "الرسم الغابي لتحليل التلوية")
