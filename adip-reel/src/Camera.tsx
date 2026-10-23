import React from 'react';
import {OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Pose, Shot, SHOTS} from './data';
import {clamp, easeIO, easeSoft, lerp} from './ui';

const mix = (a: Pose, b: Pose, k: number): Pose => ({
  cx: lerp(a.cx, b.cx, k),
  cy: lerp(a.cy, b.cy, k),
  z: lerp(a.z, b.z, k),
  b: lerp(a.b ?? 1, b.b ?? 1, k),
});

export const poseAt = (t: number): Pose => {
  let i = SHOTS.findIndex((s) => t >= s.from && t < s.to);
  if (i < 0) i = SHOTS.length - 1;
  const s = SHOTS[i];
  const p = clamp((t - s.from) / (s.to - s.from), 0, 1);
  const cur = mix(s.a, s.b, easeSoft(p));
  if (s.blend && i > 0 && t - s.from < s.blend) {
    const k = easeIO(clamp((t - s.from) / s.blend, 0, 1));
    return mix(SHOTS[i - 1].b, cur, k);
  }
  return cur;
};

export const Camera: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const pose = poseAt(t);
  const W = 2160 / pose.z;
  const H = 3840 / pose.z;
  const left = clamp(pose.cx - W / 2, 0, 2160 - W);
  const top = clamp(pose.cy - H / 2, 0, 3840 - H);
  const s = pose.z * 0.5;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#d8d8d6'}}>
      <OffthreadVideo
        src={staticFile('base.mp4')}
        muted
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 2160,
          height: 3840,
          transformOrigin: '0 0',
          transform: `scale(${s}) translate(${-left}px, ${-top}px)`,
          filter: `brightness(${pose.b ?? 1}) contrast(1.02)`,
        }}
      />
    </div>
  );
};
