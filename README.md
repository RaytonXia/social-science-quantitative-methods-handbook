# 社会科学量化方法自学手册

**An Interactive Self-Study Handbook of Quantitative Methods for the Social Sciences**

一本面向初学者的**互动教科书**：从研究问题出发，帮你找到合适的方法、读懂统计输出、动手练习，再把分析写成有依据的论文。中文讲解配规范英文术语，操作示例以 R 为主。

这个项目最初服务于作者自己的**社会心理学量化研究自学**。我们把分散的方法、教材和案例连成可以探索的学习路径，也希望帮助更多老师、同学和独立学习者。欢迎大家指出错误、分享教学建议、推荐可靠来源，一起推动手册更新。

[下载 Windows 版](https://github.com/RaytonXia/social-science-quantitative-methods-handbook/releases/tag/v1.0.1) · [建议与问题](https://github.com/RaytonXia/social-science-quantitative-methods-handbook/issues/new/choose) · [使用说明](使用说明.txt) · [添加方法](app/contribute/README.md)

## 你可以怎样用它

| 你的问题 | 在手册里怎样学 |
| --- | --- |
| 从未学过统计，从哪里开始？ | 跟着 **12 课学习引导**，从问题、变量和一张数据表开始，逐步完成设计、分析与论文草稿。 |
| 我的研究该用什么方法？ | 在 **176 个方法与基础条目**中按研究问题、方法族、难度和软件筛选；从关联方法继续探索。 |
| 软件输出这么多数字，该看什么？ | 每个方法围绕六个关键问题展开。结果表说明指标的含义、方向、大小与不确定性，配具体数字和结论边界。 |
| 方法之间有什么联系？ | 展开**方法分类树**，或沿 **1662—2026 年、89 个事件**的时间线追溯问题、方法与原始文献。 |
| 想对照教材与原文看？ | 在书架阅读 **63 份完整原文**，使用目录、全屏、左右点击翻页、书签、离线英汉查词；另外 10 份提供官方获取入口。 |
| 怎样留下自己的理解？ | 收藏方法，做笔记，记录学习状态、复习安排和课程草稿；导出备份后可迁移学习记录。 |
| 读着读着又有疑问？ | 按需开启 **AI 助手**，自行接入 DeepSeek、OpenAI、Claude 或 Gemini，询问方法与术语。 |

这里的“互动”体现在探索、筛选、对照阅读、练习、记录和问答。**应用不直接执行 R**；代码示例需在你自己的 R 环境中运行。核心内容和内置原文可离线使用；外部教材、视频、段落翻译和 AI 问答需要联网。

## 下载与安装

当前版本 **v1.0.1 · Windows 10/11 x64**。进入 [Release 页面](https://github.com/RaytonXia/social-science-quantitative-methods-handbook/releases/tag/v1.0.1) 的 **Assets**：

| 文件 | 用途 |
| --- | --- |
| `QuantMethodsHandbook_v1.0.1_Setup.exe` | 中文安装向导，安装后从开始菜单打开。推荐初次使用。 |
| `QuantMethodsHandbook_v1.0.1.zip` | 免安装版；完整解压后，打开“社会科学量化方法自学手册_v1.0.1.exe”。 |
| `SHA256_v1.0.1.txt` | 核对下载文件是否完整。 |

GitHub 下载附件采用英文文件名，包内应用、文件夹和安装界面使用中文名称。**Source code** 是维护源码，不是可直接运行的安装包。

需要 .NET Framework 4.6.2 或更高版本及 Microsoft Edge WebView2 Runtime。已有 WebView2 时可以离线安装；缺少时，向导提示使用微软安装程序联网补齐。安装包尚未做代码签名。Android 版尚未同步本版内容，因此此处不提供旧 APK。

## 记录、隐私与 AI

学习记录保存在当前用户的 `%LOCALAPPDATA%/MethodAtlas/WebView`。改名和更新不改变这个位置；卸载保留学习记录。换设备前，请在“我的学习”导出备份，并另行保留自行导入的 PDF。

AI 助手默认关闭。读者使用自己的 API Key，发行包没有共享密钥。密钥和问答仅保留在当前运行内存中；只有主动发送问题或读取模型列表才连接服务商，附上当前方法说明需要主动勾选。服务商可能收费。段落翻译在读者确认后将选中文字发送给 MyMemory，原始文件不会整份上传。

## 欢迎老师和同学参与

如果某段讲解太绕、某个术语不准确、某个指标解释不充分，欢迎直接告诉我们。也欢迎提交有助于初学者理解的真实案例、教材和课程，以及功能建议。

在 [Issues](https://github.com/RaytonXia/social-science-quantitative-methods-handbook/issues/new/choose) 选择“内容纠错与教学建议”或“软件问题”，写清方法编号、具体位置、遇到的困难和参考来源即可。不要求你会写代码。提交前请去掉私人笔记、研究数据、身份信息与 API 密钥。

愿意添加方法或修改程序的贡献者，请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。应用中“方法词典 → 添加方法”提供模板、规范和可以交给后续 AI 的维护说明。

## 许可与第三方资料

**未经作者事先书面同意，不得将项目自有代码或原创教学内容用于商业目的。**

- 项目自有代码允许署名后非商业使用、修改和再分发，具体见 [代码非商业使用许可](LICENSE)。这是提供源码的非商业项目，不宣称采用 OSI 认可的开源许可。
- 原创教学内容采用 [CC BY-NC 4.0](LICENSE-CONTENT.md)。
- 第三方文献、R 包源码、词典、字体和组件各自保留原有许可；项目的非商业条款不限制这些许可已经授予的权利。

发行包保留 63 份许可可核查的完整原文；10 份未内置资料改为官方入口。28 份 R 包手册附带对应版本的完整源码。逐项依据见 [第三方许可说明](docs/THIRD_PARTY.md)、[读物清单](docs/third-party-readings.csv)和[官方获取清单](docs/OFFICIAL_DOWNLOADS.md)。

## 维护与构建

网页和教学数据位于 `app/`。PDF 和 R 包源码随 Release 提供，不重复提交到 Git。内容校验：`python app/contribute/method_tool.py check-app`。

仓库含启动器与 AI 连接组件源码；既有 `Atlas.Shell.dll` 目前仅保留编译产物，因此不声称可以从源码重建全部原生外壳。构建入口、原文恢复与打包方式见 [BUILD.md](docs/BUILD.md)。

## English overview

An interactive textbook for beginners learning quantitative research in the social sciences, originally developed for the author's self-study in social psychology. Explore a linked history and method tree, find methods by research question, interpret statistical output through worked examples, follow a 12-lesson research-writing path, read original sources, and keep study notes. Optional AI assistance supports questions through readers' own API accounts.

Instruction is primarily in Chinese, with standard English terminology and R-oriented examples. The Windows application includes 176 method and foundation entries and 63 offline readings. R code runs in an external R environment. Teachers, students and independent learners are welcome to suggest improvements and report errors. Project-owned code and original instructional content are for noncommercial use; commercial use requires the author's prior written permission. Third-party works retain their respective licenses.
