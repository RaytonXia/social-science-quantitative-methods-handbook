# 教学内容与核对范围

手册面向没有统计基础的读者。176个方法与基础条目从具体问题和有单位的例子讲起，再解释方法与符号，最后练习阅读重要输出。每条保留六个问题、专业定义、实操路线、代码与原始来源。

717项指标与诊断说明分别给出中英名称、教学输出、含义、变化条件和常见误读。176道自测题各自对应本条内容。求和、均值标准误、OR换算、RSA不一致截面另有可操作练习。图示与计算均以教学用途标明；预设的估计值与区间不冒充真实拟合。

“从零开始”的12课用于组织研究任务。方法页的一至两个基础入口供按需补学，不表示读者必须先学完全部方法。学习记录的稳定编号与存储位置保持不变。

## 怎样核对

数值核算覆盖求和、平方、协方差、概率分母、二项概率、标准误、均方误差、似然、AIC、t检验标准误、OR与概率、IRT类别概率、RSA截面及a5变换、DiD、有效样本量、连续时间系数、多重插补方差、后分层权重、贝叶斯更新和空间反馈等示例。它不等于在真实数据上运行了所有模型。

当前176页均通过结构、关联、资源指纹与图示数据校验；在1280×800和390×844浏览器布局逐页核对内容结构与横向溢出，另实际操作四个练习、展开、自测及学习记录保存。截图为实际页面。R示例未在本机逐一执行；应用本身也不执行R。前沿方法只有公开摘要可读时，明确限制在摘要支持的用途和评价范围，不声称复现了完整算法。

![手机中的指标讲解](images/teaching-mobile.png)

## 部分重要解释的直接依据

每个方法页继续保留自己的原始文献与课程。下面列出本次针对易误读之处实际查阅的主要原始资料和官方文档；详细定位也放在相关方法页的“本页讲解的参考依据”中。这不是对所有外部链接的重新可达保证。

| 内容 | 查阅来源 | 核对重点 |
| --- | --- | --- |
| GLM | [R glm](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html) | 分布、连接函数与系数含义 |
| CFA/SEM | [lavaan结果提取](https://lavaan.ugent.be/tutorial/inspect.html) | 标准化、区间与拟合指标 |
| RSA | [RSA官方手册](https://www.stat.ethz.ch/CRAN/web/packages/RSA/refman/RSA.html)及内置0.10.8源码RSA.ST | a1–a5、主轴、共同量尺；不只凭a4下结论 |
| GAM | [summary.gam](https://stat.ethz.ch/R-manual/R-devel/library/mgcv/html/summary.gam.html)、[k.check](https://stat.ethz.ch/R-manual/R-devel/library/mgcv/html/k.check.html) | EDF、近似检验、基函数规模诊断 |
| RQR | [Borgen等原文](https://journals.sagepub.com/doi/10.1177/00811750261450139) | 处理残差化与无条件分位目标 |
| 交错DiD | [did作者教程](https://bcallaway11.github.io/did/articles/did-basics.html) | 分组—时期ATT、控制组与聚合 |
| DML | [DoubleML官方模型说明](https://docs.doubleml.org/stable/guide/models.html) | PLR与IRM、辅助学习与交叉拟合 |
| 贝叶斯计算 | [Stan诊断](https://mc-stan.org/learn-stan/diagnostics-warnings.html)、[loo比较](https://mc-stan.org/loo/reference/loo_compare.html) | R-hat、ESS、计算误差、ELPD差与标准误 |
| 元分析 | [metafor模型](https://wviechtb.github.io/metafor/reference/rma.uni.html)、[预测](https://wviechtb.github.io/metafor/reference/predict.rma.html) | 方差参数、异质性、平均区间与预测区间 |
| 多重插补 | [mice合并规则](https://amices.org/mice/reference/pool.scalar.html) | 组内、组间与总方差，不能拼成多倍样本 |
| 空间模型 | [spdep Moran](https://r-spatial.github.io/spdep/reference/moran.html)、[spatialreg impacts](https://r-spatial.github.io/spatialreg/reference/impacts.html) | 权重、直接/间接/总影响 |
| APC | [Nielsen两样本原文](https://journals.sagepub.com/doi/10.1177/00491241251376509) | 两样本仍有线性识别问题，Introduction与摘要 |
| 网络模块度 | [Zhu等原文](https://journals.sagepub.com/doi/10.1177/00811750261454676) | 概念、算法、网络依赖和重抽样规模校准 |
| 度数比校正 | [Laga等原文](https://journals.sagepub.com/doi/10.1177/00491241251364233) | Background与Degree Ratio Adjustment的分母及假设 |
| 反事实斜率 | [Yu与Zhao原文](https://journals.sagepub.com/doi/10.1177/00811750251340392) | 选择干预的目标，不等于改变背景本身 |
| 逐题作答努力 | [Jiang等公开摘要](https://pubmed.ncbi.nlm.nih.gov/42804241/) | 连续有界评分、人×题层面的不确定分类 |
| COLNI | [Zhang等公开摘要](https://pubmed.ncbi.nlm.nih.gov/42593985/) | 有序数据插补及测量参数恢复；不声称完整复现 |
| 历史生育估计 | [Omenti等公开摘要](https://journals.sagepub.com/doi/10.1177/00491241261463559) | 儿童—妇女比不同于时期总和生育率 |

同题名结构方程文献的 DOI 10.1002/j.2333-8504.1970.tb00783.x 对应1970年ETS报告，已按[出版社元数据](https://onlinelibrary.wiley.com/doi/10.1002/j.2333-8504.1970.tb00783.x)与1973年书中版本区分。事件数/参数数的历史经验亦不作为所有逻辑回归通用最低要求。

新增方法请用[维护规范](../app/contribute/README.md)和随附工具，保留稳定编号。图示和指标卡可通过guide结构继续添加；结构校验不代替学术审查。
