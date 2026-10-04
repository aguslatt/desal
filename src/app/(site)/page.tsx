import { Collections } from "@/components/home/Collections";
import { Footer } from "@/components/home/Footer";
import { Intro } from "@/components/home/Intro";
import { MadeByHand } from "@/components/home/MadeByHand";
import { Objects } from "@/components/home/Objects";
import { SeenOnYou } from "@/components/home/SeenOnYou";
import { World } from "@/components/home/World";

export default function Home() {
  return (
    <>
      <Intro />
      <Objects />
      <World />
      <MadeByHand />
      <Collections />
      <SeenOnYou />
      <Footer />
    </>
  );
}
