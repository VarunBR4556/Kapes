import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CityInput } from "@/components/ui/city-input";
import { Truck, Home, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { VEHICLE_TYPES, type Trip, type VehicleType } from "@/lib/trips";
import { useTrips } from "@/lib/trips-store";
import {
  getAvailableTrips,
  findExactMatches,
  findRelatedTrips,
  findRouteLegs,
  tripDeparted,
} from "@/lib/search";
import TripCard from "@/components/trips/TripCard";
import { formatDate } from "@/lib/format";
import ThemeToggle from "@/components/theme-toggle";
import { useUsers, isDriverSearchable } from "@/lib/users-store";

const Trips = () => {
  const { trips } = useTrips();
  const { currentUser, userById } = useUsers();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const activeType = searchParams.get("type") as VehicleType | null;

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date");
  const minWeight = searchParams.get("weight");

  const include = useMemo(
    () => (t: Trip) => !t.driverId || isDriverSearchable(userById(t.driverId)),
    [userById],
  );

  const available = useMemo(
    () =>
      getAvailableTrips(trips, include).filter((t) => !tripDeparted(t, new Date())),
    [trips, include],
  );

  const parsedMinWeight = minWeight && !Number.isNaN(Number(minWeight)) ? Number(minWeight) : null;

  const filters = useMemo(
    () => ({
      type: activeType,
      from,
      to,
      date,
      minWeight: parsedMinWeight,
      query,
    }),
    [activeType, from, to, date, parsedMinWeight, query],
  );

  const filtered = useMemo(() => findExactMatches(available, filters), [available, filters]);

  const related = useMemo(
    () => (from || to ? [] : findRelatedTrips(available, filtered, filters)),
    [available, filtered, filters, from, to],
  );

  const legs = useMemo(() => {
    const all = findRouteLegs(available, filters);
    const exactIds = new Set(filtered.map((t) => t.id));
    return {
      leaving: all.leaving.filter((t) => !exactIds.has(t.id)),
      arriving: all.arriving.filter((t) => !exactIds.has(t.id)),
    };
  }, [available, filters, filtered]);
  const showLegs =
    Boolean(from || to) && (legs.leaving.length > 0 || legs.arriving.length > 0);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const typeHref = (type: VehicleType | null) => {
    const next = new URLSearchParams(searchParams);
    if (type) {
      next.set("type", type);
    } else {
      next.delete("type");
    }
    const params = next.toString();
    return params ? `/trips?${params}` : "/trips";
  };

  const filterChips = [
    { label: from ? `From: ${from}` : null, clear: () => updateParam("from", null) },
    { label: to ? `To: ${to}` : null, clear: () => updateParam("to", null) },
    {
      label: date ? `After: ${formatDate(date)}` : null,
      clear: () => updateParam("date", null),
    },
    {
      label: minWeight ? `Min ${minWeight} kg` : null,
      clear: () => updateParam("weight", null),
    },
  ].filter(
    (chip) => chip.label !== null,
  ) as { label: string; clear: () => void }[];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Truck className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight">
              Kapes<span className="text-primary">.</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-accent px-3 py-1 text-sm font-medium sm:inline-flex">
              Browse capacity
            </span>
            <ThemeToggle />
            <Button size="sm" asChild>
              <Link to={currentUser ? (currentUser.role === "driver" ? "/driver" : "/account") : "/login"}>
                {currentUser ? "Dashboard" : "Log in"}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <Home className="h-4 w-4" />
                Back to site
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Available capacity</h1>
          <p className="mt-1 text-muted-foreground">
            {available.length} trips with spare space currently on the road.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Link
              to={typeHref(null)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                !activeType ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
              )}
            >
              All
            </Link>
            {VEHICLE_TYPES.map((v) => (
              <Link
                key={v}
                to={typeHref(v)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  activeType === v ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
                )}
              >
                {v}
              </Link>
            ))}
          </div>

          <div className="w-full lg:w-72">
            <CityInput
              icon={
                <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              }
              placeholder="Search city…"
              value={query}
              onValueChange={setQuery}
            />
          </div>
        </div>

        {filterChips.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {filterChips.map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-1.5 rounded-full border bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
              >
                {chip.label}
                <button
                  onClick={chip.clear}
                  className="text-muted-foreground transition-colors hover:text-primary"
                  aria-label={`Clear ${chip.label}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-2">
            {filtered.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}

        {showLegs && (
          <div className={cn(filtered.length > 0 && "mt-12")}>
            <div className="mb-6 rounded-xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
              {filtered.length === 0 ? (
                <>
                  No direct trip from{" "}
                  <span className="font-semibold text-foreground">{from ?? query}</span> to{" "}
                  <span className="font-semibold text-foreground">{to ?? query}</span> yet.
                  You can reach your destination in two legs — ship out of the origin,
                  then onward from a hub to your dropoff.
                </>
              ) : (
                <>
                  More trips involving{" "}
                  <span className="font-semibold text-foreground">{from ?? query}</span>
                  {to ? (
                    <>
                      {" "}
                      → <span className="font-semibold text-foreground">{to}</span>
                    </>
                  ) : null}{" "}
                  — combine these legs to complete your route.
                </>
              )}
            </div>

            {legs.leaving.length > 0 && (
              <div className="mb-10">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-amber-950 dark:bg-teal-400 dark:text-teal-950">
                    1
                  </span>
                  <h2 className="text-lg font-bold">Leaving {from}</h2>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Trips departing {from} — ship your goods to a hub first.
                </p>
                <div className="grid gap-5 lg:grid-cols-2">
                  {legs.leaving.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              </div>
            )}

            {legs.arriving.length > 0 && (
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-amber-950 dark:bg-teal-400 dark:text-teal-950">
                    2
                  </span>
                  <h2 className="text-lg font-bold">Arriving at {to}</h2>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Trips reaching {to} — move your goods onward from there.
                </p>
                <div className="grid gap-5 lg:grid-cols-2">
                  {legs.arriving.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!showLegs && related.length > 0 && (
          <>
            <div className="mb-5 rounded-xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
              No direct trips found for your route. Showing{" "}
              <span className="font-semibold text-foreground">
                {from || to || query}
              </span>
              trips heading nearby.
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {related.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </>
        )}

        {filtered.length === 0 && !showLegs && related.length === 0 && (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No trips found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different vehicle type or city — new capacity is posted every day.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Trips;