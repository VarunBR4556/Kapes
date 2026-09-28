import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  ArrowRight,
  CalendarDays,
  Clock,
  Route,
  Package,
  Weight,
  Boxes,
  User,
  Truck,
} from "lucide-react";
import type { Trip } from "@/lib/trips";
import { cargoRoomLabel } from "@/lib/trips";
import { useBookings } from "@/lib/bookings-store";
import { useUsers } from "@/lib/users-store";
import { formatDate } from "@/lib/format";

const TripCard = ({ trip }: { trip: Trip }) => {
  const navigate = useNavigate();
  const { currentUser } = useUsers();
  const { availableCapacityKgs } = useBookings();
  const availableKg = availableCapacityKgs(trip.id);
  const reservedKg = trip.capacityKg - availableKg;
  const bookable = (trip.status === "open" || trip.status === "matched") && availableKg > 0;
  const isDriver = currentUser?.role === "driver";

  return (
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
        {trip.driverName ? (
          <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{trip.driverName}</span>
            {trip.driverVehicle ? (
              <>
                <span className="text-muted-foreground">·</span>
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{trip.driverVehicle}</span>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {formatDate(trip.departureDate)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {trip.departureTime}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Route className="h-4 w-4" />
            {trip.vehicleType}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Weight className="h-4 w-4" />
            {availableKg > 0
              ? `${availableKg.toLocaleString("en-IN")} kg available`
              : "Capacity full"}
            {reservedKg > 0 ? (
              <span className="text-xs text-muted-foreground/80">
                ({reservedKg.toLocaleString("en-IN")} kg booked)
              </span>
            ) : null}
          </span>
          {cargoRoomLabel(trip) ? (
            <span className="inline-flex items-center gap-1.5">
              <Boxes className="h-4 w-4" />
              {cargoRoomLabel(trip)}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Package className="h-4 w-4" />
          </span>
          <div className="text-sm">
            <p className="font-semibold">
              <span className="text-primary">₹{trip.pricePerKg}/kg</span>
            </p>
            <p className="text-muted-foreground">
              Up to ₹
              {((availableKg > 0 ? availableKg : trip.capacityKg) * trip.pricePerKg).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
          {isDriver ? null : (
            <Button
              size="sm"
              className="ml-auto"
              disabled={!bookable}
              onClick={() => navigate(`/book/${trip.id}`)}
            >
              {availableKg > 0 ? "Book space" : "Capacity full"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TripCard;