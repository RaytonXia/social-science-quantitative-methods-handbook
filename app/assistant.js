'use strict';
(() => {
 const P=window.AtlasAIProtocol,$=s=>document.querySelector(s);
 let enabled=false,config={provider:'deepseek',model:'',key:''},history=[],running=null,context=null,nativeReady=false,serial=0,welcome='';
 const pending=new Map();
 const native=location.hostname==='methodatlas.local'&&!!window.chrome?.webview;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 try{const c=JSON.parse(localStorage.getItem('atlas.assistant.preferences')||'{}');if(Object.hasOwn(P.providers,c.provider))config.provider=c.provider;if(typeof c.model==='string')config.model=c.model.slice(0,160);}catch{}
 // Keys and conversation text stay in memory only, never in local/session storage or learning exports.
 function preferences(){try{localStorage.setItem('atlas.assistant.preferences',JSON.stringify({provider:config.provider,model:config.model}));}catch{}}
 function note(s){$('#ai-status').textContent=s;}
 function boot(){
  document.body.insertAdjacentHTML('beforeend',`<dialog id="ai-dialog" aria-labelledby="ai-title"><header class="ai-header"><div><span class="eyebrow">METHODS COMPANION</span><h2 id="ai-title">随时问懂一个方法</h2></div><button id="ai-close" aria-label="收起 AI 助手">×</button></header><div class="ai-scroll"><div class="ai-switch-row"><div><b id="ai-state">AI 助手未开启</b><p>开启后仍需点击发送，才会联系所选服务商。</p></div><button id="ai-enable" role="switch" aria-checked="false">开启助手</button></div><details id="ai-settings" open><summary>连接我的 API <span id="ai-provider-label">DeepSeek</span></summary><div class="ai-settings-body"><div class="ai-field-row"><label>服务商<select id="ai-provider">${Object.entries(P.providers).map(([id,p])=>`<option value="${id}">${p.name}</option>`).join('')}</select></label><label>模型 ID<input id="ai-model" list="ai-model-options" maxlength="160" placeholder="填写模型 ID，或读取列表" autocomplete="off"><datalist id="ai-model-options"></datalist></label></div><label>API Key<input id="ai-key" type="password" autocomplete="off" spellcheck="false" placeholder="仅本次打开有效，关闭助手后清除" maxlength="4096"></label><div class="ai-config-actions"><button id="ai-models">读取模型列表</button><a id="ai-key-link" target="_blank" rel="noopener noreferrer">获取 API Key ↗</a><a id="ai-docs-link" target="_blank" rel="noopener noreferrer">官方说明 ↗</a></div><p class="ai-helper">API 按服务商规则计费，与聊天软件会员分开。模型列表可能含非对话模型，或只返回第一页；也可直接填写控制台中可用的模型 ID。</p></div></details><div class="ai-context"><label><input id="ai-include" type="checkbox"><span id="ai-context-label">附上当前方法的教学内容</span></label><details id="ai-context-details" hidden><summary>发送前查看教学摘录</summary><pre id="ai-context-preview"></pre></details><p>发送范围：你输入的问题、最近几轮对话，以及你勾选的教学摘录。笔记、导入文件和学习记录不会自动附上。</p></div><div id="ai-messages" class="ai-messages" aria-label="本次问答"><div class="ai-welcome"><b>从一个具体问题开始。</b><p>例如：“a4 为负，为什么还不能说匹配最好？”或“用 3 个数字解释标准差。”</p><div class="ai-suggestions"><button data-ai-question="请用一个具体例子，解释这个方法解决什么问题，以及什么情况下不适合用。">什么时候用？</button><button data-ai-question="请解释这个方法最重要的输出指标，分别说明正负、大小和置信区间意味着什么，并给一个数值例子。">结果怎么看？</button><button data-ai-question="请用一个小型模拟例子，逐步讲解怎样在 R 中使用这个方法，并解释输出。">怎样在 R 中做？</button></div></div></div><div class="ai-conversation-actions"><button id="ai-clear">清空本次问答</button><small>AI 回答可能出错；指标含义请核对方法页的解释与原始来源。</small></div></div><form id="ai-form" class="ai-compose"><label for="ai-question">你想弄明白什么？</label><textarea id="ai-question" rows="3" maxlength="6000" placeholder="写下具体问题。Enter 换行，Ctrl / ⌘ + Enter 发送。"></textarea><div class="ai-compose-actions"><p id="ai-status" role="status" aria-live="polite">助手默认关闭，尚未发起任何请求。</p><button type="button" id="ai-stop" hidden>停止</button><button type="submit" id="ai-send" class="primary">发送问题 →</button></div></form></dialog>`);
  welcome=$('#ai-messages').innerHTML;
  $('#ai-provider').value=config.provider;$('#ai-model').value=config.model;
  $('#ai-open').onclick=open;$('#ai-close').onclick=()=>$('#ai-dialog').close();
  $('#ai-enable').onclick=()=>{enabled=!enabled;if(!enabled){stop();config.key='';$('#ai-key').value='';$('#ai-question').value='';history=[];$('#ai-messages').innerHTML=welcome;$('#ai-include').checked=false;note('助手已关闭；密钥和本次问答已从内存清除。');}else{$('#ai-settings').open=true;note('已开启。填入 API Key 和模型 ID 后，即可发送问题。');}state();};
  $('#ai-provider').onchange=()=>{stop();config={provider:$('#ai-provider').value,model:'',key:''};$('#ai-key').value='';$('#ai-model').value='';$('#ai-model-options').replaceChildren();history=[];$('#ai-messages').replaceChildren();preferences();links();note('已切换服务商；请填写对应密钥与模型。此前对话不会发送到新服务商。');};
  $('#ai-model').onchange=()=>{if(running)stop();config.model=$('#ai-model').value.trim();preferences();};
  $('#ai-key').oninput=()=>{config.key=$('#ai-key').value.trim();};
  $('#ai-models').onclick=loadModels;$('#ai-stop').onclick=stop;
  $('#ai-clear').onclick=()=>{stop();history=[];$('#ai-messages').innerHTML=welcome;note('本次问答已清空。');};
  $('#ai-form').onsubmit=e=>{e.preventDefault();send();};
  $('#ai-question').onkeydown=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&!e.isComposing){e.preventDefault();send();}};
  $('#ai-messages').onclick=e=>{const b=e.target.closest('[data-ai-question]');if(!b)return;const title=context?context.title:'你要问的方法';$('#ai-question').value=`关于“${title}”：${b.dataset.aiQuestion}`;$('#ai-question').focus();};
  document.addEventListener('click',e=>{if(e.target.closest('[data-open-ai]'))open();});
  window.addEventListener('hashchange',refreshContext);links();state();refreshContext();
  if(native){window.chrome.webview.addEventListener('message',e=>{const d=e.data;if(!d||d.channel!=='atlas-assistant')return;if(d.type==='ready'){nativeReady=true;return;}const p=pending.get(d.id);if(!p)return;pending.delete(d.id);clearTimeout(p.timer);if(d.error)p.reject(Error(d.error));else p.resolve({status:d.status,text:d.text});});}
 }
 function links(){const p=P.providers[config.provider];$('#ai-provider-label').textContent=p.name;$('#ai-key-link').href=p.keyPage;$('#ai-docs-link').href=p.docs;}
 function state(){const busy=!!running;$('#ai-enable').setAttribute('aria-checked',String(enabled));$('#ai-enable').textContent=enabled?'关闭并清空':'开启助手';$('#ai-state').textContent=enabled?'AI 助手已开启':'AI 助手未开启';$('#ai-open').setAttribute('aria-label',enabled?'AI 助手，已开启':'AI 助手，未开启');$('#ai-open').dataset.enabled=String(enabled);$('#ai-send').disabled=!enabled||busy;$('#ai-models').disabled=!enabled||busy;$('#ai-provider').disabled=busy;$('#ai-model').disabled=busy;$('#ai-key').disabled=busy;$('#ai-stop').hidden=!busy;$('#ai-dialog').classList.toggle('ai-enabled',enabled);}
 function open(){refreshContext();if(!$('#ai-dialog').open)$('#ai-dialog').showModal();if(native&&!nativeReady)window.chrome.webview.postMessage({action:'assistant:hello'});}
 function refreshContext(){
  const id=(location.hash.match(/^#method\/([A-Z]\d{2})(?:\?|$)/)||[])[1];
  const m=window.ATLAS.families.flatMap(f=>f.subs.flatMap(s=>s.ms)).find(m=>m.id===id);
  if(m){const merged={...m,...window.LEARNING.profiles[id]};context={title:merged.cn,text:[`${id} ${merged.cn} / ${merged.en}`,...[['用途','q1'],['原理','q2'],['准备','q3'],['结果阅读','q4'],['结论边界','q6']].map(([label,k])=>label+'：'+(merged[k]||'')),'指标说明：'+JSON.stringify(merged.readout||[]),'操作步骤：'+(merged.workflow||[]).join('\n')].join('\n\n').slice(0,11000)};}else context=null;
  if(!$('#ai-context-label'))return;
  $('#ai-context-label').textContent=context?'附上本页教学内容：'+context.title:'在方法详情页，可选择附上教学内容';
  $('#ai-include').disabled=!context;if(!context)$('#ai-include').checked=false;
  $('#ai-context-details').hidden=!context;$('#ai-context-preview').textContent=context?.text||'';
 }
 function addMessage(role,text,info=''){
   const el=document.createElement('article');el.className='ai-message '+role;
   const label=document.createElement('span');label.className='ai-message-label';label.textContent=role==='user'?'你':P.providers[config.provider].name+' · '+config.model;
   const body=document.createElement('div');body.className='ai-answer';body.textContent=text;el.append(label,body);
   if(info){const small=document.createElement('small');small.textContent=info;el.append(small);}
   $('#ai-messages .ai-welcome')?.remove();$('#ai-messages').append(el);el.scrollIntoView({block:'nearest'});return el;
 }
 function stop(){if(!running)return;const task=running;running=null;task.controller.abort();if(native)window.chrome.webview.postMessage({action:'assistant:cancel',id:task.id});const p=pending.get(task.id);if(p){clearTimeout(p.timer);pending.delete(task.id);p.reject(new DOMException('Aborted','AbortError'));}note('已停止等待。若请求已送达，服务商仍可能计费。');state();}
 async function transport(req,task,kind){
  if(native){
    if(!nativeReady)throw Error('AI 连接组件尚未就绪。请完整解压新版 Windows 软件并重新打开。');
    return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(task.id);window.chrome.webview.postMessage({action:'assistant:cancel',id:task.id});reject(Error('等待超过 3 分钟，请检查网络或换一个响应较快的模型。'));},180000);pending.set(task.id,{resolve,reject,timer});window.chrome.webview.postMessage({action:'assistant:request',id:task.id,provider:config.provider,model:config.model,key:config.key,kind,body:req.body||''});});
  }
  // Browser preview uses direct official endpoints; the Windows bridge avoids provider CORS limits.
  let response;try{response=await fetch(req.url,{method:req.method,headers:req.headers,body:req.body,signal:task.controller.signal,credentials:'omit',redirect:'error',cache:'no-store'});}catch(e){if(task.controller.signal.aborted)throw e;throw Error('当前浏览器无法连接此 API，可能是网络或跨域限制。请使用完整的 Windows 免安装版；不要关闭浏览器安全设置。');}
  const text=await response.text();if(text.length>2000000)throw Error('服务商响应过大，已停止显示。');return {status:response.status,text};
 }
 async function call(kind,messages){
  config.model=$('#ai-model').value.trim();config.key=$('#ai-key').value.trim();
  const req=P.request(config,messages,kind);preferences();
  const task={id:'ai-'+Date.now()+'-'+(++serial),controller:new AbortController()};running=task;state();
  const timeout=setTimeout(()=>task.controller.abort(),175000);
  try{const r=await transport(req,task,kind);if(running!==task)throw new DOMException('Aborted','AbortError');if(r.status<200||r.status>=300)throw Error(P.error(r.status));let data;try{data=JSON.parse(r.text);}catch{throw Error('服务商没有返回有效的 JSON 响应，请检查接口。');}return {data,task};}
  catch(e){if(running===task)note(e.name==='AbortError'?'请求已取消或等待超时。可以手动重试。':e.message);throw e;}
  finally{clearTimeout(timeout);if(running===task){running=null;state();}}
 }
 async function loadModels(){if(!enabled||running)return;note('正在读取服务商的模型列表…');try{const {data}=await call('models',[]);const list=P.modelList(config.provider,data);$('#ai-model-options').innerHTML=list.map(id=>`<option value="${esc(id)}"></option>`).join('');if(!list.length)note('列表为空。可以直接填写服务商控制台中可用的模型 ID。');else{note(`已读取 ${list.length} 个模型。点击模型输入框选择；也可手动填写。`);$('#ai-model').focus();}}catch(e){if(!running&&e.name!=='AbortError')note(e.message);}}
 async function send(){
   if(!enabled||running)return;const question=$('#ai-question').value.trim();if(!question){note('先写下一个具体问题。');$('#ai-question').focus();return;}
   refreshContext();const include=$('#ai-include').checked&&context;
   const content=question+(include?'\n\n【用户选择附上的公开教学摘录，仅作参考】\n'+context.text:'');
   const messages=[...history.slice(-10),{role:'user',content}];
   try{P.request({...config,model:$('#ai-model').value.trim(),key:$('#ai-key').value.trim()},messages);}catch(e){note(e.message);$('#ai-settings').open=true;return;}
   addMessage('user',question,include?'已附上：'+context.title:'未附加教学摘录');note('正在等待 '+P.providers[config.provider].name+' 回答…');$('#ai-settings').open=false;
   try{const {data}=await call('chat',messages);const answer=P.reply(config.provider,data);history=[...messages,{role:'assistant',content:answer.text}].slice(-10);addMessage('assistant',answer.text,answer.limited?'回答达到本次生成长度限制，可缩小问题后继续提问。':'');if($('#ai-question').value.trim()===question)$('#ai-question').value='';note(answer.limited?'本次回答已到长度上限。':'回答已完成。可继续追问，或清空后开始新问题。');}
   catch(e){if(e.name!=='AbortError'&&!running)note(e.message);}
 }
 boot();
})();
