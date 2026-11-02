"""Synthesises the instrumental bed + UI sound effects (no external audio needed)."""
import numpy as np, wave, sys, json
SR=44100
def save(path,x):
    x=np.clip(x,-1,1);s=(x*32767).astype(np.int16)
    if s.ndim==1: s=np.stack([s,s],1)
    w=wave.open(path,'wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(s.tobytes());w.close()
def env(n,a,r):
    e=np.ones(n);na=int(a*SR);nr=int(r*SR)
    if na>0:e[:na]=np.linspace(0,1,na)
    if nr>0:e[-nr:]=np.minimum(e[-nr:],np.linspace(1,0,nr))
    return e
def lp(x,fc):
    a=np.exp(-2*np.pi*fc/SR);y=np.zeros_like(x);s=0.0
    for i in range(len(x)):
        s=(1-a)*x[i]+a*s;y[i]=s
    return y
def tone(f,d,kind='tri',a=0.005,r=0.2,detune=0.0):
    n=int(d*SR);t=np.arange(n)/SR
    if kind=='tri': y=2/np.pi*np.arcsin(np.sin(2*np.pi*f*t))
    elif kind=='sine': y=np.sin(2*np.pi*f*t)
    else: y=np.sin(2*np.pi*f*t)+0.3*np.sin(4*np.pi*f*t)
    if detune: y=(y+np.sin(2*np.pi*f*(1+detune)*t))/2
    return y*env(n,a,r)
mid=lambda m:440*2**((m-69)/12)
def music(dur,bpm=104):
    n=int(dur*SR);out=np.zeros(n);beat=60/bpm
    chords=[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,67]]  # Cmaj7 Am7 Fmaj7 G
    bass=[36,33,29,31]
    bar=beat*4;nb=int(dur/bar)+1
    for b in range(nb):
        t0=b*bar;c=chords[b%4]
        def put(x,t):
            i=int(t*SR)
            if i<n: out[i:i+len(x)]+=x[:max(0,n-i)] if i+len(x)>n else x
        for m in c: put(0.05*tone(mid(m),bar*1.05,'tri',0.25,0.6,0.003),t0)
        put(0.16*tone(mid(bass[b%4]),beat*1.9,'sine',0.01,0.3),t0)
        put(0.16*tone(mid(bass[b%4]),beat*1.4,'sine',0.01,0.3),t0+beat*2.5)
        arp=[c[0]+12,c[2]+12,c[3]+12,c[1]+24,c[3]+12,c[2]+12,c[1]+12,c[2]+12]
        for k,m in enumerate(arp): put(0.075*tone(mid(m),0.34,'tri',0.003,0.28),t0+k*beat/2)
        for k in range(8):  # soft shaker
            ns=np.random.RandomState(b*8+k).randn(int(0.05*SR));ns=ns-lp(ns,3000)
            put(0.03*ns*env(len(ns),0.002,0.04)*(1.4 if k%2 else 0.8),t0+k*beat/2)
        for k in (0,2):  # muted kick
            tt=np.arange(int(0.18*SR))/SR;kick=np.sin(2*np.pi*(52+60*np.exp(-tt*30))*tt)*np.exp(-tt*18)
            put(0.22*kick,t0+k*beat)
    fade=np.minimum(1,np.arange(n)/(SR*1.2))*np.minimum(1,(n-np.arange(n))/(SR*2.5))
    return out*fade
def sfx():
    S={}
    rs=np.random.RandomState(3)
    n=int(0.06*SR);t=np.arange(n)/SR
    S['click']=(0.5*np.sin(2*np.pi*1900*t)*np.exp(-t*90)+0.35*rs.randn(n)*np.exp(-t*140))
    n=int(0.09*SR);t=np.arange(n)/SR
    S['tick']=0.3*np.sin(2*np.pi*1200*t)*np.exp(-t*80)
    n=int(0.5*SR);t=np.arange(n)/SR
    w=rs.randn(n);w=lp(w,2500)-lp(w,300);S['whoosh']=w*np.sin(np.pi*np.minimum(1,t/0.5))**2*1.6
    n=int(0.45*SR);t=np.arange(n)/SR
    S['pop']=0.5*np.sin(2*np.pi*(520+380*np.minimum(1,t/0.08))*t)*np.exp(-t*9)
    n=int(0.7*SR);t=np.arange(n)/SR
    S['chime']=sum(a*np.sin(2*np.pi*f*t) for f,a in [(880,.35),(1320,.25),(1760,.15)])*np.exp(-t*5)
    n=int(0.9*SR);t=np.arange(n)/SR
    S['swell']=lp(rs.randn(n),1800)*np.sin(np.pi*np.minimum(1,t/0.9))**3*1.8
    return S
if __name__=='__main__':
    mode=sys.argv[1]
    if mode=='music':
        np.random.seed(1);save(sys.argv[3],music(float(sys.argv[2]))*0.9)
    else:
        S=sfx()
        for k,v in S.items(): save(f'{sys.argv[2]}/{k}.wav',v)
