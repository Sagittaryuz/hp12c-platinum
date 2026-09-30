"""Raster legends for the original editable 3D model. Requires Pillow."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'model' / 'textures'
OUT.mkdir(parents=True, exist_ok=True)
FONT = Path('C:/Windows/Fonts')
def font(size, bold=False, italic=False):
    return ImageFont.truetype(str(FONT / ('arialbi.ttf' if italic else 'arialbd.ttf' if bold else 'arial.ttf')), size)
def centered(draw, text, xy, size, fill, bold=False):
    draw.text(xy, text, font=font(size,bold), fill=fill, anchor='mm')
for key in json.loads((ROOT/'model/key-layout.json').read_text(encoding='utf-8')):
    im=Image.new('RGBA',(512,384),(0,0,0,0));d=ImageDraw.Draw(im)
    fill='#203125' if key.get('tone')=='power' else '#171d20' if key['id'] in ['f','g'] else '#f4f7f3'
    if key['id']=='enter':
        for idx,char in enumerate('ENTER'): centered(d,char,(256,55+idx*53),48,fill,True)
        centered(d,key['g'],(256,346),30,'#7ec6db')
    else:
        label=key['label'].replace('ˣ','x').replace('↔','↔')
        centered(d,label,(256,150),200 if len(label)==1 else 160 if len(label)==2 else 115,fill,True)
        if key['g']: centered(d,key['g'],(256,300),66,'#75bfd6')
    im.save(OUT/f"key-{key['id']}.png")
    im=Image.new('RGBA',(512,112),(0,0,0,0));d=ImageDraw.Draw(im)
    if key['f'] and key.get('printF',True): centered(d,key['f'],(256,56),47,'#e96455',False)
    im.save(OUT/f"f-{key['id']}.png")

im=Image.new('RGBA',(512,256),(0,0,0,0));d=ImageDraw.Draw(im)
d.text((30,30),'HP 12c',font=font(72),fill='#212426');d.text((30,123),'Platinum',font=font(65),fill='#212426');im.save(OUT/'brand.png')
im=Image.new('RGBA',(256,256),(0,0,0,0));d=ImageDraw.Draw(im)
d.text((128,125),'hp',font=font(170,italic=True),fill='#f3f3e9',anchor='mm');im.save(OUT/'badge.png')
im=Image.new('RGBA',(2048,80),(0,0,0,0));d=ImageDraw.Draw(im)
centered(d,'H E W L E T T · P A C K A R D',(1024,40),48,'#f1f3ef',True);im.save(OUT/'nameplate.png')
im=Image.new('RGB',(1600,1200),'#111414');d=ImageDraw.Draw(im)
d.rectangle((18,18,1582,1182),outline='#c8c8b5',width=4)
d.text((42,38),'HP 12c Platinum',font=font(48,True),fill='#e8e5cf')
d.text((42,102),'Referência de funções · projeto independente',font=font(24),fill='#c6c7b6')
rows=[('FINANCEIRO','n   i   PV   PMT   FV   ·   RPN / ALG'),('FLUXOS DE CAIXA','CF0   CFj   Nj    NPV    IRR'),('CALENDÁRIO','M.DY   D.MY   DATE    ΔDYS'),('AMORTIZAÇÃO','PV   PMT   i    n → AMORT'),('DEPRECIAÇÃO','SL    SOYD    DB'),('ESTATÍSTICA','Σ+    Σ−    x̄    s    x̄w    x̂,r    ŷ,r'),('MEMÓRIA','STO    RCL    R0 — R9    R.0 — R.9'),('PROGRAMAÇÃO','P/R   R/S   SST   BST   GTO   PSE')]
for idx,(title,text) in enumerate(rows):
    y=190+idx*112;d.line((35,y,1565,y),fill='#a4a79a',width=2);d.text((48,y+18),title,font=font(30,True),fill='#dddcc7');d.text((530,y+22),text,font=font(32),fill='#d2d3c2')
d.text((45,1133),'Cálculos e memória permanecem no dispositivo.',font=font(27),fill='#b1b6a7');im.save(OUT/'back-guide.png')
im=Image.new('RGB',(400,1300),'#101312');d=ImageDraw.Draw(im)
for idx,text in enumerate(['HEWLETT','PACKARD','PLATINUM','FINANCIAL','CALCULATOR','Σx → R2','Σx² → R3','Σy → R4','Σy² → R5','Σxy → R6']):centered(d,text,(200,70+idx*113),42,'#dfdecb',True)
im.save(OUT/'back-brand.png')
