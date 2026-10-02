import { useMemo } from "react";
import { Truck, Container } from "lucide-react";
import Watermark from "@/components/landing/Watermark";
import { useUsers } from "@/lib/users-store";
import { useTrips } from "@/lib/trips-store";
import { useBookings } from "@/lib/bookings-store";

interface Stat {
  value: string;
  label: string;
}

const inr = (value: number) =>
  "₹" + Math.round(value).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const kg = (value: number) => value.toLocaleString("en-IN") + " kg";

// Shown to signed-out visitors and to admins, where there is no single user's
// history to summarise.
const collective: Stat[] = [
  { value: "25K+", label: "Trips shared" },
  { value: "40K+", label: "Tons of capacity moved" },
  { value: "220+", label: "Cities connected" },
  { value: "98%", label: "On-time delivery" },
];

const TrustBar = () => {
  const { currentUser } = useUsers();
  const { myTrips } = useTrips();
  const { bookings, myBookings } = useBookings();

  const role = currentUser?.role;
  const isPersonal = !!currentUser && (role === "driver" || role === "customer");

  const stats = useMemo<Stat[]>(() => {
    if (!currentUser || !role || role === "admin") return collective;

    if (role === "driver") {
      const myTripIds = new Set(myTrips.map((t) => t.id));
      const onMyTrips = bookings.filter((b) => myTripIds.has(b.tripId));
      const delivered = onMyTrips.filter((b) => b.status === "delivered");
      const earnings = delivered.reduce((s, b) => s + b.totalPrice, 0);
      const active = myTrips.filter(
        (t) => t.status === "open" || t.status === "matched",
      ).length;

      return [
        { value: String(myTrips.length), label: "Trips you posted" },
        { value: String(delivered.length), label: "Shipments delivered" },
        { value: inr(earnings), label: "Earnings to date" },
        {
          value: String(active),
          label: active === 1 ? "Active trip" : "Active trips",
        },
      ];
    }

    // customer
    const active = myBookings.filter(
      (b) => b.status === "pending" || b.status === "confirmed" || b.status === "in_transit",
    );
    const delivered = myBookings.filter((b) => b.status === "delivered");
    const spend = myBookings
      .filter((b) => b.status !== "cancelled")
      .reduce((s, b) => s + b.totalPrice, 0);
    const totalKg = delivered.reduce((s, b) => s + b.shipmentWeightKg, 0);

    return [
      { value: String(myBookings.length), label: "Bookings made" },
      {
        value: String(active.length),
        label: active.length === 1 ? "Shipment in transit" : "Shipments in transit",
      },
      { value: kg(totalKg), label: "Weight delivered" },
      { value: inr(spend), label: "Total spend" },
    ];
  }, [currentUser, role, myTrips, bookings, myBookings]);

  const heading = isPersonal ? "Your Kapes activity" : null;

  return (
    <section className="relative overflow-hidden border-y bg-[#eceef1] dark:bg-muted/40 -mt-4 sm:mt-0">
      {heading && (
        <p className="container pt-5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:pt-7 sm:text-xs">
          {heading}
        </p>
      )}
      <div
        className={
          "container grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6 " +
          (heading ? "py-4 sm:py-6 md:py-7" : "py-6 sm:py-8 md:py-10")
        }
      >
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