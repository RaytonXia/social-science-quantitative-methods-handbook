# Windows AI 连接组件

`AssistantHost.cs` 是可构建的 Windows 入口和 HTTPS 连接组件。它加载同目录上级的 `Atlas.Shell.dll`，沿用已安装外壳的 WebView2 配置、`https://methodatlas.local/index.html` 来源、学习记录位置、全屏、复制及导出功能。`Atlas.Shell.dll` 是此前已交付的原生外壳程序集，未修改其代码；本目录并不声称包含该旧外壳的原始工程。

接口协议位于 `app/assistant-core.js`，界面位于 `app/assistant.js`。默认关闭；打开界面和开启开关不会发起 API 请求。只有“读取模型列表”和“发送问题”联系服务商。四家 API 使用各自原生协议：OpenAI Responses、DeepSeek Chat Completions、Claude Messages、Gemini generateContent。

DeepSeek 请求明确使用 `thinking: {type: "disabled"}`，优先返回可阅读的教学正文；Windows 字段校验同步允许这一参数。模型 ID 从账号返回的列表中选择或由读者填写，不能假定旧模型名称一直有效。真实接口已验证连接与连续问答；这不意味着生成的统计解释自动正确，页面仍提示核对教学说明与原始来源。

密钥与对话只在内存中保存；关闭助手清除，收起面板保留本次会话。只在本地保存服务商与模型 ID。密钥不放在 URL、日志、学习备份、浏览器存储或程序包中。AI 请求不包含用户的笔记、导入文件、阅读历史。发送教学内容需要勾选，并可事先查看摘录。模型回答作为纯文字显示，不执行 HTML、代码或工具调用。

原生传输仅接受应用自身页面的消息，仅允许四个固定 HTTPS API 主机；不跟随重定向，不启用 Cookie，不关闭 TLS 验证。不启动本地开放代理，也不关闭 WebView 的跨域安全策略。取消、超时、2 MB 响应上限及固定错误提示在原生层处理。请求已被服务商接收后，停止等待不保证免于计费。

## 构建

启动顺序：先由原生外壳完成 WinForms 初始化，再在首次 `Application.Idle` 时启动 AI 桥接定时器。`Timer.Start()` 会创建原生窗口，不能放在外壳的 `SetCompatibleTextRenderingDefault` 之前。启动异常会按实际原因提示，并仅在本机 `LocalAppData/MethodAtlas/Diagnostics/startup.log` 保存初始化诊断。

使用 Windows 自带 .NET Framework 4.x C# 编译器。`build.ps1` 在本目录运行，不需要下载 SDK。输出沿用软件原有文件名与图标。构建前关闭此软件；脚本不会结束其他程序。

运行 `build.ps1` 前，上级目录应已有 `Atlas.Shell.dll`、三个 WebView2 文件、`atlas.ico`、现有 exe.config 和 app 目录。首次接入时，维护脚本将旧版 EXE 原样保存为 `Atlas.Shell.dll`；之后不可用新入口 EXE 覆盖它。

浏览器预览走官方 API 的直接请求，能否连通受该厂商的跨域策略影响；正式 Windows 包走上述原生传输。没有密钥时采用合成响应测试，不把合成回答标作真实 API 返回。安卓原生工程不在此目录，不能仅替换网页文件就宣称 APK 已更新。

官方接口依据（实现时查阅）：

- https://developers.openai.com/api/docs/guides/text
- https://api-docs.deepseek.com/api/create-chat-completion/
- https://platform.claude.com/docs/en/api/messages/create
- https://ai.google.dev/api/generate-content
