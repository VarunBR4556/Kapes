import { test } from "node:test";
import assert from "node:assert/strict";
import { seedTrips } from "./trips-fixtures";
import {
  getAvailableTrips,
  upcomingTripCities,
  upcomingPickupCities,
  upcomingDropoffCities,
  tripDeparted,
  findExactMatches,
  findRelatedTrips,
  findRouteLegs,
} from "./search";
import type { Trip } from "./trips";

const ids = (trips: { id: string }[]) => trips.map((t) => t.id);
const available = getAvailableTrips(seedTrips);

test("available excludes completed/cancelled and is date-sorted", () => {
  assert.ok(available.every((t) => t.status === "open" || t.status === "matched"));
  assert.equal(available.length, seedTrips.filter((t) => t.status === "open" || t.status === "matched").length);
  assert.equal(available[0].id, "seed-3");
});

test("no filters returns all available trips", () => {
  assert.equal(findExactMatches(available, {}).length, available.length);
});

test("visibility predicate keeps only trips from approved drivers", () => {
  const trips = [
    {
      id: "approved-trip",
      driverId: "d1",
      origin: "Pune",
      destination: "Goa",
      departureDate: "2099-01-06",
      departureTime: "09:00",
      status: "open",
    },
    {
      id: "pending-trip",
      driverId: "d2",
      origin: "Pune",
      destination: "Goa",
      departureDate: "2099-01-06",
      departureTime: "09:00",
      status: "open",
    },
  ] as unknown as Trip[];
  const include = (t: Trip) => t.driverId === "d1";
  assert.deepEqual(ids(getAvailableTrips(trips, include)), ["approved-trip"]);
  assert.deepEqual(
    upcomingTripCities(trips, new Date("2026-01-01T00:00:00"), include),
    ["Goa", "Pune"],
  );
  assert.deepEqual(
    upcomingPickupCities(trips, new Date("2026-01-01T00:00:00"), include),
    ["Pune"],
  );
});

test("exact from-to finds the direct trip", () => {
  const r = findExactMatches(available, { from: "Mumbai", to: "Pune" });
  assert.deepEqual(ids(r), ["seed-1"]);
});

test("vehicle type combines with from/to search", () => {
  const r = findExactMatches(available, { from: "Delhi", to: "Jaipur", type: "Truck" });
  assert.deepEqual(ids(r), ["seed-2"]);
});

test("search is case-insensitive", () => {
  const upper = findExactMatches(available, { from: "BENGALURU" });
  const lower = findExactMatches(available, { from: "bengaluru" });
  assert.deepEqual(ids(upper), ids(lower));
  assert.deepEqual(ids(lower).sort(), [
    "seed-13",
    "seed-15",
    "seed-17",
    "seed-24",
    "seed-28",
    "seed-3",
    "seed-31",
    "seed-35",
    "seed-47",
  ]);
});

test("reverse route has no exact match but related trips are found", () => {
  const exact = findExactMatches(available, { from: "Pune", to: "Mumbai" });
  assert.deepEqual(ids(exact), []);
  const rel = findRelatedTrips(available, exact, { from: "Pune", to: "Mumbai" });
  assert.ok(ids(rel).includes("seed-1"));
});

test("related trips respect vehicle type filter", () => {
  const exact = findExactMatches(available, { from: "Bengaluru", to: "Hubballi", type: "Container" });
  assert.deepEqual(ids(exact), []);
  const rel = findRelatedTrips(available, exact, {
    from: "Bengaluru",
    to: "Hubballi",
    type: "Container",
  });
  assert.deepEqual(ids(rel).sort(), ["seed-15", "seed-3", "seed-34", "seed-42", "seed-47"]);
});

test("related trips are not returned when exact matches exist", () => {
  const exact = findExactMatches(available, { from: "Mumbai", to: "Pune" });
  assert.deepEqual(ids(findRelatedTrips(available, exact, { from: "Mumbai", to: "Pune" })), []);
});

test("min weight only keeps trips with enough capacity", () => {
  const r = findExactMatches(available, { from: "Bengaluru", minWeight: 5000 });
  assert.deepEqual(ids(r).sort(), ["seed-15", "seed-3", "seed-47"]);
});

test("date filter keeps departures on or after the given date", () => {
  const r = findExactMatches(available, { date: "2026-10-01" });
  assert.ok(r.length > 0);
  assert.ok(r.every((t) => t.departureDate >= "2026-10-01"));
});

test("city query matches origin or destination", () => {
  const r = findExactMatches(available, { query: "Mangaluru" });
  assert.deepEqual(ids(r).sort(), ["seed-15", "seed-16", "seed-36", "seed-37"]);
});

test("type alone lists all capacity of that vehicle", () => {
  const r = findExactMatches(available, { type: "Trailer" });
  assert.deepEqual(ids(r).sort(), ["seed-22", "seed-39", "seed-46", "seed-5"]);
});

test("combined from+to+type with no exact falls back to nearby type trips", () => {
  const exact = findExactMatches(available, { from: "Bengaluru", to: "Hubballi", type: "Truck" });
  assert.deepEqual(ids(exact), ["seed-17"]);
});

test("no direct from-to splits fallback into leaving and arriving legs", () => {
  const exact = findExactMatches(available, { from: "Banglore", to: "Bidar" });
  assert.deepEqual(ids(exact), []);

  const legs = findRouteLegs(available, { from: "Banglore", to: "Bidar" });
  assert.ok(legs.leaving.length > 0);
  assert.ok(legs.leaving.every((t) => t.origin.toLowerCase().includes("bengaluru")));
  assert.deepEqual(ids(legs.arriving), ["seed-22"]);
  assert.ok(legs.arriving.every((t) => t.destination.toLowerCase().includes("bidar")));
});

test("spelling aliases match official city names", () => {
  const alias = findExactMatches(available, { from: "Blr", to: "Mysore" });
  assert.deepEqual(ids(alias), ["seed-13"]);
  const official = findExactMatches(available, { from: "Bengaluru", to: "Mysuru" });
  assert.deepEqual(ids(official), ["seed-13"]);
  assert.deepEqual(ids(alias), ids(official));
});

test("legs respect the vehicle type filter", () => {
  const legs = findRouteLegs(available, { from: "Bengaluru", to: "Mysuru", type: "Truck" });
  assert.ok(legs.leaving.length > 0);
  assert.ok(legs.leaving.every((t) => t.vehicleType === "Truck"));
  assert.ok(legs.arriving.every((t) => t.vehicleType === "Truck"));
  const legsMini = findRouteLegs(available, { from: "Bengaluru", to: "Mysuru", type: "Mini" });
  assert.ok(legsMini.leaving.some((t) => t.destination.toLowerCase().includes("mysuru")));
});

test("single-sided search yields one leg group", () => {
  const legs = findRouteLegs(available, { from: "Bengaluru" });
  assert.ok(legs.leaving.length > 0);
  assert.deepEqual(ids(legs.arriving), []);
});

test("upcomingTripCities lists only cities from upcoming posted trips", () => {
  const trips = [
    { id: "past-open", origin: "Nagpur", destination: "Amravati", departureDate: "2020-01-05", status: "open" },
    { id: "past-matched", origin: "Patna", destination: "Gaya", departureDate: "2020-01-06", status: "matched" },
    { id: "future-completed", origin: "Nagpur", destination: "Amravati", departureDate: "2099-01-05", status: "completed" },
    { id: "future-matched", origin: "Pune", destination: "Goa", departureDate: "2099-01-06", status: "matched" },
    { id: "future-open", origin: "Nashik", destination: "Mumbai", departureDate: "2099-01-07", status: "open" },
  ] as unknown as Trip[];

  const cities = upcomingTripCities(trips);
  assert.deepEqual(cities, ["Goa", "Mumbai", "Nashik", "Pune"]);
  assert.ok(!cities.includes("Nagpur"), "already-departed trip's city is excluded");
  assert.ok(!cities.includes("Amravati"), "past trip destination is excluded");
  assert.ok(!cities.includes("Patna"), "past matched trip cities are excluded");
  assert.ok(!cities.includes("Gaya"));
});

test("pickup and dropoff suggestion lists are separate entities", () => {
  const now = new Date("2026-09-20T10:00:00");
  const base = { departureDate: "2099-01-06", departureTime: "09:00", status: "open" } as const;
  const trips = [
    { id: "t1", ...base, origin: "Bengaluru", destination: "Mysuru" },
    { id: "t2", ...base, origin: "Mumbai", destination: "Pune" },
    { id: "t3", ...base, origin: "Pune", destination: "Goa", status: "matched" },
    { id: "t4", ...base, origin: "Indore", destination: "Bhopal", departureDate: "2026-09-19", departureTime: "23:00" },
  ] as unknown as Trip[];

  const pickup = upcomingPickupCities(trips, now);
  const dropoff = upcomingDropoffCities(trips, now);
  assert.deepEqual(pickup, ["Bengaluru", "Mumbai", "Pune"], "only upcoming origin cities");
  assert.deepEqual(dropoff, ["Goa", "Mysuru", "Pune"], "only upcoming destination cities");
  assert.ok(!pickup.includes("Goa"), "a dropoff-only city is not offered as pickup");
  assert.ok(!dropoff.includes("Bengaluru"), "a pickup-only city is not offered as dropoff");
  assert.ok(!pickup.includes("Indore") && !dropoff.includes("Indore"), "departed transits excluded");
  assert.deepEqual(upcomingTripCities(trips, now), ["Bengaluru", "Goa", "Mumbai", "Mysuru", "Pune"]);
});

test("tripDeparted drops a transit the moment its journey begins", () => {
  const now = new Date("2026-09-20T10:00:00");
  const departedEarlier = { departureDate: "2026-09-20", departureTime: "09:00" };
  const departedYesterday = { departureDate: "2026-09-19", departureTime: "23:30" };
  const departingSoon = { departureDate: "2026-09-20", departureTime: "10:00" };
  const departingToday = { departureDate: "2026-09-20", departureTime: "12:00" };
  assert.equal(tripDeparted(departedEarlier as Trip, now), true, "yesterday/today-past departed");
  assert.equal(tripDeparted(departedYesterday as Trip, now), true);
  assert.equal(tripDeparted(departingSoon as Trip, now), false, "now (on the hour) is still upcoming");
  assert.equal(tripDeparted(departingToday as Trip, now), false);
});