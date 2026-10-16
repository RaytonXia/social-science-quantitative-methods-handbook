'use strict';
window.TeachingVisuals=(()=>{
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const colors=['#315f82','#367c70','#9c714c','#74658c'];
 const wrap=(s,n=12)=>{const chars=Array.from(String(s)),a=[];for(let i=0;i<chars.length;i+=n)a.push(chars.slice(i,i+n).join(''));return a;};
 const label=(s,x,y,anchor='middle',n=12)=>`<text x="${x}" y="${y}" text-anchor="${anchor}">${wrap(s,n).map((l,i)=>`<tspan x="${x}" dy="${i?21:0}">${esc(l)}</tspan>`).join('')}</text>`;
 const num=v=>Number(v).toLocaleString('zh-CN',{maximumFractionDigits:3});
 function render(g){
  const f=g?.figure;if(!f)return '';
  let drawing='',h=320;
  if(f.kind==='flow'){
   let top=16;
   drawing=f.labels.map((s,i)=>{const n=wrap(s,24).length,bh=Math.max(62,n*21+22),cy=top;top+=bh+29;return `<rect x="100" y="${cy}" width="440" height="${bh}" rx="5" fill="${i%2?'#eef4f2':'#eef3f7'}" stroke="#cbd9df"/>${label(s,320,cy+(bh-(n-1)*21)/2+5,'middle',24)}${i<f.labels.length-1?`<path d="M320 ${cy+bh+4} v19 m-5 -5 5 5 5 -5" fill="none" stroke="#708d9e" stroke-width="2"/>`:''}`;}).join('');h=top-10;
  }else if(f.kind==='spatial'){
   h=366;
   drawing=['高—高','低—低','高—低','低—高'].map((s,i)=>{const cx=165+(i%2)*310,cy=87+Math.floor(i/2)*172,high=i===0||i===2,neighborHigh=i===0||i===3;
    return `<rect x="${cx-140}" y="${cy-70}" width="280" height="155" rx="5" fill="#f3f6f7"/>${[[0,-30],[0,30],[-30,0],[30,0]].map(([dx,dy])=>`<rect x="${cx+dx-12}" y="${cy+dy-12}" width="24" height="24" rx="2" fill="${neighborHigh?'#9c714c':'#467596'}"/>`).join('')}<rect x="${cx-12}" y="${cy-12}" width="24" height="24" rx="2" fill="${high?'#9c714c':'#467596'}" stroke="#fff" stroke-width="3"/>${label(s,cx,cy+67)}`;}).join('')+label('棕色：高值　蓝色：低值；中心方块是本地',320,361,'middle',40);
  }else if(f.kind==='intervals'){
   const xmin=Math.min(f.null??0,...f.bounds.flat()),xmax=Math.max(f.null??0,...f.bounds.flat()),dx=xmax-xmin||1;
   const px=v=>210+(v-xmin)/dx*335;
   h=115+f.labels.length*78;
   drawing=`<path d="M${px(f.null??0)} 32 V${h-45}" stroke="#94a7b2" stroke-dasharray="5 5"/>${label('无效值 '+num(f.null??0),px(f.null??0),h-20)}`;
   drawing+=f.labels.map((s,i)=>{const yy=62+i*78;return `${label(s,185,yy+5,'end',11)}<path d="M${px(f.bounds[i][0])} ${yy} H${px(f.bounds[i][1])}" stroke="${colors[i%colors.length]}" stroke-width="3"/><circle cx="${px(f.points[i])}" cy="${yy}" r="5" fill="${colors[i%colors.length]}"/>${label(`${num(f.points[i])} [${f.bounds[i].map(num).join(', ')}]`,px(f.points[i]),yy-15,'middle',32)}`;}).join('');
  }else{
   const values=f.kind==='bars'?f.values:f.series.flatMap(s=>s.values);
   const lo=Math.min(0,...values),hi=Math.max(0,...values),span=hi-lo||1;
   const y=v=>240-(v-lo)/span*178,x=i=>100+i*(440/Math.max(1,f.labels.length-1));
   drawing=[0,.5,1].map(t=>{const v=lo+t*span;return `<path d="M74 ${y(v)} H600" stroke="#e0e8eb"/>${label(num(v),60,y(v)+5,'end')}`;}).join('')+label(f.unit||'',76,28,'start',30);
   if(f.kind==='bars'){
    const step=520/f.labels.length,bw=Math.min(90,step*.52),nc=Math.max(5,Math.floor(step/17));
    h=285+Math.max(...f.labels.map(s=>wrap(s,nc).length))*21;
    drawing+=f.values.map((v,i)=>{const px=76+(i+.5)*step;return `<rect x="${px-bw/2}" y="${Math.min(y(v),y(0))}" width="${bw}" height="${Math.max(2,Math.abs(y(v)-y(0)))}" rx="2" fill="${colors[i%colors.length]}"/>${label(num(v),px,y(v)-11)}${label(f.labels[i],px,273,'middle',nc)}`;}).join('');
   }else if(f.kind==='lines'||f.kind==='steps'){
    const nLines=Math.max(...f.labels.map(s=>wrap(s,9).length)),legendY=283+(nLines-1)*21;
    drawing+=f.series.map((s,j)=>`<path d="${s.values.map((v,i)=>i?(f.kind==='steps'?`H${x(i)} V${y(v)}`:`L${x(i)} ${y(v)}`):`M${x(i)} ${y(v)}`).join(' ')}" stroke="${colors[j%colors.length]}" fill="none" stroke-width="3"/>${s.values.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${colors[j%colors.length]}"/>${label(num(v),x(i),y(v)-11-j*2)}`).join('')}`).join('');
    drawing+=f.labels.map((s,i)=>label(s,x(i),268,'middle',9)).join('');
    const rows=[];let bottom=legendY;
    for(let j=0;j<f.series.length;j+=2){const row=f.series.slice(j,j+2),rowHeight=Math.max(...row.map(s=>wrap(s.name,15).length))*21+13;rows.push({row,j,top:bottom});bottom+=rowHeight;}
    drawing+=rows.map(({row,j,top})=>row.map((s,k)=>`<path d="M${78+k*280} ${top-5} h24" stroke="${colors[(j+k)%colors.length]}" stroke-width="3"/>${label(s.name,111+k*280,top,'start',15)}`).join('')).join('');h=bottom+15;
   }
  }
  const chart=f.kind==='flow'?`<ol class="teaching-flow" aria-label="${esc(f.title)}">${f.labels.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`:`<div class="teaching-chart-scroll" tabindex="0" role="group" aria-label="${esc(f.title)}，小屏幕可左右滑动"><svg viewBox="0 0 640 ${h}" role="img" aria-label="${esc(f.title+'。'+f.caption)}"><title>${esc(f.title)}</title>${drawing}</svg></div><small class="chart-pan-hint">小屏幕可左右滑动图示；关键数字也会在正文中解释。</small>`;
  return `<figure class="teaching-visual"><figcaption><b>${esc(f.title)}</b><span>教学示例 · ${esc(f.unit||'结构示意')}</span></figcaption>${chart}<p>${esc(f.caption)}</p></figure>`;
 }
 function explorer(mid){
  const input=(key,name,min,max,step,value,type='range')=>`<label>${esc(name)}<input type="${type}" data-example-input="${key}" min="${min}" max="${max}" step="${step}" value="${value}"><output data-example-value="${key}">${value}</output></label>`;
  const configs={
   M01:['改一改数字，看清括号的作用',input('x1','第一位同学（小时）',0,20,1,2,'number')+input('x2','第二位同学（小时）',0,20,1,4,'number')+input('x3','第三位同学（小时）',0,20,1,6,'number'),'本例固定三人。可以用键盘输入数字，比较“先平方”和“先相加”。'],
   M11:['只改变人数，看看标准误',input('n','独立调查人数 n',4,400,1,25)+input('sd','总体标准差 SD（小时）',.5,10,.5,2),'在独立、同分布和有限方差等本页条件下，均值 SE=SD/√n。此处总体SD按设置固定，不随人数自动变化。'],
   D03:['自己换一个基准概率',input('p','基准概率（%）',5,95,1,20)+input('or','优势比 OR',.25,4,.05,2),'固定其他条件，用同一个OR比较不同基准概率。它是模型换算，不是实际干预实验。'],
   D12:['拖动 a3、a4，观察不一致线',input('a3','中心斜率 a3',-.4,.4,.01,.08)+input('a4','弯曲 a4',-.8,.4,.01,-.41),'只改变平均固定为3的这条截面：Z=3.50+a3×t+a4×t²。a1、a2及其余曲面信息不在这个小实验中变化；不含抽样误差和置信区间。']
  };const c=configs[mid];if(!c)return '';
  return `<section class="teaching-explorer" data-teaching-explorer="${mid}"><div class="explorer-kicker">动手试一试 · 教学模型</div><h3>${c[0]}</h3><p>${c[2]}</p><div class="explorer-controls">${c[1]}</div><div class="explorer-result" data-example-result aria-live="polite"></div></section>`;
 }
 function wire(){document.querySelectorAll('[data-teaching-explorer]').forEach(root=>{
  const fields=[...root.querySelectorAll('[data-example-input]')],target=root.querySelector('[data-example-result]');
  const update=()=>{const v={};let valid=true;fields.forEach(input=>{const n=Number(input.value);if(input.value.trim()===''||!Number.isFinite(n)||n<Number(input.min)||n>Number(input.max))valid=false;v[input.dataset.exampleInput]=n;root.querySelector(`[data-example-value="${input.dataset.exampleInput}"]`).textContent=Number.isFinite(n)?num(n):'—';});if(!valid){target.textContent='请在所示范围内输入完整数字。';return;}
   let html='';switch(root.dataset.teachingExplorer){
    case 'M01':{const xs=[v.x1,v.x2,v.x3],s=xs.reduce((a,b)=>a+b,0),ss=xs.reduce((a,b)=>a+b*b,0);html=`<p>总和：${xs.map(n=>`(${num(n)})`).join('+')}=<b>${num(s)}</b> 小时；平均=<b>${num(s/3)}</b> 小时。</p><p>先各自平方再相加：<b>${num(ss)}</b> 小时²。先相加再平方：<b>${num(s*s)}</b> 小时²。</p>`;break;}
    case 'M11':{const se=v.sd/Math.sqrt(v.n);html=`<p>SE=${num(v.sd)}/√${v.n}≈<b>${num(se)} 小时</b>。</p><p>若人数增至 ${v.n*4}，SD仍为${num(v.sd)}，则SE减半为 <b>${num(se/2)}小时</b>。增加人数减少均值波动，没有改变这里设定的人群差异。</p>`;break;}
    case 'D03':{const p=v.p/100,odds=p/(1-p),nextOdds=odds*v.or,next=nextOdds/(1+nextOdds);html=`<p>基准优势=${v.p}/${100-v.p}≈${num(odds)}；乘OR后≈${num(nextOdds)}。</p><p>新概率=${num(nextOdds)}/(1+${num(nextOdds)})=<b>${num(next*100)}%</b>；概率差为 <b>${num((next-p)*100)}个百分点</b>。</p><div class="probability-compare"><span>原概率 ${v.p}%</span><i style="--probability:${v.p}%"></i><span>新概率 ${num(next*100)}%</span><i style="--probability:${next*100}%"></i></div>`;break;}
    case 'D12':{const z=t=>3.5+v.a3*t+v.a4*t*t,py=n=>230-(n-2)*68,px=t=>310+t*230,ts=[-1,0,1],peak=v.a4!==0?-v.a3/(2*v.a4):null;let shape=v.a4<0?'向下弯（倒U形）':v.a4>0?'向上弯（U形）':'直线，无弯曲';let position=v.a4<0?(peak>=-1&&peak<=1?`本截面最高点 t≈${num(peak)}。`:'本范围内最高点在端点，顶点位于展示范围之外。'):v.a4>0?'顶点是最低点，不是最高点。':'不能使用除以2a4的顶点公式。';
     html=`<div class="teaching-chart-scroll"><svg viewBox="0 0 640 305" role="img" aria-label="不一致线随a3和a4改变，${esc(shape)}"><title>不一致线的教学预测</title>${[2,3,4,5].map(n=>`<path d="M70 ${py(n)} H558" stroke="#e0e8eb"/>${label(n,54,py(n)+5,'end')}`).join('')}<path d="${Array.from({length:41},(_,i)=>{const t=-1+i/20;return `${i?'L':'M'}${px(t)} ${py(z(t))}`;}).join(' ')}" fill="none" stroke="#315f82" stroke-width="3"/>${ts.map(t=>`<circle cx="${px(t)}" cy="${py(z(t))}" r="5" fill="#367c70"/>${label(num(z(t)),px(t),py(z(t))-13)}${label(t===-1?'实际2／期望4':t===0?'两者都是3':'实际4／期望2',px(t),263,'middle',9)}`).join('')}</svg></div><p>曲线${shape}。${position}</p><p>两种错配的预测差：Z(1)−Z(−1)=2a3=<b>${num(2*v.a3)}分</b>。a4控制弯曲，a3控制这里的方向不对称。</p>`;break;}
   }target.innerHTML=html;
  };fields.forEach(input=>input.addEventListener('input',update));update();
 });}
 return {render,explorer,wire};
})();
