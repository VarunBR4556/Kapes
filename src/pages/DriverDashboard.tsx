import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Home, Route, Package, Wallet, CheckCircle2, LogOut, ShieldX, Hourglass, IdCard } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import { useTrips } from "@/lib/trips-store";
import { useUsers } from "@/lib/users-store";
import { useBookings } from "@/lib/bookings-store";
import DriverProfileCard from "@/components/driver/DriverProfileCard";
import PostTripForm from "@/components/driver/PostTripForm";
import TripList from "@/components/driver/TripList";
import DriverBookings from "@/components/driver/DriverBookings";
import ReportBugDialog from "@/components/reports/ReportBugDialog";

const inr = (value: number) =>
  "₹" + value.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const DriverDashboard = () => {
  const { myTrips } = useTrips();
  const { currentUser, logout } = useUsers();
  const { bookings } = useBookings();

  const myTripIds = useMemo(() => new Set(myTrips.map((t) => t.id)), [myTrips]);
  const incomingCount = bookings.filter((b) => myTripIds.has(b.tripId)).length;

  const active = myTrips.filter((t) => t.status === "open" || t.status === "matched");
  const completed = myTrips.filter((t) => t.status === "completed").length;
  const capacityOnRoad = active.reduce((sum, t) => sum + t.capacityKg, 0);
  const potentialEarnings = active.reduce((sum, t) => sum + t.capacityKg * t.pricePerKg, 0);

  const stats = [
    {
      icon: Route,
      label: "Active trips",
      value: String(active.length),
      accent: "bg-primary text-primary-foreground",
    },
    {
      icon: Package,
      label: "Capacity on the road",
      value: capacityOnRoad.toLocaleString("en-IN") + " kg",
      accent: "bg-amber-400 text-amber-950 dark:bg-teal-400 dark:text-teal-950",
    },
    {
      icon: Wallet,
      label: "Potential earnings",
      value: inr(potentialEarnings),
      accent: "bg-emerald-500 text-white",
    },
    {
      icon: CheckCircle2,
      label: "Completed trips",
      value: String(completed),
      accent: "bg-rose-500 text-white",
    },
  ];

  const verified = currentUser && currentUser.driverVerification === "approved";
  const rejected = currentUser && currentUser.driverVerification === "rejected";

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
              Driver dashboard
            </span>
            <ThemeToggle />
            <ReportBugDialog />
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
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {currentUser?.name.split(" ")[0] ?? "Driver"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Post your available capacity and let customers fill the empty space on your route.
          </p>
        </div>

        <DriverProfileCard />

        {!verified ? (
          <Card className="mb-8 rounded-xl">
            <CardContent
              className={`flex flex-wrap items-center gap-3 px-5 py-4 text-sm ${
                rejected
                  ? "text-destructive"
                  : "text-amber-700 dark:text-teal-300"
              }`}
            >
              {rejected ? (
                <ShieldX className="h-5 w-5 shrink-0" />
              ) : (
                <Hourglass className="h-5 w-5 shrink-0" />
              )}
              <span className="min-w-[16rem] flex-1">
                {rejected
                  ? "Your identity documents were rejected. Re-upload clean copies of your driving licence and vehicle RCs in Account settings to continue operating on Kapes."
                  : "Your identity documents are being attested by Kapes admin. You can manage your account, but posting trips starts once your licence and vehicle registrations are verified."}
              </span>
              <Button variant={rejected ? "destructive" : "outline"} size="sm" asChild>
                <Link to="/settings">
                  <IdCard className="h-4 w-4" />
                  {rejected ? "Re-upload documents" : "View verification"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

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

        <div className="grid items-start gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            {verified ? (
              <PostTripForm />
            ) : (
              <Card className="rounded-2xl">
                <CardContent className="flex flex-col items-center p-8 text-center">
                  <span
                    className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${
                      rejected
                        ? "bg-destructive/10 text-destructive"
                        : "bg-amber-400/15 text-amber-600 dark:bg-teal-400/15 dark:text-teal-300"
                    }`}
                  >
                    {rejected ? (
                      <ShieldX className="h-6 w-6" />
                    ) : (
                      <Hourglass className="h-6 w-6" />
                    )}
                  </span>
                  <h3 className="font-bold">Posting trips is locked</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {rejected
                      ? "Re-upload your documents in account settings and Kapes admin will review them again."
                      : "Your driving licence and vehicle registration certificates are still in the admin review queue."}
                  </p>
                  <Button size="sm" variant="outline" className="mt-4" asChild>
                    <Link to="/settings">Open account settings</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="lg:col-span-3">
            <h2 className="mb-4 text-xl font-bold">
              Your trips{" "}
              <span className="text-sm font-semibold text-muted-foreground">({myTrips.length})</span>
            </h2>
            <TripList />
          </div>
        </div>

        <div className="mt-12">
          <h2 className="mb-4 text-xl font-bold">
              Incoming bookings{" "}
              <span className="text-sm font-semibold text-muted-foreground">({incomingCount})</span>
            </h2>
          <DriverBookings />
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;