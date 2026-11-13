# مقرر A-302: تحليل البقاء ونمذجة كوكس
library(survival)
library(survminer)
data(lung)
lung <- lung %>% mutate(status_bin = ifelse(status == 2, 1, 0))
km_fit <- survfit(Surv(time, status_bin) ~ sex, data = lung)
ggsurvplot(km_fit, data = lung, pval = TRUE, risk.table = TRUE)
cox_model <- coxph(Surv(time, status_bin) ~ age + sex + ph.ecog, data = lung)
summary(cox_model)
