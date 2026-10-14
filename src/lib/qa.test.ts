// Behavioural tests for the pure, store-independent logic in src/lib.
//
// This suite previously exercised a localStorage-backed store that has since
// been replaced by Supabase. The provider-driven scenarios moved to the live
// app, so this file now asserts the rules that are still pure functions:
// verification gates, vehicle approval, booking/cargo formatting and routing.
// Anything that needs a backend is intentionally out of scope here.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  driverDocuments,
  findDriverDocument,
  isVehicleApproved,
  approvedVehicles,
  isDriverSearchable,
  driverRemovedVehicles,
  userAccountLabel,
  primaryVehicle,
  docKindLabels,
  docStatusLabels,
  MAX_PDF_BYTES,
} from "./users-store";
import type { DriverDocument, User, Vehicle } from "./users-store";
import { bookingSizeLabel, bookingStatusLabels, ABNORMAL_BOOKING_STATUSES } from "./bookings-store";
import { defaultCargoRoom, cargoRoomLabel, tripStatusLabels, VEHICLE_TYPES } from "./trips";
import { roleHome } from "./auth";
import { formatDate, toIsoDate, initialsOf, timeAgo } from "./format";
import { sampleDrivers } from "./user-fixtures";

const doc = (
  id: string,
  kind: DriverDocument["kind"],
  status: DriverDocument["status"],
  vehicleId?: string,
): DriverDocument => ({
  id,
  kind,
  status,
  fileName: `${id}.pdf`,
  data: "",
  uploadedAt: "2026-09-05T08:00:00.000Z",
  vehicleId,
});

const vehicle = (id: string, overrides: Partial<Vehicle> = {}): Vehicle => ({
  id,
  vehicleNumber: `KA 01 ${id.toUpperCase()}`,
  vehicleType: "Truck",
  isPrimary: false,
  ...overrides,
});

const makeDriver = (overrides: Partial<User> = {}): User => ({
  id: "d1",
  role: "driver",
  name: "Ravi Kumar",
  email: "ravi@kapes.in",
  createdAt: "2026-09-01T08:00:00.000Z",
  ...overrides,
});

// ---------------------------------------------------------------- verification

test("isDriverSearchable: only a driver whose every document is approved shows up", () => {
  const ravi = sampleDrivers.find((d) => d.id === "driver-ravi")!;
  const arjun = sampleDrivers.find((d) => d.id === "driver-arjun")!;
  assert.equal(isDriverSearchable(ravi), true, "fully attested driver is searchable");
  assert.equal(isDriverSearchable(arjun), false, "pending RC keeps the driver out of search");
  assert.equal(isDriverSearchable(undefined), false);
  assert.equal(isDriverSearchable(null), false);

  const noDocs = makeDriver({ documents: [] });
  assert.equal(isDriverSearchable(noDocs), false, "no documents means not searchable");

  const mixed = makeDriver({
    documents: [doc("a", "driving_licence", "approved"), doc("b", "vehicle_rc", "rejected")],
  });
  assert.equal(isDriverSearchable(mixed), false, "any rejected document disqualifies");

  const customer = makeDriver({
    role: "customer",
    documents: [doc("a", "driving_licence", "approved")],
  });
  assert.equal(isDriverSearchable(customer), false, "customers are never in the driver directory");
});

// ---------------------------------------------------------------- vehicles

test("isVehicleApproved: a vehicle needs role driver plus an approved RC for that vehicle", () => {
  const v = vehicle("v1");
  const pending = makeDriver({ vehicles: [v], documents: [doc("rc", "vehicle_rc", "pending", "v1")] });
  assert.equal(isVehicleApproved(pending, "v1"), false, "pending RC locks the vehicle");

  const approved = makeDriver({
    vehicles: [v],
    documents: [doc("rc", "vehicle_rc", "approved", "v1")],
  });
  assert.equal(isVehicleApproved(approved, "v1"), true, "approved RC unlocks the vehicle");
  assert.equal(isVehicleApproved(approved, "other"), false, "RC is scoped to its vehicle");
  assert.equal(isVehicleApproved(approved, undefined), false, "no vehicle id means no approval");
  assert.equal(
    isVehicleApproved(makeDriver({ role: "customer", documents: approved.documents }), "v1"),
    false,
    "customers never own approved vehicles",
  );
});

test("approvedVehicles: keeps only vehicles whose RC is approved", () => {
  const user = makeDriver({
    vehicles: [vehicle("v1"), vehicle("v2")],
    documents: [doc("rc1", "vehicle_rc", "approved", "v1"), doc("rc2", "vehicle_rc", "pending", "v2")],
  });
  assert.deepEqual(approvedVehicles(user).map((v) => v.id), ["v1"]);
  assert.deepEqual(approvedVehicles(makeDriver({ vehicles: [] })), []);
});

test("primaryVehicle falls back to the first vehicle when none is marked primary", () => {
  const first = vehicle("v1");
  const second = vehicle("v2");
  assert.equal(primaryVehicle(makeDriver({ vehicles: [first, second] }))?.id, "v1");
  assert.equal(
    primaryVehicle(makeDriver({ vehicles: [first, vehicle("v2", { isPrimary: true })] }))?.id,
    "v2",
  );
  assert.equal(primaryVehicle(makeDriver({ vehicles: [] })), undefined);
  assert.equal(primaryVehicle(undefined), undefined);
});

// ---------------------------------------------------------------- documents

test("driverDocuments / findDriverDocument filter by kind and vehicle", () => {
  const user = makeDriver({
    documents: [
      doc("lic", "driving_licence", "approved"),
      doc("rc1", "vehicle_rc", "approved", "v1"),
      doc("rc2", "vehicle_rc", "pending", "v2"),
    ],
  });
  assert.equal(driverDocuments(user).length, 3);
  assert.equal(driverDocuments(null).length, 0);
  assert.equal(findDriverDocument(user, "driving_licence")?.id, "lic");
  assert.equal(findDriverDocument(user, "vehicle_rc", "v2")?.id, "rc2");
  assert.equal(findDriverDocument(user, "vehicle_rc", "missing"), undefined);
  // A document with no vehicleId matches any vehicle lookup.
  const unlinked = makeDriver({ documents: [doc("rc", "vehicle_rc", "pending")] });
  assert.equal(findDriverDocument(unlinked, "vehicle_rc", "anything")?.id, "rc");
});

test("document labels and the PDF size cap are stable", () => {
  assert.equal(docKindLabels.driving_licence, "Driving licence");
  assert.equal(docStatusLabels.pending, "In review");
  assert.equal(docStatusLabels.approved, "Verified");
  assert.equal(docStatusLabels.rejected, "Rejected");
  assert.equal(MAX_PDF_BYTES, 1_500_000);
});

// ---------------------------------------------------------------- moderation

test("userAccountLabel ranks blocked over held over warned over active", () => {
  assert.equal(userAccountLabel(makeDriver()), "Active");
  assert.equal(userAccountLabel(makeDriver({ warned: true })), "Warned");
  assert.equal(userAccountLabel(makeDriver({ warned: true, held: true })), "On hold");
  assert.equal(userAccountLabel(makeDriver({ warned: true, held: true, blocked: true })), "Blocked");
  assert.equal(userAccountLabel(undefined), "Active");
});

test("driverRemovedVehicles reads the archive", () => {
  const archived = {
    removedAt: "2026-09-10T00:00:00.000Z",
    vehicle: vehicle("gone"),
    documents: [doc("rc", "vehicle_rc", "approved", "gone")],
  };
  assert.deepEqual(driverRemovedVehicles(makeDriver({ removedVehicles: [archived] })).length, 1);
  assert.deepEqual(driverRemovedVehicles(makeDriver()), []);
});

// ---------------------------------------------------------------- bookings

test("bookingSizeLabel formats L × B × H and stays silent when incomplete", () => {
  assert.equal(bookingSizeLabel({ lengthCm: 120, breadthCm: 80, heightCm: 60 }), "120 × 80 × 60 cm");
  assert.equal(bookingSizeLabel({ lengthCm: 120, breadthCm: 80, heightCm: undefined }), null);
  assert.equal(bookingSizeLabel({ lengthCm: undefined, breadthCm: 80, heightCm: 60 }), null);
});

test("booking status labels cover every status and delivered/cancelled free capacity", () => {
  assert.deepEqual(Object.keys(bookingStatusLabels).sort(), [
    "cancelled",
    "confirmed",
    "delivered",
    "in_transit",
    "pending",
  ]);
  assert.deepEqual([...ABNORMAL_BOOKING_STATUSES].sort(), ["cancelled", "delivered"]);
});

// ---------------------------------------------------------------- trips/cargo

test("defaultCargoRoom matches the documented dimensions for every vehicle type", () => {
  assert.deepEqual(defaultCargoRoom("Mini"), { lengthCm: 180, breadthCm: 140, heightCm: 120 });
  assert.deepEqual(defaultCargoRoom("Truck"), { lengthCm: 320, breadthCm: 180, heightCm: 180 });
  assert.deepEqual(defaultCargoRoom("Container"), { lengthCm: 600, breadthCm: 240, heightCm: 240 });
  assert.deepEqual(defaultCargoRoom("Trailer"), { lengthCm: 1200, breadthCm: 250, heightCm: 260 });
  assert.deepEqual([...VEHICLE_TYPES].sort(), ["Container", "Mini", "Trailer", "Truck"]);
});

test("cargoRoomLabel renders dimensions or null when any side is missing", () => {
  assert.equal(cargoRoomLabel({ lengthCm: 320, breadthCm: 180, heightCm: 180 }), "320 × 180 × 180 cm");
  assert.equal(cargoRoomLabel({ lengthCm: 320, breadthCm: 180, heightCm: undefined }), null);
  assert.equal(cargoRoomLabel(null), null);
  assert.equal(cargoRoomLabel(undefined), null);
});

test("tripStatusLabels cover every status", () => {
  assert.deepEqual(Object.keys(tripStatusLabels).sort(), [
    "cancelled",
    "completed",
    "matched",
    "open",
  ]);
});

// ---------------------------------------------------------------- routing

test("roleHome sends each role to its dashboard", () => {
  assert.equal(roleHome("driver"), "/driver");
  assert.equal(roleHome("admin"), "/admin");
  assert.equal(roleHome("customer"), "/account");
});

// ---------------------------------------------------------------- formatting

test("initialsOf takes up to two initials and falls back", () => {
  assert.equal(initialsOf("Ravi Kumar"), "RK");
  assert.equal(initialsOf("Ravi Kumar Sr."), "RK");
  assert.equal(initialsOf("ravi"), "R");
  assert.equal(initialsOf(""), "?");
  assert.equal(initialsOf(undefined, "X"), "X");
});

test("formatDate and toIsoDate round-trip a date", () => {
  assert.equal(formatDate("2026-09-21"), "21/09/26");
  assert.equal(formatDate("not-a-date"), "not-a-date");
  assert.equal(toIsoDate(new Date(2026, 8, 21)), "2026-09-21");
});

test("timeAgo describes recent activity", () => {
  const now = new Date("2026-09-20T12:00:00.000Z");
  assert.equal(timeAgo("2026-09-20T11:59:30.000Z", now), "just now");
  assert.equal(timeAgo("2026-09-20T11:45:00.000Z", now), "15 minutes ago");
  assert.equal(timeAgo("2026-09-20T09:00:00.000Z", now), "3 hours ago");
  assert.equal(timeAgo("", now), "");
});
