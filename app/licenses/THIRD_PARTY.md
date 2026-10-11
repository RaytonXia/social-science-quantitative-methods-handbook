# 第三方许可与来源

核查日期：2026-10-11。本版本为非商业的完整原件汇编，不对内置 PDF 加水印、删页、改写或去除原有版权信息。不同作品保留各自许可，项目自有代码的非商业限制不施加到这些作品上。

## 读物处理

73 份原目录条目中，63 份保持原件随包分发，10 份仅提供官方入口。作者、题名、来源、许可、依据、文件哈希和对应源码记录在 [逐项清单](readings.json)；应用内可在“关于 → 版权与来源”查看同一记录。官方入口清单见 [OFFICIAL_DOWNLOADS.md](../../docs/OFFICIAL_DOWNLOADS.md)。未内置不等于禁止个人下载，只表示本次未取得足够的再分发依据。

| 类别 | 处理与依据 |
| --- | --- |
| R 入门、数据导入导出手册 | PDF 第 2 页明确允许保留声明后的原样复制和分发。 |
| Learning Statistics with R | PDF 第 3 页 CC BY-SA 4.0；保持原文。 |
| OpenIntro 英文教材 | 原文版权页与官方许可页对应 CC BY-SA 3.0；原样分发，不作为本项目自有教材或声称背书。 |
| 动手学深度学习中文 PDF | 官方构建配置将教材设为 CC BY-SA 4.0、书中代码为 MIT-0。仓库其他软件代码另用 Apache 2.0，不能混为同一种许可。 |
| 28 份 R 包参考手册 | PDF 版本与各源包 DESCRIPTION 一致。完整源包和 Rd 文档随软件保存在 app/licenses/sources/；保留 GPL、LGPL、MIT、Unlimited 及包内特殊声明。它们作为独立文献汇集，不链接进本项目应用代码。 |
| JSS 论文 | 按期刊 Copyright Notice 的 CC BY 3.0 分发，保留作者、DOI 和原文。 |
| PLOS、Frontiers、IRSP、JOSS、Psychonomic Bulletin & Review 论文 | 按原文具体版权页处理。Frontiers 2012 年信度论文明确为 CC BY-NC 3.0，未改写成通用 CC BY；2013 年 PLOS 网络论文原文未给出 CC BY 版本，记录原始分发授权而不猜测版本。 |
| 两篇《心理学报》论文 | 期刊政策 CC BY-NC-ND 4.0；只分发未改动的完整 PDF，不发布改写、翻译版本。 |

所有 CC 作品均保留作者、题名、原始来源、许可链接与原文声明。带 NC 的资料限非商业使用；带 ND 的资料不在本项目内发布改编版；带 SA 的资料独立保持原许可。应用内按需生成的个人译文不作为发行物共享。文内另有第三方标识的内容依其特别声明。

## 软件、数据与字体

| 组件 | 版本及核对结果 | 许可与随包材料 |
| --- | --- | --- |
| PDF.js | 5.6.205；197 个本地 vendor 文件与官方 pdfjs-dist npm 包逐字节一致 | Apache 2.0；保留 CMap、Foxit/Liberation 字体、JBIG2/OpenJPEG/QCMS 等各自声明；附 core-js 3.48.0 的 MIT 声明。 |
| WebView2 SDK | 1.0.4258.31；3 个 DLL 与 LICENSE、NOTICE 共 5 个文件匹配官方 NuGet 包 | 根目录 WebView2_LICENSE.txt（BSD 3-Clause）及 WebView2_NOTICE.txt。 |
| WebView2 引导程序 | Microsoft 签名的 Evergreen Bootstrapper | 按微软官方分发说明随包提供；不打包 Edge Stable 浏览器。运行时仍受微软自身条款约束。 |
| ECDICT | 745,179 个词条的音标和释义均与官方 CSV 匹配；只规范换行 | MIT，保留 ECDICT-LICENSE.txt；CSV SHA256 为 1a6947e04785db63613a92e14903cdae7954f7e84860b10e68e5c7cbb3f9c3cf。 |
| Atlas Editorial Serif | Noto Serif SC 的字符子集，改内部字体名并转换 WOFF2 | SIL OFL 1.1；NotoSerifSC-OFL.txt 与 NotoSerifSC-NOTICE.txt。 |
| NSIS | 3.04；安装程序构建工具 | NSIS-LICENSE.txt 保留许可，构建工具不作为应用功能集成。 |
| Atlas.Shell.dll | 本项目既有自有外壳编译产物，不是以第三方名义授权的组件 | 适用项目代码许可；完整外壳源工程尚未找回，不能宣称全套原生代码可重建。 |

源码与许可入口：

- PDF.js：[官方发行包](https://registry.npmjs.org/pdfjs-dist/-/pdfjs-dist-5.6.205.tgz)、[源码](https://github.com/mozilla/pdf.js)。
- core-js：[对应版本许可](https://github.com/zloirock/core-js/blob/v3.48.0/LICENSE)。
- WebView2：[官方 NuGet](https://www.nuget.org/packages/Microsoft.Web.WebView2/1.0.4258.31)、[运行组件分发说明](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution)。
- ECDICT：[作者仓库](https://github.com/skywind3000/ECDICT)、[MIT 许可](https://github.com/skywind3000/ECDICT/blob/master/LICENSE)。
- Noto Serif SC：[官方字体与许可](https://github.com/google/fonts/tree/main/ofl/notoserifsc)。
- CRAN：[包许可约定](https://cran.r-project.org/doc/manuals/r-release/R-exts.html#Licensing)；具体版本源码及 SHA256 见 app/licenses/source-archives.json。
- OpenIntro：[官方许可](https://www.openintro.org/license/)；D2L：[书籍构建配置](https://github.com/d2l-ai/d2l-zh/blob/master/config.ini)；JSS：[期刊版权声明](https://www.jstatsoft.org/about)；《心理学报》：[版权政策](https://journal.psych.ac.cn/xlxb/CN/column/column14.shtml)。

本记录针对包内这些具体文件。外部链接、后续更新或其他版本不因被列出而自动获得再分发许可。若更换任何原文或组件，应重新确认版本、许可、特殊署名要求与文件哈希。
