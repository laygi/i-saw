"""Build the shared content-page footer. Run with --check to verify generated HTML."""
from pathlib import Path
import re,sys
ROOT=Path(__file__).resolve().parents[1]
template=(ROOT/'components/site-footer.html').read_text().strip()
for name,base in [('gallery.html',''),('design-system/index.html','../')]:
 path=ROOT/name;source=path.read_text()
 footer='<!-- shared-footer:start -->\n'+template.replace('{{ROOT}}',base)+'\n<!-- shared-footer:end -->'
 if '<!-- shared-footer:start -->' in source:
  result=re.sub(r'<!-- shared-footer:start -->.*?<!-- shared-footer:end -->',lambda _:footer,source,flags=re.S)
 else:
  result=source.replace('</body>',footer+'\n</body>')
 if '--check' in sys.argv:assert source==result,f'{name}: rebuild shared footer'
 else:path.write_text(result)
print('Shared footer: Gallery and Design System are synchronized')
