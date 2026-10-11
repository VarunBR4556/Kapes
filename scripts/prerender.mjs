import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// @supabase/supabase-js throws at import time on Node builds that lack a
// global WebSocket. The stores only use it inside effects (which never run
// during server rendering), so a stub is enough to get past the import.
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class WebSocketStub {};
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = path.join(root, "dist", "index.html");
const clientEntry = path.join(root, "dist-server", "entry-server.js");

const { render } = await import(clientEntry);

const route = "/";
const template = await readFile(templatePath, "utf8");
const marker = '<div id="root"></div>';

if (!template.includes(marker)) {
  throw new Error(`prerender: could not find "${marker}" in ${templatePath}`);
}

const html = render(route);
await writeFile(templatePath, template.replace(marker, `<div id="root">${html}</div>`), "utf8");
console.log(`prerender: ${route} -> ${html.length} bytes of markup`);
