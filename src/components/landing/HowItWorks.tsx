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
    <section id="how-it-works" className="relative scroll-mt-20 overflow-hidden py-20">
      <div className="container">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
            How it works
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Capacity that's already on the road
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Empty space is wasted money. Kapes puts it to work in three simple steps.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <Card key={step.title} className="relative overflow-hidden rounded-2xl">
              <CardContent className="p-7">
                <span className="absolute right-5 top-5 text-5xl font-extrabold text-primary/10">
                  0{i + 1}
                </span>
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 text-amber-950 dark:bg-teal-400 dark:text-teal-950">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Watermark icon={MapPin} className="-left-12 top-1/3 h-52 w-52 -rotate-12" />
      <Watermark icon={Navigation} className="-right-10 top-10 h-48 w-48 rotate-12" />
    </section>
  );
};

export default HowItWorks;