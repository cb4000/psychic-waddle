// server.js
// Minimal Express app with in-memory APM, static hosting, cookie (no-deps) user extraction,
// two tracked proxies, and "fail-open" recordEvent.

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 3000;

// ---- In-memory "APM" store (global) ----
const APM = {
  logins: 0,                              // total login events
  buttonPresses: Object.create(null),     // counts by buttonId
  routeHits: Object.create(null),         // counts by method+path
  proxyHits: { service1: 0, service2: 0}, // counts per proxy
  recentEvents: [],                       // last N events
  maxRecent: 200,                         // cap
};

// ---- Safe, silent event recorder ----
function recordEvent(evt) {
  try {
    const rec =
      evt && typeof evt === "object"
        ? { ...evt, ts: Date.now() }
        : { msg: String(evt), ts: Date.now() };

    if (!APM || !Array.isArray(APM.recentEvents)) return;

    APM.recentEvents.push(rec);

    const cap = Number.isFinite(APM.maxRecent) && APM.maxRecent > 0 ? APM.maxRecent : 200;
    if (APM.recentEvents.length > cap) {
      APM.recentEvents.splice(0, APM.recentEvents.length - cap);
    }
  } catch (_) {
    // swallow all telemetry errors
  }
}

// ---- Minimal cookie parsing (no external parser) ----
function getCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  const out = Object.create(null);
  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const k = pair.slice(0, idx).trim();
    let v = pair.slice(idx + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    try { v = decodeURIComponent(v); } catch {}
    out[k] = v;
  }
  return out;
}

// ---- Core middleware ----
app.use(express.json());

// Attach req.username for convenience (from cookie "username")
app.use((req, _res, next) => {
  const cookies = getCookies(req);
  req.username = cookies.username || "anonymous";
  next();
});

// Count every request (method + path)
app.use((req, _res, next) => {
  const key = `${req.method} ${req.path}`;
  APM.routeHits[key] = (APM.routeHits[key] || 0) + 1;
  next();
});

// ---- Static files ----
app.use(express.static("public")); // serve ./public

// ---- APM endpoints ----

// Track a login event (front-end sets the cookie; this logs who called)
app.post("/apm/login", (req, res) => {
  APM.logins += 1;
  recordEvent({ type: "login", user: req.username, body: req.body || null });
  res.json({ ok: true, user: req.username, logins: APM.logins });
});

// Track a button press
app.post("/apm/button", (req, res) => {
  const id = (req.body && req.body.buttonId) || "unknown";
  APM.buttonPresses[id] = (APM.buttonPresses[id] || 0) + 1;
  recordEvent({ type: "button", buttonId: id, user: req.username });
  res.json({ ok: true, user: req.username, buttonId: id, count: APM.buttonPresses[id] });
});

// Metrics view
app.get("/apm/metrics", (_req, res) => {
  res.json({
    logins: APM.logins,
    buttonPresses: APM.buttonPresses,
    routeHits: APM.routeHits,
    proxyHits: APM.proxyHits,
    recentEvents: APM.recentEvents,
  });
});

// Reset (handy during testing)
app.post("/apm/reset", (_req, res) => {
  APM.logins = 0;
  APM.buttonPresses = Object.create(null);
  APM.routeHits = Object.create(null);
  APM.proxyHits = { service1: 0, service2: 0 };
  APM.recentEvents = [];
  res.json({ ok: true });
});

// ---- Proxies (with backend hit tracking) ----
const SERVICE1_TARGET = process.env.SERVICE1_URL || "https://httpbin.org";
const SERVICE2_TARGET = process.env.SERVICE2_URL || "https://httpbin.org";

const trackProxy = (label) => (req, _res, next) => {
  APM.proxyHits[label] = (APM.proxyHits[label] || 0) + 1;
  recordEvent({ type: "proxyHit", label, user: req.username, path: req.originalUrl, method: req.method });
  next();
};

app.use(
  "/proxy/service1",
  trackProxy("service1"),
  createProxyMiddleware({
    target: SERVICE1_TARGET,
    changeOrigin: true,
    pathRewrite: { "^/proxy/service1": "" },
    onProxyReq(proxyReq, req) {
      // forward username to upstream for correlation
      proxyReq.setHeader("X-User", req.username || "anonymous");
    },
  })
);

app.use(
  "/proxy/service2",
  trackProxy("service2"),
  createProxyMiddleware({
    target: SERVICE2_TARGET,
    changeOrigin: true,
    pathRewrite: { "^/proxy/service2": "" },
    onProxyReq(proxyReq, req) {
      proxyReq.setHeader("X-User", req.username || "anonymous");
    },
  })
);

// ---- Start server ----
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Proxy /proxy/service1 -> ${SERVICE1_TARGET}`);
  console.log(`Proxy /proxy/service2 -> ${SERVICE2_TARGET}`);
});
