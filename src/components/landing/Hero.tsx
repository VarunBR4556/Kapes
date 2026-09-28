import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DatePicker from "@/components/ui/date-picker";
import { CityInput } from "@/components/ui/city-input";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Search, Truck, Zap, Star, ShieldCheck, Route, Package, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Watermark from "@/components/landing/Watermark";
import { useUsers } from "@/lib/users-store";

const Hero = () => {
  const navigate = useNavigate();
  const { currentUser } = useUsers();
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
    <section id="top" className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl dark:bg-teal-400/15" />

      <div className="container relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-accent px-4 py-1.5 text-sm font-medium">
            <Zap className="h-4 w-4 text-primary" />
            The unused-capacity marketplace
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl xl:text-6xl">
            Don't send an empty vehicle.{" "}
            <span className="text-primary">Don't pay for a whole one.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Kapes matches drivers with unused space on their route to customers who
            need cargo moved. Less fuel burned, lower shipping costs, fairer on everyone.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={handleSubmit}>
              <Search className="h-5 w-5" />
              Find capacity
            </Button>
            {currentUser?.role === "customer" ? (
              <Button size="lg" variant="outline" asChild>
                <a href="#company">
                  <HelpCircle className="h-5 w-5" />
                  Help
                </a>
              </Button>
            ) : (
              <Button size="lg" variant="outline" asChild>
                <Link to="/driver">
                  <Truck className="h-5 w-5" />
                  Post your trip
                </Link>
              </Button>
            )}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-2">
              {["RD", "MS", "AK", "JT"].map((initials, i) => (
                <span
                  key={initials}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 border-background text-xs font-bold",
                    ["bg-primary text-primary-foreground", "bg-amber-400 text-amber-950 dark:bg-teal-400 dark:text-teal-950", "bg-emerald-500 text-white", "bg-rose-500 text-white"][i],
                  )}
                >
                  {initials}
                </span>
              ))}
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400 dark:fill-teal-400 dark:text-teal-400" />
                ))}
                <span className="ml-1 font-semibold">4.8</span>
              </div>
              <p className="text-muted-foreground">
                Trusted by 5,000+ drivers & 2,000+ shippers
              </p>
            </div>
          </div>
        </div>

        <Card className="rounded-2xl p-6 shadow-xl sm:p-8">
          <form
            className="space-y-4"
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
            />
            <CityInput
              placeholder="Dropoff city"
              scope="destination"
              value={dropoff}
              onValueChange={setDropoff}
            />
            <div className="grid grid-cols-2 gap-4">
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
            <Button size="lg" className="w-full" type="submit">
              <Search className="h-5 w-5" />
              Search available capacity
            </Button>
          </form>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Verified drivers & secure payments
          </p>
        </Card>
      </div>
      <Watermark icon={Truck} className="-left-14 -top-8 h-72 w-72 rotate-12" />
      <Watermark icon={Route} className="-bottom-10 -right-10 h-80 w-80 -rotate-12" />
      <Watermark icon={Package} className="right-1/3 top-2 h-40 w-40 rotate-6" />
    </section>
  );
};

export default Hero;