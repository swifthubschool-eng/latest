import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/layout/Hero";
import { StockCarousel } from "@/components/StockCarousel";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <Hero />
      <section className="py-2">
        <StockCarousel />
      </section>
    </main>
  );
}
