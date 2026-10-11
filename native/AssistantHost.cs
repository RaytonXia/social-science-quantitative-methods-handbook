using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

[assembly: AssemblyTitle("社会科学量化方法自学手册")]
[assembly: AssemblyProduct("社会科学量化方法自学手册")]
[assembly: AssemblyVersion("1.4.3.0")]
[assembly: AssemblyFileVersion("1.4.3.0")]

// Keeps the established WebView shell, profile, reader bridge and origin unchanged.
// This entry point only adds an opt-in, fixed-provider HTTPS transport.
internal static class AssistantHost {
    private static readonly HashSet<CoreWebView2> Attached = new HashSet<CoreWebView2>();
    private static readonly List<AssistantBridge> Bridges = new List<AssistantBridge>();
    [STAThread] private static void Main() {
        ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12;
        var timer = new System.Windows.Forms.Timer { Interval = 400 };
        timer.Tick += delegate {
            foreach (Form form in Application.OpenForms) AttachChildren(form);
        };
        // Timer.Start creates a native window. Defer it until the shell has called
        // SetCompatibleTextRenderingDefault and entered its message loop.
        EventHandler startBridge = null;
        startBridge = delegate {
            Application.Idle -= startBridge;
            timer.Start();
            foreach (Form form in Application.OpenForms) AttachChildren(form);
        };
        Application.Idle += startBridge;
        try {
            var path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Atlas.Shell.dll");
            var shell = Assembly.LoadFrom(path);
            shell.EntryPoint.Invoke(null, null);
        } catch(Exception ex) {
            while(ex is TargetInvocationException && ex.InnerException != null) ex=ex.InnerException;
            string logPath="";
            try {
                logPath=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"MethodAtlas","Diagnostics","startup.log");
                Directory.CreateDirectory(Path.GetDirectoryName(logPath));
                File.WriteAllText(logPath,DateTime.Now.ToString("s")+Environment.NewLine+ex.ToString(),Encoding.UTF8);
            } catch {logPath="";}
            string explanation=ex is FileNotFoundException || ex is FileLoadException
                ? "缺少程序组件，或组件未能载入。请重新运行安装包，或完整解压免安装版。"
                : "程序初始化未完成。请保留下面的错误信息，以便定位原因。";
            MessageBox.Show(explanation+"\n\n"+ex.GetType().Name+": "+ex.Message+
                (logPath.Length>0?"\n\n诊断记录："+logPath:"")+"\n\n学习记录仍保留在原来的本机位置。",
                "社会科学量化方法自学手册", MessageBoxButtons.OK, MessageBoxIcon.Information);
        } finally {
            Application.Idle -= startBridge;
            timer.Dispose();foreach(var bridge in Bridges) bridge.Dispose();
        }
    }
    private static void AttachChildren(Control c) {
        var form = c as Form;
        if(form != null && form.Text.StartsWith("社会科学")) form.Text="社会科学量化方法自学手册";
        var view = c as WebView2;
        if(view != null && !view.IsDisposed && view.CoreWebView2 != null && Attached.Add(view.CoreWebView2))
            Bridges.Add(new AssistantBridge(view.CoreWebView2));
        foreach(Control child in c.Controls) AttachChildren(child);
    }
}

internal sealed class AssistantBridge : IDisposable {
    private readonly CoreWebView2 core;
    private readonly JavaScriptSerializer json = new JavaScriptSerializer { MaxJsonLength = 2400000 };
    private readonly Dictionary<string,CancellationTokenSource> active = new Dictionary<string,CancellationTokenSource>();
    private readonly HttpClient client;
    private bool disposed;
    internal AssistantBridge(CoreWebView2 core) {
        this.core=core;
        client = new HttpClient(new HttpClientHandler { AllowAutoRedirect=false, UseCookies=false, AutomaticDecompression=DecompressionMethods.GZip|DecompressionMethods.Deflate });
        client.Timeout=TimeSpan.FromSeconds(180);
        core.WebMessageReceived += Message;
        core.NavigationStarting += Navigation;
        Ready();
    }
    internal static bool Trusted(string url) {
        Uri u;return Uri.TryCreate(url,UriKind.Absolute,out u) && u.Scheme=="https" && u.Host=="methodatlas.local" && u.IsDefaultPort && u.UserInfo=="" && u.AbsolutePath=="/index.html";
    }
    private static string Get(Dictionary<string,object> d,string key) { object value;return d.TryGetValue(key,out value) ? value as string ?? "" : ""; }
    internal static string Endpoint(string provider,string model,string kind) {
        if(kind!="chat" && kind!="models")throw new ArgumentException("不支持的请求类型。");
        if(kind=="chat" && (model.Length<1||model.Length>160||!Regex.IsMatch(model,@"\A[-a-zA-Z0-9._:/]+\z")))throw new ArgumentException("模型 ID 无效。");
        switch(provider) {
            case "openai": return "https://api.openai.com/v1/"+(kind=="models"?"models":"responses");
            case "deepseek": return "https://api.deepseek.com/"+(kind=="models"?"models":"chat/completions");
            case "claude": return "https://api.anthropic.com/v1/"+(kind=="models"?"models":"messages");
            case "gemini":
                if(kind=="models")return "https://generativelanguage.googleapis.com/v1beta/models";
                if(model.StartsWith("models/"))model=model.Substring(7);
                if(!Regex.IsMatch(model,@"\A[-a-zA-Z0-9._]+\z"))throw new ArgumentException("Gemini 模型 ID 无效。");
                return "https://generativelanguage.googleapis.com/v1beta/models/"+Uri.EscapeDataString(model)+":generateContent";
            default:throw new ArgumentException("不支持的 API 服务商。");
        }
    }
    private void Post(object value) {
        if(disposed)return;try { if(Trusted(core.Source))core.PostWebMessageAsJson(json.Serialize(value)); } catch { }
    }
    private void Ready(){Post(new {channel="atlas-assistant",type="ready"});}
    private void Navigation(object sender,CoreWebView2NavigationStartingEventArgs e) { CancelAll(); }
    private async void Message(object sender,CoreWebView2WebMessageReceivedEventArgs e) {
        if(disposed||!Trusted(e.Source)||!Trusted(core.Source))return;
        string id="";CancellationTokenSource cts=null;
        try {
            string raw=e.WebMessageAsJson;if(raw.Length>200000)return;
            var d=json.Deserialize<Dictionary<string,object>>(raw);if(d==null)return;
            string action=Get(d,"action");
            if(action=="assistant:hello"){Ready();return;}
            if(action!="assistant:request" && action!="assistant:cancel")return;
            id=Get(d,"id");if(!Regex.IsMatch(id,@"\Aai-[0-9]+-[0-9]+\z"))return;
            if(action=="assistant:cancel"){CancellationTokenSource old;if(active.TryGetValue(id,out old))old.Cancel();return;}
            if(active.Count>=1){Post(new{channel="atlas-assistant",id,error="已有请求正在处理，请稍后重试。"});return;}
            string provider=Get(d,"provider"),model=Get(d,"model"),kind=Get(d,"kind"),key=Get(d,"key"),body=Get(d,"body");
            string endpoint=Endpoint(provider,model,kind);
            if(key.Length<1||key.Length>4096||Regex.IsMatch(key,@"[^\x21-\x7E]"))throw new ArgumentException("API Key 格式无效。");
            if(kind=="chat") {
                if(body.Length<2||body.Length>150000)throw new ArgumentException("问题过长，请缩短后发送。");
                var payload=json.Deserialize<Dictionary<string,object>>(body);
                if(payload==null)throw new ArgumentException("请求格式无效。");
                // Never permit tool calls, remote file ingestion or server-side background jobs.
                string[] allowed = provider=="openai" ? new[]{"model","instructions","input","store","max_output_tokens"} : provider=="claude" ? new[]{"model","system","messages","max_tokens"} : provider=="gemini" ? new[]{"systemInstruction","contents","generationConfig"} : new[]{"model","messages","thinking","stream","max_tokens"};
                foreach(string field in payload.Keys)if(Array.IndexOf(allowed,field)<0)throw new ArgumentException("请求包含不支持的字段。");
            }
            cts=new CancellationTokenSource(TimeSpan.FromSeconds(175));active.Add(id,cts);
            using(var request=new HttpRequestMessage(kind=="models"?HttpMethod.Get:HttpMethod.Post,endpoint)) {
                if(provider=="claude"){request.Headers.Add("x-api-key",key);request.Headers.Add("anthropic-version","2023-06-01");}
                else if(provider=="gemini")request.Headers.Add("x-goog-api-key",key);
                else request.Headers.Authorization=new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer",key);
                if(kind=="chat")request.Content=new StringContent(body,Encoding.UTF8,"application/json");
                using(var response=await client.SendAsync(request,HttpCompletionOption.ResponseHeadersRead,cts.Token)) {
                    // Error bodies are deliberately not returned: some gateways echo credentials.
                    if(!response.IsSuccessStatusCode){Post(new{channel="atlas-assistant",id,status=(int)response.StatusCode,text="{}"});return;}
                    using(var stream=await response.Content.ReadAsStreamAsync())using(var memory=new MemoryStream()) {
                        var buffer=new byte[8192];int count;
                        while((count=await stream.ReadAsync(buffer,0,buffer.Length,cts.Token))>0){
                            if(memory.Length+count>2000000)throw new ArgumentException("响应过大，请缩小问题范围后重试。");
                            memory.Write(buffer,0,count);
                        }
                        if(!cts.IsCancellationRequested)Post(new{channel="atlas-assistant",id,status=(int)response.StatusCode,text=Encoding.UTF8.GetString(memory.ToArray())});
                    }
                }
            }
        } catch(OperationCanceledException) { Post(new{channel="atlas-assistant",id,error="请求已取消或超时。"}); }
          catch(ArgumentException ex) {Post(new{channel="atlas-assistant",id,error=ex.Message});}
          catch {Post(new{channel="atlas-assistant",id,error="无法连接服务商。请检查网络、代理设置与服务商可用地区后重试。"});}
        finally {if(cts!=null){active.Remove(id);cts.Dispose();}}
    }
    private void CancelAll(){foreach(var task in active.Values)task.Cancel();}
    public void Dispose(){if(disposed)return;disposed=true;CancelAll();try{core.WebMessageReceived-=Message;core.NavigationStarting-=Navigation;}catch{}client.Dispose();}
}
