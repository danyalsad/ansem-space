import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Forge } from "@/components/sections/Forge";
import { Charge } from "@/components/sections/Charge";
import { Herd } from "@/components/sections/Herd";
import { Hands } from "@/components/sections/Hands";
import { Lore } from "@/components/sections/Lore";
import { Intel } from "@/components/sections/Intel";
import { Footer } from "@/components/Footer";
import { FloatingCTA } from "@/components/FloatingCTA";

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <Forge />
      <Charge />
      <Herd />
      <Hands />
      <Lore />
      <Intel />
      <Footer />
      <FloatingCTA />
    </main>
  );
}
