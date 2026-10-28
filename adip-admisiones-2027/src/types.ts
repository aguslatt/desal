export type Seg = {
  id: string;
  kind: string;
  silent: boolean;
  speaker: 'lu' | 'int';
  srcF0: number;
  srcF1: number;
  outF0: number;
  outF1: number;
  srcA: number;
  srcB: number;
};
export type Sub = {s: number; e: number; lines: string[]; seg: string};
export type Timeline = {
  id: string;
  fps: number;
  totalFrames: number;
  voiceEnd: number;
  hold: number;
  segments: Seg[];
  words: {w: string; s: number; e: number; seg: string}[];
  subs: Sub[];
  marks: Record<string, number[]>;
};
