# مقرر A-304: التعلم الآلي والإحصاء البايزي الحيوي (Random Forests, Bayesian Inference)
library(randomForest)

set.seed(304)
n <- 1500
age <- rnorm(n, 50, 15)
bmi <- rnorm(n, 27, 5)
smoking <- rbinom(n, 1, plogis(-1 + 0.02 * age))
hypertension <- rbinom(n, 1, plogis(-3 + 0.04 * age + 0.08 * bmi + 0.8 * smoking))
diabetes <- rbinom(n, 1, plogis(-2.5 + 0.03 * age + 0.09 * bmi + 0.6 * hypertension))

patients <- data.frame(age, bmi, smoking = factor(smoking), hypertension = factor(hypertension), diabetes = factor(diabetes))
train_idx <- sample(seq_len(n), size = 0.7 * n)
train <- patients[train_idx, ]
test <- patients[-train_idx, ]

rf_model <- randomForest(diabetes ~ age + bmi + smoking + hypertension, data = train, ntree = 500, mtry = 2)
print(rf_model)
print(importance(rf_model))

confusion <- table(Predicted = predict(rf_model, test), Actual = test$diabetes)
print(confusion)
cat(sprintf("دقة النموذج: %.1f%%\n", 100 * sum(diag(confusion)) / sum(confusion)))

posterior_mean <- function(successes, failures, prior_a = 1, prior_b = 1) {
  (successes + prior_a) / (successes + failures + prior_a + prior_b)
}

exposed_events <- sum(patients$diabetes == 1 & patients$hypertension == 1)
exposed_total <- sum(patients$hypertension == 1)
unexposed_events <- sum(patients$diabetes == 1 & patients$hypertension == 0)
unexposed_total <- sum(patients$hypertension == 0)

p1_hat <- posterior_mean(exposed_events, exposed_total - exposed_events)
p0_hat <- posterior_mean(unexposed_events, unexposed_total - unexposed_events)
rr_bayes <- p1_hat / p0_hat
cat(sprintf("الخطر النسبي البايزي (Beta-Binomial): %.3f\n", rr_bayes))
