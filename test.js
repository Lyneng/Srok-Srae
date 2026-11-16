'use strict';
// Automated test suite for Srok Srae (ស្រុកស្រែ)
// Supports both in-process dispatch and live HTTP server testing.
// Run: npm test
const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const assert = require('assert');
const EventEmitter = require('events');

const PORT = 3999;
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'srok-test-'));
const DATA_FILE = path.join(DIR, 'db.json');

// Pre-seed a high-level player so level-gated shop items can be tested.
const salt = crypto.randomBytes(16);
fs.writeFileSync(DATA_FILE, JSON.stringify({
  users: {
    farmer: {
      username: 'farmer', name: 'Farmer', look: { skin: 1, hair: 0, outfit: 0 },
      salt: salt.toString('hex'), hash: crypto.scryptSync('secret1', salt, 32).toString('hex'),
      riel: 5000, xp: 5000, plots: [], inv: {}, friends: [], lastSeen: 0, lastChat: 0, created: 0,
    },
  },
  sessions: {}, chatSeq: 0, chat: [],
}));

process.env.PORT = String(PORT);
process.env.DATA_FILE = DATA_FILE;
process.env.GROWTH_SPEED = '0.01';
process.env.FORCE_EVENT = 'water_festival';

const { handleRequest, loadDb, saveNow, db } = require('./server.js');
loadDb();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class MockReq extends EventEmitter {
  constructor(method, url, body, headers = {}) {
    super();
    this.method = method;
    this.url = url;
    this.headers = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
    this.socket = { remoteAddress: '127.0.0.1' };
    this.body = body;
    process.nextTick(() => {
      if (body !== undefined) {
        this.emit('data', Buffer.from(JSON.stringify(body)));
      }
      this.emit('end');
    });
  }
}

class MockRes extends EventEmitter {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.chunks = [];
  }
  writeHead(code, headers = {}) {
    this.statusCode = code;
    Object.assign(this.headers, headers);
  }
  setHeader(k, v) {
    this.headers[k.toLowerCase()] = v;
  }
  end(chunk) {
    if (chunk) this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    this.emit('finish');
  }
}

async function call(method, url, body, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = 'Bearer ' + token;
    const req = new MockReq(method, url, body, headers);
    const res = new MockRes();
    res.on('finish', () => {
      const raw = Buffer.concat(res.chunks).toString('utf8');
      let data = null;
      try { data = JSON.parse(raw); } catch {}
      resolve({
        status: res.statusCode,
        data,
        text: () => Promise.resolve(raw),
      });
    });
    handleRequest(req, res).catch(reject);
  });
}

(async () => {
  let passed = 0;
  const check = (name, cond) => {
    assert(cond, 'FAILED: ' + name);
    passed++;
    console.log('  ok  ' + name);
  };

  console.log('static + security');
  let r = await call('GET', '/');
  check('serves index.html', r.status === 200 && (await r.text()).includes('app.js'));
  r = await call('GET', '/..%2f..%2fetc%2fpasswd');
  check('blocks path traversal', r.status === 403 || r.status === 404);
  r = await call('GET', '/%2e%2e/server.js');
  check('blocks ../server.js', r.status === 403 || r.status === 404);
  r = await call('GET', '/events.json');
  check('does not expose events.json / db', r.status === 404);

  console.log('auth');
  r = await call('POST', '/api/register', { username: 'A!', password: 'secret1' });
  check('rejects bad username', r.status === 400 && r.data.error === 'bad_username');
  r = await call('POST', '/api/register', { username: 'dara', password: '123' });
  check('rejects short password', r.status === 400 && r.data.error === 'bad_password');
  r = await call('POST', '/api/register', {
    username: 'Dara',
    password: 'secret1',
    name: '  <b>Dara</b>  ',
    look: { skin: 2, hair: 99, outfit: 1 },
  });
  check('registers (username lowercased)', r.status === 200 && r.data.me.username === 'dara');
  check('invalid look value falls back to 0', r.data.me.look.hair === 0 && r.data.me.look.skin === 2);
  check('new player has yard, pen and 12 plots', r.data.me.plots.length === 12 && r.data.me.decor.placed.length === 12 && r.data.me.animals.length === 0);
  const tokA = r.data.token;

  r = await call('POST', '/api/register', { username: 'dara', password: 'other12' });
  check('rejects duplicate username', r.status === 409);
  r = await call('POST', '/api/login', { username: 'dara', password: 'wrongpw' });
  check('rejects wrong password', r.status === 401);
  r = await call('POST', '/api/login', { username: 'dara', password: 'secret1' });
  check('logs in', r.status === 200 && !!r.data.token);
  r = await call('GET', '/api/me');
  check('requires token', r.status === 401);
  r = await call('GET', '/api/me', undefined, tokA);
  check('/api/me works', r.status === 200 && r.data.riel === 50);

  console.log('farming');
  r = await call('POST', '/api/plant', { plot: 0, crop: 'mango' }, tokA);
  check('mango locked at level 1', r.status === 403 && r.data.error === 'level_too_low');
  r = await call('POST', '/api/plant', { plot: 99, crop: 'rice' }, tokA);
  check('rejects bad plot index', r.status === 400);
  r = await call('POST', '/api/plant', { plot: 0, crop: 'rice' }, tokA);
  check('plants rice (-5 riel)', r.status === 200 && r.data.riel === 45 && r.data.plots[0].crop === 'rice');
  r = await call('POST', '/api/plant', { plot: 0, crop: 'rice' }, tokA);
  check('cannot plant on busy plot', r.status === 409);
  r = await call('POST', '/api/harvest', { plot: 0 }, tokA);
  check('cannot harvest early', r.status === 409 && r.data.error === 'not_ready');
  r = await call('POST', '/api/water', { plot: 0 }, tokA);
  check('waters', r.status === 200 && r.data.plots[0].watered === true);
  r = await call('POST', '/api/water', { plot: 0 }, tokA);
  check('cannot water twice', r.status === 409);
  await sleep(700);
  r = await call('POST', '/api/harvest', { plot: 0 }, tokA);
  check('harvests when ready', r.status === 200 && r.data.inv.crops.rice === 1 && r.data.xp === 3 && r.data.plots[0] === null);
  r = await call('POST', '/api/sell', {}, tokA);
  check('sell gets Water Festival +20% (12 -> 14)', r.status === 200 && r.data.sold === 14 && r.data.riel === 59 && Math.abs(r.data.bonus - 0.2) < 1e-9);

  console.log('events');
  r = await call('GET', '/api/events', undefined, tokA);
  const evs = r.data.events;
  const wf = evs.find((e) => e.id === 'water_festival');
  check('lists 4 events', evs.length === 4);
  check('forced Water Festival is active and sorted first', wf.active && evs[0].id === 'water_festival');
  const idle = evs.find((e) => !e.active);
  check('inactive events have a next start date', idle && idle.startsAt > Date.now() - 86400000 * 400);
  r = await call('POST', '/api/event/claim', { event: 'water_festival' }, tokA);
  check('claims daily gift (+40 riel, +1 fertilizer)', r.status === 200 && r.data.riel === 99 && r.data.fert === 1);
  r = await call('POST', '/api/event/claim', { event: 'water_festival' }, tokA);
  check('cannot claim twice in a day', r.status === 409 && r.data.error === 'already_claimed');
  r = await call('POST', '/api/event/claim', { event: idle.id }, tokA);
  check('cannot claim an inactive event', r.status === 409 && r.data.error === 'event_not_active');
  r = await call('GET', '/api/events', undefined, tokA);
  check('claimed flag updates', r.data.events.find((e) => e.id === 'water_festival').claimed === true);

  console.log('farm shop');
  r = await call('POST', '/api/shop/land', {}, tokA);
  check('land expansion needs level 2', r.status === 403 && r.data.error === 'level_too_low');
  r = await call('POST', '/api/shop/can', {}, tokA);
  check('can upgrade needs level 2', r.status === 403);
  r = await call('POST', '/api/plant', { plot: 1, crop: 'rice' }, tokA);
  r = await call('POST', '/api/fertilize', { plot: 1 }, tokA);
  check('fertilizer halves remaining time', r.status === 200 && r.data.fert === 0 && r.data.plots[1].fert === true);
  r = await call('POST', '/api/fertilize', { plot: 1 }, tokA);
  check('cannot fertilize twice / without stock', r.status === 409 || r.status === 402);

  // seeded high-level player
  r = await call('POST', '/api/login', { username: 'farmer', password: 'secret1' });
  check('seeded player logs in (level 15)', r.status === 200 && r.data.me.level === 15 && r.data.me.plots.length === 12);
  const tokF = r.data.token;
  for (const n of [16, 20, 24]) {
    r = await call('POST', '/api/shop/land', {}, tokF);
    check(`buys land -> ${n} plots`, r.status === 200 && r.data.plots.length === n);
  }
  r = await call('POST', '/api/shop/land', {}, tokF);
  check('land maxes out at 24', r.status === 409 && r.data.error === 'max_land');
  r = await call('POST', '/api/shop/fertilizer', { qty: 3 }, tokF);
  check('buys 3 fertilizer', r.status === 200 && r.data.fert === 3);
  r = await call('POST', '/api/shop/fertilizer', { qty: 0 }, tokF);
  check('rejects bad quantity', r.status === 400);
  r = await call('POST', '/api/shop/can', {}, tokF);
  r = await call('POST', '/api/shop/can', {}, tokF);
  check('watering can reaches level 3', r.status === 200 && r.data.canLevel === 3);
  r = await call('POST', '/api/shop/can', {}, tokF);
  check('can maxes out', r.status === 409);
  r = await call('POST', '/api/plant', { plot: 23, crop: 'mango' }, tokF);
  const t0 = r.data.plots[23].readyAt - r.data.serverNow;
  r = await call('POST', '/api/water', { plot: 23 }, tokF);
  const t1 = r.data.plots[23].readyAt - r.data.serverNow;
  check('level-3 can saves 40% (remaining ~60%)', Math.abs(t1 / t0 - 0.6) < 0.05);

  console.log('decorations');
  r = await call('POST', '/api/decor/buy', { id: 'nonsense' }, tokF);
  check('rejects unknown decoration', r.status === 400);
  r = await call('POST', '/api/decor/buy', { id: 'flower' }, tokF);
  check('buys a flower', r.status === 200 && r.data.decor.owned.flower === 1);
  r = await call('POST', '/api/decor/place', { slot: 0, id: 'flower' }, tokF);
  check('places it in the yard', r.status === 200 && r.data.decor.placed[0] === 'flower');
  r = await call('POST', '/api/decor/place', { slot: 1, id: 'flower' }, tokF);
  check('cannot place more than owned', r.status === 409 && r.data.error === 'not_owned');
  r = await call('POST', '/api/decor/place', { slot: 0, id: 'flower' }, tokF);
  check('re-placing in the same slot is fine', r.status === 200);
  r = await call('POST', '/api/decor/place', { slot: 99, id: 'flower' }, tokF);
  check('rejects bad slot', r.status === 400);
  r = await call('POST', '/api/decor/buy', { id: 'racing_boat' }, tokF);
  check('event decoration buyable while its event is on', r.status === 200 && r.data.decor.owned.racing_boat === 1);
  r = await call('POST', '/api/decor/buy', { id: 'sand_mound' }, tokF);
  check('event decoration refused when its event is off', r.status === 403 && r.data.error === 'event_only');
  r = await call('POST', '/api/decor/place', { slot: 0, id: null }, tokF);
  check('clears a slot', r.status === 200 && r.data.decor.placed[0] === null);
  r = await call('POST', '/api/decor/buy', { id: 'pagoda' }, tokA);
  check('pagoda locked for level-1 player', r.status === 403);

  console.log('animals');
  r = await call('POST', '/api/animals/buy', { type: 'chicken' }, tokA);
  check('chicken needs level 2', r.status === 403);
  r = await call('POST', '/api/animals/buy', { type: 'chicken' }, tokF);
  check('buys a chicken', r.status === 200 && r.data.animals.length === 1 && r.data.animals[0].readyAt === null);
  const rielBefore = r.data.riel;
  r = await call('POST', '/api/animals/collect', { index: 0 }, tokF);
  check('cannot collect a hungry animal', r.status === 409);
  r = await call('POST', '/api/animals/feed', { index: 0 }, tokF);
  check('feeding costs 2 riel and starts production', r.status === 200 && r.data.riel === rielBefore - 2 && r.data.animals[0].readyAt > r.data.serverNow);
  r = await call('POST', '/api/animals/feed', { index: 0 }, tokF);
  check('cannot feed twice', r.status === 409 && r.data.error === 'not_hungry');
  r = await call('POST', '/api/animals/collect', { index: 0 }, tokF);
  check('cannot collect early', r.status === 409);
  await sleep(700);
  r = await call('POST', '/api/animals/collect', { index: 0 }, tokF);
  check('collects an egg', r.status === 200 && r.data.product === 'egg' && r.data.inv.products.egg === 1 && r.data.animals[0].readyAt === null);
  r = await call('POST', '/api/animals/buy', { type: 'pig' }, tokF);
  const fertBefore = r.data.fert;
  await call('POST', '/api/animals/feed', { index: 1 }, tokF);
  await sleep(1400);
  r = await call('POST', '/api/animals/collect', { index: 1 }, tokF);
  check('pig produces fertilizer', r.status === 200 && r.data.fert === fertBefore + 1);
  for (const type of ['duck', 'buffalo', 'chicken', 'chicken']) {
    r = await call('POST', '/api/animals/buy', { type }, tokF);
  }
  check('pen holds 6 animals', r.data.animals.length === 6);
  r = await call('POST', '/api/animals/buy', { type: 'chicken' }, tokF);
  check('pen full -> rejected', r.status === 409 && r.data.error === 'pen_full');
  r = await call('POST', '/api/sell', {}, tokF);
  check('sells egg with event bonus (floor(9*1.2)=10)', r.status === 200 && r.data.sold === 10);

  console.log('fishing');
  r = await call('POST', '/api/fish/reel', {}, tokA);
  check('cannot reel without casting', r.status === 409);
  r = await call('POST', '/api/fish/cast', {}, tokA);
  check('cast returns delay', r.status === 200 && r.data.delay >= 2000 && r.data.delay < 6000);
  r = await call('POST', '/api/fish/reel', {}, tokA);
  check('reeling immediately is too early', r.data.result === 'early');
  r = await call('POST', '/api/fish/cast', {}, tokA);
  await sleep(r.data.delay + 100);
  r = await call('POST', '/api/fish/reel', {}, tokA);
  check('reeling after bite catches a fish', r.data.result === 'caught' && ['riel', 'snakehead', 'catfish'].includes(r.data.fish));
  r = await call('POST', '/api/fish/cast', {}, tokA);
  await sleep(r.data.delay + 2200);
  r = await call('POST', '/api/fish/reel', {}, tokA);
  check('reeling too late misses', r.data.result === 'missed');

  console.log('friends + visiting');
  r = await call('POST', '/api/register', { username: 'sophea', password: 'secret2', name: 'Sophea' });
  const tokB = r.data.token;
  r = await call('GET', '/api/farm/farmer', undefined, tokB);
  check('cannot visit non-friend', r.status === 404);
  r = await call('POST', '/api/friends', { username: 'nobody' }, tokB);
  check('unknown friend rejected', r.status === 404);
  r = await call('POST', '/api/friends', { username: 'sophea' }, tokB);
  check('cannot add self', r.status === 400);
  r = await call('POST', '/api/friends', { username: 'Farmer' }, tokB);
  check('adds friend', r.status === 200);
  r = await call('POST', '/api/friends', { username: 'farmer' }, tokB);
  check('duplicate friend rejected', r.status === 409);
  r = await call('GET', '/api/friends', undefined, tokB);
  check('friend list shows online status', r.data.friends.length === 1 && r.data.friends[0].online === true);
  r = await call('GET', '/api/farm/farmer', undefined, tokB);
  check(
    'visit shows 24 plots, yard and 6 animals, no private data',
    r.status === 200 &&
      r.data.plots.length === 24 &&
      r.data.yard.length === 12 &&
      r.data.animals.length === 6 &&
      !('riel' in r.data)
  );

  console.log('chat');
  r = await call('POST', '/api/chat', { text: '   ' }, tokA);
  check('empty chat rejected', r.status === 400);
  r = await call('POST', '/api/chat', { text: 'សួស្តី <script>alert(1)</script>' }, tokA);
  check('posts chat (Khmer + html stored as text)', r.status === 200);
  r = await call('POST', '/api/chat', { text: 'again' }, tokA);
  check('chat flood limited', r.status === 429);
  r = await call('GET', '/api/chat?since=0', undefined, tokB);
  check('other user reads chat', r.data.messages.length === 1 && r.data.messages[0].text.startsWith('សួស្តី'));
  r = await call('GET', `/api/chat?since=${r.data.messages[0].id}`, undefined, tokB);
  check('chat since cursor', r.data.messages.length === 0);

  console.log('additional validation checks');
  r = await call('POST', '/api/plant', { plot: -1, crop: 'rice' }, tokA);
  check('rejects negative plot index', r.status === 400 && r.data.error === 'bad_plot');
  r = await call('POST', '/api/plant', { plot: 0.5, crop: 'rice' }, tokA);
  check('rejects float plot index', r.status === 400 && r.data.error === 'bad_plot');
  r = await call('POST', '/api/plant', { plot: 0, crop: 12345 }, tokA);
  check('rejects non-string crop', r.status === 400 && r.data.error === 'bad_crop');
  r = await call('POST', '/api/decor/buy', { id: 999 }, tokF);
  check('rejects non-string decor id', r.status === 400 && r.data.error === 'bad_item');
  r = await call('POST', '/api/animals/buy', { type: false }, tokF);
  check('rejects non-string animal type', r.status === 400 && r.data.error === 'bad_animal');
  r = await call('POST', '/api/shop/fertilizer', { qty: -5 }, tokF);
  check('rejects negative fertilizer quantity', r.status === 400 && r.data.error === 'bad_qty');
  r = await call('POST', '/api/shop/fertilizer', { qty: 'abc' }, tokF);
  check('rejects non-numeric fertilizer quantity', r.status === 400 && r.data.error === 'bad_qty');
  r = await call('POST', '/api/friends', { username: 'bad name with spaces' }, tokB);
  check('rejects invalid username characters in friends', r.status === 400 && r.data.error === 'bad_username');

  console.log('persistence + migration');
  saveNow();
  const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  check('password hashed, not stored in cleartext', !JSON.stringify(saved).includes('secret2') && saved.users.dara.hash.length === 64);
  check('old-format account was upgraded (seeded user got yard/pen/gifts)', saved.users.farmer.decor.placed.length === 12 && Array.isArray(saved.users.farmer.animals));
  check('saved database JSON is valid and contains users', Object.keys(saved.users).length >= 3);

  r = await call('POST', '/api/logout', {}, tokA);
  check('logout succeeds', r.status === 200 && r.data.ok === true);
  r = await call('GET', '/api/me', undefined, tokA);
  check('logout invalidates token', r.status === 401);

  console.log('cold-start client vault recovery');
  const daraBackup = {
    username: 'dara',
    salt: saved.users.dara.salt,
    hash: saved.users.dara.hash,
    riel: 555,
    xp: 200,
  };
  delete db.users.dara;
  r = await call('POST', '/api/login', { username: 'dara', password: 'wrongpassword', backup: daraBackup });
  check('cold start rejects wrong password', r.status === 401);
  r = await call('POST', '/api/login', { username: 'dara', password: 'secret1', backup: daraBackup });
  check('cold start restores user and gameplay state', r.status === 200 && r.data.me.riel === 555 && r.data.me.xp === 200);
  r = await call('GET', '/api/me', undefined, r.data.token);
  check('restored user can call authenticated endpoints', r.status === 200 && r.data.riel === 555);

  // Test data bounds & security validation on restore
  const forgedBackup = {
    username: 'dara',
    salt: saved.users.dara.salt,
    hash: saved.users.dara.hash,
    riel: 999999999999,
    plots: new Array(50).fill(null),
    friends: ['sokha', 'sokha', 'dara_friend'],
  };
  delete db.users.dara;
  r = await call('POST', '/api/login', { username: 'dara', password: 'secret1', backup: forgedBackup });
  check('restore caps over-limit plots to 24', r.status === 200 && r.data.me.plots.length === 24);
  check('restore caps over-limit riel', r.data.me.riel === 100000000);
  check('restore deduplicates friends', r.data.me.friends.length === 2);

  console.log(`\nAll ${passed} checks passed successfully.`);
  process.exit(0);
})().catch((e) => {
  console.error('\n' + (e.stack || e.message));
  process.exit(1);
});
