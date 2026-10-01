import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DatePicker from "@/components/ui/date-picker";
import { CityInput } from "@/components/ui/city-input";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Search, Truck, Zap, Star, ShieldCheck, Route, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import Watermark from "@/components/landing/Watermark";

const Hero = () => {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [date, setDate] = useState("");
  const [weight, setWeight] = useState("");
  const today = format(new Date(), "yyyy-MM-dd");

  const handleSubmit = () => {
    if (!pickup.trim()) {
      toast("Enter your pickup city", {
        description: "We need at least a pickup city to find capacity.",
      });
      return;
    }

    const params = new URLSearchParams();
    params.set("from", pickup.trim());
    if (dropoff.trim()) params.set("to", dropoff.trim());
    if (date) params.set("date", date);
    if (weight && Number(weight) > 0) params.set("weight", String(Math.round(Number(weight))));

    navigate(`/trips?${params.toString()}`);
  };

  return (
    <section id="top" className="relative overflow-hidden -mt-4 sm:mt-0">
      <div className="pointer-events-none absolute -left-20 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl sm:-left-32 sm:-top-32 sm:h-96 sm:w-96" />
      <div className="pointer-events-none absolute -right-16 top-24 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl sm:-right-24 sm:top-40 sm:h-80 sm:w-80 dark:bg-teal-400/15" />

      <div className="container relative grid items-center gap-8 sm:gap-10 py-8 sm:py-12 lg:py-16 lg:grid-cols-2">
        <div>
          <div className="mb-1.5 sm:mb-3 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border bg-accent px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            The unused-capacity marketplace
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight">
            Don't send an empty vehicle.{" "}
            <span className="text-primary">Don't pay for a whole one.</span>
          </h1>

          <p className="mt-4 sm:mt-5 max-w-xl text-sm sm:text-base text-muted-foreground">
            Kapes matches drivers with unused space on their route to customers who
            need cargo moved. Less fuel burned, lower shipping costs, fairer on everyone.
          </p>

          <div className="hidden sm:mt-6 sm:flex sm:items-center sm:gap-3">
            <div className="flex -space-x-2">
              {["RD", "MS", "AK", "JT"].map((initials, i) => (
                <span
                  key={initials}
                  className={cn(
                    "flex h-7 w-7 sm:h-8 sm:w-9 items-center justify-center rounded-full border-2 border-background text-[9px] sm:text-[10px] font-bold",
                    ["bg-primary text-primary-foreground", "bg-amber-400 text-amber-950 dark:bg-teal-400 dark:text-teal-950", "bg-emerald-500 text-white", "bg-rose-500 text-white"][i],
                  )}
                >
                  {initials}
                </span>
              ))}
            </div>
            <div className="text-[10px] sm:text-xs">
              <div className="flex items-center gap-0.5 sm:gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-2.5 w-2.5 sm:h-3 sm:w-4 fill-amber-400 text-amber-400 dark:fill-teal-400 dark:text-teal-400" />
                ))}
                <span className="ml-0.5 sm:ml-1 font-semibold">4.8</span>
              </div>
              <p className="text-muted-foreground hidden sm:block">
                Trusted by 5,000+ drivers & 2,000+ shippers
              </p>
            </div>
          </div>
        </div>

        <Card className="rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg sm:shadow-xl">
          <form
            className="space-y-2.5 sm:space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <CityInput
              placeholder="Pickup city"
              scope="origin"
              value={pickup}
              onValueChange={setPickup}
              include={() => true}
            />
            <CityInput
              placeholder="Dropoff city"
              scope="destination"
              value={dropoff}
              onValueChange={setDropoff}
              include={() => true}
            />
            <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2">
              <DatePicker
                value={date}
                onChange={setDate}
                min={today}
                aria-label="Travel date"
              />
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  placeholder="Weight (kg)"
                  className="pl-9"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>
            <Button size="sm" className="w-full" type="submit">
              <Search className="h-4 w-4" />
              Search available capacity
            </Button>
          </form>

          <p className="mt-3 sm:mt-4 flex items-center justify-center gap-1 text-center text-[9px] sm:text-xs text-muted-foreground">
            <ShieldCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-500" />
            Verified drivers & secure payments
          </p>
        </Card>
      </div>
      <Watermark icon={Truck} className="-left-8 -top-6 h-24 w-24 rotate-12 opacity-[0.05] dark:opacity-[0.06] sm:-left-14 sm:-top-8 sm:h-72 sm:w-72 sm:opacity-[0.07] sm:dark:opacity-[0.08]" />
      <Watermark icon={Route} className="-bottom-8 -right-8 h-28 w-28 -rotate-12 opacity-[0.05] dark:opacity-[0.06] sm:-bottom-10 sm:-right-10 sm:h-80 sm:w-80 sm:opacity-[0.07] sm:dark:opacity-[0.08]" />
      <Watermark icon={Package} className="right-2 top-24 h-16 w-16 rotate-6 opacity-[0.05] dark:opacity-[0.06] sm:right-1/3 sm:top-2 sm:h-40 sm:w-40 sm:opacity-[0.07] sm:dark:opacity-[0.08]" />
    </section>
  );
};

export default Hero;