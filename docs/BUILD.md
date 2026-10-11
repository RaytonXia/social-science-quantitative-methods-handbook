# 维护与构建

## 1. 网页预览

安装 Python 3.10 或更高版本后，在仓库根目录运行：

```sh
python app/contribute/method_tool.py check-app
python -m http.server 8772 --bind 127.0.0.1 --directory app
```

浏览器访问 `http://127.0.0.1:8772/`。不要直接双击 HTML 进行功能验收。浏览器预览与 Windows 应用使用不同的学习记录位置。

Git 中不保存 73 份第三方 PDF。若要测试原文阅读，先下载同版本 Release ZIP，把其中 `app/books/` 的内容复制到本仓库的 `app/books/`。Git 已忽略这些 PDF。不要把自己的阅读记录、API Key 或私人附件加入仓库。

## 2. Windows 启动器

仓库保留 `Atlas.Shell.dll` 和对应 WebView2 DLL。启动器源码位于 `native/AssistantHost.cs`，运行：

```powershell
& .
ativeuild.ps1
```

脚本使用 Windows 自带 .NET Framework C# 编译器生成根目录的 EXE。不要把生成的启动器覆盖到 `Atlas.Shell.dll`；二者必须保持不同程序集名称。原生外壳源工程当前不在仓库中，因此这些步骤构建的是入口与 AI 连接组件，并非从零重建全部原生外壳。

## 3. 复建 v1.0 Setup

1. 下载 Release 中的 ZIP，完整解压到仓库内的 `dist/`，使路径成为 `dist/社会科学量化方法自学图谱_v1.0/`。该完整目录提供 PDF、微软 WebView2 引导程序和其他发行依赖。
2. 如果修改了现有应用文件，将相应文件复制到上述目录；重新编译启动器后也需复制新 EXE。
3. 使用 Unicode NSIS，在 `packaging/` 目录执行 `makensis /INPUTCHARSET UTF8 MethodAtlas.nsi`。输出为 `dist/社会科学量化方法自学图谱_v1.0_Setup.exe`。

`payload-install.nsh` 和 `payload-uninstall.nsh` 固定记录 v1.0 的 360 个文件。新增或移除文件时必须同步更新安装及卸载清单，不要只修改其中一份。卸载使用明确文件名，不递归删除安装目录，也不移除学习记录目录。`packaging/payload-manifest.json` 是原 v1.0 文件校验基线；修改后的版本需要重新生成校验值并实际验证安装、启动与卸载。

已发布 v1.0 的 NSIS 版本为 3.04，工具来自 electron-builder-binaries 的 nsis-3.0.4.1 官方构建。工具下载地址见 [该版本发布页](https://github.com/electron-userland/electron-builder-binaries/releases/tag/nsis-3.0.4.1)。本仓库不附编译器缓存，也不承诺不同编译环境产生字节完全一致的 EXE。
