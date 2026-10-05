"""Check rendered metal continuity on both sides, allowing raster edge rounding."""
import json, math
from pathlib import Path
from PIL import Image
root=Path(__file__).parent
cases=json.loads((root/'visual-results.json').read_text())
results=[]
for case in cases:
    if case.get('landscapeByteIdentical'): continue
    width,height=case['viewport'].values(); dpr=case['dpr']; safe=case['safeAreaSimulation']
    image=Image.open(root/f"{case['engine']}-{width}-safe{safe}-dpr{dpr}-full.png").convert('RGB')
    frame=case['measurements']['frame']; cy=frame['bottom']-44
    def metal(x,y):
        pixel=image.getpixel((int(x*dpr),int(y*dpr)))
        return min(pixel)>100
    for side in ['left','right']:
        cx=frame['left']+44 if side=='left' else frame['right']-44
        sign=-1 if side=='left' else 1
        for offset in [-30,-10,-2,0]: assert metal(cx+sign*39,cy+offset),(case,side,'vertical')
        for offset in [0,2,10,20]: assert metal(cx-sign*offset,cy+39),(case,side,'horizontal')
        sections=[]
        for angle in range(91):
            a=math.radians(angle)
            def at(r):return metal(cx+sign*r*math.cos(a),cy+r*math.sin(a))
            # Interior points avoid edge antialiasing; a continuous 7px band
            # must survive all angles including the straight/arc tangencies.
            for radius in [36,37,38,39,40,41,42]: assert at(radius),(case,side,angle,radius,'gap')
            assert not at(30) and not at(47),(case,side,angle,'overshoot')
            if angle%15==0:
                radii=[30+i/10 for i in range(171)]
                visible=[r for r in radii if at(r)]
                lo,hi=min(visible),max(visible)
                assert abs(lo-34)<=1.6/dpr and abs(hi-44)<=1.6/dpr,(case,side,angle,lo,hi)
                assert abs((hi-lo)-10)<=2.2/dpr,(case,side,angle,hi-lo)
                sections.append({'angle':angle,'innerEdge':lo,'outerEdge':hi,'sampledThickness':round(hi-lo,2)})
        results.append({'engine':case['engine'],'viewport':case['viewport'],'safeAreaSimulation':safe,'dpr':dpr,'side':side,'all91AnglesContinuous':True,'sections':sections,'passed':True})
(root/'pixel-results.json').write_text(json.dumps(results,indent=2))
print(f'{len(results)} rendered corners passed: tangent joins, 91 angles, concentric 44/34 edges and 10px thickness within raster tolerance.')
