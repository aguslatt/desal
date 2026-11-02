"""Mixes voice (cleaned) + music bed (ducked under the voice) + sync'd UI effects -> final.wav"""
import json,sys,wave,subprocess,numpy as np
SR=48000
A='/tmp/claude-0/aud/'
total=float(sys.argv[1])
def rd(p):
    out=subprocess.run(['ffmpeg','-v','error','-i',p,'-f','f32le','-ac','2','-ar',str(SR),'-'],capture_output=True).stdout
    return np.frombuffer(out,dtype=np.float32).reshape(-1,2)
n=int(total*SR)
voice=np.zeros((n,2),np.float32);v=rd(A+'voice.wav');voice[:min(n,len(v))]=v[:n]
music=np.zeros((n,2),np.float32);m=rd(A+'music.wav');music[:min(n,len(m))]=m[:n]
# duck: envelope of the voice (smoothed) pulls music down
env=np.abs(voice).mean(1);k=int(0.12*SR);env=np.convolve(env,np.ones(k)/k,'same')
env=np.convolve(env,np.ones(int(0.25*SR))/int(0.25*SR),'same')
duck=1-np.clip(env*9,0,1)*0.55
music*= (0.13*duck)[:,None]
# fade the music out at the end
fo=np.clip((total-np.arange(n)/SR)/1.6,0,1);music*=fo[:,None]
mix=voice.copy()+music
cache={}
for c in json.load(open(A+'sfx.json')):
    if c['n'] not in cache: cache[c['n']]=rd(A+c['n']+'.wav')
    w=cache[c['n']]*c['g']*0.55
    i=int(c['t']*SR)
    if i<n: mix[i:i+len(w)]+=w[:max(0,n-i)] if i+len(w)>n else w
# gentle limiter
pk=np.abs(mix).max();print('peak',pk)
mix=np.tanh(mix*0.95)/np.tanh(0.95) if pk>0.98 else mix
out=(np.clip(mix,-1,1)*32767).astype(np.int16)
w=wave.open(A+'final.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(out.tobytes());w.close()
