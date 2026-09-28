import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TrustBar from "@/components/landing/TrustBar";
import HowItWorks from "@/components/landing/HowItWorks";
import VehicleTypes from "@/components/landing/VehicleTypes";
import ForYou from "@/components/landing/ForYou";
import CtaBand from "@/components/landing/CtaBand";
import Footer from "@/components/landing/Footer";

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <TrustBar />
        <HowItWorks />
        <VehicleTypes />
        <ForYou />
        <CtaBand />
      </main>
      <Footer />
    </div>
  );
};

export default Home;