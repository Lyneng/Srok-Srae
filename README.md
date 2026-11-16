# ស្រុកស្រែ · Srok Srae

A Khmer social farming web game. Original code, art and design (no assets from any other game).
No dependencies: only Node.js 18+.

## Run it

```bash
cd srok-srae
node server.js            # http://localhost:3000
```

- `npm run dev` makes crops and animals 10x faster so you can test quickly.
- `FORCE_EVENT=water_festival node server.js` turns a festival on right now (comma-separate several).
- `npm test` runs 85 automated server checks.
- Open it on your phone: use `http://<your-computer-ip>:3000` on the same Wi-Fi.

## What's in it

| Area | Features |
|---|---|
| Accounts | Register / login, passwords hashed with scrypt, session tokens, character creator (skin, hair, krama) |
| Farm | Plots to plant, water, fertilize, harvest and sell. Rice, morning glory, lotus, mango. Levels unlock new crops |
| Animals | Pen for 6: chicken 🐔, duck 🦆, pig 🐖, buffalo 🐃. Feed them, wait, collect eggs / milk / fertilizer |
| Farm shop | Buy more land (12 → 24 plots), fertilizer (halves grow time), watering-can upgrades (saves 20% → 40%) |
| Decoration shop | 11 decorations (flowers, lotus pond, tuk-tuk, pagoda, elephant statue...) placed in your village yard (12 spots) |
| Festivals | Khmer New Year, Royal Ploughing, Pchum Ben, Water Festival: bonuses, daily gift, and festival-only decorations |
| Fishing | Cast, wait for the bite, reel in within 1.5 seconds. Water Festival makes rare fish more likely |
| Friends | Add by username, see who is online, visit their farm, yard and animals (read-only) |
| Chat | One global village room |
| Languages | Khmer (default) and English, toggle in the header |
| Installable | PWA: "Add to Home Screen" on Android/iOS |

All game rules (crop timers, money, animals, shop, festivals, fishing, XP) run on the **server**, so players can't cheat from the browser.

## Festivals (`events.json`)

Edit `events.json` and restart. Each festival can give: `sellBonus`, `growth` (crop speed), `fishLuck`, a daily `giftRiel`, and `items` (decorations that can only be bought while it is on).

- **Khmer New Year** repeats every year on 14-16 April.
- **Royal Ploughing, Pchum Ben and Water Festival** follow the lunar calendar, so their dates change every year. I filled in 2026 and 2027 from public-holiday listings (Water Festival: 23-25 Nov 2026 and 12-14 Nov 2027, Pchum Ben: 10-12 Oct 2026 and 29 Sep-1 Oct 2027, Royal Ploughing: 5 May 2026 and 24 May 2027). **Please check them against the government announcement** and add new windows each year. Sources disagreed on some dates, so treat these as a starting point.
- All dates use Cambodia time (UTC+7).

## Files

```
server.js            API + static file server + JSON storage + all game rules
events.json          festival calendar and bonuses
public/index.html    page shell
public/app.js        the whole game client
public/style.css     styles
public/manifest.webmanifest, sw.js, icon*.png/svg   installable-app bits
data/db.json         created automatically (all player data)
test.js              server tests
```

Game balance lives at the top of `server.js` (`CROPS`, `FISH`, `SHOP`, `DECOR`, `ANIMALS`).
Add a decoration or animal by adding one entry there (with `km` and `en` names). Add a crop by adding an entry plus `crop_<id>` names in both languages in `public/app.js`.
Existing player accounts are upgraded automatically when you update the game.

## Put it online

### Option A: Small VPS or Platform with Persistent Disk (Recommended for Long-term Storage)
Because the game uses a local JSON file (`data/db.json`) for data storage, hosting on a host with persistent storage ensures player data remains intact across server restarts:
1. Rent a small VPS (Singapore region is closest to Cambodia) or use Railway / Render with a persistent volume.
2. Install Node 18+, copy this folder, run `PORT=3000 TRUST_PROXY=1 node server.js` under `pm2` or systemd so it restarts.
3. Put **Caddy** or **nginx** in front for free HTTPS (needed for "Add to Home Screen"), and point your domain at it.
4. Back up `data/db.json` regularly.

### Option B: Hosting on Vercel
The project now includes `vercel.json` and `api/index.js` so it runs directly on Vercel:
- **Routing**: Static assets (`public/`) are served by Vercel CDN at the root, and `/api/*` routes are handled by `@vercel/node` serverless functions.
- **Serverless File Storage**: Vercel functions have a read-only root filesystem. The server automatically routes `DATA_FILE` to `/tmp/srok-srae-data/db.json` and flushes changes synchronously before serverless function execution freezes.
- **Important Note on Vercel Persistence**: Vercel serverless containers are ephemeral (`/tmp` is reset when containers spin down or redeploy). For production with real persistent multi-player data, consider using a VPS/Railway or connecting an external database.

## Things to know

- **Khmer text:** I could not check Khmer rendering on a real device, and the translations should be reviewed by a native speaker. Fonts load from Google Fonts (Noto Sans Khmer). For offline or faster loading, download that font into `public/` and add an `@font-face` rule in `style.css`.
- **Storage:** one JSON file is fine for hundreds of players. Move to SQLite/PostgreSQL if you grow past that.
- **Moderation:** chat has no word filter or report button yet. Add them before opening to the public, especially if children will play.
- **Passwords:** there is no "forgot password" flow yet.
- **Real money:** there is no payment system. Everything is bought with in-game riel.
- **Original content:** keep your own name, art and characters. Don't copy Teamobi's Avatar assets or branding.

## Ideas for next steps

Gifts between friends, private messages, daily login rewards, quests, more animals and crops, a market between players, Telegram/Facebook login, real top-up payments (ABA/Wing).
