#!/usr/bin/env python3
"""Local, append-only method maintenance. Standard library; no network or code execution."""
import argparse
import copy
from datetime import date, datetime
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile
from urllib.parse import urlsplit

FILES = {'atlas-data.js': 'ATLAS', 'learning-data.js': 'LEARNING',
         'downloads-data.js': 'DOWNLOADS', 'books-data.js': 'BOOKS', 'history-data.js':'ATLAS_HISTORY'}
SLOTS = ('zh_text', 'en_text', 'zh_video', 'en_video')
STAGE_NAMES = ('看懂问题和例子', '跟着做一次', '读懂关键结果', '说明结论与局限')
ID_RE = re.compile(r'^[A-Z][0-9]{2}$')
KEY_RE = re.compile(r'^[A-Za-z0-9][A-Za-z0-9._-]{0,89}$')
PLACEHOLDER = re.compile(r'待填写|请填写|TODO|TBD|example\.(?:com|org|net)|示例题名|替换为真实', re.I)


def load_json(path):
    def unique(pairs):
        obj = {}
        for k, v in pairs:
            if k in obj:
                raise ValueError(f'JSON 中重复出现字段 {k}，请先消除重复。')
            obj[k] = v
        return obj
    return json.loads(Path(path).read_text(encoding='utf-8-sig'), object_pairs_hook=unique)


def read_data(app):
    result = {}
    for name, variable in FILES.items():
        if variable == 'ATLAS_HISTORY' and not (app/name).exists():
            result[variable] = {'events':[], 'sources':{}}; continue
        text = (app / name).read_text(encoding='utf-8-sig').strip()
        match = re.fullmatch(r'window\.' + variable + r'\s*=\s*([\s\S]*?);?', text)
        if not match:
            raise ValueError(f'{name} 不是预期的纯 JSON 数据赋值，停止写入。')
        result[variable] = json.loads(match[1].rstrip(';'))
    return result


def all_methods(data):
    return [m for f in data['ATLAS']['families'] for s in f['subs'] for m in s['ms']]


def url_ok(value):
    if not isinstance(value, str) or re.search(r'\s', value):
        return False
    try:
        u = urlsplit(value)
        return u.scheme in ('http', 'https') and bool(u.hostname and '.' in u.hostname) and not u.username and not u.password
    except ValueError:
        return False


def canonical_url(value):
    return str(value).strip().rstrip('/').replace('http://', 'https://', 1)


def template(family='', sub='', mid=''):
    return {
        'schema_version': 1,
        'method': {
            'id': mid, 'cn': '', 'en': '', 'ab': '', 'aliases': [], 'fam': family,
            'sub': sub, 'lv': 'L0' if family == 'M' else 'L2', 'front': False,
            'plain': '', 'origin': '', 'q1': '', 'q2': '', 'q3': '', 'q4': '', 'q6': '',
            'example': '', 'readout': [[''] * (3 if family == 'M' else 4) for _ in range(3)],
            'workflow': ['', '', '', ''], 'code': {'r': ''}, 'soft': ['R'],
            'rp': [], 'pp': [], 'sp': [], 'related_methods': [],
            'self_check': {'question': '', 'answer': ''}},
        'learning': {'term_note': '', 'term_source': '', 'stages': [
            {'number': i+1, 'name': n, 'outcome': '', 'targets': [''], 'resource_urls': []}
            for i, n in enumerate(STAGE_NAMES)]},
        'references': [
            {'id': '', 'role': role, 'title': '', 'author': '', 'year': None, 'venue': '',
             'doi': '', 'url': '', 'lang': 'en', 'use': '', 'locator': '', 'checked_at': '',
             'access': '', 'availability': ''} for role in ('origin', 'tutorial')],
        'existing_reference_ids': [],
        'resources': [{'id': '', 'title': '', 'url': '', 'lang': 'en', 'medium': 'text',
                       'provider': '', 'scope': '', 'source': '', 'access': '',
                       'coverage': 'direct', 'locator': '', 'checked_at': '', 'availability': ''}],
        'existing_resources': [],
        'placement': {'cluster_ids': [], 'history_node_ids': [], 'history_note': ''},
        'cases': [],
        'quality': {'terminology_check': '', 'calculation_check': '', 'code_check': '',
                    'evidence_check': '', 'case_gap': '',
                    'resource_gaps': dict.fromkeys(SLOTS, '')}}


def validate(bundle, data):
    errors, warnings = [], []
    atlas = data['ATLAS']; context = atlas['context']
    methods = all_methods(data); mids = {m['id'] for m in methods}
    resource_map = {r['id']: r for r in atlas['resources']}
    source_map = context['sources']

    def fail(message):
        errors.append(message)

    def obj(value, label, keys=None):
        if not isinstance(value, dict):
            fail(f'{label} 必须是对象。'); return {}
        if keys is not None:
            for key in sorted(set(value) - set(keys)):
                fail(f'{label}.{key} 是不支持的字段，请检查拼写。')
            for key in sorted(set(keys) - set(value)):
                fail(f'{label}.{key} 缺失。')
        return value

    def text(value, label, required=True):
        if not isinstance(value, str) or (required and not value.strip()):
            fail(f'{label} 需要' + ('非空' if required else '') + '文字。'); return ''
        if PLACEHOLDER.search(value): fail(f'{label} 仍含占位内容。')
        if re.search(r'<\s*/?\s*[A-Za-z][^>]*>', value): fail(f'{label} 请使用纯文本，不要写 HTML。')
        return value

    def array(value, label, minimum=0):
        if not isinstance(value, list): fail(f'{label} 必须是数组。'); return []
        if len(value) < minimum: fail(f'{label} 至少需要 {minimum} 项。')
        return value

    def strings(value, label, minimum=0):
        values = array(value, label, minimum)
        return [text(v, f'{label}[{i}]') for i, v in enumerate(values)]

    def url(value, label, optional=False):
        if optional and value == '': return
        if not url_ok(value): fail(f'{label} 需要完整的 http(s) 来源 URL。')
        elif PLACEHOLDER.search(value): fail(f'{label} 仍是示例地址。')

    def checked(value, label):
        try:
            if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value) or date.fromisoformat(value) > date.today():
                raise ValueError()
        except (ValueError, TypeError): fail(f'{label} 需要真实的核对日期 YYYY-MM-DD，不能写未来日期。')

    def identifier(value, label):
        if not isinstance(value, str) or not KEY_RE.fullmatch(value): fail(f'{label} 需要字母、数字、点、下划线或短横线组成的唯一编号。')

    def selection(values, allowed, label, minimum=0):
        seq = strings(values, label, minimum)
        if len(set(seq)) != len(seq): fail(f'{label} 有重复项。')
        for v in seq:
            if v not in allowed: fail(f'{label}: {v!r} 不存在。')
        return seq

    base = template()
    b = obj(bundle, '草稿', base)
    if b.get('schema_version') != 1: fail('schema_version 必须为 1。')
    m = obj(b.get('method'), 'method', base['method'])
    for k in ('id', 'cn', 'en', 'fam', 'sub', 'lv', 'plain', 'origin', 'q1', 'q2', 'q3', 'q4', 'q6', 'example'):
        text(m.get(k), 'method.' + k)
    mid = m.get('id', '') if isinstance(m.get('id'), str) else ''
    if not ID_RE.fullmatch(mid): fail('方法编号须为大写方法族字母和两位数字，例如 D13。')
    if mid in mids: fail(f'{mid} 已存在；新增命令不会覆盖原方法或学习记录。')
    fam = m.get('fam') if isinstance(m.get('fam'), str) else ''
    family_ids = {f['code'] for f in atlas['families']}
    if fam not in family_ids or not mid.startswith(fam): fail('fam 必须是现有方法族，且与方法编号首字母相同。')
    if m.get('lv') not in list(data['LEARNING']['levels']): fail('lv 必须是现有层级 L0–L4。')
    if not isinstance(m.get('front'), bool): fail('front 必须为 true 或 false。')
    text(m.get('ab'), 'method.ab', False)
    if isinstance(m.get('en'), str) and not re.search('[A-Za-z]', m['en']): fail('en 需要专业英文名称。')
    for old in methods:
        if any(isinstance(m.get(k), str) and m[k].strip().casefold() == old[k].strip().casefold() for k in ('cn', 'en')):
            fail(f'名称与 {old["id"]} 重复；应先确认是否只是已有方法的别名。'); break
    for k in ('aliases', 'rp', 'pp', 'sp'): strings(m.get(k), 'method.' + k)
    selection(m.get('soft'), ('R', 'Python', 'Stata', 'Mplus', 'SPSS', 'JASP'), 'method.soft', 1)
    selection(m.get('related_methods'), mids, 'method.related_methods', 1)
    strings(m.get('workflow'), 'method.workflow', 4)
    cols = 3 if fam == 'M' else 4
    for i, row in enumerate(array(m.get('readout'), 'method.readout', 3)):
        values = strings(row, f'method.readout[{i}]')
        if len(values) != cols: fail(f'method.readout[{i}] 必须有 {cols} 列。')
    if isinstance(m.get('example'), str) and not re.search(r'\d', m['example']): fail('example 需要可以核算的具体数字。')
    sc = obj(m.get('self_check'), 'method.self_check', ('question', 'answer'))
    for k in ('question', 'answer'): text(sc.get(k), 'method.self_check.' + k)
    code = obj(m.get('code'), 'method.code')
    if not code: fail('code 至少提供一种语言的代码，或明确的“复现路线”。')
    for k, v in code.items():
        if k not in ('r', 'python', 'stata', 'mplus', 'spss', 'jasp', '复现路线'): fail(f'code 不支持语言键 {k!r}。')
        # Code is stored as escaped text and never evaluated here.
        if not isinstance(v, str) or not v.strip() or PLACEHOLDER.search(v): fail(f'method.code.{k} 需要实际代码或复现说明。')

    refs = array(b.get('references'), 'references')
    existing_refs = selection(b.get('existing_reference_ids'), source_map, 'existing_reference_ids')
    new_ref_ids, ref_urls, roles = [], [], []
    for i, raw in enumerate(refs):
        p = obj(raw, f'references[{i}]', base['references'][0]); label = f'references[{i}]'
        identifier(p.get('id'), label + '.id')
        rid = p.get('id') if isinstance(p.get('id'), str) else ''
        if rid in source_map or rid in new_ref_ids: fail(f'来源编号 {rid!r} 已存在；复用请用 existing_reference_ids。')
        new_ref_ids.append(rid)
        for k in ('title', 'author', 'venue', 'use', 'locator', 'access', 'availability'): text(p.get(k), label + '.' + k)
        text(p.get('doi'), label + '.doi', False)
        if p.get('doi') and (not isinstance(p['doi'], str) or not re.fullmatch(r'10\.\d{4,9}/\S+', p['doi'])): fail(label + '.doi 应是 10.… 的 DOI 编号，不是网址。')
        if type(p.get('year')) is not int or not 1000 <= p['year'] <= date.today().year+1: fail(label + '.year 需要真实出版年份。')
        if p.get('lang') not in ('zh', 'en'): fail(label + '.lang 只支持 zh/en。')
        if p.get('role') not in ('origin', 'tutorial', 'application'): fail(label + '.role 需要 origin/tutorial/application。')
        roles.append(p.get('role')); url(p.get('url'), label + '.url'); checked(p.get('checked_at'), label + '.checked_at')
        if isinstance(p.get('url'), str): ref_urls.append(p['url'])
    if len(refs) + len(existing_refs) < 2: fail('至少关联两条经过查阅的真实来源，覆盖来历和使用解释。')
    if not existing_refs and not {'origin', 'tutorial'}.issubset(set(r for r in roles if isinstance(r, str))): fail('新增来源应同时包括 origin 与 tutorial。')
    all_ref_ids = set(existing_refs + new_ref_ids)

    new_resources = array(b.get('resources'), 'resources')
    selected_resources, new_resource_ids, used_ids = [], [], []
    for i, raw in enumerate(new_resources):
        r = obj(raw, f'resources[{i}]', base['resources'][0]); label = f'resources[{i}]'
        identifier(r.get('id'), label + '.id')
        rid = r.get('id') if isinstance(r.get('id'), str) else ''
        if rid in resource_map or rid in new_resource_ids: fail(f'资源编号 {rid!r} 已存在；复用请用 existing_resources。')
        new_resource_ids.append(rid); used_ids.append(rid)
        for k in ('title', 'provider', 'scope', 'access', 'locator', 'availability'): text(r.get(k), label + '.' + k)
        url(r.get('url'), label + '.url'); url(r.get('source'), label + '.source')
        checked(r.get('checked_at'), label + '.checked_at')
        if r.get('lang') not in ('zh', 'en') or r.get('medium') not in ('text', 'video'): fail(label + ' 需要 lang=zh/en 与 medium=text/video。')
        if r.get('coverage') not in ('direct', 'related', 'foundation'): fail(label + '.coverage 无效。')
        selected_resources.append(r)
    for i, raw in enumerate(array(b.get('existing_resources'), 'existing_resources')):
        r = obj(raw, f'existing_resources[{i}]', ('id', 'coverage'))
        rid = r.get('id') if isinstance(r.get('id'), str) else ''
        if rid not in resource_map: fail(f'existing_resources[{i}].id 不存在。')
        else: selected_resources.append(resource_map[rid])
        if rid in used_ids: fail('existing_resources 不能重复关联同一资源。')
        used_ids.append(rid)
        if r.get('coverage') not in ('direct', 'related', 'foundation'): fail(f'existing_resources[{i}].coverage 无效。')
    if not selected_resources: fail('至少需要一项可供学习的真实文字或视频资源。')
    resource_urls = {r.get('url') for r in selected_resources if isinstance(r.get('url'), str)}
    learn = obj(b.get('learning'), 'learning', base['learning'])
    text(learn.get('term_note'), 'learning.term_note', False)
    url(learn.get('term_source'), 'learning.term_source', True)
    stages = array(learn.get('stages'), 'learning.stages')
    if len(stages) != 4: fail('learning.stages 必须保留四个阶段，与现有学习记录一致。')
    for i, raw in enumerate(stages):
        st = obj(raw, f'learning.stages[{i}]', base['learning']['stages'][0]); label = f'learning.stages[{i}]'
        if st.get('number') != i+1: fail(label + '.number 必须按 1–4 排列。')
        if i < 4 and st.get('name') != STAGE_NAMES[i]: fail(label + '.name 应沿用既有阶段名。')
        text(st.get('outcome'), label + '.outcome'); strings(st.get('targets'), label + '.targets', 1)
        selection(st.get('resource_urls'), resource_urls, label + '.resource_urls', 1)

    placement = obj(b.get('placement'), 'placement', base['placement'])
    selection(placement.get('cluster_ids'), {g['id'] for g in context['clusters']}, 'placement.cluster_ids', 1)
    selection(placement.get('history_node_ids'), {n['id'] for n in context['graph']['nodes']} | {n['id'] for n in data.get('ATLAS_HISTORY',{}).get('events',[])}, 'placement.history_node_ids')
    text(placement.get('history_note'), 'placement.history_note')
    if not placement.get('history_node_ids'): warnings.append('未挂入历史节点；分类树和问题群仍会收录。请核对 history_note。')

    cases = array(b.get('cases'), 'cases'); case_ids = {c['id'] for c in context['cases']}
    case_fields = ('id', 'title', 'domain', 'year', 'question', 'design', 'result', 'boundary', 'task', 'refs')
    for i, raw in enumerate(cases):
        case = obj(raw, f'cases[{i}]', case_fields); label = f'cases[{i}]'
        for k in case_fields[:-1]: text(case.get(k), label + '.' + k)
        identifier(case.get('id'), label + '.id')
        cid = case.get('id') if isinstance(case.get('id'), str) else ''
        if cid in case_ids: fail(label + '.id 重复。')
        case_ids.add(cid)
        selection(case.get('refs'), all_ref_ids, label + '.refs', 1)
    quality = obj(b.get('quality'), 'quality', base['quality'])
    for k in ('terminology_check', 'calculation_check', 'code_check', 'evidence_check'): text(quality.get(k), 'quality.' + k)
    text(quality.get('case_gap'), 'quality.case_gap', not cases)
    gaps = obj(quality.get('resource_gaps'), 'quality.resource_gaps', SLOTS)
    present = {str(r.get('lang')) + '_' + str(r.get('medium')) for r in selected_resources}
    for slot in SLOTS:
        text(gaps.get(slot), 'quality.resource_gaps.' + slot, slot not in present)
        if slot not in present: warnings.append(f'资源缺口 {slot}: {gaps.get(slot, "未说明")}')
    if not cases: warnings.append('尚无真实应用案例；教学数字例子不能代替实证案例。')
    return errors, warnings


def prepare(bundle, original):
    data = copy.deepcopy(original); a = data['ATLAS']; c = a['context']; l = data['LEARNING']
    b = copy.deepcopy(bundle); m = b['method']; mid = m['id']
    family = next(f for f in a['families'] if f['code'] == m['fam'])
    sub = next((s for s in family['subs'] if s['name'] == m['sub']), None)
    if sub is None:
        sub = {'name': m['sub'], 'ms': []}; family['subs'].append(sub)
    refs = b['existing_reference_ids'] + [r['id'] for r in b['references']]
    for p in b['references']:
        c['sources'][p['id']] = {'id': p['id'], 'kind': {'origin':'方法起源', 'tutorial':'方法教程', 'application':'应用研究'}[p['role']],
            **{k: p[k] for k in ('title','author','year','doi','url','use','access','availability','checked_at')},
            'locator': p['locator'], 'venue': p['venue'], 'lang': p['lang']}
    for r in b['resources']:
        r['coverage'] = {mid: r['coverage']}; a['resources'].append(r)
    rm = {r['id']: r for r in a['resources']}
    for r in b['existing_resources']: rm[r['id']].setdefault('coverage', {})[mid] = r['coverage']
    m['resources'] = [r['id'] for r in b['resources']] + [r['id'] for r in b['existing_resources']]
    m['fam_name'] = family['name']; m['explain'] = m['q2']
    m['q5'] = '\n\n'.join(f'{i+1}．{s}' for i, s in enumerate(m['workflow']))
    m['example_label'] = '教学示例'
    m['papers'] = []
    for rid in refs:
        p = c['sources'][rid]
        m['papers'].append({'t': p.get('kind', '来源'), 'au':p['author'], 'yr':p['year'],
            'ti':p['title'], 'vn':p.get('venue',p.get('kind','来源')), 'why':p['use'], 'url':p['url'],
            'doi':p.get('doi',''), 'availability':p.get('availability','访问状态待确认')})
    sub['ms'].append(m)
    l['profiles'][mid] = {k: copy.deepcopy(m[k]) for k in ('cn','en','plain')}
    l['profiles'][mid].update(b['learning'])
    l['profiles'][mid]['aliases'] = list(dict.fromkeys([m['cn'], m['en'], m['ab']] + m['aliases']))
    l['profiles'][mid]['aliases'] = [x for x in l['profiles'][mid]['aliases'] if x]
    c['profiles'][mid] = {'groups':b['placement']['cluster_ids'], 'origin':m['origin'],
        'refs':refs, 'case_ids':[x['id'] for x in b['cases']], 'family':m['fam'], 'name':m['cn']}
    for g in c['clusters']:
        if g['id'] in b['placement']['cluster_ids']: g['methods'].append(mid)
    for n in c['graph']['nodes']:
        if n['id'] in b['placement']['history_node_ids']:
            n['methods'].append(mid)
    for event in data.get('ATLAS_HISTORY',{}).get('events',[]):
        if event['id'] in b['placement']['history_node_ids']:
            event['methods'].append(mid)
    for case in b['cases']:
        case.update(methods=[mid], courses=[]); c['cases'].append(case)
        for g in c['clusters']:
            if g['id'] in b['placement']['cluster_ids']: g.setdefault('case_ids', []).append(case['id'])
    urls = {canonical_url(rm[rid]['url']) for rid in m['resources']}
    urls.update(canonical_url(c['sources'][rid]['url']) for rid in refs)
    dois = {c['sources'][rid].get('doi','').casefold() for rid in refs} - {''}
    downloads = data['DOWNLOADS']
    for row in downloads:
        if canonical_url(row.get('url','')) in urls or (row.get('doi') and row['doi'].casefold() in dois):
            row['methods'] = list(dict.fromkeys(row.get('methods',[]) + [mid]))
    for book in data['BOOKS']:
        if canonical_url(book.get('url','')) in urls:
            book['methods'] = list(dict.fromkeys(book.get('methods',[]) + [mid]))
    for rid in refs:
        p = c['sources'][rid]
        same = next((r for r in downloads if canonical_url(r.get('url','')) == canonical_url(p['url']) or
                     (p.get('doi') and r.get('doi','').casefold() == p['doi'].casefold())), None)
        if same: continue
        did = 'D-' + hashlib.sha256(p['url'].encode()).hexdigest()[:8].upper()
        if any(r['id'] == did for r in downloads): raise ValueError('下载编号冲突，请调整编号规则后再添加。')
        downloads.append({'id':did, 'title':p['title'], 'author':p['author'], 'year':p['year'],
            'kind':p.get('kind','方法来源'), 'methods':[mid], 'lang':p.get('lang','en'), 'why':p['use'],
            'priority':'优先', 'url':p['url'], 'doi':p.get('doi',''), 'status':'待下载',
            'reason':'已关联来源；尚未获取或验证可再分发的本地原文。',
            'action':'按来源权限获取原文，并核对许可；链接可达不代表已内置。', 'checked':p.get('checked_at','')})
    return data


def audit(data, app=None):
    errors = []; ms = all_methods(data); mids = [m['id'] for m in ms]; ids = set(mids)
    a = data['ATLAS']; c = a['context']; l = data['LEARNING']['profiles']
    resource_ids = [r['id'] for r in a['resources']]; resources = set(resource_ids)
    if len(mids) != len(ids): errors.append('方法编号重复。')
    if len(resource_ids) != len(resources): errors.append('课程资源编号重复。')
    def refs_exist(seq, valid, where):
        for value in seq:
            if value not in valid: errors.append(f'{where} 引用了不存在的 {value}。')
    for m in ms:
        if m['id'] not in l: errors.append(f'{m["id"]} 缺少学习资料。')
        refs_exist(m.get('resources',[]), resources, m['id'])
        refs_exist(m.get('related_methods',[]), ids, m['id'])
    for name, rows in [('问题群',c['clusters']),('历史节点',c['graph']['nodes']),('案例',c['cases'])]:
        for row in rows:
            refs_exist(row.get('methods',[]), ids, name + ' ' + row['id'])
            refs_exist(row.get('refs',[]), c['sources'], name + ' ' + row['id'])
    timeline=data.get('ATLAS_HISTORY',{})
    events=timeline.get('events',[])
    if len({e['id'] for e in events}) != len(events): errors.append('历史事件编号重复。')
    if [e['year'] for e in events] != sorted(e['year'] for e in events): errors.append('历史事件未按年份排序。')
    for event in events:
        refs_exist(event.get('methods',[]), ids, '历史事件 '+event['id'])
        refs_exist(event.get('refs',[]), timeline.get('sources',{}), '历史事件 '+event['id'])
    for mid, p in c['profiles'].items():
        refs_exist([mid], ids, '来历资料'); refs_exist(p.get('refs',[]), c['sources'], mid)
    for r in a['resources']: refs_exist(r.get('coverage',{}), ids, '资源 ' + r['id'])
    for variable in ('DOWNLOADS','BOOKS'):
        for r in data[variable]: refs_exist(r.get('methods',[]), ids, variable + ' ' + r['id'])
    if app:
        html = (app/'index.html').read_text(encoding='utf-8')
        for name, digest in re.findall(r'(?:src|href)="([^"?]+)\?asset=([a-f0-9]+)"', html):
            f = (app/name).resolve()
            if not f.is_relative_to(app.resolve()) or not f.is_file(): errors.append(f'页面资源不存在：{name}')
            elif hashlib.sha256(f.read_bytes()).hexdigest()[:12] != digest: errors.append(f'页面资源指纹过期：{name}')
    return errors


def encoded_data(data):
    return {name:('window.' + variable + '=' + json.dumps(data[variable], ensure_ascii=False, separators=(',',':')) + ';\n').encode('utf-8')
            for name, variable in FILES.items()}


def apply_bundle(app, bundle, data):
    prepared = prepare(bundle, data)
    errors = audit(prepared)
    if errors: raise ValueError('整库关联检查未通过：\n' + '\n'.join(errors))
    payloads = encoded_data(prepared)
    # Do not rewrite a data file when its parsed value is unchanged.
    payloads = {n:v for n,v in payloads.items() if prepared[FILES[n]] != data[FILES[n]]}
    html = (app/'index.html').read_text(encoding='utf-8')
    def fingerprint(match):
        name = match[2]; raw = payloads.get(name)
        if raw is None: raw = (app/name).read_bytes()
        return match[1] + name + '?asset=' + hashlib.sha256(raw).hexdigest()[:12] + '"'
    html = re.sub(r'((?:src|href)=")([^"?]+)\?asset=[a-f0-9]+"', fingerprint, html)
    payloads['index.html'] = html.encode('utf-8')
    entry = 'contribute/entries/' + bundle['method']['id'] + '.json'
    if (app/entry).exists(): raise ValueError('已有同名维护稿，停止覆盖。')
    payloads[entry] = (json.dumps(bundle,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
    before = {n:(app/n).read_bytes() if (app/n).exists() else None for n in payloads}
    backup = app/'contribute/backups'/(datetime.now().strftime('%Y%m%d-%H%M%S-%f') + '-' + bundle['method']['id'])
    backup.mkdir(parents=True, exist_ok=False)
    for name, value in before.items():
        if value is not None:
            target=backup/name; target.parent.mkdir(parents=True,exist_ok=True); target.write_bytes(value)
    (backup/'manifest.json').write_text(json.dumps({'files':list(before),'new_files':[n for n,v in before.items() if v is None]},indent=2),encoding='utf-8')
    written = []; staged = []
    try:
        for name, content in payloads.items():
            target = app/name; target.parent.mkdir(parents=True,exist_ok=True)
            with tempfile.NamedTemporaryFile(dir=target.parent, prefix='.method-', suffix='.tmp', delete=False) as f:
                f.write(content); temp = Path(f.name)
            staged.append(temp)
            os.replace(temp, target); written.append(name)
        issues = audit(read_data(app), app)
        if issues: raise ValueError('\n'.join(issues))
    except BaseException:
        for name in reversed(written):
            target=app/name
            if before[name] is None: target.unlink(missing_ok=True)
            else: target.write_bytes(before[name])
        raise
    finally:
        for path in staged: path.unlink(missing_ok=True)
    return backup, list(payloads)


def catalog(data):
    a=data['ATLAS']; c=a['context']
    return {'families':[{'code':f['code'],'name':f['name'],'subclasses':list(dict.fromkeys(s['name'] for s in f['subs']))} for f in a['families']],
        'methods':[{'id':m['id'],'cn':m['cn'],'en':m['en']} for m in all_methods(data)],
        'clusters':[{'id':g['id'],'name':g['name']} for g in c['clusters']],
        'history_nodes':[dict(id=n['id'],title=n['title'],date=str(n['year']),lane=n['lane'],view='历史年表') for n in data.get('ATLAS_HISTORY',{}).get('events',[])] + [dict({k:n[k] for k in ('id','title','date','lane')},view='旧主线节点，保留兼容') for n in c['graph']['nodes']],
        'sources':[{k:v.get(k,'') for k in ('id','title','url')} for v in c['sources'].values()],
        'resources':[{k:r[k] for k in ('id','title','url','lang','medium')} for r in a['resources']]}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--app',type=Path,default=Path(__file__).resolve().parent.parent)
    subs=parser.add_subparsers(dest='command',required=True)
    subs.add_parser('catalog'); subs.add_parser('check-app')
    init=subs.add_parser('template'); init.add_argument('--family',required=True); init.add_argument('--sub',required=True); init.add_argument('--out',type=Path,required=True)
    for name in ('check','preview','add'):
        command=subs.add_parser(name); command.add_argument('draft',type=Path)
        if name=='preview': command.add_argument('--out',type=Path,required=True)
    args=parser.parse_args(); app=args.app.resolve(); data=read_data(app)
    if args.command=='catalog': print(json.dumps(catalog(data),ensure_ascii=False,indent=2)); return 0
    if args.command=='template':
        if args.out.exists(): raise ValueError('输出文件已存在，不覆盖草稿。')
        if args.family not in {f['code'] for f in data['ATLAS']['families']}: raise ValueError('方法族不存在，先运行 catalog。')
        number=max(int(m['id'][1:]) for m in all_methods(data) if m['fam']==args.family)+1
        if number>99: raise ValueError('本方法族编号已到 99；先升级编号和学习记录规则。')
        args.out.parent.mkdir(parents=True,exist_ok=True)
        args.out.write_text(json.dumps(template(args.family,args.sub,f'{args.family}{number:02d}'),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print('模板已生成：'+str(args.out.resolve())); return 0
    if args.command=='check-app':
        issues=audit(data,app)
        print(json.dumps({'methods':len(all_methods(data)),'errors':issues,'scope':'仅检查结构、关联与资源指纹；不检查外网或学术正确性'},ensure_ascii=False,indent=2))
        return 1 if issues else 0
    draft=load_json(args.draft); errors,warnings=validate(draft,data)
    print(json.dumps({'errors':errors,'warnings':warnings,'scope':'本地静态校验；未联网、未执行代码'},ensure_ascii=False,indent=2))
    if errors: return 1
    if args.command=='check': return 0
    if args.command=='preview':
        target=args.out.resolve()
        if target.exists() or target.is_relative_to(app): raise ValueError('预览目录必须尚不存在，且不在当前 app 内。')
        shutil.copytree(app,target,ignore=shutil.ignore_patterns('backups','__pycache__','*.tmp'))
        apply_bundle(target,draft,data)
        print('预览副本已生成：'+str(target)+'\n启动本地服务器后打开 #method/'+draft['method']['id'])
    else:
        issues=audit(data,app)
        if issues: raise ValueError('当前应用需先修复结构或资源指纹：\n'+'\n'.join(issues))
        backup,changed=apply_bundle(app,draft,data)
        print('已添加 '+draft['method']['id']+'；写入：'+', '.join(changed)+'\n原文件备份：'+str(backup))
    return 0


if __name__=='__main__':
    # Keep Chinese diagnostics usable when a Windows shell or AI runner captures stdout.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, 'reconfigure'):
            stream.reconfigure(encoding='utf-8', errors='backslashreplace')
    try:
        raise SystemExit(main())
    except (ValueError, KeyError, TypeError, OSError) as exc:
        print('未完成：'+str(exc),file=sys.stderr)
        raise SystemExit(1)
