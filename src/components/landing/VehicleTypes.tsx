import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Box, Truck, Container, Route, ArrowRight } from "lucide-react";
import type { VehicleType } from "@/lib/trips";
import Watermark from "@/components/landing/Watermark";

interface VehicleCard {
  icon: typeof Box;
  label: string;
  short: string;
  shortRange: string;
  range: string;
  use: string;
  type: VehicleType;
}

const vehicles: VehicleCard[] = [
  {
    icon: Box,
    label: "Mini Van / LCV",
    short: "Mini",
    shortRange: "1.5t max",
    range: "500 – 1,500 kg",
    use: "Intra-city & last mile",
    type: "Mini",
  },
  {
    icon: Truck,
    label: "Truck (6–14 ft)",
    short: "Truck",
    shortRange: "2–5t",
    range: "2 – 5 tonnes",
    use: "Intercity haulage",
    type: "Truck",
  },
  {
    icon: Container,
    label: "Container",
    short: "Container",
    shortRange: "7–14t",
    range: "7 – 14 tonnes",
    use: "Full truckload (FTL)",
    type: "Container",
  },
  {
    icon: Route,
    label: "Trailer",
    short: "Trailer",
    shortRange: "16–25t",
    range: "16 – 25 tonnes",
    use: "Bulk & long haul",
    type: "Trailer",
  },
];

const VehicleTypes = () => {
  return (
    <section id="vehicle-types" className="relative overflow-hidden border-y bg-[#eceef1] py-8 sm:py-12 lg:py-16 dark:bg-muted/40 -mt-4 sm:mt-0">
      <div className="container">
        <div className="mx-auto mb-5 max-w-2xl text-center sm:mb-14">
          <p className="mb-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary sm:py-0.5 sm:text-xs">
            Vehicle types
          </p>
          <h2 className="text-lg font-extrabold tracking-tight sm:text-2xl lg:text-3xl md:text-4xl">
            Space for every kind of cargo
          </h2>
          <p className="mt-2 text-xs text-muted-foreground sm:mt-3 sm:text-base">
            <span className="hidden sm:inline">
              From a few boxes in a van to a full 25-tonne trailer — find or fill space
              on the right vehicle.
            </span>
            <span className="sm:hidden">Find or fill space on any vehicle.</span>
          </p>
        </div>

        <div className="-mx-8 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-pl-8 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:scroll-pl-0 lg:grid-cols-4 lg:gap-6">
          {vehicles.map((v) => (
            <Card
              key={v.label}
              className="group w-[42%] shrink-0 cursor-pointer snap-start rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg sm:w-auto sm:rounded-2xl"
            >
              <CardContent className="flex flex-col items-start p-2 sm:p-5 lg:p-7">
                <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-110 sm:mb-4 sm:h-12 sm:w-12 sm:rounded-xl">
                  <v.icon className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="text-xs leading-tight font-bold sm:text-lg">
                  <span className="sm:hidden">{v.short}</span>
                  <span className="hidden sm:inline">{v.label}</span>
                </h3>
                <p className="mt-0.5 text-[9px] font-extrabold leading-tight tracking-tight text-primary sm:mt-0.5 sm:text-2xl">
                  <span className="sm:hidden">{v.shortRange}</span>
                  <span className="hidden sm:inline">{v.range}</span>
                </p>
                <p className="mt-1 text-[10px] leading-tight text-muted-foreground sm:mt-1 sm:text-sm">
                  {v.use}
                </p>
                <Link
                  to={`/trips?type=${v.type}`}
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-primary sm:mt-4 sm:text-sm"
                >
                  <span className="sm:hidden">See</span>
                  <span className="hidden sm:inline">See trips</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1 sm:h-4 sm:w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Watermark icon={Box} className="-left-14 top-1/4 h-56 w-56 rotate-12 opacity-[0.03] dark:opacity-[0.04] sm:opacity-[0.07] sm:dark:opacity-[0.08]" />
      <Watermark icon={Truck} className="-right-12 bottom-8 h-64 w-64 -rotate-6 opacity-[0.03] dark:opacity-[0.04] sm:opacity-[0.07] sm:dark:opacity-[0.08]" />
      <Watermark icon={Route} className="right-1/4 -top-6 h-32 w-32 rotate-45 opacity-[0.03] dark:opacity-[0.04] sm:opacity-[0.07] sm:dark:opacity-[0.08]" />
    </section>
  );
};

export default VehicleTypes;