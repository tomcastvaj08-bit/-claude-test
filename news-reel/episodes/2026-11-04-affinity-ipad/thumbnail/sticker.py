# Mascot sticker for the cover: cut-out puppet posed (pencil raised), white die-cut border.
from PIL import Image, ImageDraw, ImageFilter
import json, numpy as np, math
from scipy import ndimage
M='assets/mascot/'; P=json.load(open(M+'parts.json'))
W,H=1700,1900; c=Image.new('RGBA',(W,H),(0,0,0,0)); ox,oy=500,700
def paste(name,x,y,rot=0,piv=None):
    im=Image.open(M+name+'.png')
    if rot:
        px,py=piv; s=max(im.width,im.height)*2+40; big=Image.new('RGBA',(s,s)); big.alpha_composite(im,(s//2-px,s//2-py))
        big=big.rotate(rot,resample=Image.BICUBIC); c.alpha_composite(big,(ox+x+px-s//2,oy+y+py-s//2))
    else: c.alpha_composite(im,(ox+x,oy+y))
a=P['armL']; paste('armL',a['x'],a['y'],rot=-14,piv=(a['w']//2,16))
for n in ['legL','legR']: paste(n,P[n]['x'],P[n]['y'])
paste('torso',P['torso']['x'],P['torso']['y'])
hd=P['head']; g=P['head_grin']
paste('head_grin',hd['x']+(hd['w']-g['w'])//2,hd['y']+hd['h']+46-g['h'], rot=8, piv=(g['w']//2,g['h']-30))
a=P['armR']; th=150; paste('armR',a['x'],a['y'],rot=th,piv=(a['w']//2,16))
sx,sy=ox+a['x']+a['w']//2, oy+a['y']+16; L=650
hx,hy=sx+L*math.sin(math.radians(th)), sy+L*math.cos(math.radians(th))
pen=Image.new('RGBA',(80,330)); pd=ImageDraw.Draw(pen)
pd.rectangle([20,40,60,260],fill='#ffcf3a',outline='#222',width=5); pd.polygon([(20,260),(40,320),(60,260)],fill='#f2d2a0',outline='#222'); pd.polygon([(33,300),(40,320),(47,300)],fill='#222'); pd.rectangle([20,10,60,44],fill='#ff7a9a',outline='#222',width=5)
pen=pen.rotate(150,expand=True,resample=Image.BICUBIC)
c.alpha_composite(pen,(int(hx-pen.width//2+10),int(hy-pen.height//2+10)))
c=c.crop((0,0,W,oy+P['legL']['y']+300)); c=c.crop(c.getbbox())
al=np.array(c.split()[3])>20; pad=40
border=ndimage.binary_dilation(np.pad(al,pad),iterations=18)
S=Image.new('RGBA',(c.width+2*pad,c.height+2*pad))
bm=Image.fromarray((border*255).astype('uint8'))
sh=Image.new('RGBA',S.size,(20,20,40,255)); sh.putalpha(bm.filter(ImageFilter.GaussianBlur(14)).point(lambda v:int(v*0.35)))
S.alpha_composite(sh,(10,18)); wh=Image.new('RGBA',S.size,(255,255,255,255)); wh.putalpha(bm); S.alpha_composite(wh); S.alpha_composite(c,(pad,pad))
S.save('episodes/2026-11-04-affinity-ipad/thumbnail/sticker.png'); print(S.size)
