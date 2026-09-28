import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { ArrowRight, CalendarDays, Clock, MapPin, Route, X, Package, Truck, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Trip, TripStatus } from "@/lib/trips";
import { tripStatusLabels, cargoRoomLabel } from "@/lib/trips";
import { useTrips } from "@/lib/trips-store";
import { useBookings } from "@/lib/bookings-store";
import { formatDate } from "@/lib/format";

const statusStyles: Record<TripStatus, string> = {
  open: "bg-emerald-100 text-emerald-700",
  matched: "bg-primary/10 text-primary",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const TripCard = ({ trip }: { trip: Trip }) => {
  const { cancelTripWithBookings } = useBookings();
  const [confirming, setConfirming] = useState(false);

  const handleCancel = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    void cancelTripWithBookings(trip.id);
    setConfirming(false);
    toast("Trip cancelled", { description: `${trip.origin} → ${trip.destination}` });
  };

  return (
    <Card className="overflow-hidden rounded-xl">
      <div className="flex items-center justify-between border-b bg-muted/40 px-5 py-2.5">
        <span className="text-sm font-medium text-muted-foreground">
          Trip #{trip.id.slice(0, 4).toUpperCase()}
        </span>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusStyles[trip.status])}>
          {tripStatusLabels[trip.status]}
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
            <Clock className="ml-2 h-4 w-4" />
            {trip.departureTime}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Route className="h-4 w-4" />
            {trip.vehicleType}
          </span>
          {trip.driverVehicle ? (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Truck className="h-4 w-4" />
              {trip.driverVehicle}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Package className="h-4 w-4" />
            {trip.capacityKg.toLocaleString("en-IN")} kg capacity
          </span>
          {cargoRoomLabel(trip) ? (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Boxes className="h-4 w-4" />
              {cargoRoomLabel(trip)}
            </span>
          ) : null}
          <span className="font-semibold text-primary">₹{trip.pricePerKg}/kg</span>
          <span className="ml-auto font-semibold">
            Up to ₹{(trip.capacityKg * trip.pricePerKg).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </span>
        </div>

        {trip.status !== "cancelled" && trip.status !== "completed" && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className={cn("text-destructive hover:text-destructive", confirming && "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground")}
              onClick={handleCancel}
              onMouseLeave={() => confirming && setConfirming(false)}
            >
              <X className="h-4 w-4" />
              {confirming ? "Confirm cancel?" : "Cancel trip"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const TripList = () => {
  const { myTrips } = useTrips();

  if (myTrips.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-12 text-center">
        <Route className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold">No trips yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Post your first trip to start earning on your spare capacity.
        </p>
      </div>
    );
  }

  return (
    <div className="scroll-list max-h-[30rem] space-y-4 overflow-y-auto rounded-2xl pr-1">
      {myTrips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
};

export default TripList;