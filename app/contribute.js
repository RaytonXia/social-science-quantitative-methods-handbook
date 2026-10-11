'use strict';
window.MethodContribute = (() => {
  const prompt = `请为《社会科学量化方法自学手册》的方法词典添加我指定的方法。

先读取当前 app/contribute/AGENTS.md 和 README.md，使用 method_tool.py catalog 查看现有分类与条目，避免重复收录。用 template 命令生成 JSON 草稿，不从旧版复制整库。

面向零基础读者，用自然中文逐一讲清六个问题：解决什么问题；原理和数字例子；准备什么数据与假设；输出中先看哪些指标；怎样逐步操作；结论与局限。专业中文配英文名称。指标表要说明数值的方向、大小、变化、单位和不确定性；不能只写“检查显著性”。R 优先，核算例子并核对实际输出。

查阅真实原始文献、方法教程和官方说明，记录题名、作者、年份、URL/DOI、支持的章节或页码及核对日期。寻找中文与英文的文字和视频；找不到时填写资源缺口，不编造。真实案例与虚构教学例子分开。只使用获准处理的资料，不上传私人数据。

运行 check，在 preview 副本检查搜索、标签、六个问题、学习步骤、图谱关联、资源与下载清单，并检查桌面和手机布局。确认后执行 add，再运行 check-app。保留已有编号、教学内容、Logo、版式和学习记录。机器检查不能替代专业审读。

交付更新包与检查结果。GitHub 发布等我明确安排后再进行。`;
  const escape = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render() {
    const count = window.ATLAS.families.reduce((n,f)=>n+f.subs.reduce((v,s)=>v+s.ms.length,0),0);
    return `<article class="contribute-page"><div class="breadcrumbs"><a href="#methods">方法词典</a><span>/</span><span>添加方法</span></div>
      <div class="eyebrow">内容维护 / Contributing a method</div><h1>为词典补充一个方法</h1>
      <p class="intro">这里供维护者与 AI 使用。先把一个方法讲完整，再让它进入词典、学习步骤和图谱。当前收录 ${count} 个方法。</p>
      <div class="contribute-downloads"><a class="button primary" href="contribute/maintenance-kit.zip" download="方法词典维护工具.zip">下载维护工具包</a><a class="text-link" href="contribute/method-template.json" download="新方法模板.json">单独下载条目模板 →</a><a class="text-link" href="contribute/README.md" download="方法词典维护规范.md">下载完整规范 →</a></div>
      <p class="save-hint">工具和规范已随 Windows 包保存在 app/contribute。工具包包含模板与本地校验脚本；需要 Python 3.10 及以上版本，无需安装额外依赖。</p>
      <section class="contribute-section"><div class="section-head"><h2>四步完成一次新增</h2><span class="muted">填写 → 检查 → 预览 → 入库</span></div>
      <ol class="contribute-flow"><li><span>01</span><div><h3>从当前词典生成模板</h3><p>先用 catalog 查看已有方法与分类，再生成空模板。下例中的 D 族和“回归”子类，需按实际方法选择。</p><code>python method_tool.py template --family D --sub "回归" --out new-method.json</code></div></li><li><span>02</span><div><h3>写完整，再检查</h3><p>补齐讲解、指标、例子、来源和关联。空白内容、重复编号和失配引用会被指出。</p><code>python method_tool.py check new-method.json</code></div></li><li><span>03</span><div><h3>在副本里看实际效果</h3><p>检查方法页、标签、学习步骤和图谱。桌面与手机都看一遍，正式词典保持原样。</p><code>python method_tool.py preview new-method.json --out ../../../方法预览</code></div></li><li><span>04</span><div><h3>确认后写入词典</h3><p>自动同步相关数据、刷新资源指纹并备份原文件。已有方法编号和读者记录保持原样。</p><code>python method_tool.py add new-method.json</code></div></li></ol></section>
      <section class="contribute-section"><div class="section-head"><h2>六个问题，一个也不省略</h2></div><div class="contribute-questions">${[
        ['能解决什么问题？','从一个具体研究问题开始，说明什么情境适用。'],['原理是什么？','先解释变量，再用小数字算一遍；每个符号都有对应的含义。'],['开始前准备什么？','交代一行代表谁、每列是什么，以及设计、量尺和假设。'],['怎样看结果？','指出输出里的重要指标，解释正负、大小、变化和不确定性。'],['怎样一步一步用？','从整理数据到拟合、诊断和报告，给能跟着做的步骤。'],['结论能说到哪里？','结合例子说明哪些结论有依据，哪些还不能确定。']
      ].map(([t,d],i)=>`<div><span>0${i+1}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}</div></section>
      <section class="contribute-section"><h2>每项资料，都说明能学到什么</h2><p>中文文字、英文文字、中文视频、英文视频分别寻找。专门教程与基础课程分清楚；缺少某一类时写明原因。来源记录支持的章节、页码或时间段，真实研究案例与教学数字例子分开。</p><div class="reading-note"><b>通过校验，不等于讲解已经正确。</b> 工具检查字段、编号、关联与文件指纹；专业解释、计算、引用内容和链接是否可达，仍须实际核对。</div></section>
      <details class="contribute-prompt"><summary>给后续 AI 的任务说明</summary><div class="details-body"><label for="contribute-prompt">复制后，再补充你想加入的方法名称。</label><textarea id="contribute-prompt" readonly rows="12">${escape(prompt)}</textarea><div class="actions"><button id="copy-contribute-prompt">复制任务说明</button><span id="contribute-copy-status" role="status" aria-live="polite"></span></div></div></details>
      <p class="save-hint">未来公开发布前，另行核对第三方材料的再分发许可，并排除草稿、备份和个人记录。此入口只用于本地维护。</p>
      <a class="text-link" href="#methods">← 返回方法词典</a></article>`;
  }
  function wire() {
    document.getElementById('copy-contribute-prompt').onclick = async () => {
      const status = document.getElementById('contribute-copy-status');
      try { await navigator.clipboard.writeText(prompt); status.textContent = '已复制，可以交给后续 AI。'; }
      catch { const field=document.getElementById('contribute-prompt'); field.focus(); field.select(); status.textContent='已选中文字，请按 Ctrl+C 或使用系统复制。'; }
    };
  }
  return {render,wire};
})();
