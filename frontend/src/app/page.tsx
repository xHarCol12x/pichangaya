import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import Features from "@/components/landing/Features";
import AudienceSection from "@/components/landing/AudienceSection";
import StatsSection from "@/components/landing/StatsSection";
import HowItWorks from "@/components/landing/HowItWorks";
import AISection from "@/components/landing/AISection";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <Features />
      <AudienceSection />
      <HowItWorks />
      <AISection />
      <Testimonials />
      <Pricing />
      <Footer />
    </main>
  );
}
