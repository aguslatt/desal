# Portal de empleo · pipeline

1. `python3 tools/build_edl.py words.json src/portal/edl.json` – edit decision list from the ASR words.
2. ffmpeg cuts (`public/portal/edit.mp4`, voz limpia) – see the commands in the session notes.
3. `src/portal/plan.ts` – what the portal window shows, when (screenshots of the real site, cursor, highlights, steps).
4. `npx remotion render src/index.ts Portal out/portal_silent.mp4`
5. `node --experimental-strip-types tools/dump_sfx.mjs sfx.json` + `python3 tools/synth.py …` + `python3 tools/mix.py <total>` – música, efectos y mezcla.
6. `ffmpeg -i out/portal_silent.mp4 -i final.wav -c:v copy -c:a aac …` – MP4 final.
