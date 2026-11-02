"""Builds the edit decision list (EDL) from the ASR word timings.
Usage: build_edl.py <words.json> <out/edl.json>
Source times are seconds in the original interview; everything else is derived."""
import json,sys
FPS=30
words=[]
for s in json.load(open(sys.argv[1])):
    for w in s['w']: words.append((w[0].strip(),w[1],w[2]))
q=lambda t:round(t*FPS)/FPS
# ranges of the interview kept (source seconds). Repetitions ("para que nos cuente cómo podés sumarte…"),
# hesitations and the long silences are dropped. Pauses > GAP inside a range are tightened.
HOOK=(6.52,8.05)         # "…así te podés sumar a nuestro equipo."  (cold open, moved up front)
HOOK_TAIL=0.95           # keep a beat of Andy smiling after the line
KEEP=[(0.0,6.52),(9.15,11.75),(15.55,19.98),(20.40,21.85),(22.40,40.00),(40.88,48.20),(48.62,58.62),(58.62,68.20),(68.50,74.20),(75.55,76.35)]
GAP=0.42;PAD=0.10
segs=[]
for a,b in KEEP:
    inside=[w for w in words if w[1]>=a-0.05 and w[2]<=b+0.05]
    cur=a
    for i in range(len(inside)-1):
        gap=inside[i+1][1]-inside[i][2]
        if gap>GAP:
            segs.append((cur,inside[i][2]+PAD));cur=inside[i+1][1]-PAD
    segs.append((cur,b))
hook=(HOOK[0],HOOK[1]+HOOK_TAIL)
out=[];t=0.0
allsegs=[hook]+segs
for a,b in allsegs:
    a=q(a);b=q(b);d=b-a;out.append({'src':[a,b],'out':round(t,4),'dur':round(d,4)});t+=d
json.dump({'fps':FPS,'total':round(t,4),'segments':out},open(sys.argv[2],'w'),indent=1)
print('total',t,'segments',len(out))
for s in out: print(s)
