import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeatureCards from "@/components/landing/FeatureCards";
import HowItWorks from "@/components/landing/HowItWorks";
import CTASection from "@/components/landing/CTASection";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main id="top" className="min-h-screen bg-slate-950 light:bg-slate-50 text-white light:text-slate-900 selection:bg-emerald-500/30 font-sans overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <FeatureCards />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
