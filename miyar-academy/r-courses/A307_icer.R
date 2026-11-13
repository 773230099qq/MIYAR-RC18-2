# مقرر A-307: الاقتصاد الصحي وحساب ICER
library(tidyverse)
strategies_data <- data.frame(
  Strategy = c("Standard Care", "New Intervention"),
  Cost = c(1200, 2800),
  QALY = c(14.5, 16.8)
) %>% arrange(Cost)
cost_diff <- strategies_data$Cost[2] - strategies_data$Cost[1]
qaly_diff <- strategies_data$QALY[2] - strategies_data$QALY[1]
icer_value <- cost_diff / qaly_diff
wtp_threshold <- 50000
nmb <- (qaly_diff * wtp_threshold) - cost_diff
cat(sprintf("ICER: $%.2f لكل QALY\n", icer_value))
cat(sprintf("صافي المنفعة النقدية (NMB): $%.2f\n", nmb))
