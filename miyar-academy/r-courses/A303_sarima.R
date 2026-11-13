# مقرر A-303: السلاسل الزمنية والتنبؤ SARIMA
library(forecast)
library(tseries)
set.seed(303)
weeks <- 150
time <- 1:weeks
trend <- 10 + 0.5 * time - 0.003 * (time^2)
seasonality <- 15 * sin(2 * pi * time / 52)
cases <- pmax(0, round(trend + seasonality + rnorm(weeks, 0, 3)))
epidemic_ts <- ts(cases, frequency = 52)
adf.test(epidemic_ts)
sarima_model <- auto.arima(epidemic_ts, seasonal = TRUE)
summary(sarima_model)
forecast_result <- forecast(sarima_model, h = 20)
autoplot(forecast_result)
