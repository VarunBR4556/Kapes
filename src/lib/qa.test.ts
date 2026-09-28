import { test, before } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { create, act, type ReactTestRenderer } from "react-test-renderer";
import { MemoryRouter } from "react-router-dom";
import TripCard from "@/components/trips/TripCard";
import {
  UsersProvider,
  useUsers,
  primaryVehicle,
  isVehicleApproved,
  isDriverSearchable,
} from "./users-store";
import { sampleDrivers } from "./user-fixtures";
import type { Vehicle } from "./users-store";
import { TripsProvider, useTrips } from "./trips-store";
import { BookingsProvider, useBookings, bookingSizeLabel } from "./bookings-store";
import { ReportsProvider, useReports } from "./reports-store";
import { AuthProvider } from "./auth-context";
import { getAvailableTrips } from "./search";

const USERS_KEY = "kapes_users_v1";
const PASSWORD = "kapes123";

class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
}

before(() => {
  Object.assign(globalThis, { localStorage: new MemoryStorage() });
});

type Store = {
  users: ReturnType<typeof useUsers>;
  trips: ReturnType<typeof useTrips>;
  bookings: ReturnType<typeof useBookings>;
  reports: ReturnType<typeof useReports>;
};

let store: Store;

const Probe = () => {
  store = {
    users: useUsers(),
    trips: useTrips(),
    bookings: useBookings(),
    reports: useReports(),
  };
  return null;
};

function mountApp(preSeeds?: () => void, clear = true): ReactTestRenderer {
  if (clear) {
    localStorage.clear();
  }
  preSeeds?.();
  let root: ReactTestRenderer | undefined;
  act(() => {
    root = create(
      React.createElement(AuthProvider, null,
      React.createElement(UsersProvider, null,
        React.createElement(TripsProvider, null,
          React.createElement(BookingsProvider, null,
            React.createElement(ReportsProvider, null, React.createElement(Probe)))))),
    );
  });
  return root!;
}

function unmount(root: ReactTestRenderer) {
  act(() => root.unmount());
}

function login(email: string, password: string) {
  let result: unknown;
  act(() => {
    result = store.users.login(email, password);
  });
  return result;
}

function logout() {
  act(() => store.users.logout());
}

const makeTrip = (origin: string, destination: string) => ({
  origin,
  destination,
  departureDate: "2026-12-25",
  departureTime: "09:00",
  vehicleType: "Truck" as const,
  capacityKg: 5000,
  pricePerKg: 5,
});

const book = (
  tripId: string,
  shipmentWeightKg: number,
  pickupAddress = "",
  dropoffAddress = "",
  totalPrice = 1,
) =>
  store.bookings.createBooking({
    tripId,
    shipmentWeightKg,
    pickupAddress,
    dropoffAddress,
    totalPrice,
  });

const seedAvailability = () => {
  assert.equal(store.bookings.availableCapacityKgs("seed-1"), 800, "seed-1 has 800 kg free");
  assert.equal(store.bookings.availableCapacityKgs("seed-3"), 5000, "seed-3 has 5000 kg free");
  assert.equal(store.bookings.availableCapacityKgs("seed-17"), 2500, "seed-17 has 2500 kg free");
  assert.equal(store.bookings.availableCapacityKgs("seed-9"), 1100, "seed-9 delivered frees all 1100 kg");
};

test("seed data is wired and availability matches the live tables", () => {
  const root = mountApp();
  try {
    assert.equal(store.trips.trips.length, 52);
    const seed1 = store.trips.trips.find((t) => t.id === "seed-1")!;
    assert.equal(seed1.driverId, "driver-ravi");
    assert.equal(seed1.status, "open");
    assert.equal(seed1.vehicleType, "Mini");
    assert.equal(seed1.lengthCm, 180, "seed trips carry cargo room from vehicle type");
    assert.equal(seed1.breadthCm, 140);
    assert.equal(seed1.heightCm, 120);
    assert.equal(store.users.users.length, 8);
    assert.equal(store.bookings.bookings.length, 4);
    seedAvailability();
    assert.equal(store.bookings.reservedCapacityKgs("seed-1"), 400);
  } finally {
    unmount(root);
  }
});

test("auth: correct login, wrong password, case-insensitive email, logout", () => {
  const root = mountApp();
  try {
    assert.equal(store.users.currentUser, null);
    assert.equal(login("ravi@kapes.in", "nope"), null);
    assert.equal(store.users.currentUser, null);

    const ok = login("   RAVI@kapes.in  ", PASSWORD);
    assert.equal(ok?.id, "driver-ravi");
    assert.equal(store.users.currentUser?.id, "driver-ravi");

    logout();
    assert.equal(store.users.currentUser, null);
  } finally {
    unmount(root);
  }
});

test("register driver with vehicle; identity survives a reload (no Ravi hijack)", () => {
  let userId = "";
  let tripId = "";
  const root = mountApp();
  try {
    const user = store.users.register({
      role: "driver",
      name: "   Kiran Rao   ",
      email: "kiran@test.in",
      password: "secret123",
      phone: "9999000011",
      vehicleNumber: "KA 51 AB 4242",
      vehicleType: "Trailer",
    });
    userId = user.id;
    assert.equal(store.users.currentUser?.id, user.id);
    assert.equal(store.users.currentUser!.vehicles!.length, 1);

    const added = store.trips.addTrip(
      { ...makeTrip("Bengaluru", "Chennai"), capacityKg: 3000 },
      { vehicleNumber: "KA 51 AB 4242" },
    );
    tripId = added.id;
    assert.equal(added.driverId, user.id);
  } finally {
    unmount(root);
  }

  const root2 = mountApp(null, false);
  try {
    login("kiran@test.in", "secret123");
    assert.equal(store.users.currentUser?.id, userId, "fresh driver keeps own id after reload");
    assert.equal(store.users.currentUser!.vehicles!.length, 1);
    assert.ok(store.trips.myTrips.some((t) => t.id === tripId));
    assert.equal(store.trips.trips.find((t) => t.id === tripId)!.driverId, userId);
    assert.notEqual(
      store.trips.trips.find((t) => t.id === tripId)!.driverId,
      "driver-ravi",
      "attachTripDriver never reassigns new drivers' trips to a sample driver",
    );
  } finally {
    unmount(root2);
  }
});

test("addTrip snapshots the chosen vehicle and scopes posts to the owner", () => {
  const root = mountApp();
  try {
    login("ravi@kapes.in", PASSWORD);

    const withVehicle = store.trips.addTrip(
      { ...makeTrip("Mumbai", "Goa"), capacityKg: 4000 },
      { vehicleNumber: "MH 04 TT 9876" },
    );
    assert.equal(withVehicle.driverVehicle, "MH 04 TT 9876");
    assert.equal(withVehicle.driverName, "Ravi Kumar");
    assert.equal(withVehicle.status, "open");
    assert.equal(withVehicle.lengthCm, 320, "posted trips inherit cargo room");
    assert.equal(withVehicle.breadthCm, 180);
    assert.equal(withVehicle.heightCm, 180);

    const noVehicle = store.trips.addTrip(makeTrip("Mumbai", "Pune"));
    assert.equal(noVehicle.driverVehicle, "KA 01 AB 1234", "falls back to primary vehicle");

    assert.ok(store.trips.myTrips.some((t) => t.id === withVehicle.id));
    assert.ok(store.trips.myTrips.some((t) => t.id === "seed-1"), "seed-1 belongs to ravi");

    logout();
    login("asha@kapes.in", PASSWORD);
    assert.ok(!store.trips.myTrips.some((t) => t.id === withVehicle.id), "not visible to a customer");
  } finally {
    unmount(root);
  }
});

test("account settings: rename propagates to the driver's trips and persists", () => {
  const root = mountApp();
  try {
    login("ravi@kapes.in", PASSWORD);
    store.users.updateUser({ name: "Ravi Kumar Sr." });
    store.trips.updateTripDriver({ name: "Ravi Kumar Sr." });

    const mine = store.trips.trips.filter((t) => t.driverId === "driver-ravi");
    assert.ok(mine.length > 0);
    assert.ok(mine.every((t) => t.driverName === "Ravi Kumar Sr."));
    assert.equal(store.users.currentUser!.name, "Ravi Kumar Sr.");
    assert.equal(store.users.users.find((u) => u.id === "driver-ravi")!.email, "ravi@kapes.in");
  } finally {
    unmount(root);
  }
});

test("driver can browse a trip card but cannot book", () => {
  const root = mountApp();
  try {
    login("ravi@kapes.in", PASSWORD);
    const trip = store.trips.trips.find((t) => t.id === "seed-1")!;
    let card: ReactTestRenderer | undefined;
    act(() => {
      card = create(
        React.createElement(AuthProvider, null,
      React.createElement(UsersProvider, null,
          React.createElement(TripsProvider, null,
            React.createElement(BookingsProvider, null,
              React.createElement(ReportsProvider, null,
                React.createElement(MemoryRouter, null,
                  React.createElement(TripCard, { trip })))))),
        ),
      );
    });
    const rendered = JSON.stringify(card!.toJSON());
    assert.ok(!rendered.includes("Drivers can't book"), "no driver notice button");
    assert.ok(!rendered.includes("Book space"), "driver gets no book CTA");
    assert.ok(rendered.includes("Mumbai"), "driver can still browse trip details");
  } finally {
    unmount(root);
  }
});

test("demo login migrates old store: left-over pre-rename account still logs in with new credentials", () => {
  localStorage.clear();
  localStorage.setItem(
    "kappe_users_v1",
    JSON.stringify([
      {
        id: "customer-asha",
        role: "customer",
        name: "Asha Nair",
        email: "asha@kappe.in",
        password: "kappe123",
        phone: "9000011122",
        createdAt: "2026-09-01T08:00:00.000Z",
      },
    ]),
  );
  const root = mountApp(undefined, false);
  try {
    const user = store.users.login("asha@kapes.in", "kapes123");
    assert.ok(user, "left-over old-brand demo account accepts new login credentials");
  } finally {
    unmount(root);
  }
});

test("customer edit profile: name and phone update and persist across sessions", () => {
  const root = mountApp();
  try {
    login("asha@kapes.in", PASSWORD);
    store.users.updateUser({ name: "Asha Nair K.", phone: "9447001122" });
    assert.equal(store.users.currentUser!.name, "Asha Nair K.");
    assert.equal(store.users.currentUser!.phone, "9447001122");

    logout();
    login("asha@kapes.in", PASSWORD);
    assert.equal(store.users.currentUser!.name, "Asha Nair K.", "edited name persists");
    assert.equal(store.users.currentUser!.phone, "9447001122", "edited phone persists");
    assert.equal(store.users.currentUser!.role, "customer", "role is frozen");
    assert.equal(store.users.currentUser!.email, "asha@kapes.in", "email (login id) is frozen");
  } finally {
    unmount(root);
  }
});

test("profile picture: set, replace and clear persists for the account", () => {
  const root = mountApp();
  try {
    login("asha@kapes.in", PASSWORD);
    const photo = "data:image/jpeg;base64,AAAA";
    store.users.updateUser({ profilePic: photo });
    assert.equal(store.users.currentUser!.profilePic, photo, "photo is stored on the account");

    logout();
    login("asha@kapes.in", PASSWORD);
    assert.equal(store.users.currentUser!.profilePic, photo, "photo persists across sessions");

    store.users.updateUser({ profilePic: undefined });
    assert.equal(store.users.currentUser!.profilePic, undefined, "photo can be removed");
  } finally {
    unmount(root);
  }
});

test("vehicles: add (not primary), set primary, edit, remove promotes first", () => {
  const root = mountApp();
  try {
    login("ravi@kapes.in", PASSWORD);

    const added = store.users.addVehicle({ vehicleNumber: "gj 07 xy 3333", vehicleType: "Trailer" })!;
    assert.ok(typeof added.id === "string" && added.id.length > 0);
    const fleet = store.users.users.find((u) => u.id === "driver-ravi")!.vehicles!;
    assert.equal(fleet.length, 4);
    assert.equal(added.isPrimary, false, "extra vehicle is not primary");
    assert.equal(added.lengthCm, 1200, "added vehicle inherits its type's cargo room");
    assert.equal(added.breadthCm, 250);
    assert.equal(added.heightCm, 260);
    assert.equal(store.users.currentUser!.vehicleNumber, "KA 01 AB 1234");

    const mini = primaryVehicle(store.users.currentUser)!;
    assert.equal(mini.lengthCm, 180, "seed vehicles carry cargo room from vehicle type");
    assert.equal(mini.breadthCm, 140);
    assert.equal(mini.heightCm, 120);

    store.users.setPrimaryVehicle(added.id);
    assert.equal(store.users.currentUser!.vehicleNumber, "GJ 07 XY 3333");
    assert.equal(primaryVehicle(store.users.currentUser)?.vehicleNumber, "GJ 07 XY 3333");

    store.users.updateVehicle(added.id, { vehicleType: "Container" });
    assert.equal(primaryVehicle(store.users.currentUser)?.vehicleType, "Container");
    assert.equal(primaryVehicle(store.users.currentUser)?.lengthCm, 600, "type change recomputes cargo room");
    assert.equal(primaryVehicle(store.users.currentUser)?.heightCm, 240);

    store.users.removeVehicle(added.id);
    const after = store.users.users.find((u) => u.id === "driver-ravi")!;
    assert.equal(after.vehicles!.length, 3);
    assert.equal(after.vehicleNumber, "KA 01 AB 1234", "promotion restores the primary vehicleNumber");
    assert.equal(primaryVehicle(after)?.vehicleNumber, "KA 01 AB 1234");
  } finally {
    unmount(root);
  }
});

test("profile activity: edits are recorded and persist across sessions", () => {
  const root = mountApp();
  try {
    login("asha@kapes.in", PASSWORD);
    store.users.updateUser({ name: "Asha New", phone: "9000111222" });
    const entries = store.users.currentUser!.profileActivity ?? [];
    assert.ok(
      entries.some((e) => e.action === "Updated name" && e.detail?.includes("Asha New")),
      "name edit is logged",
    );
    assert.ok(
      entries.some((e) => e.action === "Updated phone number" && e.detail === "9000111222"),
      "phone edit is logged",
    );

    logout();
    login("asha@kapes.in", PASSWORD);
    assert.equal(
      (store.users.currentUser!.profileActivity ?? []).length,
      entries.length,
      "activity persists across sessions",
    );
  } finally {
    unmount(root);
  }
});

test("profile activity: vehicle add and remove are logged", () => {
  const root = mountApp();
  try {
    login("ravi@kapes.in", PASSWORD);
    const added = store.users.addVehicle({ vehicleNumber: "dl 08 zz 1234", vehicleType: "Mini" })!;
    store.users.setPrimaryVehicle(added.id);
    store.users.removeVehicle(added.id);
    const actions = store.users.users.find((u) => u.id === "driver-ravi")!
      .profileActivity!.map((e) => e.action);
    assert.ok(actions.includes("Added vehicle"), "add vehicle logged");
    assert.ok(actions.includes("Set primary vehicle"), "set primary logged");
    assert.ok(actions.includes("Removed vehicle"), "remove vehicle logged");
  } finally {
    unmount(root);
  }
});

test("admin moderation: hold and block prevent login, warn does not; admin is protected", () => {
  const root = mountApp();
  try {
    login("admin@kapes.in", "kapes@admin2026");

    act(() => store.users.setAccountFlag("driver-ravi", "warn", true));
    const warned = store.users.users.find((u) => u.id === "driver-ravi")!;
    assert.equal(warned.warned, true, "driver is warned");
    logout();
    assert.ok(login("ravi@kapes.in", PASSWORD), "warned user can still sign in");

    login("admin@kapes.in", "kapes@admin2026");
    act(() => store.users.setAccountFlag("driver-ravi", "hold", true));
    logout();
    assert.equal(login("ravi@kapes.in", PASSWORD), null, "held user cannot sign in");

    login("admin@kapes.in", "kapes@admin2026");
    act(() => store.users.setAccountFlag("driver-ravi", "hold", false));
    act(() => store.users.setAccountFlag("driver-ravi", "block", true));
    logout();
    assert.equal(login("ravi@kapes.in", PASSWORD), null, "blocked user cannot sign in");

    login("admin@kapes.in", "kapes@admin2026");
    act(() => store.users.setAccountFlag("driver-ravi", "block", false));
    logout();
    assert.ok(login("ravi@kapes.in", PASSWORD), "unblocked user can sign in again");

    login("admin@kapes.in", "kapes@admin2026");
    act(() => store.users.setAccountFlag(store.users.currentUser!.id, "block", true));
    assert.equal(
      store.users.users.find((u) => u.id === "admin")!.blocked,
      undefined,
      "admin account cannot be blocked",
    );
  } finally {
    unmount(root);
  }
});

test("migration: legacy driver with only vehicleNumber becomes a Truck primary vehicle", () => {
  const legacy = JSON.stringify([
    {
      id: "driver-ravi",
      role: "driver",
      name: "Ravi Kumar",
      email: "ravi@kapes.in",
      password: PASSWORD,
      phone: "9876543210",
      vehicleNumber: "KA 01 AB 1234",
      vehicles: [
        { id: "vehicle-ravi-1", vehicleNumber: "KA 01 AB 1234", vehicleType: "Mini", isPrimary: true },
        { id: "vehicle-ravi-2", vehicleNumber: "MH 04 TT 9876", vehicleType: "Truck" },
        { id: "vehicle-ravi-3", vehicleNumber: "DL 1T 7788", vehicleType: "Container" },
      ],
      createdAt: "2026-09-01T08:00:00.000Z",
    },
    {
      id: "driver-xyz",
      role: "driver",
      name: "Old Driver",
      email: "old@kapes.in",
      password: "x",
      phone: "1",
      vehicleNumber: "up 32 xx 1001",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ]);
  const root = mountApp(() => localStorage.setItem(USERS_KEY, legacy));
  try {
    const old = store.users.users.find((u) => u.id === "driver-xyz")!;
    assert.ok(Array.isArray(old.vehicles));
    assert.equal(old.vehicles!.length, 1);
    assert.equal(old.vehicles![0].vehicleNumber, "UP 32 XX 1001");
    assert.equal(old.vehicles![0].vehicleType, "Truck");
    assert.equal(old.vehicles![0].isPrimary, true);
    assert.equal(old.vehicles![0].lengthCm, 320, "legacy-only vehicleNumber gets Truck room");
    assert.equal(old.vehicles![0].breadthCm, 180);
    assert.equal(old.vehicles![0].heightCm, 180);
    assert.equal(old.vehicleNumber, "UP 32 XX 1001");

    const ravi = store.users.users.find((u) => u.id === "driver-ravi")!;
    assert.equal(ravi.vehicles![0].lengthCm, 180, "legacy vehicles with type get room normalized");
    assert.equal(ravi.vehicles![1].lengthCm, 320);
    assert.equal(ravi.vehicles![2].lengthCm, 600);
  } finally {
    unmount(root);
  }
});

test("bookings: over-capacity, full trip, role and status guards all return null", () => {
  const root = mountApp();
  try {
    seedAvailability();

    login("asha@kapes.in", PASSWORD);
    assert.equal(book("seed-1", 1200), null, "over remaining capacity rejected");
    assert.equal(store.bookings.availableCapacityKgs("seed-1"), 800);

    const fills = book("seed-1", 800);
    assert.notEqual(fills, null, "fills the remaining capacity exactly");
    assert.equal(store.bookings.availableCapacityKgs("seed-1"), 0);
    assert.equal(book("seed-1", 1), null, "fully-booked trip rejects further bookings");

    store.bookings.setBookingStatus(fills!.id, "cancelled");
    assert.equal(store.bookings.availableCapacityKgs("seed-1"), 800);

    logout();
    login("ravi@kapes.in", PASSWORD);
    assert.equal(book("seed-2", 10), null, "drivers cannot book");

    logout();
    login("asha@kapes.in", PASSWORD);
    assert.equal(book("seed-9", 10), null, "completed trip cannot be booked");
  } finally {
    unmount(root);
  }
});

test("bookings: approx shipment size (L×B×H) is stored and labelled", () => {
  const root = mountApp();
  try {
    login("asha@kapes.in", PASSWORD);
    const b = store.bookings.createBooking({
      tripId: "seed-6",
      shipmentWeightKg: 300,
      lengthCm: 120,
      breadthCm: 80,
      heightCm: 60,
      pickupAddress: "Camp, Pune",
      dropoffAddress: "College Road, Nashik",
      totalPrice: 3000,
    })!;
    assert.equal(b.lengthCm, 120);
    assert.equal(b.breadthCm, 80);
    assert.equal(b.heightCm, 60);
    const stored = store.bookings.myBookings.find((x) => x.id === b.id)!;
    assert.equal(
      bookingSizeLabel(stored),
      "120 × 80 × 60 cm",
      "dimensions format as L × B × H cm",
    );
    assert.equal(
      bookingSizeLabel({ lengthCm: 120, breadthCm: 80, heightCm: undefined }),
      null,
      "missing dimensions show no label",
    );
  } finally {
    unmount(root);
  }
});

test("bookings: full lifecycle confirm, deliver, cancel with capacity release", () => {
  const root = mountApp();
  try {
    login("asha@kapes.in", PASSWORD);
    const b = book("seed-6", 400, "Pune", "Nashik", 4000)!;
    assert.equal(b.status, "pending");
    assert.ok(b.id.length > 0);
    assert.equal(store.bookings.availableCapacityKgs("seed-6"), 500);
    assert.ok(store.bookings.myBookings.some((x) => x.id === b.id));

    logout();
    login("ravi@kapes.in", PASSWORD);
    store.bookings.setBookingStatus(b.id, "confirmed");
    assert.equal(store.trips.trips.find((t) => t.id === "seed-6")!.status, "matched", "confirm moves trip to matched");
    assert.equal(store.bookings.availableCapacityKgs("seed-6"), 500, "confirmed still reserves capacity");

    store.bookings.setBookingStatus(b.id, "delivered");
    assert.equal(store.trips.trips.find((t) => t.id === "seed-6")!.status, "completed", "delivery completes the trip");
    assert.equal(store.bookings.availableCapacityKgs("seed-6"), 900, "delivery frees the space");

    logout();
    login("asha@kapes.in", PASSWORD);
    const b2 = book("seed-5", 1000)!;
    store.bookings.setBookingStatus(b2.id, "cancelled");
    assert.equal(store.trips.trips.find((t) => t.id === "seed-5")!.status, "open", "cancel reopens an open trip");
    assert.equal(store.bookings.availableCapacityKgs("seed-5"), 18000);
  } finally {
    unmount(root);
  }
});

test("delivering one shipment does NOT complete a trip with other active bookings", () => {
  const root = mountApp();
  try {
    login("asha@kapes.in", PASSWORD);
    const extra = book("seed-1", 100)!;

    logout();
    login("ravi@kapes.in", PASSWORD);

    store.bookings.setBookingStatus("booking-4", "confirmed");
    assert.equal(store.trips.trips.find((t) => t.id === "seed-1")!.status, "matched");

    store.bookings.setBookingStatus("booking-4", "delivered");
    assert.equal(
      store.trips.trips.find((t) => t.id === "seed-1")!.status,
      "matched",
      "another active booking blocks trip completion",
    );

    logout();
    login("asha@kapes.in", PASSWORD);
    store.bookings.setBookingStatus(extra.id, "cancelled");
    assert.equal(
      store.trips.trips.find((t) => t.id === "seed-1")!.status,
      "completed",
      "cancelling the last active booking on a delivery-shown trip completes it",
    );
    assert.equal(store.bookings.availableCapacityKgs("seed-1"), 1200);
  } finally {
    unmount(root);
  }
});

test("driver cancelling a trip cascades to its active bookings", () => {
  const root = mountApp();
  try {
    login("asha@kapes.in", PASSWORD);
    const b = book("seed-1", 500)!;
    assert.equal(b.status, "pending");

    logout();
    login("ravi@kapes.in", PASSWORD);
    store.bookings.cancelTripWithBookings("seed-1");
    assert.equal(
      store.trips.trips.find((t) => t.id === "seed-1")!.status,
      "cancelled",
    );
    assert.equal(
      store.bookings.bookings.find((x) => x.id === b.id)!.status,
      "cancelled",
      "active booking is released when trip is cancelled",
    );
  } finally {
    unmount(root);
  }
});

test("getAvailableTrips still surfaces fully-booked open trips (Capacity-full CTA stays visible)", () => {
  const root = mountApp();
  try {
    login("asha@kapes.in", PASSWORD);
    const b = book("seed-1", 800)!;
    assert.equal(store.bookings.availableCapacityKgs("seed-1"), 0);
    assert.ok(getAvailableTrips(store.trips.trips).some((t) => t.id === "seed-1"));
    store.bookings.setBookingStatus(b.id, "cancelled");
  } finally {
    unmount(root);
  }
});

test("full journey survives a reload: session, capacity and booking persist", () => {
  const root = mountApp();
  let bookingId = "";
  try {
    login("asha@kapes.in", PASSWORD);
    store.users.updateUser({ phone: "9000011122" });
    const b = book("seed-17", 700, "Koramangala", "Gokul Road, Hubballi", 4200)!;
    bookingId = b.id;
  } finally {
    unmount(root);
  }

  const root2 = mountApp(null, false);
  try {
    assert.equal(store.users.currentUser?.id, "customer-asha", "session restored after reload");
    assert.equal(store.bookings.availableCapacityKgs("seed-17"), 1800, "700 new + 1500 seed reserved");
    assert.ok(store.bookings.bookings.some((x) => x.id === bookingId));
    assert.equal(store.users.currentUser!.phone, "9000011122");
    logout();
  } finally {
    unmount(root2);
  }
});

test("admin account exists, logs in, and persists as admin role", () => {
  const root = mountApp();
  try {
    const user = login("admin@kapes.in", "kapes@admin2026");
    assert.ok(user, "admin credentials accepted");
    assert.equal(store.users.currentUser?.role, "admin");
    assert.equal(store.users.currentUser?.id, "admin");
  } finally {
    unmount(root);
  }
});

test("driver documents gate the platform and admin attestation flips verification", () => {
  const root = mountApp();
  try {
    const driver = store.users.register({
      role: "driver",
      name: "Qa Driver",
      email: "qadriver@qa.in",
      password: PASSWORD,
      vehicleNumber: "KA 05 XY 2020",
      vehicleType: "Truck",
      documents: [
        {
          kind: "driving_licence",
          fileName: "qa-driver-dl.pdf",
          data: "data:application/pdf;base64,SEVMTE8=",
        },
      ],
    });
    assert.equal(driver.driverVerification, "pending", "new drivers land in review queue");
    assert.ok(driver.documentsSubmittedAt, "documents timestamp recorded");
    assert.equal((driver.documents ?? []).length, 1, "licence document stored");

    const driverStored = () => store.users.users.find((u) => u.id === driver.id)!;
    const dl = driverStored().documents![0];
    assert.equal(dl.status, "pending", "freshly uploaded licence awaits attestation");

    const arjun = () => store.users.users.find((u) => u.id === "driver-arjun")!;
    assert.equal(arjun().driverVerification, "pending", "seed arjun awaiting review");
    assert.ok(
      (arjun().documents ?? []).length >= 2,
      "seed drivers carry licence + RC documents",
    );
    arjun()
      .documents!.map((d) => d.id)
      .forEach((docId) => act(() => store.users.setDocumentStatus(docId, "approved")));
    assert.equal(
      arjun().driverVerification,
      "approved",
      "attesting every document clears the driver",
    );

    act(() => store.users.setDocumentStatus(dl.id, "rejected"));
    assert.equal(
      driverStored().driverVerification,
      "rejected",
      "any rejected document blocks the account",
    );

    act(() =>
      store.users.setDocumentStatus(dl.id, "approved"),
    );
    assert.equal(
      driverStored().driverVerification,
      "approved",
      "approved documents unlock the account",
    );
  } finally {
    unmount(root);
  }
});

test("search hides a driver's trips until every document is approved", () => {
  const ravi = sampleDrivers.find((d) => d.id === "driver-ravi")!;
  const arjun = sampleDrivers.find((d) => d.id === "driver-arjun")!;
  assert.equal(isDriverSearchable(ravi), true, "fully attested driver is searchable");
  assert.equal(
    isDriverSearchable(arjun),
    false,
    "pending licence or vehicle RC keeps the driver out of search",
  );
  assert.equal(isDriverSearchable(undefined), false);
});

test("adding a vehicle requires an RC document that admin attests separately", () => {
  const root = mountApp();
  try {
    login("arjun@kapes.in", PASSWORD);
    let created: Vehicle | null = null;
    act(() => {
      created = store.users.addVehicle({
        vehicleNumber: "KA 09 ZZ 3333",
        vehicleType: "Truck",
      });
    });
    assert.ok(created, "vehicle added while pending");
    let arjun = store.users.users.find((u) => u.id === "driver-arjun")!;
    assert.equal(
      isVehicleApproved(arjun, created!.id),
      false,
      "vehicle with no RC document cannot be used",
    );
    act(() =>
      store.users.addDriverDocument({
        kind: "vehicle_rc",
        vehicleId: created!.id,
        fileName: "ka09zz3333_rc.pdf",
        data: "data:application/pdf;base64,UkM=",
      }),
    );
    arjun = store.users.users.find((u) => u.id === "driver-arjun")!;
    const rcDoc = arjun.documents!.find(
      (d) => d.kind === "vehicle_rc" && d.vehicleId === created!.id,
    );
    assert.ok(rcDoc, "RC document linked to the new vehicle");
    assert.equal(rcDoc!.status, "pending");
    assert.equal(
      isVehicleApproved(arjun, created!.id),
      false,
      "pending RC document keeps the vehicle locked",
    );

    act(() =>
      store.users.setDocumentStatus(rcDoc!.id, "approved"),
    );
    arjun = store.users.users.find((u) => u.id === "driver-arjun")!;
    assert.equal(
      isVehicleApproved(arjun, created!.id),
      true,
      "attested RC unlocks the vehicle for trips",
    );
    assert.equal(
      arjun.driverVerification,
      "pending",
      "outstanding documents keep the driver unreviewed",
    );

    const remainingIds = arjun.documents!
      .filter((d) => d.id !== rcDoc!.id && d.status !== "approved")
      .map((d) => d.id);
    remainingIds.forEach((docId) =>
      act(() => store.users.setDocumentStatus(docId, "approved")),
    );
    arjun = store.users.users.find((u) => u.id === "driver-arjun")!;
    assert.equal(arjun.driverVerification, "approved", "all docs attested unlocks account");

    act(() => store.users.removeVehicle(created!.id));
    arjun = store.users.users.find((u) => u.id === "driver-arjun")!;
    assert.ok(
      !arjun.documents!.some((d) => d.kind === "vehicle_rc" && d.vehicleId === created!.id),
      "removing a vehicle drops its RC document",
    );
    const rec = arjun.removedVehicles!.find((r) => r.vehicle.id === created!.id);
    assert.ok(rec, "removed vehicle stays archived for admin review");
    assert.equal(rec!.vehicle.vehicleNumber, "KA 09 ZZ 3333");
    assert.equal(rec!.documents[0].status, "approved", "archived RC keeps its status");
  } finally {
    unmount(root);
  }
});

test("a driver can remove their only vehicle and it stays archived", () => {
  const root = mountApp();
  try {
    login("lakshmi@kapes.in", PASSWORD);
    const lakshmi = () => store.users.users.find((u) => u.id === "driver-lakshmi")!;
    assert.equal(lakshmi().vehicles!.length, 1, "seed lakshmi has one vehicle");
    act(() => store.users.removeVehicle(lakshmi().vehicles![0].id));
    const updated = lakshmi();
    assert.equal(updated.vehicles!.length, 0, "last vehicle can be removed");
    assert.equal(updated.removedVehicles!.length, 1, "removal history preserved");
  } finally {
    unmount(root);
  }
});

test("transit issues can be reported and resolved", () => {
  const root = mountApp();
  try {
    login("asha@kapes.in", PASSWORD);
    const issue = store.reports.reportTransitIssue({
      bookingId: "booking-1",
      tripId: "seed-3",
      origin: "Bengaluru",
      destination: "Chennai",
      reporterId: "customer-asha",
      reporterName: "Asha Nair",
      reporterRole: "customer",
      category: "delay",
      message: "Driver is 3 hours late for pickup.",
    });
    assert.ok(issue, "issue created with message");
    assert.equal(store.reports.issues[0].status, "open");
    store.reports.resolveTransitIssue(issue!.id);
    assert.equal(
      store.reports.issues.find((i) => i.id === issue!.id)!.status,
      "resolved",
      "open issue marked resolved",
    );
    assert.ok(store.reports.issues.find((i) => i.id === issue!.id)!.resolvedAt);
  } finally {
    unmount(root);
  }
});

test("bug reports can be filed and their status triaged", () => {
  const root = mountApp();
  try {
    login("rahul@kapes.in", PASSWORD);
    const bug = store.reports.reportBug({
      title: "Search crashes on empty query",
      description: "Typing spaces only in the search bar throws an error.",
      category: "ui",
      severity: "high",
      reporterId: "customer-rahul",
      reporterName: "Rahul Verma",
    });
    assert.ok(bug, "bug report saved");
    assert.equal(store.reports.bugs[0].status, "open");
    store.reports.updateBugStatus(bug!.id, "in_progress");
    assert.equal(
      store.reports.bugs.find((b) => b.id === bug!.id)!.status,
      "in_progress",
    );
    store.reports.updateBugStatus(bug!.id, "fixed");
    assert.equal(store.reports.bugs.find((b) => b.id === bug!.id)!.status, "fixed");
  } finally {
    unmount(root);
  }
});