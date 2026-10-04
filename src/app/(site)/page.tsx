import { Collections } from "@/components/home/Collections";
import { Community } from "@/components/home/Community";
import { Featured } from "@/components/home/Featured";
import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { MadeByHand } from "@/components/home/MadeByHand";
import { Band } from "@/components/home/Band";
import { NewIn } from "@/components/home/NewIn";

export default function Home() {
  return (
    <>
      <Hero />
      <NewIn />
      <Featured />
      <Band />
      <Collections />
      <MadeByHand />
      <Community />
      <Footer />
    </>
  );
}
