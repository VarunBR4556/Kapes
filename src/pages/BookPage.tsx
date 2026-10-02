import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Truck, Home, MapPin, ArrowRight, CalendarDays, Clock, Route, Weight, Boxes, CheckCircle2, Package } from "lucide-react";
import { useTrips } from "@/lib/trips-store";
import { useBookings, type Booking } from "@/lib/bookings-store";
import { formatDate } from "@/lib/format";
import { cargoRoomLabel } from "@/lib/trips";
import { tripDeparted } from "@/lib/search";
import ThemeToggle from "@/components/theme-toggle";

const BookPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { trips } = useTrips();
  const { myBookings, createBooking, availableCapacityKgs } = useBookings();

  const [weight, setWeight] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [breadthCm, setBreadthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [successId, setSuccessId] = useState<string | null>(null);

  const trip = useMemo(() => trips.find((t) => t.id === tripId), [trips, tripId]);
  const availableKg = trip ? availableCapacityKgs(trip.id) : 0;

  if (!trip) {
    return (
      <Shell>
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Trip not found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This trip may have been removed.
          </p>
          <Button className="mt-4" asChild>
            <Link to="/trips">Browse capacity</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  if (successId) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Booking requested!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Booking <span className="font-semibold text-foreground">#{successId.slice(-4).toUpperCase()}</span> for{" "}
            {trip.origin} → {trip.destination} is{" "}
            <span className="font-semibold text-foreground">pending</span>. The driver will confirm shortly.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate("/account")}>View my shipments</Button>
            <Button variant="outline" onClick={() => navigate("/trips")}>
              Book more capacity
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  const notBookable =
    (trip.status !== "open" && trip.status !== "matched") ||
    tripDeparted(trip, new Date());
  const alreadyBooked = myBookings.some(
    (b) =>
      b.tripId === trip.id &&
      (b.status === "pending" || b.status === "confirmed" || b.status === "in_transit"),
  );
  const weightNum = Number(weight);
  const weightValid = Number.isFinite(weightNum) && weightNum >= 1 && weightNum <= availableKg;
  const lenNum = Number(lengthCm);
  const widNum = Number(breadthCm);
  const hgtNum = Number(heightCm);
  const sizeValid =
    Number.isFinite(lenNum) && Number.isFinite(widNum) && Number.isFinite(hgtNum) &&
    lenNum >= 1 && widNum >= 1 && hgtNum >= 1;
  const totalPrice = weightValid ? Math.round(weightNum * trip.pricePerKg) : 0;

  const handleSubmit = async () => {
    if (!pickup.trim() || !dropoff.trim()) {
      toast("Add pickup and dropoff", { description: "Both addresses are required to book." });
      return;
    }
    if (!weightValid) {
      toast("Check the weight", {
        description: `Only ${availableKg.toLocaleString("en-IN")} kg is still available on this trip.`,
      });
      return;
    }
    if (!sizeValid) {
      toast("Approx shipment size needed", {
        description: "Enter the approximate length, breadth and height (in cm) of your shipment.",
      });
      return;
    }
    let booking: Booking;
    try {
      booking = await createBooking({
        tripId: trip.id,
        shipmentWeightKg: weightNum,
        lengthCm: Math.round(lenNum),
        breadthCm: Math.round(widNum),
        heightCm: Math.round(hgtNum),
        pickupAddress: pickup.trim(),
        dropoffAddress: dropoff.trim(),
        totalPrice,
      });
    } catch (err) {
      // Previously a rejected booking returned null and the button did nothing.
      toast(err instanceof Error ? err.message : "Could not save your booking.", {
        description: "Please review the details and try again.",
      });
      return;
    }
    setSuccessId(booking.id);
  };

  return (
    <Shell>
      <div className="grid items-start gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b bg-muted/40 px-5 py-3">
              <span className="flex min-w-0 items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{trip.origin}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{trip.destination}</span>
              </span>
            </div>
            <CardContent className="p-5">
              <div className="space-y-2 text-sm">
                {trip.driverName ? (
                  <p className="text-muted-foreground">
                    Driver: <span className="font-medium text-foreground">{trip.driverName}</span>
                    {trip.driverVehicle ? ` (${trip.driverVehicle})` : ""}
                  </p>
                ) : null}
                <p className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {formatDate(trip.departureDate)}
                  <Clock className="ml-2 h-4 w-4" />
                  {trip.departureTime}
                </p>
                <p className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Route className="h-4 w-4" />
                  {trip.vehicleType}
                  {cargoRoomLabel(trip) ? (
                    <>
                      <Boxes className="ml-2 h-4 w-4" />
                      {cargoRoomLabel(trip)}
                    </>
                  ) : null}
                  <Weight className="ml-2 h-4 w-4" />
                  {availableKg.toLocaleString("en-IN")} kg available
                  {trip.capacityKg - availableKg > 0 ? (
                    <>
                      <span className="text-xs text-muted-foreground/80">
                        · {(trip.capacityKg - availableKg).toLocaleString("en-IN")} kg booked
                      </span>
                    </>
                  ) : null}
                </p>
                <p className="pt-2 font-semibold text-primary">₹{trip.pricePerKg}/kg</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="rounded-2xl">
            <CardContent className="p-6 sm:p-8">
              <h1 className="text-2xl font-bold tracking-tight">Book this trip</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell us what you're shipping and where to drop it off.
              </p>

              {notBookable ? (
                <div className="mt-6 rounded-xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
                  {tripDeparted(trip, new Date())
                    ? "This trip has already departed and is no longer accepting bookings."
                    : `This trip is no longer accepting bookings (status: ${trip.status}).`}
                </div>
              ) : alreadyBooked ? (
                <div className="mt-6 rounded-xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
                  You already have an active booking on this trip. Check{" "}
                  <Link to="/account" className="font-semibold text-primary underline">
                    my shipments
                  </Link>
                  .
                </div>
              ) : availableKg <= 0 ? (
                <div className="mt-6 rounded-xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
                  This trip's capacity is fully booked. Try searching for another route in{" "}
                  <Link to="/trips" className="font-semibold text-primary underline">
                    browse capacity
                  </Link>
                  .
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Shipment weight (kg)</Label>
                    <div className="relative">
                      <Weight className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="weight"
                        type="number"
                        min="1"
                        max={availableKg}
                        placeholder={`Up to ${availableKg.toLocaleString("en-IN")} kg available`}
                        className="pl-9"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Approx shipment size (cm) — length × breadth × height</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="lengthCm" className="text-xs text-muted-foreground">
                          Length
                        </Label>
                        <Input
                          id="lengthCm"
                          type="number"
                          min="1"
                          placeholder="e.g. 120"
                          value={lengthCm}
                          onChange={(e) => setLengthCm(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="breadthCm" className="text-xs text-muted-foreground">
                          Breadth
                        </Label>
                        <Input
                          id="breadthCm"
                          type="number"
                          min="1"
                          placeholder="e.g. 90"
                          value={breadthCm}
                          onChange={(e) => setBreadthCm(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="heightCm" className="text-xs text-muted-foreground">
                          Height
                        </Label>
                        <Input
                          id="heightCm"
                          type="number"
                          min="1"
                          placeholder="e.g. 80"
                          value={heightCm}
                          onChange={(e) => setHeightCm(e.target.value)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Just an estimate of the room the shipment takes up. Round to the nearest 10 cm.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pickup">Pickup address</Label>
                    <Input
                      id="pickup"
                      placeholder="e.g. Andheri East, Mumbai"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dropoff">Dropoff address</Label>
                    <Input
                      id="dropoff"
                      placeholder="e.g. Kothrud, Pune"
                      value={dropoff}
                      onChange={(e) => setDropoff(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 p-4">
                    <span className="text-sm text-muted-foreground">
                      {weightValid ? (
                        <>
                          {weightNum.toLocaleString("en-IN")} kg × ₹{trip.pricePerKg}/kg
                        </>
                      ) : (
                        "Estimated total"
                      )}
                    </span>
                    <span className="text-lg font-bold">₹{totalPrice.toLocaleString("en-IN")}</span>
                  </div>

                  <Button size="lg" className="w-full" onClick={() => void handleSubmit()}>
                    <Package className="h-4 w-4" />
                    Request booking — ₹{totalPrice.toLocaleString("en-IN")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
};

const Shell = ({ children }: { children: React.ReactNode }) => {
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
            <ThemeToggle />
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <Home className="h-4 w-4" />
                Back to site
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-10">{children}</main>
    </div>
  );
};

export default BookPage;