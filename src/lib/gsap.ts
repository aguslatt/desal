"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

let ready = false;
export function registerGsap() {
  if (ready || typeof window === "undefined") return gsap;
  gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin, MotionPathPlugin);
  gsap.defaults({ ease: "power3.out", duration: 0.7 });
  ready = true;
  return gsap;
}

export { gsap, ScrollTrigger, Draggable };
