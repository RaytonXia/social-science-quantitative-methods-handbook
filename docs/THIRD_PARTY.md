# 第三方组件和读物

本记录服务于私有试发布后的逐项复核，不把“公开全文”“已下载”当作随软件再分发的授权。`third-party-readings.csv` 列出 73 份内置原文、来源 URL、当前许可记录及尚需核实的事项。

| 组件 | 已随包保存的声明 | 公开前核对事项 |
| --- | --- | --- |
| PDF.js 及字体、CMap、WASM 依赖 | `app/licenses/PDFjs-LICENSE.txt`，`app/vendor/pdfjs/` 内各许可 | 保留全部依赖声明并核对对应版本 |
| Noto Serif SC 子集字体 | `app/licenses/NotoSerifSC-OFL.txt` 和 `NotoSerifSC-NOTICE.txt` | 保留改名、子集化和字体许可说明 |
| 英汉词典数据 | `app/licenses/ECDICT-LICENSE.txt` | 进一步核对数据来源、版本和现有许可对应关系 |
| Microsoft WebView2 SDK | 根目录 `WebView2_LICENSE.txt`、`WebView2_NOTICE.txt` | 保留声明并按微软条款分发运行组件 |
| NSIS | `app/licenses/NSIS-LICENSE.txt` | 保留安装程序相关声明 |
| RSA 0.10.8 手册 | `app/licenses/RSA-NOTICE.txt`、GPL 文本及对应源包 | 保留完整原件、声明和对应源包 |

各读物中的作者与版权声明保持原样。含 GPL 或其他要求提供对应源码的资料，还需逐项核对发行形式和义务；只有指向公开下载页的链接，不能自动替代所有许可要求。

项目自身暂未选定开源许可证。既有原生外壳 `Atlas.Shell.dll` 的完整源工程尚未找回。仓库转为公开前，应完成读物、词典和原生组件的来源与许可确认，并由仓库所有者决定项目许可；未经确认的读物可保留官方入口，移出公开下载包。
