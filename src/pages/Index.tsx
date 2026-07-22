import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import TrustStrip from "@/components/landing/TrustStrip";
import ProblemSection from "@/components/landing/ProblemSection";
import PlatformSection from "@/components/landing/PlatformSection";
import MethodologySection from "@/components/landing/MethodologySection";
import BenchmarkSection from "@/components/landing/BenchmarkSection";
import MacroSection from "@/components/landing/MacroSection";
import ReportsSection from "@/components/landing/ReportsSection";
import ProductPreview from "@/components/landing/ProductPreview";
import TrustGovernance from "@/components/landing/TrustGovernance";
import ValuationTeaser from "@/components/landing/ValuationTeaser";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";
import DemoDashboard from "@/components/demo/DemoDashboard";

const Index = () => {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      <Navbar onOpenDemo={() => setDemoOpen(true)} />
      {/* 1. Hero */}
      <HeroSection onOpenDemo={() => setDemoOpen(true)} />
      {/* 2. Trust strip */}
      <TrustStrip />
      {/* 3. Problem */}
      <ProblemSection />
      {/* 4. Platform workflow */}
      <PlatformSection />
      {/* 5. Methodology */}
      <MethodologySection onOpenDemo={() => setDemoOpen(true)} />
      {/* 6. Benchmarks */}
      <BenchmarkSection />
      {/* 7. Macro context */}
      <MacroSection />
      {/* 8. Reports AAA */}
      <ReportsSection onOpenDemo={() => setDemoOpen(true)} />
      {/* 9. Product preview */}
      <ProductPreview />
      {/* 10. Trust governance */}
      <TrustGovernance />
      {/* 11. Quick estimator (after credibility is established) */}
      <ValuationTeaser onOpenDemo={() => setDemoOpen(true)} />
      {/* 12. Final CTA */}
      <FinalCTA onOpenDemo={() => setDemoOpen(true)} />
      {/* 13. Footer */}
      <Footer onOpenDemo={() => setDemoOpen(true)} />
      <DemoDashboard open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
};

export default Index;
