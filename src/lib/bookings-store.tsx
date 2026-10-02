/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useUsers } from "./users-store";
import { useTrips } from "./trips-store";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { tripDeparted } from "./search";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface Booking {
  id: string;
  tripId: string;
  customerId: string;
  shipmentWeightKg: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
  pickupAddress: string;
  dropoffAddress: string;
  status: BookingStatus;
  totalPrice: number;
  createdAt: string;
}

// The capacity trigger raises a Postgres check_violation. Turn the driver-facing
// text into something a customer can act on.
const friendlyBookingError = (message: string): string => {
  if (message.includes("Trip capacity exceeded")) {
    const m = message.match(/Trip capacity exceeded:\s*([\d.]+)\s*kg free/);
    return m
      ? `Someone booked this trip while you were filling the form. Only ${Math.round(
          Number(m[1]),
        ).toLocaleString("en-IN")} kg is left, please lower your weight or pick another trip.`
      : "Someone booked this trip while you were filling the form. Please pick another trip.";
  }
  if (message.includes("Trip") && message.includes("does not exist"))
    return "That trip no longer exists.";
  return "Could not save your booking. Please try again.";
};

export const bookingSizeLabel = (
  booking: Pick<Booking, "lengthCm" | "breadthCm" | "heightCm">,
): string | null => {
  if (
    booking.lengthCm == null ||
    booking.breadthCm == null ||
    booking.heightCm == null
  ) {
    return null;
  }
  return `${booking.lengthCm} × ${booking.breadthCm} × ${booking.heightCm} cm`;
};


export const seedBookings: Booking[] = [
  {
    id: "booking-1",
    tripId: "seed-3",
    customerId: "customer-asha",
    shipmentWeightKg: 4000,
    lengthCm: 240,
    breadthCm: 120,
    heightCm: 120,
    pickupAddress: "Adugodi, Bengaluru",
    dropoffAddress: "T Nagar, Chennai",
    status: "confirmed",
    totalPrice: 20000,
    createdAt: "2026-09-15T09:00:00.000Z",
  },
  {
    id: "booking-2",
    tripId: "seed-17",
    customerId: "customer-rahul",
    shipmentWeightKg: 1500,
    lengthCm: 180,
    breadthCm: 110,
    heightCm: 100,
    pickupAddress: "Whitefield, Bengaluru",
    dropoffAddress: "Vidyanagar, Hubballi",
    status: "pending",
    totalPrice: 9000,
    createdAt: "2026-09-16T10:00:00.000Z",
  },
  {
    id: "booking-3",
    tripId: "seed-9",
    customerId: "customer-asha",
    shipmentWeightKg: 500,
    lengthCm: 90,
    breadthCm: 60,
    heightCm: 60,
    pickupAddress: "Bapunagar, Ahmedabad",
    dropoffAddress: "Kalawad Road, Rajkot",
    status: "delivered",
    totalPrice: 6000,
    createdAt: "2026-09-11T11:00:00.000Z",
  },
  {
    id: "booking-4",
    tripId: "seed-1",
    customerId: "customer-asha",
    shipmentWeightKg: 400,
    lengthCm: 80,
    breadthCm: 55,
    heightCm: 50,
    pickupAddress: "Andheri East, Mumbai",
    dropoffAddress: "Kothrud, Pune",
    status: "pending",
    totalPrice: 4400,
    createdAt: "2026-09-17T09:30:00.000Z",
  },
];

export const bookingStatusLabels: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ABNORMAL_BOOKING_STATUSES: BookingStatus[] = ["cancelled", "delivered"];

export type CreateBookingInput = {
  tripId: string;
  shipmentWeightKg: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
  pickupAddress: string;
  dropoffAddress: string;
  totalPrice: number;
};

const mapBooking = (row: Record<string, unknown>): Booking => ({
  id: String(row.id),
  tripId: String(row.trip_id ?? ""),
  customerId: String(row.customer_id ?? ""),
  shipmentWeightKg: Number(row.shipment_weight_kg ?? 0),
  lengthCm: (row.length_cm as number | null) ?? undefined,
  breadthCm: (row.breadth_cm as number | null) ?? undefined,
  heightCm: (row.height_cm as number | null) ?? undefined,
  pickupAddress: String(row.pickup_address ?? ""),
  dropoffAddress: String(row.dropoff_address ?? ""),
  status: (row.status as BookingStatus) ?? "pending",
  totalPrice: Number(row.total_price ?? 0),
  createdAt: String(row.created_at ?? new Date().toISOString()),
});

interface BookingsContextValue {
  bookings: Booking[];
  myBookings: Booking[];
  loading: boolean;
  createBooking: (input: CreateBookingInput) => Promise<Booking>;
  setBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  cancelTripWithBookings: (tripId: string) => Promise<void>;
  availableCapacityKgs: (tripId: string) => number;
  reservedCapacityKgs: (tripId: string) => number;
}

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined);

export const BookingsProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useUsers();
  const { trips, setTripStatus } = useTrips();
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id ?? null;

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    setBookings((data ?? []).map(mapBooking));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, userId]);

  const reservedCapacityKgs = useCallback(
    (tripId: string) =>
      bookings
        .filter(
          (b) =>
            b.tripId === tripId && !ABNORMAL_BOOKING_STATUSES.includes(b.status),
        )
        .reduce((sum, b) => sum + b.shipmentWeightKg, 0),
    [bookings],
  );

  const availableCapacityKgs = useCallback(
    (tripId: string) => {
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) return 0;
      return Math.max(0, trip.capacityKg - reservedCapacityKgs(tripId));
    },
    [trips, reservedCapacityKgs],
  );

  const createBooking = useCallback(
    async (input: CreateBookingInput): Promise<Booking> => {
      if (!userId || !currentUser || currentUser.role !== "customer")
        throw new Error("Only customer accounts can book a trip.");
      const trip = trips.find((t) => t.id === input.tripId);
      if (!trip) throw new Error("That trip no longer exists.");
      if (trip.status !== "open" && trip.status !== "matched")
        throw new Error("That trip is not accepting bookings.");
      if (tripDeparted(trip, new Date()))
        throw new Error("That trip has already departed.");
      const free = availableCapacityKgs(input.tripId);
      if (input.shipmentWeightKg > free)
        throw new Error(
          free <= 0
            ? "That trip is already fully booked."
            : `Only ${free.toLocaleString("en-IN")} kg is left on that trip.`,
        );

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          trip_id: input.tripId,
          customer_id: userId,
          shipment_weight_kg: input.shipmentWeightKg,
          length_cm: input.lengthCm ?? null,
          breadth_cm: input.breadthCm ?? null,
          height_cm: input.heightCm ?? null,
          pickup_address: input.pickupAddress,
          dropoff_address: input.dropoffAddress,
          status: "pending",
          total_price: Math.round(input.shipmentWeightKg * trip.pricePerKg),
        } as unknown as Record<string, never>)
        .select()
        .single();
      // The database also enforces capacity, so a race between two customers can
      // still be rejected here. Surface it instead of failing silently.
      if (error) throw new Error(friendlyBookingError(error.message));
      if (!data) throw new Error("Could not save your booking. Please try again.");
      const mapped = mapBooking(data as Record<string, unknown>);
      setBookings((prev) => [mapped, ...prev]);
      return mapped;
    },
    [userId, currentUser, trips, availableCapacityKgs],
  );

  const setBookingStatus = useCallback(
    async (id: string, status: BookingStatus) => {
      const booking = bookings.find((b) => b.id === id);
      if (booking) {
        if (status === "confirmed") {
          await setTripStatus(booking.tripId, "matched");
        } else if (status === "delivered") {
          const stillActive = bookings.some(
            (b) =>
              b.tripId === booking.tripId &&
              b.id !== id &&
              (b.status === "pending" ||
                b.status === "confirmed" ||
                b.status === "in_transit"),
          );
          if (!stillActive) await setTripStatus(booking.tripId, "completed");
        } else if (status === "cancelled") {
          const rest = bookings.filter(
            (b) => b.tripId === booking.tripId && b.id !== id,
          );
          const active = (["pending", "confirmed", "in_transit"] as BookingStatus[]).some(
            (s) => rest.some((b) => b.status === s),
          );
          if (!active) {
            const anyDelivered = rest.some((b) => b.status === "delivered");
            await setTripStatus(booking.tripId, anyDelivered ? "completed" : "open");
          } else if (
            !rest.some((b) => b.status === "confirmed" || b.status === "in_transit")
          ) {
            await setTripStatus(booking.tripId, "open");
          }
        }
      }
      await supabase
        .from("bookings")
        .update({ status } as unknown as Record<string, never>)
        .eq("id", id);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    },
    [bookings, setTripStatus],
  );

  const cancelTripWithBookings = useCallback(
    async (tripId: string) => {
      const affected = bookings.filter(
        (b) =>
          b.tripId === tripId &&
          (b.status === "pending" ||
            b.status === "confirmed" ||
            b.status === "in_transit"),
      );
      for (const b of affected) {
        await supabase
          .from("bookings")
          .update({ status: "cancelled" } as unknown as Record<string, never>)
          .eq("id", b.id);
      }
      const ids = new Set(affected.map((b) => b.id));
      setBookings((prev) =>
        prev.map((x) =>
          ids.has(x.id) ? { ...x, status: "cancelled" as const } : x,
        ),
      );
      await setTripStatus(tripId, "cancelled");
    },
    [bookings, setTripStatus],
  );

  const myBookings = useMemo(
    () => bookings.filter((b) => b.customerId === currentUser?.id),
    [bookings, currentUser?.id],
  );

  const value = useMemo(
    () => ({
      bookings,
      myBookings,
      createBooking,
      setBookingStatus,
      cancelTripWithBookings,
      availableCapacityKgs,
      reservedCapacityKgs,
      loading,
    }),
    [
      bookings,
      myBookings,
      createBooking,
      setBookingStatus,
      cancelTripWithBookings,
      availableCapacityKgs,
      reservedCapacityKgs,
      loading,
    ],
  );

  return (
    <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>
  );
};

export function useBookings(): BookingsContextValue {
  const context = useContext(BookingsContext);
  if (!context) {
    throw new Error("useBookings must be used within a BookingsProvider");
  }
  return context;
}
