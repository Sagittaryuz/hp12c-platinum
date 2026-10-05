"""Measure both independently centred 40px rendered arcs, including tangencies."""
import json, math
from pathlib import Path
from PIL import Image
root=Path(__file__).parent
results=[]
for case in json.loads((root/'visual-results.json').read_text()):
    if case.get('landscapeByteIdentical'):continue
    width,height=case['viewport'].values();dpr=case['dpr'];safe=case['safeAreaSimulation']
    image=Image.open(root/f"{case['engine']}-{width}x{height}-safe{safe}-dpr{dpr}-full.png").convert('RGB')
    f=case['measurements']['frame']
    # CSS radius scaling is bounded by sums of adjacent radii. Top radii0,
    # bottom40 each; both painting boxes must permit the full40px curves.
    scale=min(1,f['width']/80,f['height']/40,(f['width']-20)/80,(f['height']-11)/40)
    assert scale==1,(case,'CSS radius normalization')
    def metal(x,y):return min(image.getpixel((int(x*dpr),int(y*dpr))))>100
    for side in ['left','right']:
        sign=-1 if side=='left' else 1
        outer=(f['left']+40 if side=='left' else f['right']-40,f['bottom']-40)
        inner=(outer[0]-sign*10,outer[1]-10)
        for offset in [-25,-10,0]:
            assert metal(inner[0]+sign*45,inner[1]+offset)
            assert not metal(inner[0]+sign*38,inner[1]+offset)
        sections=[]
        for angle in range(91):
            a=math.radians(angle)
            def at(center,r):return metal(center[0]+sign*r*math.cos(a),center[1]+r*math.sin(a))
            assert at(outer,38) and not at(outer,42),(case,side,angle,'outer arc')
            assert not at(inner,38) and at(inner,42),(case,side,angle,'inner arc')
            if angle%15==0:
                radii=[36+i/10 for i in range(80)]
                out=[r for r in radii if at(outer,r)]
                ins=[r for r in radii if at(inner,r)]
                out_edge=max(out);inner_edge=min(ins)
                assert abs(out_edge-40)<=1.6/dpr,(case,side,angle,out_edge)
                assert abs(inner_edge-40)<=1.6/dpr,(case,side,angle,inner_edge)
                sections.append({'angle':angle,'outerEffectiveRadius':out_edge,'innerEffectiveRadius':inner_edge})
        # Equal40px arcs offset10px on each axis produce a thicker diagonal.
        # At45 degrees, the centres lie on the same inward normal.
        a=math.pi/4
        visible=[r/10 for r in range(200,451) if metal(outer[0]+sign*(r/10)*math.cos(a),outer[1]+(r/10)*math.sin(a))]
        thickness=max(visible)-min(visible);assert abs(thickness-10*math.sqrt(2))<=2.2/dpr,(case,side,thickness)
        results.append({'engine':case['engine'],'viewport':case['viewport'],'safeAreaSimulation':safe,'dpr':dpr,'side':side,'cssRadiusScale':scale,'outerCentre':outer,'innerCentre':inner,'both91AnglesContinuous':True,'sections':sections,'diagonalThickness':round(thickness,3),'straightThickness':10,'passed':True})
(root/'pixel-results.json').write_text(json.dumps(results,indent=2))
print(f'{len(results)} rendered corners passed: both effective radii40px, no normalization, continuous tangent arcs; straight10px, diagonal approximately14.14px.')
