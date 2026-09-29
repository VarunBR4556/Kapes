import { Card, CardContent } from "@/components/ui/card";
import { Truck, Search, PackageCheck, MapPin, Navigation } from "lucide-react";
import Watermark from "@/components/landing/Watermark";

const steps = [
  {
    icon: Truck,
    title: "Drivers post trips",
    description:
      "Share your route, vehicle type, available capacity, departure date and price per kg in under two minutes.",
  },
  {
    icon: Search,
    title: "Customers find & book",
    description:
      "Search by pickup, dropoff and date. Compare verified drivers and book only the space you actually need.",
  },
  {
    icon: PackageCheck,
    title: "Ship, track & pay securely",
    description:
      "Your cargo moves on a route that was already happening. Track it live and pay securely on delivery.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative scroll-mt-10 overflow-hidden py-8 sm:py-12 lg:py-16 -mt-4 sm:mt-0">
      <div className="container">
        <div className="mx-auto mb-10 sm:mb-14 max-w-2xl text-center">
          <p className="mb-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-primary">
            How it works
          </p>
          <h2 className="text-xl sm:text-2xl lg:text-3xl md:text-4xl font-extrabold tracking-tight">
            Capacity that's already on the road
          </h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground">
            Empty space is wasted money. Kapes puts it to work in three simple steps.
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 lg:gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <Card key={step.title} className="relative overflow-hidden rounded-2xl">
              <CardContent className="p-4 sm:p-5 lg:p-7">
                <span className="absolute right-4 top-4 text-4xl font-extrabold text-primary/10 sm:text-5xl">
                  0{i + 1}
                </span>
                <div className="mb-4 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-amber-400 text-amber-950 dark:bg-teal-400 dark:text-teal-950">
                  <step.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="mb-1.5 text-lg sm:text-xl font-bold">{step.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{step.description}</p>
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