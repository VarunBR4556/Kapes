import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TrustBar from "@/components/landing/TrustBar";
import HowItWorks from "@/components/landing/HowItWorks";
import VehicleTypes from "@/components/landing/VehicleTypes";
import ForYou from "@/components/landing/ForYou";
import About from "@/components/landing/About";
import Faq from "@/components/landing/Faq";
import CtaBand from "@/components/landing/CtaBand";
import Footer from "@/components/landing/Footer";

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="sm:space-y-0 -mt-4 sm:mt-0">
          <Hero />
          <TrustBar />
          <HowItWorks />
          <VehicleTypes />
          <ForYou />
          <About />
          <Faq />
          <CtaBand />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;