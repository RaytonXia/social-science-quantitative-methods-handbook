'use strict';
(() => {
  // Reading positions are session-only. Notes and API credentials never enter
  // browser history; its marker contains only an opaque entry identifier.
  const $ = selector => document.querySelector(selector);
  const filterFields = '#main .filter-panel input:not([type=file]), #main .filter-panel select, #main .toolbar input, #main .toolbar select, #main .study-filter input, #main .study-filter select';
  const entries = [];
  const session = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  let cursor = -1, serial = 0, restoring = false, renderVersion = 0;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function remember() {
    const entry = entries[cursor];
    if (!entry || restoring) return;
    entry.y = window.scrollY;
    entry.details = [...document.querySelectorAll('#main details')].map(d => d.open);
    entry.examples = [...document.querySelectorAll('#main [data-example-input]')]
      .map(el => ({name: el.dataset.exampleInput, value: el.value}));
    entry.filters = [...document.querySelectorAll(filterFields)].filter(el => el.id)
      .map(el => ({id: el.id, value: el.value}));
    entry.filterChips = [...document.querySelectorAll('#main [data-family].selected, #main [data-level].selected')]
      .map(el => ({kind: el.hasAttribute('data-family') ? 'family' : 'level', value: el.dataset.family ?? el.dataset.level}));
  }

  function begin() {
    remember();
    const marker = history.state?.atlasReadingEntry;
    const found = marker?.session === session
      ? entries.findIndex(e => e.key === marker.key && e.hash === location.hash) : -1;
    if (found >= 0) {
      cursor = found;
      restoring = true;
    } else {
      entries.splice(cursor + 1);
      entries.push({key: ++serial, hash: location.hash, y: 0, details: null, examples: [], title: ''});
      cursor = entries.length - 1;
      restoring = false;
      history.replaceState({...history.state, atlasReadingEntry: {session, key: serial}}, '', location.href);
    }
    renderVersion++;
  }

  function complete() {
    const entry = entries[cursor];
    if (!entry) return;
    entry.title = $('#main h1')?.textContent || document.title.replace(/ · 社会科学量化方法自学手册$/, '');
    const restore = restoring, version = renderVersion;
    if (restore) {
      const fields = (entry.filters || []).map(saved => {
        const el = document.getElementById(saved.id);
        if (el?.closest('#main') && el.type !== 'file') { el.value = saved.value; return el; }
        return null;
      }).filter(Boolean);
      for (const saved of entry.filterChips || []) {
        const button = [...document.querySelectorAll('#main [data-' + saved.kind + ']')]
          .find(el => el.dataset[saved.kind] === saved.value);
        button?.click();
      }
      fields.forEach(el => el.dispatchEvent(new Event('input', {bubbles: true})));
    }
    if (restore && entry.details) {
      document.querySelectorAll('#main details').forEach((d, i) => {
        if (typeof entry.details[i] === 'boolean') d.open = entry.details[i];
      });
      for (const saved of entry.examples) {
        const input = [...document.querySelectorAll('#main [data-example-input]')]
          .find(el => el.dataset.exampleInput === saved.name);
        if (input) { input.value = saved.value; input.dispatchEvent(new Event('input', {bubbles: true})); }
      }
    }
    const top = restore ? entry.y : 0;
    window.scrollTo({top, left: 0, behavior: 'instant'});
    requestAnimationFrame(() => {
      if (version !== renderVersion) return;
      window.scrollTo({top, left: 0, behavior: 'instant'});
      restoring = false;
    });
    updateButtons();
  }

  function updateButtons() {
    const back = $('#page-back'), forward = $('#page-forward');
    const fallback = cursor === 0 && /^#method\//.test(location.hash);
    if (back) {
      back.disabled = cursor < 1 && !fallback;
      back.title = cursor > 0 ? '返回：' + entries[cursor - 1].title : fallback ? '返回方法词典' : '还没有上一页';
      back.setAttribute('aria-label', cursor > 0 ? '返回上一页' : fallback ? '返回方法词典' : '返回上一页');
    }
    if (forward) {
      forward.disabled = cursor >= entries.length - 1;
      forward.title = cursor < entries.length - 1 ? '前进：' + entries[cursor + 1].title : '还没有下一页';
    }
    for (const link of document.querySelectorAll('[data-reading-back]')) {
      link.title = cursor > 0 ? '返回：' + entries[cursor - 1].title : '返回书架';
      link.setAttribute('aria-label', cursor > 0 ? '返回上一页' : '返回书架');
    }
  }

  document.addEventListener('click', event => {
    const back = event.target.closest('#page-back, [data-reading-back]');
    if (back) {
      if (back.disabled) return;
      if (cursor > 0) { event.preventDefault(); remember(); history.back(); }
      else if (back.id === 'page-back') { event.preventDefault(); location.hash = 'methods'; }
      return;
    }
    if (event.target.closest('#page-forward')) {
      event.preventDefault();
      if (cursor < entries.length - 1) { remember(); history.forward(); }
      return;
    }
    const link = event.target.closest('a[href^="#"]');
    if (link && !event.defaultPrevented && link.getAttribute('href') !== '#') remember();
  }, true);
  window.addEventListener('pagehide', remember);
  window.ReadingNavigation = {begin, complete};
})();
