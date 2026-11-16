"use strict";
/*
 * Srok Srae (ស្រុកស្រែ) - a small social farming game server.
 * Zero dependencies: only Node.js built-ins (Node 18+).
 *
 *   node server.js                       -> http://localhost:3000
 *   PORT=8080 node server.js
 *   GROWTH_SPEED=0.1 node server.js      (crops/animals 10x faster, for testing)
 *   FORCE_EVENT=water_festival node server.js   (turn an event on, for testing)
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const SPEED = Number(process.env.GROWTH_SPEED || 1);
const TRUST_PROXY =
  process.env.TRUST_PROXY === "1" || Boolean(process.env.VERCEL);
const FORCE_EVENTS = (process.env.FORCE_EVENT || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
);

function resolveDataFilePath() {
  if (process.env.DATA_FILE) return process.env.DATA_FILE;
  if (isServerless) {
    return path.join("/tmp", "srok-srae-data", "db.json");
  }
  return path.join(__dirname, "data", "db.json");
}

let DATA_FILE = resolveDataFilePath();
const PUBLIC_DIR = path.join(__dirname, "public");
const EVENTS_FILE = path.join(__dirname, "events.json");

/* ------------------------------------------------------------------ */
/* Game configuration (sent to the client via /api/config)             */
/* ------------------------------------------------------------------ */
const PLOT_START = 12;
const START_RIEL = 50;
const YARD_SLOTS = 12;
const PEN_CAP = 6;

const CROPS = {
  morning_glory: {
    id: "morning_glory",
    emoji: "🥬",
    seed: 3,
    sell: 7,
    time: 30000,
    xp: 2,
    level: 1,
  },
  rice: {
    id: "rice",
    emoji: "🌾",
    seed: 5,
    sell: 12,
    time: 45000,
    xp: 3,
    level: 1,
  },
  lotus: {
    id: "lotus",
    emoji: "🪷",
    seed: 12,
    sell: 30,
    time: 90000,
    xp: 6,
    level: 2,
  },
  mango: {
    id: "mango",
    emoji: "🥭",
    seed: 25,
    sell: 70,
    time: 150000,
    xp: 12,
    level: 3,
  },
};

const FISH = {
  riel: { id: "riel", emoji: "🐟", sell: 8, weight: 60 },
  snakehead: { id: "snakehead", emoji: "🐠", sell: 20, weight: 30 },
  catfish: { id: "catfish", emoji: "🐡", sell: 50, weight: 10 },
};

// Farm shop
const SHOP = {
  land: [
    // each step adds 4 plots
    { plots: 16, price: 150, level: 2 },
    { plots: 20, price: 400, level: 3 },
    { plots: 24, price: 900, level: 4 },
  ],
  fertPrice: 15,
  canSave: [0.2, 0.3, 0.4], // share of remaining time saved by watering, per can level
  canUpgrades: [
    { price: 200, level: 2 },
    { price: 600, level: 4 },
  ], // to reach can level 2 and 3
};

// Decorations for the village yard
const DECOR = {
  flower: {
    id: "flower",
    emoji: "🌺",
    price: 20,
    level: 1,
    name: { km: "ផ្កា", en: "Flowers" },
  },
  palm: {
    id: "palm",
    emoji: "🌴",
    price: 40,
    level: 1,
    name: { km: "ដើមត្នោត", en: "Palm tree" },
  },
  lantern: {
    id: "lantern",
    emoji: "🏮",
    price: 35,
    level: 1,
    name: { km: "ចង្កៀង", en: "Lantern" },
  },
  bicycle: {
    id: "bicycle",
    emoji: "🚲",
    price: 60,
    level: 2,
    name: { km: "កង់", en: "Bicycle" },
  },
  pond: {
    id: "pond",
    emoji: "🪷",
    price: 90,
    level: 2,
    name: { km: "ស្រះឈូក", en: "Lotus pond" },
  },
  house: {
    id: "house",
    emoji: "🏠",
    price: 120,
    level: 2,
    name: { km: "ផ្ទះ", en: "House" },
  },
  tuktuk: {
    id: "tuktuk",
    emoji: "🛺",
    price: 150,
    level: 3,
    name: { km: "តុកតុក", en: "Tuk-tuk" },
  },
  fountain: {
    id: "fountain",
    emoji: "⛲",
    price: 180,
    level: 3,
    name: { km: "ប្រភពទឹក", en: "Fountain" },
  },
  bridge: {
    id: "bridge",
    emoji: "🌉",
    price: 200,
    level: 3,
    name: { km: "ស្ពាន", en: "Bridge" },
  },
  elephant: {
    id: "elephant",
    emoji: "🐘",
    price: 300,
    level: 4,
    name: { km: "ដំរី", en: "Elephant statue" },
  },
  pagoda: {
    id: "pagoda",
    emoji: "🛕",
    price: 400,
    level: 4,
    name: { km: "វត្ត", en: "Pagoda" },
  },
  // event-only (id must be listed in an event's "items" in events.json)
  sand_mound: {
    id: "sand_mound",
    emoji: "⛰️",
    price: 80,
    level: 1,
    event: true,
    name: { km: "ភ្នំខ្សាច់", en: "Sand mound" },
  },
  plough_ox: {
    id: "plough_ox",
    emoji: "🐂",
    price: 80,
    level: 1,
    event: true,
    name: { km: "គោភ្ជួរស្រែ", en: "Plough ox" },
  },
  candle: {
    id: "candle",
    emoji: "🕯️",
    price: 60,
    level: 1,
    event: true,
    name: { km: "ទៀន", en: "Candle" },
  },
  racing_boat: {
    id: "racing_boat",
    emoji: "🛶",
    price: 120,
    level: 1,
    event: true,
    name: { km: "ទូកអុំ", en: "Racing boat" },
  },
  moon: {
    id: "moon",
    emoji: "🌕",
    price: 70,
    level: 1,
    event: true,
    name: { km: "ព្រះចន្ទ", en: "Full moon" },
  },
};

// Animals: feed them, wait, collect the product
const PRODUCTS = {
  egg: {
    id: "egg",
    emoji: "🥚",
    sell: 9,
    name: { km: "ពងមាន់", en: "Chicken egg" },
  },
  duck_egg: {
    id: "duck_egg",
    emoji: "🥚",
    sell: 16,
    name: { km: "ពងទា", en: "Duck egg" },
  },
  milk: {
    id: "milk",
    emoji: "🥛",
    sell: 60,
    name: { km: "ទឹកដោះក្របី", en: "Buffalo milk" },
  },
  manure: {
    id: "manure",
    emoji: "🌿",
    sell: 0,
    fertilizer: true,
    name: { km: "ជី", en: "Fertilizer" },
  },
};

const ANIMALS = {
  chicken: {
    id: "chicken",
    emoji: "🐔",
    price: 40,
    level: 2,
    feed: 2,
    time: 60000,
    product: "egg",
    name: { km: "មាន់", en: "Chicken" },
  },
  duck: {
    id: "duck",
    emoji: "🦆",
    price: 70,
    level: 2,
    feed: 3,
    time: 90000,
    product: "duck_egg",
    name: { km: "ទា", en: "Duck" },
  },
  pig: {
    id: "pig",
    emoji: "🐖",
    price: 150,
    level: 3,
    feed: 6,
    time: 120000,
    product: "manure",
    name: { km: "ជ្រូក", en: "Pig" },
  },
  buffalo: {
    id: "buffalo",
    emoji: "🐃",
    price: 300,
    level: 4,
    feed: 10,
    time: 180000,
    product: "milk",
    name: { km: "ក្របី", en: "Buffalo" },
  },
};

const FISH_MIN_DELAY = 2000;
const FISH_MAX_DELAY = 6000;
const FISH_WINDOW = 1500;
const FISH_LATENCY_SLACK = 400;

const LOOK_LIMITS = { skin: 5, hair: 6, outfit: 6 };
const levelFor = (xp) =>
  Math.floor(Math.sqrt((typeof xp === "number" && xp > 0 ? xp : 0) / 25)) + 1;

/* ------------------------------------------------------------------ */
/* Events (loaded from events.json)                                    */
/* ------------------------------------------------------------------ */
let EVENTS = [];
try {
  EVENTS = JSON.parse(fs.readFileSync(EVENTS_FILE, "utf8")).events || [];
} catch (e) {
  console.error(
    "Could not read events.json, running without events:",
    e.message,
  );
}

const khDate = (ms) =>
  new Date(ms + 7 * 3600 * 1000).toISOString().slice(0, 10); // YYYY-MM-DD in Cambodia
const dayStart = (d) => Date.parse(d + "T00:00:00+07:00");
const dayEnd = (d) => Date.parse(d + "T23:59:59.999+07:00");

function eventWindows(ev, now) {
  const out = (ev.windows || []).map(([start, end]) => ({ start, end }));
  if (ev.yearly) {
    const y = Number(khDate(now).slice(0, 4));
    for (const yr of [y, y + 1])
      out.push({
        start: `${yr}-${ev.yearly[0]}`,
        end: `${yr}-${ev.yearly[1]}`,
      });
  }
  return out;
}

function eventStatus(ev, now) {
  const today = khDate(now);
  let active = null,
    next = null;
  for (const w of eventWindows(ev, now)) {
    if (today >= w.start && today <= w.end) active = w;
    else if (w.start > today && (!next || w.start < next.start)) next = w;
  }
  if (!active && FORCE_EVENTS.includes(ev.id))
    active = { start: today, end: today };
  return { active, next };
}

const activeEvents = (now) =>
  EVENTS.filter((ev) => eventStatus(ev, now).active);

function bonuses(now) {
  const b = { sell: 0, growth: 1, fishLuck: 1 };
  for (const ev of activeEvents(now)) {
    b.sell += ev.sellBonus || 0;
    b.growth *= ev.growth || 1;
    b.fishLuck = Math.max(b.fishLuck, ev.fishLuck || 1);
  }
  return b;
}

function eventItemAvailable(id, now) {
  return activeEvents(now).some((ev) => (ev.items || []).includes(id));
}

/* ------------------------------------------------------------------ */
/* Tiny JSON "database" with validation and atomic saves               */
/* ------------------------------------------------------------------ */
let db = { users: {}, sessions: {}, chatSeq: 0, chat: [] };
let dbMtime = 0;

function ensureUser(u) {
  if (!u || typeof u !== "object") return null;
  u.username = String(u.username || "").toLowerCase();
  u.name = cleanText(u.name, 16) || u.username;

  if (!u.look || typeof u.look !== "object" || Array.isArray(u.look)) {
    u.look = { skin: 0, hair: 0, outfit: 0 };
  }
  for (const k of Object.keys(LOOK_LIMITS)) {
    const v = Number(u.look[k]);
    u.look[k] = Number.isInteger(v) && v >= 0 && v < LOOK_LIMITS[k] ? v : 0;
  }

  u.salt = String(u.salt || "");
  u.hash = String(u.hash || "");
  u.riel =
    typeof u.riel === "number" && Number.isFinite(u.riel) && u.riel >= 0
      ? Math.min(100000000, Math.floor(u.riel))
      : START_RIEL;
  u.xp =
    typeof u.xp === "number" && Number.isFinite(u.xp) && u.xp >= 0
      ? Math.min(10000000, Math.floor(u.xp))
      : 0;
  u.fert =
    typeof u.fert === "number" && Number.isFinite(u.fert) && u.fert >= 0
      ? Math.min(999, Math.floor(u.fert))
      : 0;
  u.canLevel =
    typeof u.canLevel === "number" && u.canLevel >= 1 && u.canLevel <= 3
      ? Math.floor(u.canLevel)
      : 1;

  if (!Array.isArray(u.plots)) u.plots = [];
  while (u.plots.length < PLOT_START) u.plots.push(null);
  if (u.plots.length > 24) u.plots = u.plots.slice(0, 24);
  u.plots = u.plots.map((p) => {
    if (!p || typeof p !== "object" || !CROPS[p.crop]) return null;
    return {
      crop: p.crop,
      plantedAt: Number(p.plantedAt) || Date.now(),
      readyAt: Number(p.readyAt) || Date.now(),
      watered: Boolean(p.watered),
      fert: Boolean(p.fert),
    };
  });

  if (!u.inv || typeof u.inv !== "object" || Array.isArray(u.inv)) u.inv = {};
  if (!u.inv.crops || typeof u.inv.crops !== "object") u.inv.crops = {};
  if (!u.inv.fish || typeof u.inv.fish !== "object") u.inv.fish = {};
  if (!u.inv.products || typeof u.inv.products !== "object")
    u.inv.products = {};

  for (const cat of ["crops", "fish", "products"]) {
    for (const [id, count] of Object.entries(u.inv[cat])) {
      if (typeof count !== "number" || count <= 0 || !Number.isFinite(count)) {
        delete u.inv[cat][id];
      } else {
        u.inv[cat][id] = Math.min(9999, Math.floor(count));
      }
    }
  }

  if (!u.decor || typeof u.decor !== "object" || Array.isArray(u.decor)) {
    u.decor = { owned: {}, placed: [] };
  }
  if (!u.decor.owned || typeof u.decor.owned !== "object") u.decor.owned = {};
  for (const [id, count] of Object.entries(u.decor.owned)) {
    if (
      typeof count !== "number" ||
      count <= 0 ||
      !Number.isFinite(count) ||
      !DECOR[id]
    ) {
      delete u.decor.owned[id];
    } else {
      u.decor.owned[id] = Math.min(999, Math.floor(count));
    }
  }
  if (!Array.isArray(u.decor.placed)) u.decor.placed = [];
  while (u.decor.placed.length < YARD_SLOTS) u.decor.placed.push(null);
  u.decor.placed = u.decor.placed
    .slice(0, YARD_SLOTS)
    .map((d) => (d && DECOR[d] ? d : null));

  if (!Array.isArray(u.animals)) u.animals = [];
  u.animals = u.animals
    .filter((a) => a && typeof a === "object" && ANIMALS[a.type])
    .slice(0, PEN_CAP)
    .map((a) => ({
      type: a.type,
      readyAt: a.readyAt === null ? null : Number(a.readyAt) || null,
    }));

  if (!u.gifts || typeof u.gifts !== "object" || Array.isArray(u.gifts))
    u.gifts = {};
  if (!Array.isArray(u.friends)) u.friends = [];
  u.friends = Array.from(
    new Set(
      u.friends.filter(
        (f) => typeof f === "string" && /^[a-z0-9_]{3,16}$/.test(f),
      ),
    ),
  ).slice(0, 100);

  if (
    u.fish &&
    (typeof u.fish !== "object" || typeof u.fish.biteAt !== "number")
  ) {
    u.fish = null;
  }

  u.lastSeen = Number(u.lastSeen) || Date.now();
  u.lastChat = Number(u.lastChat) || 0;
  u.created = Number(u.created) || Date.now();
  u.updatedAt = Number(u.updatedAt) || u.lastSeen || Date.now();

  return u;
}

function pruneOldSessions() {
  const cutoff = Date.now() - 30 * 24 * 3600 * 1000; // 30 days
  for (const [token, s] of Object.entries(db.sessions)) {
    if (!s || !s.created || s.created < cutoff) {
      delete db.sessions[token];
    }
  }
}

function loadDb() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf8");
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === "object") {
          db.users =
            parsed.users && typeof parsed.users === "object"
              ? parsed.users
              : {};
          db.sessions =
            parsed.sessions && typeof parsed.sessions === "object"
              ? parsed.sessions
              : {};
          db.chat = Array.isArray(parsed.chat) ? parsed.chat : [];
          db.chatSeq = Number.isInteger(parsed.chatSeq) ? parsed.chatSeq : 0;
          Object.values(db.users).forEach(ensureUser);
          pruneOldSessions();
        }
      }
      try {
        dbMtime = fs.statSync(DATA_FILE).mtimeMs;
      } catch {
        dbMtime = Date.now();
      }
    } else {
      // Seed file from data/db.json if running in /tmp (Vercel) and not yet initialized
      const seedFile = path.join(__dirname, "data", "db.json");
      if (DATA_FILE !== seedFile && fs.existsSync(seedFile)) {
        try {
          const content = fs.readFileSync(seedFile, "utf8");
          if (content.trim()) {
            const parsed = JSON.parse(content);
            if (parsed && typeof parsed === "object") {
              db.users = parsed.users || {};
              db.sessions = parsed.sessions || {};
              db.chat = Array.isArray(parsed.chat) ? parsed.chat : [];
              db.chatSeq = parsed.chatSeq || 0;
              Object.values(db.users).forEach(ensureUser);
            }
          }
        } catch {
          /* ignore corrupt seed */
        }
      }
      saveNow();
    }
  } catch (e) {
    console.error("Could not read database, starting safely:", e.message);
    if (fs.existsSync(DATA_FILE)) {
      try {
        const backup = DATA_FILE + ".corrupt." + Date.now();
        fs.copyFileSync(DATA_FILE, backup);
        console.warn(`Corrupted database backed up to ${backup}`);
      } catch {}
    }
  }
}

function maybeReloadDb() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const stat = fs.statSync(DATA_FILE);
      if (stat.mtimeMs > dbMtime) {
        loadDb();
      }
    }
  } catch {}
}

let saveTimer = null;
function saveSoon() {
  if (isServerless) {
    saveNow();
    return;
  }
  if (saveTimer) return;
  saveTimer = setTimeout(saveNow, 250);
}

function saveNow() {
  clearTimeout(saveTimer);
  saveTimer = null;
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmp = DATA_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
    fs.renameSync(tmp, DATA_FILE);
    try {
      dbMtime = fs.statSync(DATA_FILE).mtimeMs;
    } catch {
      dbMtime = Date.now();
    }
  } catch (e) {
    console.error("Save failed:", e.message);
    if (
      (e.code === "EROFS" || e.code === "EACCES") &&
      !DATA_FILE.startsWith("/tmp")
    ) {
      const fallback = path.join("/tmp", "srok-srae-data", "db.json");
      console.warn(`Filesystem read-only. Switching DATA_FILE to ${fallback}`);
      DATA_FILE = fallback;
      saveNow();
    }
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "same-origin",
  "Content-Security-Policy":
    "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'",
};

function send(res, code, obj) {
  if (isServerless) {
    // Flush any pending write immediately before serverless response freeze
    saveNow();
  }
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...SECURITY_HEADERS,
  });
  res.end(JSON.stringify(obj));
}
const fail = (res, code, error) => send(res, code, { error });

function readJson(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "object" && !Array.isArray(req.body)) {
      return Promise.resolve(req.body);
    }
    if (typeof req.body === "string") {
      try {
        const parsed = JSON.parse(req.body);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return Promise.resolve(parsed);
        }
        return Promise.reject(
          Object.assign(new Error("bad_json"), { status: 400 }),
        );
      } catch {
        return Promise.reject(
          Object.assign(new Error("bad_json"), { status: 400 }),
        );
      }
    }
  }

  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > 10 * 1024) {
        reject(Object.assign(new Error("too_large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try {
        const raw = Buffer.concat(chunks).toString("utf8").trim();
        if (!raw) return resolve({});
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          return reject(Object.assign(new Error("bad_json"), { status: 400 }));
        }
        resolve(parsed);
      } catch {
        reject(Object.assign(new Error("bad_json"), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function clientIp(req) {
  if (TRUST_PROXY) {
    const xf = req.headers["x-forwarded-for"];
    if (xf) return String(xf).split(",")[0].trim();
    const realIp = req.headers["x-real-ip"];
    if (realIp) return String(realIp).trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

const hits = new Map();
function rateLimited(key, max, windowMs) {
  const now = Date.now();
  let h = hits.get(key);
  if (!h || now > h.reset) {
    h = { count: 0, reset: now + windowMs };
    hits.set(key, h);
  }
  h.count += 1;
  return h.count > max;
}
setInterval(() => {
  const n = Date.now();
  for (const [k, v] of hits) if (n > v.reset) hits.delete(k);
}, 60000).unref();

function scrypt(password, salt) {
  return new Promise((resolve, reject) =>
    crypto.scrypt(password, salt, 32, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

function cleanText(s, max) {
  if (typeof s !== "string") return "";
  return s
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function newUser(username, name, look, salt, hash) {
  return ensureUser({
    username,
    name,
    look,
    salt: salt.toString("hex"),
    hash: hash.toString("hex"),
    riel: START_RIEL,
    xp: 0,
    plots: [],
    inv: { crops: {}, fish: {}, products: {} },
    friends: [],
    fish: null,
    lastSeen: Date.now(),
    lastChat: 0,
    created: Date.now(),
    updatedAt: Date.now(),
  });
}

const TOKEN_SECRET =
  process.env.SESSION_SECRET ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  "srok-srae-session-secret-2025";

function signState(u) {
  const obj = {
    username: u.username,
    name: u.name,
    look: u.look,
    riel: u.riel,
    xp: u.xp,
    canLevel: u.canLevel,
    fert: u.fert,
    plots: u.plots,
    inv: u.inv,
    decor: u.decor,
    animals: u.animals,
    friends: u.friends || [],
    gifts: u.gifts || {},
    salt: u.salt,
    hash: u.hash,
    updatedAt: u.updatedAt || Date.now(),
  };
  const json = JSON.stringify(obj);
  const payload = Buffer.from(json, "utf8").toString("base64");
  const sig = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("hex");
  return { payload, sig, updatedAt: obj.updatedAt };
}

function verifyState(payloadB64, sig) {
  if (typeof payloadB64 !== "string" || typeof sig !== "string") return null;
  const expectedSig = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payloadB64)
    .digest("hex");
  if (
    sig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
  ) {
    return null;
  }
  try {
    const json = Buffer.from(payloadB64, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function view(u, now = Date.now()) {
  if (!u.updatedAt) u.updatedAt = now;
  const stateEnv = signState(u);
  return {
    username: u.username,
    name: u.name,
    look: u.look,
    riel: u.riel,
    xp: u.xp,
    level: levelFor(u.xp),
    plots: u.plots,
    inv: u.inv,
    fert: u.fert,
    canLevel: u.canLevel,
    decor: u.decor,
    animals: u.animals,
    friends: u.friends || [],
    gifts: u.gifts || {},
    updatedAt: u.updatedAt,
    _state: stateEnv,
    serverNow: now,
  };
}

function createSessionToken(username) {
  const nonce = crypto.randomBytes(16).toString("hex");
  const now = Date.now();
  const payload = `${nonce}.${username}.${now}`;
  const sig = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 32);
  const token = `${payload}.${sig}`;
  db.sessions[token] = { username, created: now };
  return token;
}

function authUser(req) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!token || typeof token !== "string") return null;
  let s = db.sessions[token];
  if (!s) {
    // Attempt stateless session verification if token is signed
    const parts = token.split(".");
    if (parts.length === 4) {
      const [nonce, username, timestampStr, sig] = parts;
      const created = Number(timestampStr);
      const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
      if (Number.isFinite(created) && created > cutoff) {
        const payload = `${nonce}.${username}.${created}`;
        const expectedSig = crypto
          .createHmac("sha256", TOKEN_SECRET)
          .update(payload)
          .digest("hex")
          .slice(0, 32);
        if (
          sig.length === expectedSig.length &&
          crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
        ) {
          s = { username, created };
          db.sessions[token] = s;
        }
      }
    }
  }
  if (!s || typeof s !== "object" || s.revoked || !s.username) return null;
  maybeReloadDb();

  // Cross-container cryptographic state sync
  const statePayload = req.headers["x-srok-state"];
  const stateSig = req.headers["x-srok-sig"];
  if (typeof statePayload === "string" && typeof stateSig === "string") {
    const verified = verifyState(statePayload, stateSig);
    if (verified && verified.username === s.username) {
      const current = db.users[s.username];
      const verifiedAt = Number(verified.updatedAt) || 0;
      const currentAt = Number(
        current ? current.updatedAt || current.lastSeen || 0 : 0,
      );
      if (!current || verifiedAt > currentAt) {
        db.users[s.username] = ensureUser(verified);
        saveNow();
      }
    }
  }

  const u = db.users[s.username];
  if (!u) return null;
  u.lastSeen = Date.now();
  return u;
}

const isInt = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;

function placedCount(u, id, exceptSlot = -1) {
  if (!u.decor || !Array.isArray(u.decor.placed)) return 0;
  return u.decor.placed.reduce(
    (n, x, i) => n + (x === id && i !== exceptSlot ? 1 : 0),
    0,
  );
}

function eventsView(u, now) {
  const today = khDate(now);
  const gifts = u && u.gifts && typeof u.gifts === "object" ? u.gifts : {};
  return EVENTS.map((ev) => {
    const { active, next } = eventStatus(ev, now);
    const w = active || next;
    return {
      id: ev.id,
      emoji: ev.emoji,
      name: ev.name,
      desc: ev.desc,
      sellBonus: ev.sellBonus || 0,
      growth: ev.growth || 1,
      fishLuck: ev.fishLuck || 1,
      giftRiel: ev.giftRiel || 0,
      items: ev.items || [],
      active: !!active,
      claimed: gifts[ev.id] === today,
      startsAt: w ? dayStart(w.start) : null,
      endsAt: w ? dayEnd(w.end) : null,
    };
  }).sort(
    (a, b) =>
      b.active - a.active ||
      (a.startsAt ?? Infinity) - (b.startsAt ?? Infinity),
  );
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */
async function api(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  const now = Date.now();

  if (route === "GET /api/config") {
    return send(res, 200, {
      crops: CROPS,
      fish: FISH,
      decor: DECOR,
      animals: ANIMALS,
      products: PRODUCTS,
      shop: SHOP,
      plotStart: PLOT_START,
      yardSlots: YARD_SLOTS,
      penCap: PEN_CAP,
      look: LOOK_LIMITS,
      speed: SPEED,
    });
  }

  /* ---- auth ---- */
  if (route === "POST /api/register" || route === "POST /api/login") {
    if (rateLimited("auth:" + clientIp(req), 20, 60000))
      return fail(res, 429, "rate_limited");
    const b = await readJson(req);
    const rawUsername = typeof b.username === "string" ? b.username : "";
    const username = rawUsername.toLowerCase().trim();
    const password = typeof b.password === "string" ? b.password : "";

    if (!/^[a-z0-9_]{3,16}$/.test(username))
      return fail(res, 400, "bad_username");
    if (password.length < 6 || password.length > 72)
      return fail(res, 400, "bad_password");

    if (route === "POST /api/register") {
      if (db.users[username]) return fail(res, 409, "username_taken");
      const name =
        (typeof b.name === "string" ? cleanText(b.name, 16) : "") || username;
      const lk =
        b.look && typeof b.look === "object" && !Array.isArray(b.look)
          ? b.look
          : {};
      const look = {};
      for (const k of Object.keys(LOOK_LIMITS)) {
        const v = Number(lk[k]);
        look[k] = Number.isInteger(v) && v >= 0 && v < LOOK_LIMITS[k] ? v : 0;
      }
      const salt = crypto.randomBytes(16);
      const hash = await scrypt(password, salt);
      if (db.users[username]) return fail(res, 409, "username_taken");
      db.users[username] = newUser(username, name, look, salt, hash);
      saveNow();
    }

    let u = db.users[username];

    // If user not in current container (e.g. serverless cold start), attempt verified restore from client backup
    if (route === "POST /api/login" && b.backup && typeof b.backup === "object") {
      const bk = b.backup;
      if (
        String(bk.username || "").toLowerCase().trim() === username &&
        typeof bk.salt === "string" &&
        typeof bk.hash === "string" &&
        /^[0-9a-f]{32}$/i.test(bk.salt) &&
        /^[0-9a-f]{64}$/i.test(bk.hash)
      ) {
        const uSalt = Buffer.from(bk.salt, "hex");
        const uHash = Buffer.from(bk.hash, "hex");
        const hash = await scrypt(password, uSalt);
        if (hash.length === uHash.length && crypto.timingSafeEqual(hash, uHash)) {
          // Cryptographically verified!
          if (!u) {
            u = ensureUser(bk);
            db.users[username] = u;
            saveNow();
          } else if (bk.updatedAt && bk.updatedAt > (u.lastSeen || 0)) {
            // Merge newer state if client was active on another serverless worker
            u.riel = Math.max(u.riel, Number(bk.riel) || 0);
            u.xp = Math.max(u.xp, Number(bk.xp) || 0);
            u.fert = Math.max(u.fert, Number(bk.fert) || 0);
            if (bk.canLevel && bk.canLevel > u.canLevel) u.canLevel = bk.canLevel;
            if (Array.isArray(bk.plots)) u.plots = bk.plots;
            if (bk.inv && typeof bk.inv === "object") u.inv = bk.inv;
            if (bk.decor && typeof bk.decor === "object") u.decor = bk.decor;
            if (Array.isArray(bk.animals)) u.animals = bk.animals;
            if (Array.isArray(bk.friends)) u.friends = bk.friends;
            if (bk.gifts && typeof bk.gifts === "object") u.gifts = bk.gifts;
            ensureUser(u);
            saveNow();
          }
        }
      }
    }

    if (!u) return fail(res, 401, "bad_credentials");
    if (route === "POST /api/login") {
      const uSalt = Buffer.from(u.salt, "hex");
      const uHash = Buffer.from(u.hash, "hex");
      const hash = await scrypt(password, uSalt);
      if (
        hash.length !== uHash.length ||
        !crypto.timingSafeEqual(hash, uHash)
      ) {
        return fail(res, 401, "bad_credentials");
      }
    }
    const token = createSessionToken(username);
    u.lastSeen = now;
    saveNow();
    return send(res, 200, {
      token,
      me: view(u, now),
      authVault: { salt: u.salt, hash: u.hash },
    });
  }

  /* ---- everything below needs a session ---- */
  const u = authUser(req);
  if (!u) return fail(res, 401, "not_logged_in");

  if (route === "POST /api/logout") {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
    if (token) {
      db.sessions[token] = { revoked: true, created: Date.now() };
      saveNow();
    }
    return send(res, 200, { ok: true });
  }

  if (route === "GET /api/me") return send(res, 200, view(u, now));

  /* ---- farming ---- */
  if (route === "POST /api/plant") {
    const b = await readJson(req);
    if (typeof b.crop !== "string") return fail(res, 400, "bad_crop");
    const crop = CROPS[b.crop];
    if (!crop) return fail(res, 400, "bad_crop");
    if (!isInt(b.plot, 0, u.plots.length - 1))
      return fail(res, 400, "bad_plot");
    if (u.plots[b.plot]) return fail(res, 409, "plot_busy");
    if (levelFor(u.xp) < crop.level) return fail(res, 403, "level_too_low");
    if (u.riel < crop.seed) return fail(res, 402, "not_enough_riel");
    u.riel -= crop.seed;
    const dur = Math.round(crop.time * SPEED * (bonuses(now).growth || 1));
    u.plots[b.plot] = {
      crop: crop.id,
      plantedAt: now,
      readyAt: now + dur,
      watered: false,
      fert: false,
    };
    saveNow();
    return send(res, 200, view(u, now));
  }

  if (route === "POST /api/water") {
    const b = await readJson(req);
    if (!isInt(b.plot, 0, u.plots.length - 1))
      return fail(res, 400, "bad_plot");
    const p = u.plots[b.plot];
    if (!p) return fail(res, 400, "bad_plot");
    if (p.watered) return fail(res, 409, "already_watered");
    if (now >= p.readyAt) return fail(res, 409, "already_ready");
    p.watered = true;
    const saveRate = SHOP.canSave[(u.canLevel || 1) - 1] ?? SHOP.canSave[0];
    const remaining = Math.max(0, p.readyAt - now);
    p.readyAt = now + Math.round(remaining * (1 - saveRate));
    saveNow();
    return send(res, 200, view(u, now));
  }

  if (route === "POST /api/fertilize") {
    const b = await readJson(req);
    if (!isInt(b.plot, 0, u.plots.length - 1))
      return fail(res, 400, "bad_plot");
    const p = u.plots[b.plot];
    if (!p) return fail(res, 400, "bad_plot");
    if (p.fert) return fail(res, 409, "already_fertilized");
    if (now >= p.readyAt) return fail(res, 409, "already_ready");
    if (u.fert < 1) return fail(res, 402, "no_fertilizer");
    u.fert -= 1;
    p.fert = true;
    const remaining = Math.max(0, p.readyAt - now);
    p.readyAt = now + Math.round(remaining * 0.5);
    saveNow();
    return send(res, 200, view(u, now));
  }

  if (route === "POST /api/harvest") {
    const b = await readJson(req);
    if (!isInt(b.plot, 0, u.plots.length - 1))
      return fail(res, 400, "bad_plot");
    const p = u.plots[b.plot];
    if (!p) return fail(res, 400, "bad_plot");
    if (now < p.readyAt) return fail(res, 409, "not_ready");
    const crop = CROPS[p.crop];
    if (!crop) {
      u.plots[b.plot] = null;
      saveNow();
      return fail(res, 400, "bad_crop");
    }
    u.inv.crops[crop.id] = (u.inv.crops[crop.id] || 0) + 1;
    u.xp += crop.xp || 0;
    u.plots[b.plot] = null;
    saveNow();
    return send(res, 200, view(u, now));
  }

  if (route === "POST /api/sell") {
    let base = 0;
    for (const [id, n] of Object.entries(u.inv.crops || {})) {
      if (typeof n === "number" && n > 0 && CROPS[id])
        base += CROPS[id].sell * n;
    }
    for (const [id, n] of Object.entries(u.inv.fish || {})) {
      if (typeof n === "number" && n > 0 && FISH[id]) base += FISH[id].sell * n;
    }
    for (const [id, n] of Object.entries(u.inv.products || {})) {
      if (typeof n === "number" && n > 0 && PRODUCTS[id])
        base += PRODUCTS[id].sell * n;
    }
    const bonus = bonuses(now).sell || 0;
    const total = Math.floor(base * (1 + bonus));
    u.inv = { crops: {}, fish: {}, products: {} };
    u.riel += total;
    saveNow();
    return send(res, 200, { ...view(u, now), sold: total, bonus });
  }

  /* ---- farm shop ---- */
  if (route === "POST /api/shop/land") {
    const step = SHOP.land.find((s) => s.plots > u.plots.length);
    if (!step) return fail(res, 409, "max_land");
    if (levelFor(u.xp) < step.level) return fail(res, 403, "level_too_low");
    if (u.riel < step.price) return fail(res, 402, "not_enough_riel");
    u.riel -= step.price;
    while (u.plots.length < step.plots) u.plots.push(null);
    saveNow();
    return send(res, 200, view(u, now));
  }

  if (route === "POST /api/shop/fertilizer") {
    const b = await readJson(req);
    const qty = typeof b.qty === "number" ? b.qty : Number(b.qty);
    if (!isInt(qty, 1, 20)) return fail(res, 400, "bad_qty");
    const cost = SHOP.fertPrice * qty;
    if (u.riel < cost) return fail(res, 402, "not_enough_riel");
    u.riel -= cost;
    u.fert += qty;
    saveNow();
    return send(res, 200, view(u, now));
  }

  if (route === "POST /api/shop/can") {
    const up = SHOP.canUpgrades[u.canLevel - 1];
    if (!up) return fail(res, 409, "max_can");
    if (levelFor(u.xp) < up.level) return fail(res, 403, "level_too_low");
    if (u.riel < up.price) return fail(res, 402, "not_enough_riel");
    u.riel -= up.price;
    u.canLevel += 1;
    saveNow();
    return send(res, 200, view(u, now));
  }

  /* ---- decorations ---- */
  if (route === "POST /api/decor/buy") {
    const b = await readJson(req);
    if (typeof b.id !== "string") return fail(res, 400, "bad_item");
    const d = DECOR[b.id];
    if (!d) return fail(res, 400, "bad_item");
    if (d.event && !eventItemAvailable(d.id, now))
      return fail(res, 403, "event_only");
    if (levelFor(u.xp) < d.level) return fail(res, 403, "level_too_low");
    if (u.riel < d.price) return fail(res, 402, "not_enough_riel");
    u.riel -= d.price;
    u.decor.owned[d.id] = (u.decor.owned[d.id] || 0) + 1;
    saveNow();
    return send(res, 200, view(u, now));
  }

  if (route === "POST /api/decor/place") {
    const b = await readJson(req);
    if (!isInt(b.slot, 0, YARD_SLOTS - 1)) return fail(res, 400, "bad_slot");
    if (b.id === null || b.id === undefined || b.id === "") {
      u.decor.placed[b.slot] = null;
    } else {
      if (typeof b.id !== "string" || !DECOR[b.id])
        return fail(res, 400, "bad_item");
      const free = (u.decor.owned[b.id] || 0) - placedCount(u, b.id, b.slot);
      if (free < 1) return fail(res, 409, "not_owned");
      u.decor.placed[b.slot] = b.id;
    }
    saveNow();
    return send(res, 200, view(u, now));
  }

  /* ---- animals ---- */
  if (route === "POST /api/animals/buy") {
    const b = await readJson(req);
    if (typeof b.type !== "string") return fail(res, 400, "bad_animal");
    const a = ANIMALS[b.type];
    if (!a) return fail(res, 400, "bad_animal");
    if (u.animals.length >= PEN_CAP) return fail(res, 409, "pen_full");
    if (levelFor(u.xp) < a.level) return fail(res, 403, "level_too_low");
    if (u.riel < a.price) return fail(res, 402, "not_enough_riel");
    u.riel -= a.price;
    u.animals.push({ type: a.id, readyAt: null });
    saveNow();
    return send(res, 200, view(u, now));
  }

  if (route === "POST /api/animals/feed") {
    const b = await readJson(req);
    const an = isInt(b.index, 0, u.animals.length - 1)
      ? u.animals[b.index]
      : null;
    if (!an) return fail(res, 400, "bad_animal");
    if (an.readyAt !== null) return fail(res, 409, "not_hungry");
    const def = ANIMALS[an.type];
    if (!def) return fail(res, 400, "bad_animal");
    if (u.riel < def.feed) return fail(res, 402, "not_enough_riel");
    u.riel -= def.feed;
    const dur = Math.round(def.time * SPEED);
    an.readyAt = now + dur;
    saveNow();
    return send(res, 200, view(u, now));
  }

  if (route === "POST /api/animals/collect") {
    const b = await readJson(req);
    const an = isInt(b.index, 0, u.animals.length - 1)
      ? u.animals[b.index]
      : null;
    if (!an) return fail(res, 400, "bad_animal");
    if (an.readyAt === null || now < an.readyAt)
      return fail(res, 409, "not_ready");
    const def = ANIMALS[an.type];
    if (!def) return fail(res, 400, "bad_animal");
    const prod = PRODUCTS[def.product];
    if (!prod) return fail(res, 500, "corrupt_product");
    if (prod.fertilizer) u.fert += 1;
    else u.inv.products[prod.id] = (u.inv.products[prod.id] || 0) + 1;
    u.xp += 2;
    an.readyAt = null;
    saveNow();
    return send(res, 200, { ...view(u, now), product: prod.id });
  }

  /* ---- events ---- */
  if (route === "GET /api/events") {
    return send(res, 200, { events: eventsView(u, now), serverNow: now });
  }

  if (route === "POST /api/event/claim") {
    const b = await readJson(req);
    if (typeof b.event !== "string") return fail(res, 404, "no_such_event");
    const ev = EVENTS.find((e) => e.id === b.event);
    if (!ev) return fail(res, 404, "no_such_event");
    if (!eventStatus(ev, now).active) return fail(res, 409, "event_not_active");
    const today = khDate(now);
    if (u.gifts[ev.id] === today) return fail(res, 409, "already_claimed");
    u.gifts[ev.id] = today;
    u.riel += ev.giftRiel || 0;
    u.fert += 1;
    saveNow();
    return send(res, 200, {
      ...view(u, now),
      gift: { riel: ev.giftRiel || 0, fert: 1 },
    });
  }

  /* ---- fishing ---- */
  if (route === "POST /api/fish/cast") {
    const delay =
      FISH_MIN_DELAY +
      Math.floor(Math.random() * (FISH_MAX_DELAY - FISH_MIN_DELAY));
    u.fish = { biteAt: now + delay };
    saveNow();
    return send(res, 200, { delay, window: FISH_WINDOW });
  }

  if (route === "POST /api/fish/reel") {
    const f = u.fish;
    u.fish = null;
    if (!f || typeof f.biteAt !== "number")
      return fail(res, 409, "not_fishing");
    if (now < f.biteAt) {
      saveNow();
      return send(res, 200, { result: "early" });
    }
    if (now > f.biteAt + FISH_WINDOW + FISH_LATENCY_SLACK) {
      saveNow();
      return send(res, 200, { result: "missed" });
    }
    const luck = bonuses(now).fishLuck || 1;
    const weight = (x) => (x.id === "riel" ? x.weight : x.weight * luck);
    const total = Object.values(FISH).reduce((a, x) => a + weight(x), 0);
    let roll = Math.random() * total,
      caught = FISH.riel;
    for (const x of Object.values(FISH)) {
      if ((roll -= weight(x)) < 0) {
        caught = x;
        break;
      }
    }
    u.inv.fish[caught.id] = (u.inv.fish[caught.id] || 0) + 1;
    u.xp += 1;
    saveNow();
    return send(res, 200, {
      result: "caught",
      fish: caught.id,
      me: view(u, now),
    });
  }

  /* ---- friends ---- */
  if (route === "GET /api/friends") {
    const list = u.friends
      .map((n) => db.users[n])
      .filter(Boolean)
      .map((f) => ({
        username: f.username,
        name: f.name,
        look: f.look,
        level: levelFor(f.xp),
        online: now - (f.lastSeen || 0) < 30000,
      }));
    return send(res, 200, { friends: list });
  }

  if (route === "POST /api/friends") {
    const b = await readJson(req);
    const raw = typeof b.username === "string" ? b.username : "";
    const name = raw.toLowerCase().trim();
    if (!/^[a-z0-9_]{3,16}$/.test(name)) return fail(res, 400, "bad_username");
    if (!db.users[name]) return fail(res, 404, "user_not_found");
    if (name === u.username) return fail(res, 400, "cannot_add_self");
    if (u.friends.includes(name)) return fail(res, 409, "already_friends");
    if (u.friends.length >= 100) return fail(res, 400, "too_many_friends");
    u.friends.push(name);
    saveNow();
    return send(res, 200, { ok: true, me: view(u, now) });
  }

  if (route === "POST /api/friends/remove") {
    const b = await readJson(req);
    const raw = typeof b.username === "string" ? b.username : "";
    const name = raw.toLowerCase().trim();
    u.friends = u.friends.filter((n) => n !== name);
    saveNow();
    return send(res, 200, { ok: true, me: view(u, now) });
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/farm/")) {
    const raw = url.pathname.slice("/api/farm/".length);
    let name = "";
    try {
      name = decodeURIComponent(raw).toLowerCase().trim();
    } catch {
      return fail(res, 400, "bad_username");
    }
    if (!/^[a-z0-9_]{3,16}$/.test(name)) return fail(res, 400, "bad_username");
    const f = db.users[name];
    if (!f || !u.friends.includes(name))
      return fail(res, 404, "user_not_found");
    return send(res, 200, {
      username: f.username,
      name: f.name,
      look: f.look,
      level: levelFor(f.xp),
      plots: f.plots.map((p) =>
        p ? { crop: p.crop, readyAt: p.readyAt } : null,
      ),
      yard: f.decor.placed,
      animals: f.animals.map((a) => ({ type: a.type, readyAt: a.readyAt })),
      serverNow: now,
    });
  }

  /* ---- chat (one global room) ---- */
  if (route === "GET /api/chat") {
    const since = Number(url.searchParams.get("since")) || 0;
    const online = Object.values(db.users).filter(
      (x) => now - (x.lastSeen || 0) < 30000,
    ).length;
    return send(res, 200, {
      messages: db.chat.filter((m) => m.id > since),
      online,
    });
  }

  if (route === "POST /api/chat") {
    const b = await readJson(req);
    const text = cleanText(b.text, 200);
    if (!text) return fail(res, 400, "empty");
    if (now - (u.lastChat || 0) < 1000) return fail(res, 429, "rate_limited");
    u.lastChat = now;
    db.chat.push({
      id: ++db.chatSeq,
      user: u.username,
      name: u.name,
      text,
      t: now,
    });
    if (db.chat.length > 100) db.chat.splice(0, db.chat.length - 100);
    saveNow();
    return send(res, 200, { ok: true });
  }

  return fail(res, 404, "not_found");
}

/* ------------------------------------------------------------------ */
/* Static files                                                        */
/* ------------------------------------------------------------------ */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

function serveStatic(req, res, url) {
  if (req.method !== "GET" && req.method !== "HEAD")
    return fail(res, 405, "method_not_allowed");
  let rel;
  try {
    rel = decodeURIComponent(url.pathname);
  } catch {
    return fail(res, 400, "bad_path");
  }
  if (rel.includes("\0")) return fail(res, 400, "bad_path");
  if (rel === "/" || rel === "") rel = "/index.html";
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (file !== PUBLIC_DIR && !file.startsWith(PUBLIC_DIR + path.sep))
    return fail(res, 403, "forbidden");
  fs.readFile(file, (err, data) => {
    if (err) return fail(res, 404, "not_found");
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control":
        ext === ".html" || file.endsWith("sw.js")
          ? "no-cache"
          : "public, max-age=3600",
      ...SECURITY_HEADERS,
    });
    res.end(req.method === "HEAD" ? undefined : data);
  });
}

/* ------------------------------------------------------------------ */
/* Server & Request Handler                                            */
/* ------------------------------------------------------------------ */
loadDb();

async function handleRequest(req, res) {
  try {
    let raw = req.headers['x-forwarded-url'] || req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.url || '/';
    let url = new URL(raw, 'http://localhost');
    const pathParam = url.searchParams.get('path');
    if (pathParam && pathParam.startsWith('/api/')) {
      url = new URL(pathParam + (url.search ? url.search : ''), 'http://localhost');
    } else if (url.pathname === '/api/index.js' || url.pathname === '/api/index' || url.pathname === '/api') {
      const match = req.headers['x-matched-path'] || req.headers['x-forwarded-url'];
      if (match && match.startsWith('/api/')) {
        url = new URL(match, 'http://localhost');
      }
    }

    if (url.pathname.startsWith('/api/')) {
      if (rateLimited('api:' + clientIp(req), 300, 60000))
        return fail(res, 429, 'rate_limited');
      maybeReloadDb();
      return await api(req, res, url);
    }
    serveStatic(req, res, url);
  } catch (e) {
    if (res.headersSent) return;
    if (e.status) return fail(res, e.status, e.message);
    console.error('Request error:', e);
    fail(res, 500, 'server_error');
  }
}

const server = http.createServer(handleRequest);

if (require.main === module) {
  server.listen(PORT, () => {
    const on = activeEvents(Date.now()).map((e) => e.id);
    console.log(
      `Srok Srae running on http://localhost:${PORT}  (growth x${(1 / SPEED).toFixed(1)}, active events: ${on.join(', ') || 'none'})`,
    );
  });
}

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    saveNow();
    process.exit(0);
  });
}

module.exports = handleRequest;
module.exports.server = server;
module.exports.handleRequest = handleRequest;
module.exports.api = api;
module.exports.db = db;
module.exports.ensureUser = ensureUser;
module.exports.loadDb = loadDb;
module.exports.saveNow = saveNow;
module.exports.CROPS = CROPS;
module.exports.FISH = FISH;
module.exports.SHOP = SHOP;
module.exports.DECOR = DECOR;
module.exports.ANIMALS = ANIMALS;
module.exports.PRODUCTS = PRODUCTS;
