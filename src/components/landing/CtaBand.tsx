import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Truck, ArrowRight } from "lucide-react";

const CtaBand = () => {
  return (
    <section id="get-started" className="scroll-mt-20 pb-8 sm:pb-12 lg:pb-16">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-amber-400 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-16 text-center dark:bg-teal-400">
          <Truck className="pointer-events-none absolute -bottom-4 -left-4 h-32 w-32 sm:-bottom-8 sm:-left-8 sm:h-48 sm:w-48 rotate-12 text-amber-500/40 dark:text-teal-600/40" />
          <Truck className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 sm:-right-8 sm:-top-8 sm:h-48 sm:w-48 -rotate-12 text-amber-500/40 dark:text-teal-600/40" />

          <h2 className="relative mx-auto max-w-xl text-xl sm:text-2xl lg:text-3xl md:text-4xl font-extrabold tracking-tight text-amber-950 dark:text-teal-950">
            Ready to fill your next trip?
          </h2>
          <p className="relative mx-auto mt-2 sm:mt-3 max-w-lg text-sm sm:text-base text-amber-900 dark:text-teal-900">
            Join the drivers and shippers already cutting empty kilometres and costs
            with Kapes.
          </p>
          <div className="relative mt-4 sm:mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
            <Button size="sm" className="w-full sm:w-auto bg-white text-amber-950 hover:bg-amber-50 dark:bg-white dark:text-teal-950 dark:hover:bg-teal-50" asChild>
              <Link to="/login">
                Get Started — It's free
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaBand;