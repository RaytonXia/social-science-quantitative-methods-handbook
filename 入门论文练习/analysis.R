# 教育与生育指标的地区关联：R 自带 swiss 数据的教学分析
# 数据说明：https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/swiss.html
# 这是地区层面、历史观察性数据的练习，不能推断个人因果效应。
# 在自己的项目文件夹运行；输出保存在 tutorial_output 子目录。
data("swiss", package = "datasets")
d <- swiss
stopifnot(nrow(d) == 47, all(complete.cases(d)))
str(d)
summary(d[c("Education", "Fertility")])
colSums(is.na(d))
out <- "tutorial_output"
dir.create(out, showWarnings = FALSE)
fit <- lm(Fertility ~ Education, data = d)
print(summary(fit))
print(confint(fit, level = 0.95))
png(file.path(out, "scatter.png"), width = 1600, height = 1100, res = 160)
plot(d$Education, d$Fertility, xlab = "Education (%)", ylab = "Fertility index",
     pch = 19, col = "#486B8F")
abline(fit, col = "#A36C42", lwd = 2)
dev.off()
pdf(file.path(out, "diagnostics.pdf"), width = 8, height = 8)
par(mfrow = c(2, 2))
plot(fit)
dev.off()
table <- cbind(coef(summary(fit)), confint(fit))
write.csv(table, file.path(out, "model_table.csv"))
capture.output(summary(fit), file = file.path(out, "model_summary.txt"))
capture.output(sessionInfo(), file = file.path(out, "session_info.txt"))
print(sort(cooks.distance(fit), decreasing = TRUE)[1:5])
print(cor.test(d$Education, d$Fertility, method = "spearman", exact = FALSE))
# Spearman 相关是探索性补充；它与线性斜率的目标量不同。
# 在真实研究中依据理论和设计评估非线性、异方差、独立性和空间相关。
