import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Intro from "@/components/Intro";
import Nav from "@/components/Nav";
import Process from "@/components/Process";
import Projects from "@/components/Projects";
import Services from "@/components/Services";
import WhatsAppFab from "@/components/WhatsAppFab";

export default function Home() {
  return (
    <>
      <a href="#proyectos" className="skip">Saltar al contenido</a>
      <Nav />
      <main>
        <Hero />
        <Intro />
        <Projects />
        <Services />
        <About />
        <Process />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
