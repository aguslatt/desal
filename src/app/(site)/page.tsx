import { Banner } from "@/components/home/Banner";
import { Collections } from "@/components/home/Collections";
import { Community } from "@/components/home/Community";
import { Featured } from "@/components/home/Featured";
import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { MadeByHand } from "@/components/home/MadeByHand";
import { Necklace } from "@/components/home/Necklace";
import { NewIn } from "@/components/home/NewIn";
import { Perks } from "@/components/home/Perks";

export default function Home() {
  return (
    <>
      <Hero />
      <NewIn />
      <Perks />
      <Necklace />
      <Banner />
      <Featured />
      <MadeByHand />
      <Collections />
      <Community />
      <Footer />
    </>
  );
}
