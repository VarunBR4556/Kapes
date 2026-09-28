// Injected into the esbuild test bundles only (see package.json test scripts).
//
// Two problems are solved here:
//  1. supabase-js aborts at import time when it detects Node 20 without a global
//     WebSocket, so an inert stub keeps the bundle loadable.
//  2. Those suites render the real provider tree, so the DOM APIs supabase-js and
//     the app touch need to exist. Every one of them is a no-op: these suites
//     assert on pure logic and component wiring, never on a live backend.
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class WebSocketStub {
    constructor() {
      this.readyState = 0;
    }
    send() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    removeAllListeners() {}
  };
}

const noop = () => {};
const fakeElement = () => ({
  style: {},
  setAttribute: noop,
  getAttribute: () => null,
  removeAttribute: noop,
  appendChild: noop,
  removeChild: noop,
  addEventListener: noop,
  removeEventListener: noop,
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementsByTagName: () => [],
  textContent: "",
  innerHTML: "",
  dataset: {},
});

if (typeof globalThis.document === "undefined") {
  globalThis.document = {
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: noop,
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementsByTagName: () => [],
    getElementById: () => null,
    createElement: fakeElement,
    createElementNS: () => fakeElement(),
    createTextNode: () => ({}),
    head: fakeElement(),
    body: fakeElement(),
    documentElement: fakeElement(),
    cookie: "",
    visibilityState: "visible",
    hidden: false,
    readyState: "complete",
  };
}

if (typeof globalThis.window === "undefined") {
  globalThis.window = globalThis;
}
if (typeof globalThis.window.addEventListener !== "function") {
  globalThis.window.addEventListener = noop;
  globalThis.window.removeEventListener = noop;
  globalThis.window.dispatchEvent = noop;
  globalThis.window.matchMedia =
    globalThis.window.matchMedia ||
    (() => ({ matches: false, addEventListener: noop, removeEventListener: noop }));
  globalThis.window.getComputedStyle = () => ({ getPropertyValue: () => "" });
  globalThis.window.localStorage = globalThis.localStorage;
}
if (typeof globalThis.location === "undefined") {
  globalThis.location = { href: "http://localhost/", origin: "http://localhost", pathname: "/" };
}
if (typeof globalThis.navigator === "undefined") {
  globalThis.navigator = { userAgent: "node", language: "en-GB" };
}

// Never let a component effect reach the network from a test bundle.
if (typeof globalThis.fetch === "function") {
  globalThis.fetch = () =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
      text: () => Promise.resolve("[]"),
      headers: { get: () => null },
    });
}
