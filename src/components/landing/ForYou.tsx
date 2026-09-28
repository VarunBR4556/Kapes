import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Truck, Package, CheckCircle2, ArrowRight, Route } from "lucide-react";
import Watermark from "@/components/landing/Watermark";

const ForYou = () => {
  const navigate = useNavigate();

  return (
    <section id="for-you" className="relative scroll-mt-20 overflow-hidden py-20">
      <div className="container">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Built for both sides of the road
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div id="for-drivers" className="scroll-mt-20 rounded-2xl bg-primary p-8 text-primary-foreground dark:bg-primary/75 sm:p-10">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold">For Drivers</h3>
            <p className="mt-2 mb-6 text-primary-foreground/80">
              Turn your return trips and spare space into revenue. No empty runs.
            </p>
            <ul className="space-y-3">
              {[
                "Fill unused space on every trip",
                "Earn extra on return journeys",
                "Get paid securely on delivery",
                "Flexible schedule — post when you're on the road",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-300 dark:text-teal-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="secondary"
              size="lg"
              className="mt-8 bg-white text-primary hover:bg-white/90"
              onClick={() => navigate("/driver")}
            >
              Start earning with Kapes
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div id="for-customers" className="scroll-mt-20 rounded-2xl border bg-card p-8 shadow-sm sm:p-10">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 text-amber-950 dark:bg-teal-400 dark:text-teal-950">
              <Package className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold">For Customers</h3>
            <p className="mt-2 mb-6 text-muted-foreground">
              Ship smarter. Pay only for the space you use, not the whole vehicle.
            </p>
            <ul className="space-y-3">
              {[
                "Save up to 40% on small shipments",
                "Live tracking of your cargo",
                "Verified drivers & transparent pricing",
                "Pay securely on confirmation & delivery",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" className="mt-8 bg-amber-400 text-amber-950 hover:bg-amber-500 dark:bg-teal-400 dark:text-teal-950 dark:hover:bg-teal-500" onClick={() => navigate("/trips")}>
              Ship with Kapes
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <Watermark icon={Package} className="-left-10 -bottom-6 h-52 w-52 rotate-12" />
      <Watermark icon={Route} className="-right-12 top-16 h-56 w-56 -rotate-12" />
      <Watermark icon={Truck} className="top-1/2 right-1/3 h-28 w-28 rotate-6" />
    </section>
  );
};

export default ForYou;