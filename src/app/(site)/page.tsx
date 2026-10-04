import { Banner } from "@/components/home/Banner";
import { Collections } from "@/components/home/Collections";
import { Community } from "@/components/home/Community";
import { Featured } from "@/components/home/Featured";
import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { MadeByHand } from "@/components/home/MadeByHand";
import { NewIn } from "@/components/home/NewIn";

export default function Home() {
  return (
    <>
      <Hero />
      <NewIn />
      <Banner />
      <Featured />
      <MadeByHand />
      <Collections />
      <Community />
      <Footer />
    </>
  );
}
