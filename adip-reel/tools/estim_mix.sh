#!/bin/sh
# usage: estim_mix.sh <audio dir>  -> final.wav (voice + sfx + ducked music) and nomusic.wav, both -14 LUFS / -1 dBTP
A=$1
lufs() { ffmpeg -hide_banner -i "$1" -af ebur128=peak=true -f null - 2>&1 | awk '/I:/{i=$2} /Peak:/{p=$2} END{print i, p}'; }
norm() { # in out
  set -- "$1" "$2" $(lufs "$1")
  g=$(python3 -c "print(round(-14-($3),2))")
  ffmpeg -v error -y -i "$1" -af "volume=${g}dB,alimiter=limit=-1.6dB:level=false:attack=3:release=60" -ar 48000 "$2"
  echo "$2: $(lufs "$2")  (I LUFS, true peak dBFS)"
}
ffmpeg -v error -y -i $A/voice.wav -i $A/sfx.wav -filter_complex "[1:a]volume=-5dB[s];[0:a][s]amix=inputs=2:normalize=0" $A/_nomusic.wav
ffmpeg -v error -y -i $A/voice.wav -i $A/sfx.wav -i $A/music.wav -filter_complex \
 "[0:a]asplit=2[v][sc];[2:a]volume=-3dB[m];[m][sc]sidechaincompress=threshold=0.08:ratio=1.5:attack=25:release=450:makeup=1[md];[1:a]volume=-5dB[s];[v][s][md]amix=inputs=3:normalize=0" $A/_final.wav
norm $A/_nomusic.wav $A/nomusic.wav
norm $A/_final.wav $A/final.wav
