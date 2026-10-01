import { Truck, Container } from "lucide-react";
import Watermark from "@/components/landing/Watermark";

const stats = [
  { value: "25K+", label: "Trips shared" },
  { value: "40K+", label: "Tons of capacity moved" },
  { value: "220+", label: "Cities connected" },
  { value: "98%", label: "On-time delivery" },
];

const TrustBar = () => {
  return (
    <section className="relative overflow-hidden border-y bg-[#eceef1] dark:bg-muted/40 -mt-4 sm:mt-0">
      <div className="container grid grid-cols-2 gap-3 py-6 sm:gap-4 sm:py-8 md:grid-cols-4 md:gap-6 md:py-10">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-primary">
              {stat.value}
            </p>
            <p className="mt-0.5 text-[10px] sm:text-xs md:text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
      <Watermark icon={Container} className="-left-6 -bottom-6 h-20 w-20 -rotate-12 opacity-[0.05] dark:opacity-[0.06] sm:-left-10 sm:-bottom-8 sm:h-40 sm:w-40 sm:opacity-[0.07] sm:dark:opacity-[0.08]" />
      <Watermark icon={Truck} className="-right-6 -top-6 h-20 w-20 rotate-12 opacity-[0.05] dark:opacity-[0.06] sm:-right-10 sm:-top-12 sm:h-40 sm:w-40 sm:opacity-[0.07] sm:dark:opacity-[0.08]" />
    </section>
  );
};

export default TrustBar;