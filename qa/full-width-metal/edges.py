from pathlib import Path
from PIL import Image
import json
root=Path(__file__).parent;rows=json.loads((root/'edge-results.json').read_text())
for r in rows:
 im=Image.open(root/r['file']).convert('RGB');d=r['dpr'];w=r['width'];a=r['measurements'];end=int(a['crossbar']['y'])
 for x in [0,w-1]:
  for y in range(12,end-1):assert min(im.getpixel((int((x+.5)*d),int((y+.5)*d))))>100,(r['engine'],w,r['height'],x,y)
 # Keyboard side bands still textured beyond the crossbar; tolerate bright texture grains.
 if r['height']>w:
  vals=[max(im.getpixel((int((x+.5)*d),int((end+30+y)*d)))) for x in range(10) for y in range(10)];assert sum(v<100 for v in vals)>75
 r['upperPlatePaintReachesBothEdges']=True
(root/'edge-results.json').write_text(json.dumps(rows,indent=2));print('12 upper paint edge scans passed; portrait keyboard plastic sides retained10px')
