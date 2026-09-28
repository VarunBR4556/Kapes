export type TripStatus = "open" | "matched" | "completed" | "cancelled";

export type VehicleType = "Mini" | "Truck" | "Container" | "Trailer";

interface CargoRoom {
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
}

export interface Trip {
  id: string;
  driverId?: string;
  driverName?: string;
  driverVehicle?: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  vehicleType: VehicleType;
  capacityKg: number;
  pricePerKg: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
  status: TripStatus;
  createdAt: string;
}

export const VEHICLE_TYPES: VehicleType[] = ["Mini", "Truck", "Container", "Trailer"];

const CARGO_ROOM_BY_TYPE: Record<VehicleType, CargoRoom> = {
  Mini: { lengthCm: 180, breadthCm: 140, heightCm: 120 },
  Truck: { lengthCm: 320, breadthCm: 180, heightCm: 180 },
  Container: { lengthCm: 600, breadthCm: 240, heightCm: 240 },
  Trailer: { lengthCm: 1200, breadthCm: 250, heightCm: 260 },
};

export const defaultCargoRoom = (type: VehicleType): CargoRoom => CARGO_ROOM_BY_TYPE[type];

export const cargoRoomLabel = (
  trip: Pick<Trip, "lengthCm" | "breadthCm" | "heightCm"> | undefined | null,
): string | null => {
  if (
    trip == null ||
    trip.lengthCm == null ||
    trip.breadthCm == null ||
    trip.heightCm == null
  ) {
    return null;
  }
  return `${trip.lengthCm} × ${trip.breadthCm} × ${trip.heightCm} cm`;
};

export const tripStatusLabels: Record<TripStatus, string> = {
  open: "Open",
  matched: "Matched",
  completed: "Completed",
  cancelled: "Cancelled",
};