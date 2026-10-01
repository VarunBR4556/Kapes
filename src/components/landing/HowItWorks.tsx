import { Card, CardContent } from "@/components/ui/card";
import { Truck, Search, PackageCheck, MapPin, Navigation } from "lucide-react";
import Watermark from "@/components/landing/Watermark";

const steps = [
  {
    icon: Truck,
    title: "Drivers post trips",
    short: "Post trips",
    shortDesc: "Share route, space, date & price.",
    description:
      "Share your route, vehicle type, available capacity, departure date and price per kg in under two minutes.",
  },
  {
    icon: Search,
    title: "Customers find & book",
    short: "Find & book",
    shortDesc: "Search by pickup, dropoff & date.",
    description:
      "Search by pickup, dropoff and date. Compare verified drivers and book only the space you actually need.",
  },
  {
    icon: PackageCheck,
    title: "Ship, track & pay securely",
    short: "Ship & pay",
    shortDesc: "Track live, pay on delivery.",
    description:
      "Your cargo moves on a route that was already happening. Track it live and pay securely on delivery.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative scroll-mt-10 overflow-hidden py-8 sm:py-12 lg:py-16 -mt-4 sm:mt-0">
      <div className="container">
        <div className="mx-auto mb-5 max-w-2xl text-center sm:mb-14">
          <p className="mb-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary sm:py-0.5 sm:text-xs">
            How it works
          </p>
          <h2 className="text-lg font-extrabold tracking-tight sm:mb-0 sm:text-2xl lg:text-3xl md:text-4xl">
            Capacity that's already on the road
          </h2>
          <p className="mt-2 text-xs text-muted-foreground sm:mt-3 sm:text-base">
            <span className="hidden sm:inline">
              Empty space is wasted money. Kapes puts it to work in three simple steps.
            </span>
            <span className="sm:hidden">Three simple steps.</span>
          </p>
        </div>

        <div className="-mx-8 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-pl-8 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:scroll-pl-0 lg:gap-6">
          {steps.map((step, i) => (
            <Card
              key={step.title}
              className="relative w-[70%] shrink-0 snap-start overflow-hidden rounded-xl sm:w-auto sm:rounded-2xl"
            >
              <CardContent className="p-2 sm:p-5 lg:p-7">
                <span className="absolute right-1.5 top-1.5 text-xl font-extrabold text-primary/10 sm:right-4 sm:top-4 sm:text-5xl">
                  0{i + 1}
                </span>
                <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-amber-950 dark:bg-teal-400 dark:text-teal-950 sm:mb-4 sm:h-12 sm:w-12 sm:rounded-xl">
                  <step.icon className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="text-sm leading-tight font-bold sm:mb-1.5 sm:text-xl">
                  {step.short}
                </h3>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground sm:mt-0 sm:text-base">
                  <span className="sm:hidden">{step.shortDesc}</span>
                  <span className="hidden sm:inline">{step.description}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Watermark icon={MapPin} className="-left-12 top-1/3 h-52 w-52 -rotate-12 opacity-[0.03] dark:opacity-[0.04] sm:opacity-[0.07] sm:dark:opacity-[0.08]" />
      <Watermark icon={Navigation} className="-right-10 top-10 h-48 w-48 rotate-12 opacity-[0.03] dark:opacity-[0.04] sm:opacity-[0.07] sm:dark:opacity-[0.08]" />
    </section>
  );
};

export default HowItWorks;