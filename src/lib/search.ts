import type { Trip, VehicleType } from "./trips";

interface SearchFilters {
  type?: VehicleType | null;
  from?: string | null;
  to?: string | null;
  date?: string | null;
  minWeight?: number | null;
  query?: string;
}

const CITY_ALIASES: Record<string, string> = {
  bangalore: "bengaluru",
  banglore: "bengaluru",
  bangaluru: "bengaluru",
  blr: "bengaluru",
  mysore: "mysuru",
  mangalore: "mangaluru",
  hubli: "hubballi",
  belgaum: "belagavi",
  gulbarga: "kalaburagi",
  bijapur: "vijayapura",
  shimoga: "shivamogga",
  tumkur: "tumakuru",
  bellary: "ballari",
  davangere: "davanagere",
};

const normalizeCity = (input: string) => {
  const trimmed = input.trim().toLowerCase();
  return CITY_ALIASES[trimmed] ?? trimmed;
};

export function getAvailableTrips(
  trips: Trip[],
  include?: (trip: Trip) => boolean,
): Trip[] {
  return trips
    .filter(
      (t) =>
        (t.status === "open" || t.status === "matched") &&
        (include ? include(t) : true),
    )
    .sort((a, b) => a.departureDate.localeCompare(b.departureDate));
}

export function tripDeparted(t: Trip, now: Date): boolean {
  const time = t.departureTime || "00:00";
  const scheduled = new Date(`${t.departureDate}T${time}:00`);
  return Number.isFinite(scheduled.getTime()) && scheduled.getTime() < now.getTime();
}

const upcomingCities = (
  trips: Trip[],
  now: Date,
  pick: (t: Trip) => string,
  include?: (trip: Trip) => boolean,
): string[] => {
  const set = new Set<string>();
  getAvailableTrips(trips, include)
    .filter((t) => !tripDeparted(t, now))
    .forEach((t) => set.add(pick(t)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

export function upcomingPickupCities(
  trips: Trip[],
  now: Date = new Date(),
  include?: (trip: Trip) => boolean,
): string[] {
  return upcomingCities(trips, now, (t) => t.origin, include);
}

export function upcomingDropoffCities(
  trips: Trip[],
  now: Date = new Date(),
  include?: (trip: Trip) => boolean,
): string[] {
  return upcomingCities(trips, now, (t) => t.destination, include);
}

export function upcomingTripCities(
  trips: Trip[],
  now: Date = new Date(),
  include?: (trip: Trip) => boolean,
): string[] {
  return Array.from(
    new Set([
      ...upcomingPickupCities(trips, now, include),
      ...upcomingDropoffCities(trips, now, include),
    ]),
  ).sort((a, b) => a.localeCompare(b));
}

export function findExactMatches(trips: Trip[], filters: SearchFilters): Trip[] {
  const from = filters.from ? normalizeCity(filters.from) : null;
  const to = filters.to ? normalizeCity(filters.to) : null;
  const q = filters.query ? normalizeCity(filters.query) : "";
  const minWeight = filters.minWeight ?? null;

  return trips.filter((t) => {
    if (filters.type && t.vehicleType !== filters.type) return false;
    if (from && !normalizeCity(t.origin).includes(from)) return false;
    if (to && !normalizeCity(t.destination).includes(to)) return false;
    if (filters.date && t.departureDate < filters.date) return false;
    if (minWeight !== null && t.capacityKg < minWeight) return false;
    if (
      q &&
      !(
        normalizeCity(t.origin).includes(q) ||
        normalizeCity(t.destination).includes(q)
      )
    ) {
      return false;
    }
    return true;
  });
}

export function findRelatedTrips(
  trips: Trip[],
  exact: Trip[],
  filters: SearchFilters,
): Trip[] {
  if (exact.length > 0) return [];
  const terms = [filters.from, filters.to, filters.query]
    .filter(Boolean)
    .map((t) => normalizeCity(t!));
  if (terms.length === 0) return [];
  const minWeight = filters.minWeight ?? null;

  return trips.filter((t) => {
    if (filters.type && t.vehicleType !== filters.type) return false;
    if (filters.date && t.departureDate < filters.date) return false;
    if (minWeight !== null && t.capacityKg < minWeight) return false;
    const origin = normalizeCity(t.origin);
    const destination = normalizeCity(t.destination);
    return terms.some((c) => origin.includes(c) || destination.includes(c));
  });
}

interface RouteLegs {
  leaving: Trip[];
  arriving: Trip[];
}

export function findRouteLegs(trips: Trip[], filters: SearchFilters): RouteLegs {
  const from = filters.from ? normalizeCity(filters.from) : null;
  const to = filters.to ? normalizeCity(filters.to) : null;
  const minWeight = filters.minWeight ?? null;

  const passes = (t: Trip) => {
    if (filters.type && t.vehicleType !== filters.type) return false;
    if (filters.date && t.departureDate < filters.date) return false;
    if (minWeight !== null && t.capacityKg < minWeight) return false;
    return true;
  };

  return {
    leaving: from
      ? trips.filter((t) => passes(t) && normalizeCity(t.origin).includes(from))
      : [],
    arriving: to
      ? trips.filter((t) => passes(t) && normalizeCity(t.destination).includes(to))
      : [],
  };
}