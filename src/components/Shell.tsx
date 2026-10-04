"use client";

import { CartDrawer, CartProvider } from "./Cart";
import { Cursor } from "./Cursor";
import { Loader } from "./Loader";
import { Nav } from "./Nav";
import { PageTransition } from "./PageTransition";
import { ScrollFx } from "./ScrollFx";
import { SmoothScroll } from "./SmoothScroll";

export function Shell({ children, preload }: { children: React.ReactNode; preload: string[] }) {
  return (
    <CartProvider>
      <SmoothScroll />
      <Nav />
      <main className="pb-14 md:pb-0">{children}</main>
      <CartDrawer />
      <PageTransition />
      <Loader preload={preload} />
      <Cursor />
      <div className="grain" aria-hidden />
      <ScrollFx />
    </CartProvider>
  );
}
