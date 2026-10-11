'use strict';
(() => {
  const D=window.ATLAS_HISTORY,L=window.LEARNING;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const methods=()=>Object.fromEntries(window.ATLAS.families.flatMap(f=>f.subs.flatMap(s=>s.ms)).map(m=>[m.id,m]));
  function render(q){
    const track=L.tracks.find(t=>t.id===q.get('track'))?.id||'';
    const period=D.periods.find(p=>p.id===q.get('period'))?.id||'';
    return `<section class="chronicle" aria-label="量化研究历史年表"><div class="chronicle-cover"><div><h2>历史年表</h2><small>${D.events.length} 个事件 · ${new Set(D.events.map(e=>e.year)).size} 个年份 · 六条研究主题</small></div><div class="chronicle-range"><span>1662</span><i>—</i><span>${Math.max(...D.events.map(e=>e.year))}</span></div></div>
    <details class="chronicle-guidance"><summary>这条年表怎样选材？</summary><p>先读事件标题与简介，再展开“它改变了什么”。年代按代表性文献或事件排列，方法通常有更早源流与后续发展；年表是精选回顾，不是完整年鉴，行距也不代表时间长度。</p></details>
    <details class="history-filter-panel" ${window.matchMedia('(max-width:700px)').matches?'':'open'}><summary>筛选年代、主题与关键词</summary><div class="chronicle-filters"><label>按年代阅读<select id="history-period"><option value="">全部年代</option>${D.periods.map(p=>`<option value="${p.id}" ${p.id===period?'selected':''}>${p.label}</option>`).join('')}</select></label><label class="history-search-label">查找事件<input type="search" id="history-search" placeholder="年份、人物、方法或关键词" value="${esc(q.get('q')||'')}"></label><button id="history-reset">重置筛选</button></div>
    <div class="history-tracks" aria-label="按研究主题筛选"><button data-history-track="" aria-pressed="${!track}">全部主题</button>${L.tracks.map(t=>`<button data-history-track="${t.id}" aria-pressed="${t.id===track}"><i style="--event-color:${t.color}"></i>${esc(t.name)}</button>`).join('')}</div></details><div class="chronicle-count" id="history-count" role="status"></div><div id="history-events"></div><p class="chronicle-end">读到这里，回到一个具体研究问题。<a href="#map?view=tree">查看今天的方法分类 →</a></p></section>`;
  }
  function wire(q){
    const M=methods();let track=L.tracks.find(t=>t.id===q.get('track'))?.id||'';
    const box=document.querySelector('#history-events');if(!box)return;
    function update(){
      const period=D.periods.find(p=>p.id===document.querySelector('#history-period').value);
      const needle=document.querySelector('#history-search').value.trim().toLowerCase();
      const events=D.events.filter(e=>(!track||e.lane===track)&&(!period||(e.year>=period.from&&e.year<=period.to))&&(!needle||[e.year,e.title,e.summary,e.change,...e.methods.flatMap(id=>[id,M[id]?.cn,M[id]?.en,M[id]?.ab]),...e.refs.flatMap(id=>[D.sources[id]?.author,D.sources[id]?.title])].join(' ').toLowerCase().includes(needle)));
      document.querySelector('#history-count').textContent=events.length?`${events.length} 个事件 · ${new Set(events.map(e=>e.year)).size} 个年份 · 从早到晚阅读`:'没有找到匹配的事件。可以缩短关键词，或重置筛选。';
      document.querySelectorAll('[data-history-track]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.historyTrack===track)));
      box.innerHTML=events.length?D.periods.map(p=>{
        const es=events.filter(e=>e.year>=p.from&&e.year<=p.to);if(!es.length)return '';
        return `<section class="chronicle-period"><header><span>${p.label}</span><h3>${esc(p.title)}</h3></header>${[...new Set(es.map(e=>e.year))].map(year=>`<div class="chronicle-year"><div class="chronicle-date"><time datetime="${year}">${year}</time><span>年</span></div><div class="chronicle-stories">${es.filter(e=>e.year===year).map(e=>{
          const t=L.tracks.find(t=>t.id===e.lane);
          return `<article class="chronicle-story" style="--event-color:${t.color}"><span class="chronicle-topic">${esc(t.name)}</span><h4>${esc(e.title)}</h4><p>${esc(e.summary)}</p><details id="history-${e.id}" ${q.get('event')===e.id?'open':''}><summary>它改变了什么 <span>＋</span></summary><div class="chronicle-more"><h5>今天怎样用到它</h5><p>${esc(e.change)}</p><h5>理解到这里，还要留意</h5><p>${esc(e.caution)}</p><div class="history-method-links">${e.methods.map(id=>`<a href="#method/${id}">${esc(M[id]?.cn||id)} →</a>`).join('')}</div><h5>追到原始出处</h5><ol class="history-citations">${e.refs.map(id=>{const s=D.sources[id];return `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><small>${esc(s.author)} · ${esc(s.year)}</small></li>`;}).join('')}</ol><a class="history-permalink" href="#map?event=${e.id}">定位到这个事件 ↗</a></div></details></article>`;
        }).join('')}</div></div>`).join('')}</section>`;
      }).join(''):'<div class="empty">暂时没有匹配项。年表只收录精选事件；没有列出的年份，并不表示当年没有进展。</div>';
    }
    document.querySelector('#history-period').onchange=update;
    document.querySelector('#history-search').oninput=update;
    document.querySelectorAll('[data-history-track]').forEach(b=>b.onclick=()=>{track=b.dataset.historyTrack;update();});
    document.querySelector('#history-reset').onclick=()=>{track='';document.querySelector('#history-period').value='';document.querySelector('#history-search').value='';q.delete('event');update();};
    update();
    if(q.get('event'))requestAnimationFrame(()=>document.querySelector('#history-'+CSS.escape(q.get('event')))?.scrollIntoView({block:'center'}));
  }
  window.AtlasHistory={render,wire};
})();
