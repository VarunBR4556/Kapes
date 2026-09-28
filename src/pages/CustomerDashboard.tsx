import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Truck, Home, Search, Package, Wallet, CheckCircle2, Activity, LogOut, ArrowRight, MapPin, CalendarDays, X, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUsers } from "@/lib/users-store";
import { useTrips } from "@/lib/trips-store";
import { useBookings, bookingStatusLabels, bookingSizeLabel } from "@/lib/bookings-store";
import type { BookingStatus } from "@/lib/bookings-store";
import { formatDate } from "@/lib/format";
import ThemeToggle from "@/components/theme-toggle";
import ReportIssueDialog from "@/components/reports/ReportIssueDialog";
import ReportBugDialog from "@/components/reports/ReportBugDialog";

const statusStyles: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-teal-400/15 dark:text-teal-300",
  confirmed: "bg-primary/10 text-primary",
  in_transit: "bg-sky-100 text-sky-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-muted text-muted-foreground",
};

const CustomerDashboard = () => {
  const { currentUser, logout } = useUsers();
  const { trips } = useTrips();
  const { myBookings, setBookingStatus } = useBookings();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const tripMap = useMemo(() => new Map(trips.map((t) => [t.id, t])), [trips]);

  if (!currentUser) return null;

  const active = myBookings.filter(
    (b) => b.status === "pending" || b.status === "confirmed" || b.status === "in_transit",
  );
  const delivered = myBookings.filter((b) => b.status === "delivered");
  const totalSpend = myBookings.reduce((s, b) => s + b.totalPrice, 0);

  const stats = [
    {
      icon: Package,
      label: "Total shipments",
      value: String(myBookings.length),
      accent: "bg-primary text-primary-foreground",
    },
    {
      icon: Activity,
      label: "Active shipments",
      value: String(active.length),
      accent: "bg-amber-400 text-amber-950 dark:bg-teal-400 dark:text-teal-950",
    },
    {
      icon: CheckCircle2,
      label: "Delivered",
      value: String(delivered.length),
      accent: "bg-emerald-500 text-white",
    },
    {
      icon: Wallet,
      label: "Total spend",
      value: "₹" + totalSpend.toLocaleString("en-IN", { maximumFractionDigits: 0 }),
      accent: "bg-rose-500 text-white",
    },
  ];

  const handleCancel = (id: string) => {
    if (confirmingId !== id) {
      setConfirmingId(id);
      return;
    }
    void setBookingStatus(id, "cancelled");
    setConfirmingId(null);
    toast("Booking cancelled", { description: "The slot was released back to the trip." });
  };

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
              Customer dashboard
            </span>
            <ThemeToggle />
            <ReportBugDialog />
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                Account settings
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <Home className="h-4 w-4" />
                Back to site
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Book space on vehicles that are already heading your way.
            </p>
          </div>
          <Button asChild>
            <Link to="/">
              <Search className="h-4 w-4" />
              Find capacity
            </Link>
          </Button>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="rounded-xl">
              <CardContent className="flex items-center gap-4 p-5">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.accent}`}>
                  <stat.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold leading-tight">{stat.value}</p>
                  <p className="truncate text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="mb-4 text-xl font-bold">
              My shipments{" "}
              <span className="text-sm font-semibold text-muted-foreground">({myBookings.length})</span>
            </h2>

        {myBookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No shipments yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Search for available capacity and book your first shipment.
            </p>
            <Button className="mt-4" asChild>
              <Link to="/trips">
                <Search className="h-4 w-4" />
                Find capacity
              </Link>
            </Button>
          </div>
        ) : (
          <div className="scroll-list max-h-[30rem] space-y-4 overflow-y-auto rounded-2xl pr-1">
            {myBookings.map((booking) => {
              const trip = tripMap.get(booking.tripId);
              if (!trip) return null;
              return (
                <Card key={booking.id} className="overflow-hidden rounded-xl">
                  <div className="flex items-center justify-between border-b bg-muted/40 px-5 py-2.5">
                    <span className="text-sm font-medium text-muted-foreground">
                      Booking #{booking.id.slice(-4).toUpperCase()}
                    </span>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusStyles[booking.status])}>
                      {bookingStatusLabels[booking.status]}
                    </span>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 font-semibold">
                        <MapPin className="h-4 w-4 text-primary" />
                        {trip.origin}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <MapPin className="h-4 w-4 text-primary" />
                        {trip.destination}
                      </div>
                      <span className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        {formatDate(trip.departureDate)}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                      <p className="text-muted-foreground">
                        Pickup: <span className="text-foreground">{booking.pickupAddress}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Dropoff: <span className="text-foreground">{booking.dropoffAddress}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Weight: <span className="text-foreground">{booking.shipmentWeightKg.toLocaleString("en-IN")} kg</span>
                      </p>
                      {bookingSizeLabel(booking) ? (
                        <p className="text-muted-foreground">
                          Size: <span className="text-foreground">{bookingSizeLabel(booking)}</span>
                        </p>
                      ) : null}
                      <p className="text-muted-foreground">
                        Total: <span className="font-semibold text-primary">₹{booking.totalPrice.toLocaleString("en-IN")}</span>
                      </p>
                    </div>

                    {(booking.status === "pending" || booking.status === "confirmed" || booking.status === "in_transit") && (
                      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                        <ReportIssueDialog booking={booking} trip={trip} reporterRole="customer" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "text-destructive hover:text-destructive",
                            confirmingId === booking.id &&
                              "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground",
                          )}
                          onClick={() => handleCancel(booking.id)}
                          onMouseLeave={() => confirmingId === booking.id && setConfirmingId(null)}
                        >
                          <X className="h-4 w-4" />
                          {confirmingId === booking.id ? "Confirm cancel?" : "Cancel booking"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerDashboard;