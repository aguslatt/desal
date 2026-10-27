import numpy as np, wave
sr=48000; D=30.4; N=int(D*sr); rng=np.random.default_rng(7)
t=np.arange(N)/sr
def fr(n): return 440*2**((n-69)/12)
def env(n,a,d,s=0.0,r=0.0):
    e=np.ones(n); na=int(a*sr); e[:na]=np.linspace(0,1,max(na,1))
    e[na:]=np.exp(-np.arange(n-na)/(d*sr)); return e
def add(buf,x,at,g=1.0):
    i=int(at*sr); j=min(N,i+len(x)); 
    if i<N: buf[i:j]+=x[:j-i]*g
music=np.zeros(N)
bpm=92; beat=60/bpm; bar=4*beat
chords=[(45,[57,60,64,67]),(41,[53,57,60,64]),(48,[55,60,64,67]),(43,[55,59,62,67])]
for b in range(12):
    root,notes=chords[b%4]; t0=b*bar
    # pad
    n=int((bar+1.2)*sr); tt=np.arange(n)/sr
    pad=sum(np.sin(2*np.pi*fr(m)*tt)+0.3*np.sin(2*np.pi*fr(m)*2.003*tt) for m in notes)/len(notes)
    e=np.minimum(tt/0.9,1)*np.minimum((bar+1.2-tt)/1.0,1); add(music,pad*e*0.55,t0)
    # bass
    nb=int(bar*sr); tb=np.arange(nb)/sr
    add(music,np.sin(2*np.pi*fr(root)*tb)*env(nb,0.01,1.2)*0.5,t0)
    # arpeggio e-piano (FM) on 8ths
    seq=[notes[0],notes[2],notes[3],notes[2]+12,notes[3],notes[2],notes[1],notes[2]]
    for k,m in enumerate(seq):
        at=t0+k*beat/2; nn=int(0.9*sr); tn=np.arange(nn)/sr
        f=fr(m+12); mod=np.sin(2*np.pi*f*tn)*2.0*np.exp(-tn*6)
        x=np.sin(2*np.pi*f*tn+mod)*np.exp(-tn*3.2)*np.minimum(tn/0.004,1)
        add(music,x,at,0.33*(0.8 if k%2 else 1))
# gentle lowpass via moving average
def lp(x,w): 
    k=np.ones(w)/w; return np.convolve(x,k,'same')
music=lp(music,6)
music/=np.abs(music).max()
fade=np.minimum(t/1.2,1)*np.clip((D-t)/2.4,0,1)
music*=fade
# SFX
sfx=np.zeros(N)
def whoosh(at,dur,g,f0=300,f1=2400):
    n=int(dur*sr); noise=rng.standard_normal(n); out=np.zeros(n)
    # sweep via time-varying one-pole lowpass minus highpass
    fc=np.geomspace(f0,f1,n); a=np.exp(-2*np.pi*fc/sr); y=0
    for i in range(n): y=a[i]*y+(1-a[i])*noise[i]; out[i]=y
    out=out-lp(out,400)
    e=np.sin(np.pi*np.linspace(0,1,n))**2
    add(sfx,out/np.abs(out).max()*e,at,g)
def tone(at,f,g,dec=0.18,dur=0.5,partials=(1,)):
    n=int(dur*sr); tn=np.arange(n)/sr
    x=sum(np.sin(2*np.pi*f*p*tn)/p for p in partials)*np.exp(-tn/dec)*np.minimum(tn/0.003,1)
    add(sfx,x,at,g)
whoosh(0.05,0.6,0.5)
tone(4.19,1318,0.35,0.07,0.3)
whoosh(7.2,0.75,0.6)
tone(10.07,660,0.45,0.12,0.4,(1,2))
for at,f in((18.35,659.3),(19.15,784),(20.0,1046.5)): tone(at,f,0.4,0.25,0.9,(1,2,3))
whoosh(22.45,0.6,0.35,600,3000)
whoosh(25.45,0.85,0.65)
for k,f in enumerate((784,988,1318)): tone(26.8+k*0.07,f,0.33,0.7,1.8,(1,2.76))
sfx/=np.abs(sfx).max()
# voice
w=wave.open('voice.wav'); v=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float64)/32768
voice=np.zeros(N); voice[:min(N,len(v))]=v[:N]
# ducking envelope from voice
absv=np.abs(voice); win=int(0.12*sr)
envv=np.convolve(absv,np.ones(win)/win,'same'); act=np.clip((envv-0.01)/0.03,0,1)
sm=np.convolve(act,np.ones(int(0.3*sr))/int(0.3*sr),'same')
duck=1-0.55*sm
mus_db=-27; sfx_db=-21
mix=voice+music*duck*10**(mus_db/20)*1.0+sfx*10**(sfx_db/20)
print('peak',np.abs(mix).max())
mix=mix/max(1,np.abs(mix).max()/0.89)
st=np.stack([mix,mix],1)
o=wave.open('mix.wav','wb'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(sr); o.writeframes((st*32767).astype(np.int16).tobytes()); o.close()
