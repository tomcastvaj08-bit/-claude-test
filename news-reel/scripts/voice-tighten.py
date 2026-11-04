# Cut pauses out of a TTS take and speed it up, keeping word timings in sync (used since #5).
# usage: python3 scripts/voice-tighten.py in.mp3 scribe-words.json out.mp3 out.words.json <tempo> [keep-gap-s]
# tighten.py in.mp3 words.json out.mp3 out.words.json tempo [keepgap]
import json,sys,subprocess,re
src,wj,out,ow,tempo=sys.argv[1:6]; tempo=float(tempo); keep=float(sys.argv[6]) if len(sys.argv)>6 else 0.06
W=json.load(open(wj)); W=W.get('words',W)
out_=[];intag=False
for w in W:
    if w.get('type','word')!='word': continue
    t=w['text']
    if t.startswith('['): intag=True
    if not intag: out_.append(w)
    if t.endswith(']') or t.endswith('],'): intag=False
W=out_
# segments
segs=[]
for w in W:
    s,e=max(0,w['start']-0.02),w['end']+0.03
    if segs and s-segs[-1][1]<keep: segs[-1][1]=max(segs[-1][1],e)
    else: segs.append([s,e])
# pad gaps: keep 'keep' sec of gap
parts=[];t=0;mapping=[]
for i,(s,e) in enumerate(segs):
    mapping.append((s,e,t)); t+=e-s
    if i<len(segs)-1: t+=keep
filt=[]
for i,(s,e) in enumerate(segs):
    filt.append(f"[0:a]atrim={s:.3f}:{e:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.008,afade=t=out:st={max(0,e-s-0.012):.3f}:d=0.012[a{i}]")
    if i<len(segs)-1: filt.append(f"anullsrc=r=44100:cl=mono,atrim=0:{keep:.3f}[g{i}]")
chain=''.join(f"[a{i}]"+(f"[g{i}]" if i<len(segs)-1 else '') for i in range(len(segs)))
n=len(segs)*2-1
filt.append(f"{chain}concat=n={n}:v=0:a=1,atempo={tempo}[o]")
subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-filter_complex',';'.join(filt),'-map','[o]','-ac','1','-ar','44100','-b:a','192k',out],check=True)
def mp(x):
    for s,e,t0 in mapping:
        if x<=e+1e-6: return (t0+max(0,x-s))/tempo
    return (mapping[-1][2]+mapping[-1][1]-mapping[-1][0])/tempo
res=[{'text':w['text'],'start':round(mp(w['start']),3),'end':round(mp(w['end']),3)} for w in W]
json.dump({'words':res},open(ow,'w'),ensure_ascii=False,indent=0)
d=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',out]))
print('dur',round(d,2),'words',len(res),'w/s',round(len(res)/d,2))
