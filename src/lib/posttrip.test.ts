import { test, before } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { create, act, type ReactTestRenderer } from "react-test-renderer";
import { MemoryRouter } from "react-router-dom";
import { UsersProvider, useUsers } from "@/lib/users-store";
import { AuthProvider } from "@/lib/auth-context";
import { TripsProvider, useTrips } from "@/lib/trips-store";
import { BookingsProvider } from "@/lib/bookings-store";
import { ReportsProvider } from "@/lib/reports-store";
import PostTripForm from "@/components/driver/PostTripForm";

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
  Object.assign(globalThis, {
    localStorage: new MemoryStorage(),
    document: {
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  });
});

type Store = {
  users: ReturnType<typeof useUsers>;
  trips: ReturnType<typeof useTrips>;
};

let store: Store;

const Probe = () => {
  store = { users: useUsers(), trips: useTrips() };
  return null;
};

function mountApp(): ReactTestRenderer {
  localStorage.clear();
  return create(
    React.createElement(AuthProvider, null,
      React.createElement(UsersProvider, null,
      React.createElement(TripsProvider, null,
        React.createElement(BookingsProvider, null,
          React.createElement(ReportsProvider, null,
            React.createElement(MemoryRouter, null,
              React.createElement(Probe),
              React.createElement(PostTripForm))))))),
  );
}

test("posting an empty trip form shows the fill-all-fields warning", async () => {
  const root = mountApp();
  try {
    act(() => {
      store.users.login("ravi@kapes.in", PASSWORD);
    });

    const form = root.root.findByType("form");
    const event = { preventDefault() {} } as unknown as React.SyntheticEvent;
    const tripsBefore = store.trips.myTrips.length;

    act(() => {
      (form.props as { onSubmit: (e: React.SyntheticEvent) => void }).onSubmit(event);
    });
    await new Promise((r) => setTimeout(r, 30));

    const text = JSON.stringify(root.toJSON());
    assert.match(text, /Fill all the fields to post your trip/);
    assert.match(text, /Origin/);
    assert.match(text, /Destination/);
    assert.match(text, /Price per kg/);
    assert.equal(store.trips.myTrips.length, tripsBefore, "empty form must not post a trip");
  } finally {
    root.unmount();
  }
});