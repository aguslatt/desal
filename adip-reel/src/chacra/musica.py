# Original soundtrack for "Un día en la chacra": ukulele-style strum, glockenspiel melody,
# soft bass and light percussion. 100 BPM, 16 bars of 4/4 = 38.4 s. Fully synthesised.
import numpy as np, wave, sys
SR=44100; BPM=100; BEAT=60/BPM; BAR=4*BEAT; E8=BEAT/2
TOTAL=16*BAR
N=int((TOTAL+0.5)*SR); rng=np.random.default_rng(7)
L=np.zeros(N); R=np.zeros(N)
def hz(n):
    names={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
    return 440*2**((names[n[0]]+12*(int(n[-1])+1)+(1 if '#' in n else 0)-69)/12)
def put(sig,t,g=1.0,pan=0.0):
    i=int(t*SR); j=min(N,i+len(sig)); 
    if i>=N: return
    s=sig[:j-i]*g; L[i:j]+=s*(1-max(0,pan)); R[i:j]+=s*(1+min(0,pan))
def pluck(f,dur=1.6,bright=0.5):
    n=int(SR/f); per=rng.uniform(-1,1,n)
    # soften the initial burst (nylon string)
    k=np.ones(5)/5; per=np.convolve(np.concatenate([per[-4:],per]),k,'valid')[:n]
    out=[]; reps=int(dur*f)+1; dec=0.9965-0.002*(f/800)
    for _ in range(reps):
        out.append(per); per=dec*((1-bright)*per+bright*np.roll(per,1))
    y=np.concatenate(out)[:int(dur*SR)]
    return y*np.minimum(1,np.arange(len(y))/60)
def glock(f,dur=1.4):
    t=np.arange(int(dur*SR))/SR
    y=np.sin(2*np.pi*f*t)*np.exp(-t*5)+0.35*np.sin(2*np.pi*f*2.76*t)*np.exp(-t*11)+0.12*np.sin(2*np.pi*f*5.4*t)*np.exp(-t*20)
    return y*np.minimum(1,t*600)
def bass(f,dur=0.55):
    t=np.arange(int(dur*SR))/SR
    return (np.sin(2*np.pi*f*t)+0.25*np.sin(4*np.pi*f*t))*np.exp(-t*4.5)*np.minimum(1,t*200)
def kick():
    t=np.arange(int(0.28*SR))/SR; ph=2*np.pi*(45*t+ (110-45)/22*(1-np.exp(-22*t)))
    return np.sin(ph)*np.exp(-t*13)
def noise(dur,dec,hp=True):
    n=int(dur*SR); x=rng.uniform(-1,1,n)
    if hp: x=np.diff(x,prepend=0); x=np.diff(x,prepend=0)
    return x*np.exp(-np.arange(n)/SR*dec)
def snap():
    x=noise(0.09,55,False); t=np.arange(len(x))/SR
    return (x*0.6+np.sin(2*np.pi*1900*t)*0.25)*np.exp(-t*40)
def pad(notes,dur):
    t=np.arange(int(dur*SR))/SR; y=sum(np.sin(2*np.pi*hz(n)*t+i)+0.3*np.sin(4*np.pi*hz(n)*t) for i,n in enumerate(notes))
    env=np.minimum(1,t/0.5)*np.minimum(1,(dur-t)/0.5)
    return y*env/len(notes)

CH={'C':(['G4','C4','E4','C5'],'C2'),'G':(['D4','G4','B4','G4'],'G2'),'Am':(['C4','E4','A4','E4'],'A2'),'F':(['C4','F4','A4','F4'],'F2')}
PROG=['C','G','Am','F']*3+['C','G','F','C']
A=[['E5',None,'G5',None,'C6',None,'G5','E5'],['D5',None,'G5',None,'B5',None,None,None],['C5',None,'E5',None,'A5',None,'E5','C5'],['C5',None,'F5',None,'A5',None,'G5',None]]
B=[['G5',None,'E5','G5','C6',None,None,None],['B5',None,'G5',None,'D5',None,'G5',None],['A5',None,'E5','A5','C6',None,None,None],['A5',None,'G5',None,'F5',None,'E5','D5']]
END=[['E5',None,'G5',None,'C6',None,'G5','E5'],['D5',None,'G5',None,'B5',None,'D6',None],['C6',None,'A5',None,'F5',None,'G5','A5'],['C6',None,None,None,None,None,None,None]]
MEL=A+B+A+END
STRUM=[(0,'d',1.0),(2,'d',0.8),(3,'u',0.5),(5,'u',0.55),(6,'d',0.8),(7,'u',0.5)]
for b in range(16):
    t0=b*BAR; notes,root=CH[PROG[b]]
    soft = b in (0,) ; calm = b in (13,)   # intro / the hug
    last = b==15
    # pad
    put(pad(notes[:3],BAR+0.3),t0,0.05 if not calm else 0.09)
    # ukulele
    pattern=[(0,'d',1.0)] if (soft or last) else STRUM
    for slot,d,v in pattern:
        order=notes if d=='d' else notes[::-1][:3]
        for k,n in enumerate(order):
            put(pluck(hz(n),2.6 if last else 1.3,0.5),t0+slot*E8+k*0.014+(0.008 if d=='u' else 0),0.16*v*(0.7 if calm else 1),pan=-0.25)
    # bass
    if b>=1 and not last:
        put(bass(hz(root)),t0,0.34); 
        if not calm: put(bass(hz(root)),t0+2.5*BEAT,0.22); put(bass(hz(root)*1.5),t0+3*BEAT,0.2)
    if last: put(bass(hz(root),1.6),t0,0.34)
    # percussion
    if 3<=b<=14 and not calm:
        put(kick(),t0,0.55); put(kick(),t0+2*BEAT,0.5); put(kick(),t0+2.5*BEAT,0.3)
        put(snap(),t0+BEAT,0.28,pan=0.2); put(snap(),t0+3*BEAT,0.3,pan=0.2)
    if 2<=b<=14:
        for e in range(8): put(noise(0.05,70),t0+e*E8,(0.05 if e%2 else 0.03)*(0.6 if calm else 1),pan=0.35)
    # melody
    for e,n in enumerate(MEL[b]):
        if n: put(glock(hz(n),2.6 if last else 1.4),t0+e*E8,0.22,pan=0.15); 
    if b in (7,11) : put(glock(hz('G6'),1.0),t0+3.5*BEAT,0.08,pan=0.3)
# room: light convolution reverb
ir_n=int(1.1*SR); ir=rng.normal(0,1,(2,ir_n))*np.exp(-np.arange(ir_n)/SR*5.5); ir[:, :200]*=0.1
def conv(x,h):
    n=len(x)+len(h)-1; m=1<<(n-1).bit_length()
    return np.fft.irfft(np.fft.rfft(x,m)*np.fft.rfft(h,m),m)[:len(x)]
wl=conv(L,ir[0]); wr=conv(R,ir[1]); k=0.16/np.sqrt(np.mean(ir[0]**2)*ir_n)
L=L+wl*k; R=R+wr*k
out=np.stack([L,R],1); out=out[:int(TOTAL*SR)]
fade=int(1.3*SR); out[-fade:]*=np.linspace(1,0,fade)[:,None]**1.5
out[:int(0.01*SR)]*=np.linspace(0,1,int(0.01*SR))[:,None]
out=np.tanh(out/np.max(np.abs(out))*1.4); out=out/np.max(np.abs(out))*0.82
w=wave.open(sys.argv[1],'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out*32767).astype('<i2').tobytes()); w.close()
print(len(out)/SR)
