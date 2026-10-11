"""Generate explicit NSIS file lists after checking the distribution's rights manifest."""
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
PAYLOAD = REPO / 'dist/社会科学量化方法自学手册_v1.0.1'
if not PAYLOAD.is_dir():
    raise SystemExit('Expected a complete, prepared v1.0.1 payload in dist/.')
rights = json.loads((PAYLOAD/'app/licenses/readings.json').read_text('utf-8'))
expected = {'app/'+r['file'] for r in rights if r['bundled']}
actual = {p.relative_to(PAYLOAD).as_posix() for p in PAYLOAD.rglob('*') if p.is_file() and p.suffix.lower()=='.pdf'}
if expected != actual:
    raise SystemExit(f'PDF allowlist mismatch. Missing: {expected-actual}; unexpected: {actual-expected}')
for r in rights:
    if r['bundled']:
        p=PAYLOAD/'app'/r['file']
        assert hashlib.sha256(p.read_bytes()).hexdigest()==r['original_sha256'], f'Changed original PDF: {r["id"]}'
sources=json.loads((PAYLOAD/'app/licenses/source-archives.json').read_text('utf-8'))
for r in sources:
    p=PAYLOAD/'app'/r['file']
    assert hashlib.sha256(p.read_bytes()).hexdigest()==r['sha256'], f'Missing/changed corresponding source: {r["package"]}'
for rel in ['LICENSE','LICENSE-CONTENT.md','WebView2_LICENSE.txt','WebView2_NOTICE.txt','app/licenses/index.html','app/licenses/GPL-2.0.txt','app/licenses/GPL-3.0.txt','app/licenses/LGPL-2.0.txt','app/licenses/LGPL-2.1.txt','app/licenses/core-js-LICENSE.txt','app/licenses/MIT-0.txt']:
    assert (PAYLOAD/rel).is_file(), 'Missing license: '+rel
files=sorted(p for p in PAYLOAD.rglob('*') if p.is_file())
assert not any(p.suffix.lower() in ['.key','.pfx','.jks','.keystore','.log'] or p.name=='.env' for p in files)
install=[]; uninstall=[]; previous=None; manifest={}
for p in files:
    rel=p.relative_to(PAYLOAD); parent=str(rel.parent)
    if parent!=previous:
        install.append('SetOutPath "$INSTDIR'+('\\'+parent if parent!='.' else '')+'"'); previous=parent
    install.append('File "${PAYLOAD}\\'+str(rel)+'"')
    uninstall.append('Delete "$INSTDIR\\'+str(rel)+'"')
    manifest[rel.as_posix()]=hashlib.sha256(p.read_bytes()).hexdigest()
for d in sorted((p for p in PAYLOAD.rglob('*') if p.is_dir()),key=lambda p:len(p.parts),reverse=True):
    uninstall.append('RMDir "$INSTDIR\\'+str(d.relative_to(PAYLOAD))+'"')
for name,lines in [('payload-install.nsh',install),('payload-uninstall.nsh',uninstall)]:
    (HERE/name).write_text('\n'.join(lines)+'\n','utf-8')
(HERE/'payload-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps({'files':len(files),'pdfs':len(expected),'source_archives':len(sources),'bytes':sum(p.stat().st_size for p in files)}))
