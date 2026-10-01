import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Truck, Package, CheckCircle2, ArrowRight, Route } from "lucide-react";
import Watermark from "@/components/landing/Watermark";

const ForYou = () => {
  const navigate = useNavigate();

  return (
    <section id="for-you" className="relative scroll-mt-16 overflow-hidden py-8 sm:mt-0 sm:scroll-mt-24 sm:py-12 lg:py-16 -mt-4">
      <div className="container">
        <div className="mb-8 sm:mb-12 text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl md:text-4xl font-extrabold tracking-tight">
            Built for both sides of the road
          </h2>
        </div>

        <div className="grid gap-3 sm:gap-4 lg:gap-6 lg:grid-cols-2">
          <div id="for-drivers" className="rounded-2xl bg-primary p-3 sm:p-4 lg:p-6 text-primary-foreground dark:bg-primary/75">
            <div className="mb-4 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/15">
              <Truck className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold">For Drivers</h3>
            <p className="mt-1 mb-3 text-xs sm:text-sm text-primary-foreground/80">
              Turn your return trips and spare space into revenue. No empty runs.
            </p>
            <ul className="space-y-2">
              {[
                "Fill unused space on every trip",
                "Earn extra on return journeys",
                "Get paid securely on delivery",
                "Flexible schedule — post when you're on the road",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-amber-300 dark:text-teal-300" />
                  <span className="text-xs sm:text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4 w-full sm:w-auto bg-white text-primary hover:bg-white/90"
              onClick={() => navigate("/driver")}
            >
              Start earning with Kapes
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>

          <div id="for-customers" className="rounded-2xl border bg-card p-3 sm:p-4 lg:p-6 shadow-sm">
            <div className="mb-4 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-amber-400 text-amber-950 dark:bg-teal-400 dark:text-teal-950">
              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold">For Customers</h3>
            <p className="mt-1 mb-3 text-xs sm:text-sm text-muted-foreground">
              Ship smarter. Pay only for the space you use, not the whole vehicle.
            </p>
            <ul className="space-y-2">
              {[
                "Save up to 40% on small shipments",
                "Live tracking of your cargo",
                "Verified drivers & transparent pricing",
                "Pay securely on confirmation & delivery",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-primary" />
                  <span className="text-xs sm:text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <Button size="sm" className="mt-4 w-full sm:w-auto bg-amber-400 text-amber-950 hover:bg-amber-500 dark:bg-teal-400 dark:text-teal-950 dark:hover:bg-teal-500" onClick={() => navigate("/trips")}>
              Ship with Kapes
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>
      <Watermark icon={Package} className="-left-6 -bottom-4 h-24 w-24 rotate-12 opacity-[0.05] dark:opacity-[0.06] sm:-left-10 sm:-bottom-6 sm:h-52 sm:w-52 sm:opacity-[0.07] sm:dark:opacity-[0.08]" />
      <Watermark icon={Route} className="-right-6 top-20 h-24 w-24 -rotate-12 opacity-[0.05] dark:opacity-[0.06] sm:-right-12 sm:top-16 sm:h-56 sm:w-56 sm:opacity-[0.07] sm:dark:opacity-[0.08]" />
      <Watermark icon={Truck} className="right-2 top-1/2 h-20 w-20 rotate-6 opacity-[0.05] dark:opacity-[0.06] sm:right-1/3 sm:h-28 sm:w-28 sm:opacity-[0.07] sm:dark:opacity-[0.08]" />
    </section>
  );
};

export default ForYou;