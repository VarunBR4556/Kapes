import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Box, Truck, Container, Route, ArrowRight } from "lucide-react";
import type { VehicleType } from "@/lib/trips";
import Watermark from "@/components/landing/Watermark";

interface VehicleCard {
  icon: typeof Box;
  label: string;
  range: string;
  use: string;
  type: VehicleType;
}

const vehicles: VehicleCard[] = [
  {
    icon: Box,
    label: "Mini Van / LCV",
    range: "500 – 1,500 kg",
    use: "Intra-city & last mile",
    type: "Mini",
  },
  {
    icon: Truck,
    label: "Truck (6–14 ft)",
    range: "2 – 5 tonnes",
    use: "Intercity haulage",
    type: "Truck",
  },
  {
    icon: Container,
    label: "Container",
    range: "7 – 14 tonnes",
    use: "Full truckload (FTL)",
    type: "Container",
  },
  {
    icon: Route,
    label: "Trailer",
    range: "16 – 25 tonnes",
    use: "Bulk & long haul",
    type: "Trailer",
  },
];

const VehicleTypes = () => {
  return (
    <section id="vehicle-types" className="relative overflow-hidden border-y bg-[#eceef1] py-8 sm:py-12 lg:py-16 dark:bg-muted/40 -mt-4 sm:mt-0">
      <div className="container">
        <div className="mx-auto mb-10 sm:mb-14 max-w-2xl text-center">
          <p className="mb-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-primary">
            Vehicle types
          </p>
          <h2 className="text-xl sm:text-2xl lg:text-3xl md:text-4xl font-extrabold tracking-tight">
            Space for every kind of cargo
          </h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground">
            From a few boxes in a van to a full 25-tonne trailer — find or fill space
            on the right vehicle.
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {vehicles.map((v) => (
            <Card
              key={v.label}
              className="group cursor-pointer rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <CardContent className="flex flex-col items-start p-4 sm:p-5 lg:p-7">
                <div className="mb-4 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:scale-110">
                  <v.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold">{v.label}</h3>
                <p className="mt-0.5 text-xl sm:text-2xl font-extrabold tracking-tight text-primary">
                  {v.range}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{v.use}</p>
                <Link
                  to={`/trips?type=${v.type}`}
                  className="mt-4 inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary"
                >
                  See trips <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
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