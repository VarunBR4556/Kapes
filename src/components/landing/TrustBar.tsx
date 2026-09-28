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
    <section className="relative overflow-hidden border-y bg-[#eceef1] dark:bg-muted/40">
      <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-3xl font-extrabold tracking-tight text-primary md:text-4xl">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
      <Watermark icon={Container} className="-left-10 -bottom-8 h-40 w-40 -rotate-12" />
      <Watermark icon={Truck} className="-right-10 -top-12 h-40 w-40 rotate-12" />
    </section>
  );
};

export default TrustBar;