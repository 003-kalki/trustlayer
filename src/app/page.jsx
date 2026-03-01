import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import HowItWorksSection from "@/components/landing/HowItWorks";
import ProblemSection from "@/components/landing/ProblemSection";
import RoadmapSection from "@/components/landing/RoadmapSection";


export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <ProblemSection/>
      <HowItWorksSection/>
      <FeaturesSection />
      <RoadmapSection/>
      <CTASection />
      <Footer />
    </>
  );
}