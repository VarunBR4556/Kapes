import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Truck, ArrowRight } from "lucide-react";

const CtaBand = () => {
  return (
    <section id="get-started" className="scroll-mt-20 pb-20">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-amber-400 px-8 py-16 text-center sm:px-16 dark:bg-teal-400">
          <Truck className="pointer-events-none absolute -bottom-8 -left-8 h-48 w-48 rotate-12 text-amber-500/40 dark:text-teal-600/40" />
          <Truck className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 -rotate-12 text-amber-500/40 dark:text-teal-600/40" />

          <h2 className="relative mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-amber-950 md:text-4xl dark:text-teal-950">
            Ready to fill your next trip?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-amber-900 dark:text-teal-900">
            Join the drivers and shippers already cutting empty kilometres and costs
            with Kapes.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="bg-amber-950 text-amber-50 hover:bg-amber-900 dark:bg-teal-950 dark:text-teal-50 dark:hover:bg-teal-900">
              <Link to="/login">
                Get Started — It's free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaBand;