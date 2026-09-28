import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { MapPin, ArrowRight, Package, User, CheckCircle2, Truck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrips } from "@/lib/trips-store";
import { useBookings, bookingStatusLabels, bookingSizeLabel } from "@/lib/bookings-store";
import type { Booking, BookingStatus } from "@/lib/bookings-store";
import { useUsers } from "@/lib/users-store";
import ReportIssueDialog from "@/components/reports/ReportIssueDialog";

const statusStyles: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-teal-400/15 dark:text-teal-300",
  confirmed: "bg-primary/10 text-primary",
  in_transit: "bg-sky-100 text-sky-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-muted text-muted-foreground",
};

const DriverBookings = () => {
  const { trips, myTrips } = useTrips();
  const { bookings, setBookingStatus } = useBookings();
  const { userById } = useUsers();
  const [declining, setDeclining] = useState<string | null>(null);

  const myTripIds = useMemo(() => new Set(myTrips.map((t) => t.id)), [myTrips]);
  const tripById = useMemo(() => new Map(trips.map((t) => [t.id, t])), [trips]);

  const myBookings = useMemo(
    () =>
      bookings
        .filter((b) => myTripIds.has(b.tripId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [bookings, myTripIds],
  );

  if (myBookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold">No incoming bookings</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          When customers book space on your trips, requests will show up here.
        </p>
      </div>
    );
  }

  const act = (booking: Booking, status: BookingStatus, message: string) => {
    void setBookingStatus(booking.id, status);
    setDeclining(null);
    toast(status === "cancelled" ? "Booking declined" : "Booking updated", {
      description: message,
    });
  };

  return (
    <div className="scroll-list max-h-[30rem] space-y-4 overflow-y-auto rounded-2xl pr-1">
      {myBookings.map((booking) => {
        const trip = tripById.get(booking.tripId);
        if (!trip) return null;
        const customer = userById(booking.customerId);
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
              </div>

              <div className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="h-4 w-4" />
                  {customer ? <span className="font-medium text-foreground">{customer.name}</span> : "Customer"}
                </p>
                <p className="text-muted-foreground">
                  From <span className="text-foreground">{booking.pickupAddress}</span>
                </p>
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Package className="h-4 w-4" />
                  {booking.shipmentWeightKg.toLocaleString("en-IN")} kg
                  {bookingSizeLabel(booking) ? (
                    <span className="text-muted-foreground/80">
                      · {bookingSizeLabel(booking)}
                    </span>
                  ) : null}
                  ·{" "}
                  <span className="font-semibold text-primary">
                    ₹{booking.totalPrice.toLocaleString("en-IN")}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  To <span className="text-foreground">{booking.dropoffAddress}</span>
                </p>
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {booking.status !== "delivered" && booking.status !== "cancelled" && (
                  <ReportIssueDialog booking={booking} trip={trip} reporterRole="driver" />
                )}
                {booking.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "text-destructive hover:text-destructive",
                        declining === booking.id &&
                          "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground",
                      )}
                      onClick={() =>
                        declining === booking.id
                          ? act(booking, "cancelled", `Booking for ${trip.origin} → ${trip.destination} declined.`)
                          : setDeclining(booking.id)
                      }
                      onMouseLeave={() => declining === booking.id && setDeclining(null)}
                    >
                      <X className="h-4 w-4" />
                      {declining === booking.id ? "Decline?" : "Decline"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => act(booking, "confirmed", `Booking confirmed — ${trip.origin} → ${trip.destination} is now matched.`)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm
                    </Button>
                  </>
                )}

                {booking.status === "confirmed" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => act(booking, "in_transit", "Shipment marked as in transit.")}
                    >
                      <Truck className="h-4 w-4" />
                      Start transit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => act(booking, "delivered", "Shipment delivered — trip completed.")}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark delivered
                    </Button>
                  </>
                )}

                {booking.status === "in_transit" && (
                  <Button
                    size="sm"
                    onClick={() => act(booking, "delivered", "Shipment delivered — trip completed.")}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark delivered
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DriverBookings;