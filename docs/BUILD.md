# 维护与构建

## 网页预览

使用 Python 3.10 或更高版本，在仓库根目录运行：

```sh
python app/contribute/method_tool.py check-app
python -m http.server 8772 --bind 127.0.0.1 --directory app
```

打开 http://127.0.0.1:8772/ 。浏览器预览与 Windows 应用有不同的学习记录位置。Git 不保存内置 PDF 和 R 包源码压缩包；测试原文阅读前，从同版本 Release ZIP 复制 app/books/ 与 app/licenses/sources/ 到相应目录。不要使用旧版本 ZIP 恢复读物：当前 63 份文件的清单和哈希由 app/licenses/readings.json 固定。

## Windows 启动器

```powershell
& .\native\build.ps1
```

脚本用 Windows 自带的 .NET Framework C# 编译器生成根目录的 EXE。保留 Atlas.Shell.dll 和 WebView2 DLL。启动器与外壳必须有不同的程序集名称，不能将新 EXE 覆盖到 Atlas.Shell.dll。Timer 必须在外壳完成 WinForms 初始化后启动。修改标题时保留 MethodAtlas 用户数据目录、应用 ID、网页来源及学习记录存储键。

既有 Atlas.Shell.dll 的完整源工程未保留在仓库；这里构建的是入口与 AI 连接组件，并非从源码重建全部原生外壳。

## 复建 v1.0.2 Setup

1. 下载 v1.0.2 Release ZIP，完整解压为 `dist/社会科学量化方法自学手册_v1.0.2/`。它提供 63 份原文、28 份对应 R 包源码、许可、微软 WebView2 引导程序和应用文件。
2. 将修改后的应用文件和重新编译的 EXE 复制到该目录。原文变化须同步更新许可清单；不要重新加入仅允许链接的 10 份 PDF。
3. 运行 `python packaging/make_manifest.py`，重新生成明确的安装、卸载清单和 SHA256 基线。脚本会核对读物、源包及必要许可，阻止未经登记的 PDF 混入。
4. 使用 Unicode NSIS，在 packaging 目录执行 `makensis /INPUTCHARSET UTF8 MethodAtlas.nsi`。
5. 实测免安装启动、安装后启动、快捷方式和卸载；检查学习记录保留。

卸载只删除清单中的文件，不递归删除安装目录，不移除学习记录。不得使用旧安装清单打包新版本。构建使用 NSIS 3.04（electron-builder 的 nsis-3.0.4.1 官方构建）；工具不随仓库分发。不同构建环境不保证产物字节完全一致。
