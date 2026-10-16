"""Validate optional structured teaching guides without executing code or fetching URLs."""
import math
from urllib.parse import urlsplit

def validate_guide(g, method_ids):
    errors=[]
    def fail(s):errors.append(s)
    def txt(s,label):
        if not isinstance(s,str) or not s.strip():fail(label+'需要非空文字。')
        elif '<script' in s.lower() or '</' in s:fail(label+'只支持纯文本。')
    def numbers(seq,label):
        if not isinstance(seq,list) or not seq:fail(label+'需要数值数组。');return []
        if any(isinstance(n,bool) or not isinstance(n,(int,float)) or not math.isfinite(n) for n in seq):fail(label+'含非有限数值。')
        return seq
    if not isinstance(g,dict):return ['guide需要对象。']
    for k in ('question','data','conclusion'):txt(g.get(k),'guide.'+k)
    steps=g.get('steps')
    if not isinstance(steps,list) or len(steps)<3:fail('guide.steps至少需要3个递进解释步骤。')
    else:
        for s in steps:txt(s,'guide.steps')
    metrics=g.get('metrics')
    if not isinstance(metrics,list) or len(metrics)<3:fail('guide.metrics至少需要3项重要输出或诊断。')
    else:
        for row in metrics:
            if not isinstance(row,dict):fail('guide.metrics每项需要对象。');continue
            for k in ('name','value','meaning','change','caution'):txt(row.get(k),'guide.metrics.'+k)
    prereqs=g.get('prerequisites',[])
    if not isinstance(prereqs,list) or any(not isinstance(i,str) or i not in method_ids for i in prereqs):fail('guide.prerequisites含不存在的方法编号。')
    elif len(set(prereqs))!=len(prereqs):fail('guide.prerequisites有重复编号。')
    sources=g.get('sources',[])
    if not isinstance(sources,list):fail('guide.sources需要数组。');sources=[]
    for src in sources:
        if not isinstance(src,dict):fail('guide.sources每项需要对象。');continue
        for k in ('title','locator'):txt(src.get(k),'guide.sources.'+k)
        try:
            u=urlsplit(src.get('url',''));valid=u.scheme in ('http','https') and u.hostname and not u.username and not u.password
        except (TypeError,ValueError):valid=False
        if not valid:fail('guide.sources.url需要http(s)来源。')
    f=g.get('figure')
    if not isinstance(f,dict):fail('guide.figure需要图示对象。');return errors
    for k in ('title','caption'):txt(f.get(k),'guide.figure.'+k)
    kind=f.get('kind');labels=f.get('labels')
    if kind not in ('flow','bars','lines','steps','intervals','spatial'):fail('guide.figure.kind不支持。')
    minimum=1 if kind=='intervals' else 2
    if not isinstance(labels,list) or len(labels)<minimum:fail(f'guide.figure.labels至少需要{minimum}项。');return errors
    for s in labels:txt(s,'guide.figure.labels')
    n=len(labels)
    if kind not in ('flow','spatial'):txt(f.get('unit'),'guide.figure.unit')
    if kind=='spatial' and n!=4:fail('空间类型图需要4个并列类型。')
    if kind=='bars':
        if len(numbers(f.get('values'),'guide.figure.values'))!=n:fail('图示标签与数值数量不一致。')
    if kind in ('lines','steps'):
        series=f.get('series')
        if not isinstance(series,list) or not series:fail('折线图需要series。')
        else:
            for s in series:
                if not isinstance(s,dict):fail('series每项需为对象。');continue
                txt(s.get('name'),'series.name')
                if len(numbers(s.get('values'),'series.values'))!=n:fail('折线标签与数值数量不一致。')
    if kind=='intervals':
        if isinstance(f.get('null',0),bool) or not isinstance(f.get('null',0),(int,float)) or not math.isfinite(f.get('null',0)):fail('区间图的无效值必须是有限数值。')
        points=numbers(f.get('points'),'figure.points');bounds=f.get('bounds')
        if len(points)!=n or not isinstance(bounds,list) or len(bounds)!=n:fail('区间图的标签、点和区间数量不一致。')
        else:
            for p,b in zip(points,bounds):
                b=numbers(b,'figure.bounds')
                if len(b)!=2:fail('区间必须有上下界。')
                elif all(isinstance(x,(int,float)) and not isinstance(x,bool) for x in [p,*b]) and not b[0]<=p<=b[1]:fail('区间上下界颠倒或估计点不在区间内。')
    return errors

def guide_template():
    return {'question':'','data':'','steps':['','','',''],
            'metrics':[dict.fromkeys(('name','value','meaning','change','caution'),'') for _ in range(3)],
            'conclusion':'','prerequisites':[], 'sources':[],
            'figure':{'kind':'flow','title':'','labels':['','','',''],'caption':''}}
