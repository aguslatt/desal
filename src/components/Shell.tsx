"use client";

import { CartDrawer, CartProvider } from "./Cart";
import { Cursor } from "./Cursor";
import { Loader } from "./Loader";
import { Nav } from "./Nav";
import { PageTransition } from "./PageTransition";
import { ScrollFx } from "./ScrollFx";
import { SmoothScroll } from "./SmoothScroll";
import { ScrollProgress } from "./ui/Extras";
import { SectionDots } from "./ui/SectionDots";

export function Shell({ children, preload }: { children: React.ReactNode; preload: string[] }) {
  return (
    <CartProvider>
      <SmoothScroll />
      <Nav />
      <main className="pb-0">{children}</main>
      <CartDrawer />
      <PageTransition />
      <Loader preload={preload} />
      <Cursor />
      <ScrollProgress />
      <SectionDots />
      <ScrollFx />
    </CartProvider>
  );
}
