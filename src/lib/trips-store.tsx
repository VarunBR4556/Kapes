/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Trip, TripStatus, VehicleType } from "./trips";
import { defaultCargoRoom } from "./trips";
import { useUsers } from "./users-store";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export interface NewTrip {
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  vehicleType: VehicleType;
  capacityKg: number;
  pricePerKg: number;
}

export { seedTrips } from "./trips-fixtures";

const mapTrip = (row: Record<string, unknown>): Trip => ({
  id: String(row.id),
  driverId: (row.driver_id as string | null) ?? undefined,
  driverName: (row.driver_name as string | null) ?? undefined,
  driverVehicle: (row.driver_vehicle as string | null) ?? undefined,
  origin: String(row.origin ?? ""),
  destination: String(row.destination ?? ""),
  departureDate: String(row.departure_date ?? ""),
  departureTime: String(row.departure_time ?? "").slice(0, 5),
  vehicleType: row.vehicle_type as VehicleType,
  capacityKg: Number(row.capacity_kg ?? 0),
  pricePerKg: Number(row.price_per_kg ?? 0),
  lengthCm: (row.length_cm as number | null) ?? defaultCargoRoom(row.vehicle_type as VehicleType).lengthCm,
  breadthCm: (row.breadth_cm as number | null) ?? defaultCargoRoom(row.vehicle_type as VehicleType).breadthCm,
  heightCm: (row.height_cm as number | null) ?? defaultCargoRoom(row.vehicle_type as VehicleType).heightCm,
  status: (row.status as TripStatus) ?? "open",
  createdAt: String(row.created_at ?? new Date().toISOString()),
});



interface TripsContextValue {
  trips: Trip[];
  myTrips: Trip[];
  loading: boolean;
  addTrip: (trip: NewTrip, vehicle?: { vehicleNumber?: string }) => Promise<Trip | null>;
  setTripStatus: (id: string, status: TripStatus) => Promise<void>;
  updateTripDriver: (patch: { name?: string }) => Promise<void>;
}

const TripsContext = createContext<TripsContextValue | undefined>(undefined);

export const TripsProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useUsers();
  const { user } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id ?? null;

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("trips")
      .select("*")
      .order("departure_date", { ascending: true });
    setTrips((data ?? []).map(mapTrip));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, userId]);

  const updateTripDriver = useCallback(
    async (patch: { name?: string }) => {
      if (!userId) return;
      const name = (patch.name ?? "").trim();
      await supabase
        .from("profiles")
        .update({ name } as unknown as Record<string, never>)
        .eq("id", userId);
      await supabase
        .from("trips")
        .update({ driver_name: name || null } as unknown as Record<string, never>)
        .eq("driver_id", userId);
      await refresh();
    },
    [userId, refresh],
  );

  const addTrip = useCallback(
    async (trip: NewTrip, vehicle?: { vehicleNumber?: string }): Promise<Trip> => {
      if (!userId) throw new Error("Sign in as a driver to post a trip.");
      const room = defaultCargoRoom(trip.vehicleType);
      const driverName = currentUser?.name?.trim() || undefined;
      const driverVehicle =
        vehicle?.vehicleNumber?.trim() || currentUser?.vehicleNumber?.trim() || undefined;
      const { data, error } = await supabase
        .from("trips")
        .insert({
          driver_id: userId,
          driver_name: driverName ?? null,
          driver_vehicle: driverVehicle ?? null,
          origin: trip.origin,
          destination: trip.destination,
          departure_date: trip.departureDate,
          departure_time: trip.departureTime,
          vehicle_type: trip.vehicleType,
          capacity_kg: trip.capacityKg,
          price_per_kg: trip.pricePerKg,
          length_cm: room.lengthCm,
          breadth_cm: room.breadthCm,
          height_cm: room.heightCm,
          status: "open",
        } as unknown as Record<string, never>)
        .select()
        .single();
      // Thrown rather than returning null: the caller used to report success
      // unconditionally, so a rejected insert still showed "Trip posted!".
      if (error) throw new Error(`Could not post your trip. ${error.message}`.trim());
      if (!data) throw new Error("Could not post your trip. Please try again.");
      const mapped = mapTrip(data as Record<string, unknown>);
      setTrips((prev) => [mapped, ...prev]);
      return mapped;
    },
    [userId, currentUser],
  );

  const setTripStatus = useCallback(
    async (id: string, status: TripStatus) => {
      await supabase
        .from("trips")
        .update({ status } as unknown as Record<string, never>)
        .eq("id", id);
      setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    },
    [],
  );

  const myTrips = useMemo(
    () => trips.filter((t) => t.driverId === currentUser?.id),
    [trips, currentUser?.id],
  );

  const value = useMemo(
    () => ({ trips, myTrips, addTrip, setTripStatus, updateTripDriver, loading }),
    [trips, myTrips, addTrip, setTripStatus, updateTripDriver, loading],
  );

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
};

export function useTrips(): TripsContextValue {
  const context = useContext(TripsContext);
  if (!context) {
    throw new Error("useTrips must be used within a TripsProvider");
  }
  return context;
}