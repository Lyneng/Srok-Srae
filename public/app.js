'use strict';
(() => {
  /* ------------------------------------------------------------------ */
  /* helpers                                                             */
  /* ------------------------------------------------------------------ */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');

  /* ------------------------------------------------------------------ */
  /* translations (Khmer text should be reviewed by a native speaker)    */
  /* Item, animal, product and event names come from the server config.  */
  /* ------------------------------------------------------------------ */
  const I18N = {
    km: {
      title: 'ស្រុកស្រែ', tagline: 'ភូមិកសិកម្មរបស់យើង',
      login: 'ចូលគណនី', register: 'បង្កើតគណនី', logout: 'ចាកចេញ',
      username: 'ឈ្មោះអ្នកប្រើ', password: 'ពាក្យសម្ងាត់', displayName: 'ឈ្មោះតួអង្គ',
      rememberMe: 'ចងចាំគណនី និងពាក្យសម្ងាត់',
      appearance: 'រូបរាង', skin: 'ស្បែក', hair: 'សក់', outfit: 'ក្រមា',
      start: 'ចាប់ផ្ដើម', level: 'កម្រិត', riel: 'រៀល',
      tab_farm: 'ចម្ការ', tab_fish: 'ស្ទូចត្រី', tab_village: 'ភូមិ', tab_shop: 'ហាង', tab_social: 'មិត្ត',
      sub_crops: 'ដំណាំ', sub_animals: 'សត្វ', sub_farm: 'ចម្ការ', sub_decor: 'តុបតែង',
      sub_friends: 'មិត្តភក្តិ', sub_chat: 'ជជែក',
      seeds: 'ជ្រើសពូជ រួចចុចដីទំនេរ ដើម្បីដាំ។ ចុចម្ដងទៀតដើម្បីស្រោចទឹក និងប្រមូលផល។',
      tool_fert: 'ដាក់ជី', pickSeed: 'សូមជ្រើសពូជជាមុនសិន', fertUsed: 'បានដាក់ជី',
      sellAll: 'លក់ទាំងអស់', inventory: 'ឃ្លាំង', emptyInv: 'ឃ្លាំងទទេ',
      growing: 'កំពុងដុះ...', sold: 'លក់បាន', harvested: 'ប្រមូលបាន', bonusWord: 'ប៉ូនុស',
      levelUp: 'កម្រិតថ្មី!', needLevel: 'កម្រិត', ready: 'រួចហើយ',
      cast: 'ស្ទូច', reel: 'ទាញ!',
      fishIdle: 'ចុចប៊ូតុងដើម្បីចាប់ផ្ដើមស្ទូចត្រី', fishWait: 'រង់ចាំត្រីខាំ...',
      fishBite: 'ត្រីខាំហើយ! ទាញ!', caught: 'បានត្រី', missed: 'ត្រីរត់បាត់ហើយ', early: 'ទាញលឿនពេក!',
      addFriend: 'បន្ថែមមិត្ត', friendName: 'ឈ្មោះអ្នកប្រើរបស់មិត្ត', noFriends: 'មិនទាន់មានមិត្តភក្តិទេ',
      visit: 'ទៅលេង', back: 'ត្រឡប់ក្រោយ', farmOf: 'ចម្ការរបស់', remove: 'ដកចេញ',
      chatTitle: 'បន្ទប់ជជែករួម', online: 'អនឡាញ', send: 'ផ្ញើ', typeMsg: 'សរសេរសារ...',
      loading: 'កំពុងផ្ទុក...',
      crop_morning_glory: 'ត្រកួន', crop_rice: 'ស្រូវ', crop_lotus: 'ផ្កាឈូក', crop_mango: 'ស្វាយ',
      fish_riel: 'ត្រីរៀល', fish_snakehead: 'ត្រីរស់', fish_catfish: 'ត្រីអណ្តែង',
      buy: 'ទិញ', maxed: 'ពេញកម្រិតហើយ', owned: 'មាន',
      landTitle: 'ពង្រីកដី', landDesc: 'ដីដាំបន្ថែម +៤', plotsWord: 'ដី',
      fertTitle: 'ជី', fertDesc: 'កាត់បន្ថយពេលដុះពាក់កណ្ដាល (១ដងក្នុង១ដី)', inStock: 'មាន',
      canTitle: 'ធុងស្រោចទឹក', canDesc: 'ស្រោចទឹកសន្សំពេល {n}%',
      eventOnly: 'តែក្នុងពិធីបុណ្យ', penWord: 'ទ្រុង', feedWord: 'ចំណី', makesWord: 'ផលិត', everyWord: 'រៀងរាល់',
      secShort: 'វិ', minShort: 'នាទី',
      yardTitle: 'ភូមិរបស់ខ្ញុំ', pickDecor: 'ជ្រើសរបស់តុបតែង រួចចុចកន្លែងក្នុងភូមិ', noDecor: 'ទិញរបស់តុបតែងនៅក្នុងហាង',
      removeChip: 'ដកចេញ',
      pen: 'ទ្រុងសត្វ', needAnimals: 'ទិញសត្វនៅក្នុងហាង', collected: 'ប្រមូលបាន', fed: 'បានចិញ្ចឹម',
      animalHint: 'ចុចសត្វដែលឃ្លានដើម្បីចិញ្ចឹម ហើយប្រមូលផលិតផលពេលរួច។', gotFert: '+១ ជី',
      eventsTitle: 'ពិធីបុណ្យ', evActive: 'កំពុងប្រារព្ធ', evEnds: 'បញ្ចប់ក្នុង', evStarts: 'ចាប់ផ្ដើមក្នុង', evNone: 'មិនទាន់មានកាលបរិច្ឆេទ',
      dayShort: 'ថ្ងៃ', hourShort: 'ម៉ោង', claim: 'ទទួលកាដូ', claimed: 'ទទួលរួចហើយថ្ងៃនេះ', giftGot: 'ទទួលបាន',
      bonusSell: '+{n}% តម្លៃលក់', bonusGrow: 'ដំណាំដុះលឿនជាង {n}%', bonusFish: 'ត្រីកម្រខាំងាយជាងមុន', bonusGift: 'កាដូរាល់ថ្ងៃ +{n} រៀល',
      specialItems: 'របស់តុបតែងពិសេស',
      err_bad_username: 'ឈ្មោះអ្នកប្រើត្រូវមាន ៣-១៦ តួ (a-z, 0-9, _)',
      err_bad_password: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួ',
      err_username_taken: 'ឈ្មោះនេះមានគេប្រើហើយ',
      tryLogin: 'បើជាគណនីរបស់អ្នក សូមចុច «ចូលគណនី»',
      err_bad_credentials: 'ឈ្មោះ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ',
      err_rate_limited: 'សូមរង់ចាំបន្តិច',
      err_not_enough_riel: 'រៀលមិនគ្រប់គ្រាន់',
      err_level_too_low: 'កម្រិតមិនទាន់ដល់',
      err_user_not_found: 'រកមិនឃើញអ្នកប្រើនេះទេ',
      err_already_friends: 'ជាមិត្តរួចហើយ',
      err_cannot_add_self: 'មិនអាចបន្ថែមខ្លួនឯងបានទេ',
      err_pen_full: 'ទ្រុងពេញហើយ', err_max_land: 'ដីពេញហើយ', err_max_can: 'ធុងពេញកម្រិតហើយ',
      err_no_fertilizer: 'អស់ជីហើយ', err_not_hungry: 'មិនទាន់ឃ្លាន', err_not_ready: 'មិនទាន់រួច',
      err_event_only: 'មានតែក្នុងពិធីបុណ្យប៉ុណ្ណោះ', err_already_claimed: 'ទទួលរួចហើយថ្ងៃនេះ',
      err_event_not_active: 'ពិធីបុណ្យមិនទាន់ចាប់ផ្ដើម', err_not_owned: 'មិនមានរបស់នេះទេ',
      err_already_fertilized: 'ដាក់ជីរួចហើយ', err_already_watered: 'ស្រោចរួចហើយ',
      err_network: 'មានបញ្ហាបណ្តាញ', err_default: 'មានបញ្ហា',
    },
    en: {
      title: 'Srok Srae', tagline: 'Our countryside village',
      login: 'Log in', register: 'Create account', logout: 'Log out',
      username: 'Username', password: 'Password', displayName: 'Character name',
      rememberMe: 'Remember username & password',
      appearance: 'Appearance', skin: 'Skin', hair: 'Hair', outfit: 'Krama',
      start: 'Start', level: 'Level', riel: 'Riel',
      tab_farm: 'Farm', tab_fish: 'Fishing', tab_village: 'Village', tab_shop: 'Shop', tab_social: 'Social',
      sub_crops: 'Crops', sub_animals: 'Animals', sub_farm: 'Farm', sub_decor: 'Decor',
      sub_friends: 'Friends', sub_chat: 'Chat',
      seeds: 'Pick a seed, then tap an empty plot to plant. Tap again to water and harvest.',
      tool_fert: 'Fertilize', pickSeed: 'Pick a seed first', fertUsed: 'Fertilizer applied',
      sellAll: 'Sell all', inventory: 'Storage', emptyInv: 'Storage is empty',
      growing: 'Still growing...', sold: 'Sold for', harvested: 'Harvested', bonusWord: 'bonus',
      levelUp: 'Level up!', needLevel: 'Level', ready: 'Ready',
      cast: 'Cast', reel: 'Reel in!',
      fishIdle: 'Tap the button to start fishing', fishWait: 'Waiting for a bite...',
      fishBite: 'A bite! Reel in!', caught: 'You caught', missed: 'It got away!', early: 'Too early!',
      addFriend: 'Add friend', friendName: "Friend's username", noFriends: 'No friends yet',
      visit: 'Visit', back: 'Back', farmOf: 'Farm of', remove: 'Remove',
      chatTitle: 'Village chat', online: 'online', send: 'Send', typeMsg: 'Type a message...',
      loading: 'Loading...',
      crop_morning_glory: 'Morning glory', crop_rice: 'Rice', crop_lotus: 'Lotus', crop_mango: 'Mango',
      fish_riel: 'Riel fish', fish_snakehead: 'Snakehead', fish_catfish: 'Catfish',
      buy: 'Buy', maxed: 'Maxed out', owned: 'Owned',
      landTitle: 'Expand land', landDesc: '+4 more plots', plotsWord: 'plots',
      fertTitle: 'Fertilizer', fertDesc: 'Halves the remaining grow time (once per plot)', inStock: 'In stock',
      canTitle: 'Watering can', canDesc: 'Watering saves {n}% of the time',
      eventOnly: 'Event only', penWord: 'Pen', feedWord: 'Feed', makesWord: 'Makes', everyWord: 'every',
      secShort: 's', minShort: 'min',
      yardTitle: 'My village', pickDecor: 'Pick a decoration, then tap a spot in your village', noDecor: 'Buy decorations in the shop',
      removeChip: 'Remove',
      pen: 'Animal pen', needAnimals: 'Buy animals in the shop', collected: 'Collected', fed: 'Fed',
      animalHint: 'Tap a hungry animal to feed it, then collect what it makes when it is ready.', gotFert: '+1 fertilizer',
      eventsTitle: 'Festivals', evActive: 'On now', evEnds: 'Ends in', evStarts: 'Starts in', evNone: 'Date not set',
      dayShort: 'd', hourShort: 'h', claim: 'Claim gift', claimed: 'Claimed today', giftGot: 'You got',
      bonusSell: '+{n}% sell price', bonusGrow: 'Crops grow {n}% faster', bonusFish: 'Rare fish bite more', bonusGift: 'Daily gift +{n} riel',
      specialItems: 'Special decorations',
      err_bad_username: 'Username must be 3-16 characters (a-z, 0-9, _)',
      err_bad_password: 'Password must be at least 6 characters',
      err_username_taken: 'That username is taken',
      tryLogin: 'If this is your account, tap "Log in" instead',
      err_bad_credentials: 'Wrong username or password',
      err_rate_limited: 'Slow down a little',
      err_not_enough_riel: 'Not enough riel',
      err_level_too_low: 'Level too low',
      err_user_not_found: 'User not found',
      err_already_friends: 'Already friends',
      err_cannot_add_self: "You can't add yourself",
      err_pen_full: 'The pen is full', err_max_land: 'No more land to buy', err_max_can: 'Watering can is maxed',
      err_no_fertilizer: 'Out of fertilizer', err_not_hungry: 'Not hungry yet', err_not_ready: 'Not ready yet',
      err_event_only: 'Only available during the festival', err_already_claimed: 'Already claimed today',
      err_event_not_active: 'That festival is not on', err_not_owned: "You don't own that",
      err_already_fertilized: 'Already fertilized', err_already_watered: 'Already watered',
      err_network: 'Network problem', err_default: 'Something went wrong',
    },
  };

  /* ------------------------------------------------------------------ */
  /* state                                                               */
  /* ------------------------------------------------------------------ */
  let savedCreds = null;
  try {
    savedCreds = JSON.parse(localStorage.getItem('srok_saved_creds') || 'null');
  } catch {}

  const S = {
    cfg: null,
    token: localStorage.getItem('token') || '',
    lang: localStorage.getItem('lang') || 'km',
    remember: localStorage.getItem('srok_remember') !== '0',
    me: null,
    offset: 0,
    tab: 'farm',
    sub: { farm: 'crops', shop: 'farm', social: 'friends' },
    seed: 'rice',          // selected seed id, or 'fert'
    pick: null,            // selected decoration id, or '__remove'
    authMode: 'login',
    form: {
      username: (savedCreds && savedCreds.username) || localStorage.getItem('last_user') || '',
      password: (savedCreds && savedCreds.password) || '',
      name: '',
    },
    look: { skin: 1, hair: 0, outfit: 0 },
    busy: false,
    events: [],
    friends: [],
    visit: null,
    chat: [],
    chatSince: 0,
    online: 0,
    unread: 0,
    fish: { state: 'idle', msg: '', emoji: '🎣' },
  };

  const t = (k, vars) => {
    let s = I18N[S.lang][k] ?? I18N.en[k] ?? k;
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.replace(`{${a}}`, b);
    return s;
  };
  const nm = (o) => (o && (o[S.lang] || o.en)) || '';   // server-provided {km,en} names
  const srvNow = () => Date.now() + S.offset;

  /* ------------------------------------------------------------------ */
  /* api                                                                 */
  /* ------------------------------------------------------------------ */
  function getStateEnv(username) {
    if (!username) return null;
    try {
      const raw = localStorage.getItem('srok_state_' + username.toLowerCase().trim());
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function api(path, body) {
    const opts = { headers: {} };
    if (S.token) opts.headers.Authorization = 'Bearer ' + S.token;
    const user = (S.me && S.me.username) || S.form.username || localStorage.getItem('last_user') || '';
    if (user) {
      const env = getStateEnv(user);
      if (env && env.payload && env.sig) {
        opts.headers['x-srok-state'] = env.payload;
        opts.headers['x-srok-sig'] = env.sig;
      }
    }
    if (body !== undefined) {
      opts.method = 'POST';
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    let res;
    try { res = await fetch(path, opts); }
    catch { throw new Error('network'); }
    let data = {};
    try { data = await res.json(); } catch { /* ignore */ }
    if (!res.ok) {
      if (res.status === 401 && S.token && !path.startsWith('/api/login')) forceLogout();
      throw new Error(data.error || 'default');
    }
    return data;
  }

  const errText = (e) => {
    const k = 'err_' + (e.message || 'default');
    return I18N[S.lang][k] || I18N.en[k] || t('err_default');
  };

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
  }

  function saveVault(u, authVault) {
    if (!u || !u.username) return;
    try {
      const key = 'srok_vault_' + u.username.toLowerCase();
      let existing = {};
      try { existing = JSON.parse(localStorage.getItem(key)) || {}; } catch {}
      // Monotonic guard: never overwrite newer local vault with older server state
      if (existing.updatedAt && u.updatedAt && u.updatedAt < existing.updatedAt) {
        return;
      }
      const merged = {
        ...existing,
        ...u,
        ...(authVault || {}),
        updatedAt: u.updatedAt || Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(merged));
      localStorage.setItem('last_user', u.username.toLowerCase());
      if (u._state) {
        localStorage.setItem(
          'srok_state_' + u.username.toLowerCase(),
          JSON.stringify(u._state)
        );
      }
    } catch {}
  }

  function getVault(username) {
    if (!username) return null;
    try {
      const raw = localStorage.getItem('srok_vault_' + username.toLowerCase().trim());
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setMe(me, authVault) {
    if (!me) return;
    // Monotonic guard: never allow older server state to overwrite newer client state
    if (S.me && me.updatedAt && S.me.updatedAt && me.updatedAt < S.me.updatedAt) {
      return;
    }
    const before = S.me ? S.me.level : null;
    S.me = me;
    S.offset = me.serverNow - Date.now();
    if (before !== null && me.level > before) toast('🎉 ' + t('levelUp'));
    saveVault(me, authVault);
  }

  /* ------------------------------------------------------------------ */
  /* avatar                                                              */
  /* ------------------------------------------------------------------ */
  const SKIN = ['#f6d7b8', '#e8b98a', '#c98f5f', '#9b6a43', '#6b4428'];
  const HAIR = ['#1a1a1a', '#3b2615', '#6b4423', '#9e9e9e', '#c47a2c', '#26327a'];
  const OUTFIT = ['#c62828', '#1565c0', '#2e7d32', '#f9a825', '#6a1b9a', '#00838f'];
  let avSeq = 0;

  function avatar(look, size = 48) {
    const id = 'av' + ++avSeq;
    const skin = SKIN[look.skin] || SKIN[0];
    const hair = HAIR[look.hair] || HAIR[0];
    const out = OUTFIT[look.outfit] || OUTFIT[0];
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
      <defs>
        <pattern id="${id}p" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="${out}"/>
          <rect width="5" height="5" fill="#fff" opacity=".85"/>
          <rect x="5" y="5" width="5" height="5" fill="#fff" opacity=".85"/>
        </pattern>
        <clipPath id="${id}c"><circle cx="50" cy="50" r="49"/></clipPath>
      </defs>
      <circle cx="50" cy="50" r="49" fill="#cfe9d1"/>
      <g clip-path="url(#${id}c)">
        <path d="M8 100 Q12 70 50 68 Q88 70 92 100Z" fill="${out}"/>
        <path d="M26 72 L50 92 L74 72 L74 84 L50 104 L26 84Z" fill="url(#${id}p)"/>
        <rect x="42" y="54" width="16" height="18" rx="6" fill="${skin}"/>
        <circle cx="50" cy="42" r="22" fill="${skin}"/>
        <path d="M27 42 Q27 17 50 17 Q73 17 73 42 Q62 28 50 30 Q38 28 27 42Z" fill="${hair}"/>
        <circle cx="42" cy="46" r="2.6" fill="#222"/><circle cx="58" cy="46" r="2.6" fill="#222"/>
        <path d="M43 55 Q50 61 57 55" stroke="#7a3b2e" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      </g></svg>`;
  }

  /* ------------------------------------------------------------------ */
  /* auth screen                                                         */
  /* ------------------------------------------------------------------ */
  const app = $('#app');

  function swatchRow(key, label, palette) {
    return `<div class="swatch-row"><span>${label}</span>${palette.map((c, i) =>
      `<button type="button" class="sw ${S.look[key] === i ? 'on' : ''}" data-look="${key}" data-i="${i}" style="background:${c}" aria-label="${label} ${i + 1}"></button>`
    ).join('')}</div>`;
  }

  function renderAuth() {
    const reg = S.authMode === 'register';
    app.innerHTML = `
      <div class="auth">
        <div class="logo">
          <h1>🌾 ${t('title')}</h1>
          <p>${t('tagline')}</p>
        </div>
        <div class="card">
          <div class="tabs2">
            <button data-mode="login" class="${reg ? '' : 'on'}">${t('login')}</button>
            <button data-mode="register" class="${reg ? 'on' : ''}">${t('register')}</button>
          </div>
          <form id="authForm" autocomplete="on">
            <label for="f_user">${t('username')}</label>
            <input id="f_user" name="username" type="text" autocapitalize="none" autocomplete="username" maxlength="16" value="${esc(S.form.username)}" required>
            <label for="f_pass">${t('password')}</label>
            <input id="f_pass" name="password" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" maxlength="72" value="${esc(S.form.password)}" required>
            <div class="remember-row">
              <label for="f_remember">
                <input id="f_remember" type="checkbox" ${S.remember ? 'checked' : ''}>
                <span>${t('rememberMe')}</span>
              </label>
            </div>
            ${reg ? `
              <label for="f_name">${t('displayName')}</label>
              <input id="f_name" name="name" type="text" maxlength="16" value="${esc(S.form.name)}">
              <label>${t('appearance')}</label>
              <div class="creator">
                <div class="preview" id="preview">${avatar(S.look, 96)}</div>
                <div class="swatches">
                  ${swatchRow('skin', t('skin'), SKIN)}
                  ${swatchRow('hair', t('hair'), HAIR)}
                  ${swatchRow('outfit', t('outfit'), OUTFIT)}
                </div>
              </div>` : ''}
            <p class="error" id="authErr"></p>
            <button class="btn" type="submit">${reg ? t('start') : t('login')}</button>
          </form>
        </div>
        <button class="btn small ghost" id="langBtn" type="button">${S.lang === 'km' ? 'English' : 'ខ្មែរ'}</button>
      </div>`;
  }

  async function submitAuth(e) {
    e.preventDefault();
    const reg = S.authMode === 'register';
    const err = $('#authErr');
    err.textContent = '';
    const userEl = $('#f_user');
    const passEl = $('#f_pass');
    const nameEl = $('#f_name');
    const username = (userEl ? userEl.value : S.form.username || '').trim();
    const password = passEl ? passEl.value : S.form.password || '';

    const rememberEl = $('#f_remember');
    const rememberMe = rememberEl ? rememberEl.checked : S.remember;
    S.remember = rememberMe;
    try { localStorage.setItem('srok_remember', rememberMe ? '1' : '0'); } catch {}
    if (rememberMe) {
      try {
        localStorage.setItem(
          'srok_saved_creds',
          JSON.stringify({ username, password })
        );
      } catch {}
    } else {
      try { localStorage.removeItem('srok_saved_creds'); } catch {}
    }

    try {
      const body = { username, password };
      if (reg) {
        body.name = (nameEl ? nameEl.value : S.form.name || '').trim();
        body.look = S.look;
      } else {
        const vault = getVault(username);
        if (vault) body.backup = vault;
      }
      const r = await api(reg ? '/api/register' : '/api/login', body);
      S.token = r.token;
      localStorage.setItem('token', S.token);
      S.form.username = username;
      S.form.password = rememberMe ? password : '';
      S.authMode = 'login';
      setMe(r.me, r.authVault);

      if (window.PasswordCredential && navigator.credentials && navigator.credentials.store) {
        try {
          const cred = new window.PasswordCredential({
            id: username,
            password: password,
            name: reg && body.name ? body.name : username,
          });
          navigator.credentials.store(cred).catch(() => {});
        } catch {}
      }

      enterGame();
    } catch (ex) {
      err.textContent = errText(ex) + (ex.message === 'username_taken' ? ' — ' + t('tryLogin') : '');
    }
  }

  /* ------------------------------------------------------------------ */
  /* game shell                                                          */
  /* ------------------------------------------------------------------ */
  let timers = [];

  function enterGame() {
    S.tab = 'farm';
    S.visit = null;
    S.chat = [];
    S.chatSince = 0;
    S.unread = 0;
    S.events = [];
    renderGame();
    startLoops();
    loadEvents();
  }

  function stopLoops() { timers.forEach(clearInterval); timers = []; }

  function startLoops() {
    stopLoops();
    timers.push(setInterval(tick, 1000));
    timers.push(setInterval(refreshMe, 60000));
    timers.push(setInterval(pollChat, 3000));
    timers.push(setInterval(loadEvents, 60000));
    timers.push(setInterval(() => { if (S.tab === 'social' && S.sub.social === 'friends' && !S.visit) loadFriends(); }, 20000));
    pollChat();
  }

  function forceLogout() {
    stopLoops();
    S.token = '';
    const lastUser = (S.me && S.me.username) || S.form.username || localStorage.getItem('last_user') || '';
    S.me = null;
    S.authMode = 'login';   // always return to the login tab (not "create account")
    S.form.username = lastUser;
    if (S.remember) {
      try {
        const sc = JSON.parse(localStorage.getItem('srok_saved_creds') || '{}');
        S.form.password = sc.password || '';
      } catch {
        S.form.password = '';
      }
    } else {
      S.form.password = '';
    }
    localStorage.removeItem('token');
    renderAuth();
  }

  async function logout() {
    try { await api('/api/logout', {}); } catch { /* ignore */ }
    forceLogout();
  }

  function renderGame() {
    app.innerHTML = `
      <header class="top" id="top"></header>
      <main id="main"></main>
      <nav class="bottom" id="nav"></nav>`;
    renderHeader();
    renderNav();
    renderTab();
  }

  function renderHeader() {
    const me = S.me;
    const lvStart = 25 * (me.level - 1) ** 2;
    const lvEnd = 25 * me.level ** 2;
    const pct = Math.max(0, Math.min(100, ((me.xp - lvStart) / (lvEnd - lvStart)) * 100));
    $('#top').innerHTML = `
      ${avatar(me.look, 44)}
      <div class="who">
        <b>${esc(me.name)}</b>
        <small>${t('level')} ${me.level}</small>
        <div class="xpbar"><i style="width:${pct}%"></i></div>
      </div>
      <span class="pill" title="${t('riel')}">💰 ${me.riel} ${t('riel')}</span>
      <button class="pill" id="langBtn" type="button">${S.lang === 'km' ? 'EN' : 'ខ្មែរ'}</button>
      <button class="pill" id="logoutBtn" type="button" title="${t('logout')}" aria-label="${t('logout')}">⎋</button>`;
  }

  function renderNav() {
    const tabs = [['farm', '🌾'], ['fish', '🎣'], ['village', '🏡'], ['shop', '🛒'], ['social', '👥']];
    const giftWaiting = S.events.some((e) => e.active && !e.claimed);
    $('#nav').innerHTML = tabs.map(([k, ic]) => {
      let badge = '';
      if (k === 'social' && S.unread) badge = `<span class="dot">${S.unread > 9 ? '9+' : S.unread}</span>`;
      if (k === 'village' && giftWaiting) badge = '<span class="dot">🎁</span>';
      return `<button data-tab="${k}" class="${S.tab === k ? 'on' : ''}"><span class="ic">${ic}</span>${t('tab_' + k)}${badge}</button>`;
    }).join('');
  }

  function segment(group, keys) {
    return `<div class="seg">${keys.map((k) =>
      `<button type="button" data-sub="${group}:${k}" class="${S.sub[group] === k ? 'on' : ''}">${t('sub_' + k)}</button>`).join('')}</div>`;
  }

  function renderTab() {
    const y = window.scrollY;
    const main = $('#main');
    if (S.tab === 'farm') renderFarm(main);
    else if (S.tab === 'fish') {
      main.innerHTML = `
        <div id="banners"></div>
        <div class="pond" id="pond"><div class="msg" id="pondMsg"></div></div>
        <button class="btn" id="fishBtn" type="button"></button>
        <div class="card" style="margin-top:14px"><div class="inv" id="inv"></div></div>`;
      renderFish();
      renderInv();
      renderBanners();
    } else if (S.tab === 'village') renderVillage(main);
    else if (S.tab === 'shop') renderShop(main);
    else if (S.tab === 'social') renderSocial(main);
    window.scrollTo(0, y);
  }

  /* ------------------------------------------------------------------ */
  /* generic in-place cell grid (plots, pen, yard)                       */
  /* Cells are updated, never replaced, so taps are not lost on a tick.  */
  /* ------------------------------------------------------------------ */
  function syncCells(g, kind, cells, readOnly) {
    if (!g) return;
    if (g.children.length !== cells.length || g.dataset.kind !== kind) {
      g.dataset.kind = kind;
      g.innerHTML = cells.map((_, i) =>
        `<button type="button" class="cell" data-kind="${kind}" data-i="${i}"><span class="em"></span><small></small><span class="drop"></span></button>`).join('');
    }
    cells.forEach((c, i) => {
      const b = g.children[i];
      const [em, sm, dr] = b.children;
      const cls = `cell ${kind}${c.cls ? ' ' + c.cls : ''}${readOnly ? ' view' : ''}`;
      if (b.className !== cls) b.className = cls;
      if (em.textContent !== c.em) em.textContent = c.em;
      if (sm.textContent !== c.sm) sm.textContent = c.sm;
      if (dr.textContent !== c.dr) dr.textContent = c.dr;
    });
  }

  function fmtTime(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${pad(s % 60)}`;
  }

  function plotCells(plots) {
    const now = srvNow();
    return plots.map((p) => {
      if (!p) return { cls: 'empty', em: '', sm: '', dr: '' };
      const crop = S.cfg.crops[p.crop];
      if (now >= p.readyAt) return { cls: 'ready', em: crop.emoji, sm: t('crop_' + crop.id), dr: '' };
      return { cls: '', em: '🌱', sm: fmtTime(p.readyAt - now), dr: (p.watered ? '💧' : '') + (p.fert ? '🧪' : '') };
    });
  }

  function penCells(animals) {
    const now = srvNow();
    const out = [];
    for (let i = 0; i < S.cfg.penCap; i++) {
      const a = animals[i];
      if (!a) { out.push({ cls: 'empty', em: '', sm: '', dr: '' }); continue; }
      const def = S.cfg.animals[a.type];
      const prod = S.cfg.products[def.product];
      if (a.readyAt === null) out.push({ cls: 'hungry', em: def.emoji, sm: '🍽 ' + def.feed, dr: '' });
      else if (now >= a.readyAt) out.push({ cls: 'ready', em: def.emoji, sm: t('ready'), dr: prod.emoji });
      else out.push({ cls: '', em: def.emoji, sm: fmtTime(a.readyAt - now), dr: '' });
    }
    return out;
  }

  function yardCells(placed) {
    return placed.map((id) => (id && S.cfg.decor[id]
      ? { cls: 'filled', em: S.cfg.decor[id].emoji, sm: '', dr: '' }
      : { cls: 'empty', em: '', sm: '', dr: '' }));
  }

  /* ------------------------------------------------------------------ */
  /* farm tab (crops + animals)                                          */
  /* ------------------------------------------------------------------ */
  function renderFarm(main) {
    if (S.sub.farm === 'crops') {
      main.innerHTML = `
        ${segment('farm', ['crops', 'animals'])}
        <div id="banners"></div>
        <div class="card">
          <div class="seeds" id="seeds"></div>
          <p class="hint">${t('seeds')}</p>
        </div>
        <div class="grid" id="grid"></div>
        <div class="card"><div class="inv" id="inv"></div></div>`;
    } else {
      main.innerHTML = `
        ${segment('farm', ['crops', 'animals'])}
        <div id="banners"></div>
        <div class="card"><b>🐔 ${t('pen')}</b> <small>${S.me.animals.length}/${S.cfg.penCap}</small>
          <p class="hint">${S.me.animals.length ? t('animalHint') : t('needAnimals')}</p></div>
        <div class="grid pen" id="pen"></div>
        <div class="card"><div class="inv" id="inv"></div></div>`;
    }
    updateFarm();
    renderBanners();
  }

  function updateSeeds() {
    const el = $('#seeds');
    if (!el) return;
    el.innerHTML = Object.values(S.cfg.crops).map((c) => {
      const locked = S.me.level < c.level;
      return `<button class="seed ${S.seed === c.id ? 'on' : ''} ${locked ? 'locked' : ''}" data-seed="${c.id}">
        <span class="e">${c.emoji}</span>${t('crop_' + c.id)}
        <small>${locked ? t('needLevel') + ' ' + c.level : c.seed + ' ' + t('riel')}</small></button>`;
    }).join('') + `<button class="seed ${S.seed === 'fert' ? 'on' : ''}" data-seed="fert">
        <span class="e">🧪</span>${t('tool_fert')}<small>×${S.me.fert}</small></button>`;
  }

  function sellBonus() {
    return S.events.filter((e) => e.active).reduce((n, e) => n + (e.sellBonus || 0), 0);
  }

  function invSummary() {
    const parts = [];
    let base = 0;
    const add = (group, defs) => {
      for (const [id, n] of Object.entries(S.me.inv[group] || {})) {
        if (!n || !defs[id]) continue;
        parts.push(`<span class="chip">${defs[id].emoji} ${n}</span>`);
        base += (defs[id].sell || 0) * n;
      }
    };
    add('crops', S.cfg.crops); add('fish', S.cfg.fish); add('products', S.cfg.products);
    return { parts, total: Math.floor(base * (1 + sellBonus())) };
  }

  function renderInv() {
    const el = $('#inv');
    if (!el) return;
    const { parts, total } = invSummary();
    const bonus = sellBonus();
    el.innerHTML = `<b>${t('inventory')}:</b> ` +
      (parts.length ? parts.join('') : `<span class="hint">${t('emptyInv')}</span>`) +
      `<button class="btn gold small" id="sellBtn" ${parts.length ? '' : 'disabled'} style="margin-left:auto">${t('sellAll')} (+${total}${bonus ? ' 🎉' : ''})</button>`;
  }

  function updateFarm() {
    if (S.tab !== 'farm') return;
    if (S.sub.farm === 'crops') { updateSeeds(); syncCells($('#grid'), 'plot', plotCells(S.me.plots), false); }
    else syncCells($('#pen'), 'animal', penCells(S.me.animals), false);
    renderInv();
  }

  // Runs an action that returns the player view (or an object containing it).
  async function act(path, body, after) {
    if (S.busy) return null;
    S.busy = true;
    try {
      const r = await api(path, body);
      setMe(r.me && r.result ? r.me : r);
      renderHeader();
      if (after) after(r);
      return r;
    } catch (ex) { toast(errText(ex)); return null; }
    finally { S.busy = false; }
  }

  async function plotAction(i) {
    const p = S.me.plots[i];
    if (!p) {
      if (S.seed === 'fert') return toast(t('pickSeed'));
      return act('/api/plant', { plot: i, crop: S.seed }, updateFarm);
    }
    if (srvNow() >= p.readyAt) {
      const crop = S.cfg.crops[p.crop];
      return act('/api/harvest', { plot: i }, () => { toast(`${crop.emoji} ${t('harvested')} +${crop.xp} XP`); updateFarm(); });
    }
    if (S.seed === 'fert') {
      if (p.fert) return toast(t('err_already_fertilized'));
      return act('/api/fertilize', { plot: i }, () => { toast('🧪 ' + t('fertUsed')); updateFarm(); });
    }
    if (!p.watered) return act('/api/water', { plot: i }, updateFarm);
    toast(t('growing'));
  }

  async function animalAction(i) {
    const a = S.me.animals[i];
    if (!a) return toast(t('needAnimals'));
    const def = S.cfg.animals[a.type];
    if (a.readyAt === null) return act('/api/animals/feed', { index: i }, () => { toast(`${def.emoji} ${t('fed')} -${def.feed}`); updateFarm(); });
    if (srvNow() >= a.readyAt) {
      return act('/api/animals/collect', { index: i }, (r) => {
        const prod = S.cfg.products[r.product];
        toast(prod.fertilizer ? `${prod.emoji} ${t('gotFert')}` : `${prod.emoji} ${t('collected')} ${nm(prod.name)}`);
        updateFarm();
      });
    }
    toast(t('growing'));
  }

  async function sellAll() {
    await act('/api/sell', {}, (r) => {
      toast(`💰 ${t('sold')} ${r.sold} ${t('riel')}` + (r.bonus ? ` (+${Math.round(r.bonus * 100)}% ${t('bonusWord')})` : ''));
      if (S.tab === 'farm') updateFarm(); else renderInv();
    });
  }

  /* ------------------------------------------------------------------ */
  /* events                                                              */
  /* ------------------------------------------------------------------ */
  async function loadEvents() {
    try {
      const r = await api('/api/events');
      S.events = r.events;
      renderNav();
      renderBanners();
      renderEventList();
      renderInv();
      if (S.tab === 'shop' && S.sub.shop === 'decor') renderShopBody();
    } catch { /* ignore */ }
  }

  function bonusLines(ev) {
    const out = [];
    if (ev.sellBonus) out.push('💰 ' + t('bonusSell', { n: Math.round(ev.sellBonus * 100) }));
    if (ev.growth && ev.growth < 1) out.push('🌱 ' + t('bonusGrow', { n: Math.round((1 - ev.growth) * 100) }));
    if (ev.fishLuck && ev.fishLuck > 1) out.push('🎣 ' + t('bonusFish'));
    if (ev.giftRiel) out.push('🎁 ' + t('bonusGift', { n: ev.giftRiel }));
    return out;
  }

  function fmtDur(ms) {
    const mins = Math.max(0, Math.floor(ms / 60000));
    const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
    if (d >= 1) return `${d}${t('dayShort')} ${h}${t('hourShort')}`;
    if (h >= 1) return `${h}${t('hourShort')} ${m}${t('minShort')}`;
    return `${m}${t('minShort')}`;
  }

  function claimBtn(ev) {
    return ev.claimed
      ? `<button class="btn small ghost" disabled>${t('claimed')}</button>`
      : `<button class="btn small gold" data-claim="${ev.id}">🎁 ${t('claim')} +${ev.giftRiel}</button>`;
  }

  function renderBanners() {
    const el = $('#banners');
    if (!el) return;
    el.innerHTML = S.events.filter((e) => e.active).map((ev) => `
      <div class="card event-banner">
        <div class="row">
          <span class="big-emoji">${ev.emoji}</span>
          <div class="grow"><b>${esc(nm(ev.name))}</b><small>${bonusLines(ev).map(esc).join(' · ')}</small></div>
          ${claimBtn(ev)}
        </div>
      </div>`).join('');
  }

  function renderEventList() {
    const el = $('#evlist');
    if (!el) return;
    const now = srvNow();
    el.innerHTML = `<div class="card"><b>🎉 ${t('eventsTitle')}</b></div>` + S.events.map((ev) => {
      const status = ev.active
        ? `<span class="tag on">${t('evActive')}</span> <small>${t('evEnds')} ${fmtDur(ev.endsAt - now)}</small>`
        : (ev.startsAt ? `<span class="tag">${t('evStarts')} ${fmtDur(ev.startsAt - now)}</span>` : `<span class="tag">${t('evNone')}</span>`);
      const items = (ev.items || []).map((id) => S.cfg.decor[id]).filter(Boolean)
        .map((d) => `<span class="chip">${d.emoji} ${esc(nm(d.name))}</span>`).join('');
      return `<div class="card event ${ev.active ? 'active' : ''}">
        <div class="row">
          <span class="big-emoji">${ev.emoji}</span>
          <div class="grow"><b>${esc(nm(ev.name))}</b><div>${status}</div></div>
        </div>
        <p class="hint">${esc(nm(ev.desc))}</p>
        <ul class="bonus">${bonusLines(ev).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
        ${items ? `<div class="inv"><small>${t('specialItems')}:</small> ${items}</div>` : ''}
        ${ev.active ? `<div style="margin-top:8px">${claimBtn(ev)}</div>` : ''}
      </div>`;
    }).join('');
  }

  async function claimGift(id) {
    await act('/api/event/claim', { event: id }, (r) => {
      toast(`🎁 ${t('giftGot')} +${r.gift.riel} ${t('riel')}, 🧪 +${r.gift.fert}`);
      loadEvents();
    });
  }

  /* ------------------------------------------------------------------ */
  /* village (yard + festivals)                                          */
  /* ------------------------------------------------------------------ */
  const placedCount = (id) => S.me.decor.placed.filter((x) => x === id).length;
  const availDecor = (id) => (S.me.decor.owned[id] || 0) - placedCount(id);

  function fixPick() {
    if (S.pick === '__remove') return;
    if (S.pick && availDecor(S.pick) > 0) return;
    S.pick = Object.keys(S.me.decor.owned).find((id) => availDecor(id) > 0) || null;
  }

  function renderVillage(main) {
    main.innerHTML = `
      <div class="card">
        <b>🏡 ${t('yardTitle')}</b>
        <p class="hint">${Object.keys(S.me.decor.owned).length ? t('pickDecor') : t('noDecor')}</p>
        <div class="grid yardgrid" id="yard"></div>
        <div class="seeds" id="palette"></div>
      </div>
      <div id="evlist"></div>`;
    updateVillage();
    renderEventList();
  }

  function updateVillage() {
    if (S.tab !== 'village') return;
    fixPick();
    syncCells($('#yard'), 'yard', yardCells(S.me.decor.placed), false);
    const pal = $('#palette');
    if (!pal) return;
    const chips = Object.keys(S.me.decor.owned).filter((id) => S.cfg.decor[id] && (availDecor(id) > 0 || S.pick === id)).map((id) => {
      const d = S.cfg.decor[id];
      return `<button class="seed ${S.pick === id ? 'on' : ''}" data-pick="${id}"><span class="e">${d.emoji}</span>${esc(nm(d.name))}<small>×${availDecor(id)}</small></button>`;
    });
    if (S.me.decor.placed.some(Boolean)) {
      chips.push(`<button class="seed ${S.pick === '__remove' ? 'on' : ''}" data-pick="__remove"><span class="e">✖</span>${t('removeChip')}<small>&nbsp;</small></button>`);
    }
    pal.innerHTML = chips.join('');
  }

  async function yardAction(i) {
    if (!S.pick) return toast(Object.keys(S.me.decor.owned).length ? t('pickDecor') : t('noDecor'));
    await act('/api/decor/place', { slot: i, id: S.pick === '__remove' ? null : S.pick }, updateVillage);
  }

  /* ------------------------------------------------------------------ */
  /* shop                                                                */
  /* ------------------------------------------------------------------ */
  function renderShop(main) {
    main.innerHTML = `
      <div class="seg">
        ${['farm', 'decor', 'animals'].map((k) =>
          `<button type="button" data-sub="shop:${k}" class="${S.sub.shop === k ? 'on' : ''}">${t('sub_' + k)}</button>`).join('')}
      </div>
      <div id="shopBody"></div>`;
    renderShopBody();
  }

  function card(o) {
    return `<div class="card shopcard ${o.locked ? 'locked' : ''}">
      <div class="row">
        <span class="big-emoji">${o.emoji}</span>
        <div class="grow"><b>${o.title}</b><small>${o.desc || ''}</small></div>
        ${o.btn ? `<button class="btn small ${o.disabled ? '' : 'gold'}" data-buy="${o.buy}" ${o.disabled ? 'disabled' : ''}>${o.btn}</button>` : ''}
      </div>
    </div>`;
  }

  function renderShopBody() {
    const body = $('#shopBody');
    if (!body) return;
    const me = S.me, cfg = S.cfg;
    const lock = (lv) => me.level < lv;
    let html = '';

    if (S.sub.shop === 'farm') {
      const step = cfg.shop.land.find((s) => s.plots > me.plots.length);
      html += step
        ? card({ emoji: '🟫', title: t('landTitle'), desc: `${me.plots.length} → ${step.plots} ${t('plotsWord')} · ${t('landDesc')}` + (lock(step.level) ? ` · ${t('needLevel')} ${step.level}` : ''),
            btn: `${step.price} ${t('riel')}`, buy: 'land', disabled: lock(step.level) || me.riel < step.price, locked: lock(step.level) })
        : card({ emoji: '🟫', title: t('landTitle'), desc: `${me.plots.length} ${t('plotsWord')} · ${t('maxed')}` });

      html += `<div class="card shopcard"><div class="row"><span class="big-emoji">🧪</span>
        <div class="grow"><b>${t('fertTitle')}</b><small>${t('fertDesc')} · ${t('inStock')}: ${me.fert}</small></div></div>
        <div class="row" style="padding-top:8px">
          <button class="btn small gold" data-buy="fert:1" ${me.riel < cfg.shop.fertPrice ? 'disabled' : ''}>${t('buy')} ×1 · ${cfg.shop.fertPrice}</button>
          <button class="btn small gold" data-buy="fert:5" ${me.riel < cfg.shop.fertPrice * 5 ? 'disabled' : ''}>${t('buy')} ×5 · ${cfg.shop.fertPrice * 5}</button>
        </div></div>`;

      const up = cfg.shop.canUpgrades[me.canLevel - 1];
      const saves = Math.round(cfg.shop.canSave[me.canLevel - 1] * 100);
      const canName = `${t('canTitle')} ${me.canLevel}/${cfg.shop.canUpgrades.length + 1}`;
      html += up
        ? card({ emoji: '🚿', title: canName,
            desc: t('canDesc', { n: saves }) + ` → ${Math.round(cfg.shop.canSave[me.canLevel] * 100)}%` + (lock(up.level) ? ` · ${t('needLevel')} ${up.level}` : ''),
            btn: `${up.price} ${t('riel')}`, buy: 'can', disabled: lock(up.level) || me.riel < up.price, locked: lock(up.level) })
        : card({ emoji: '🚿', title: canName, desc: t('canDesc', { n: saves }) + ` · ${t('maxed')}` });
    } else if (S.sub.shop === 'decor') {
      const items = Object.values(cfg.decor).sort((a, b) => (!!a.event - !!b.event) || a.price - b.price);
      const availNow = new Set(S.events.filter((e) => e.active).flatMap((e) => e.items || []));
      html += items.map((d) => {
        const evLocked = d.event && !availNow.has(d.id);
        const lv = lock(d.level);
        const owned = me.decor.owned[d.id] || 0;
        return card({
          emoji: d.emoji, title: esc(nm(d.name)),
          desc: [d.event ? '🎉 ' + t('eventOnly') : '', lv ? `${t('needLevel')} ${d.level}` : '', owned ? `${t('owned')} ×${owned}` : ''].filter(Boolean).join(' · '),
          btn: `${d.price} ${t('riel')}`, buy: 'decor:' + d.id,
          disabled: evLocked || lv || me.riel < d.price, locked: evLocked || lv,
        });
      }).join('');
    } else {
      html += `<div class="card"><b>🐔 ${t('penWord')}</b> <small>${me.animals.length}/${cfg.penCap}</small></div>`;
      html += Object.values(cfg.animals).map((a) => {
        const prod = cfg.products[a.product];
        const secs = Math.round(a.time * (cfg.speed || 1) / 1000);
        const lv = lock(a.level);
        return card({
          emoji: a.emoji, title: esc(nm(a.name)),
          desc: `${t('makesWord')} ${prod.emoji} ${esc(nm(prod.name))} ${t('everyWord')} ${secs >= 60 ? Math.round(secs / 60) + ' ' + t('minShort') : secs + t('secShort')} · ${t('feedWord')} ${a.feed}` + (lv ? ` · ${t('needLevel')} ${a.level}` : ''),
          btn: `${a.price} ${t('riel')}`, buy: 'animal:' + a.id,
          disabled: lv || me.riel < a.price || me.animals.length >= cfg.penCap, locked: lv,
        });
      }).join('');
    }
    body.innerHTML = html;
  }

  async function buy(what) {
    const [kind, arg] = what.split(':');
    const map = {
      land: ['/api/shop/land', {}],
      fert: ['/api/shop/fertilizer', { qty: Number(arg) }],
      can: ['/api/shop/can', {}],
      decor: ['/api/decor/buy', { id: arg }],
      animal: ['/api/animals/buy', { type: arg }],
    };
    const [path, body] = map[kind];
    await act(path, body, () => { toast('✅ ' + t('buy')); renderShopBody(); });
  }

  /* ------------------------------------------------------------------ */
  /* fishing                                                             */
  /* ------------------------------------------------------------------ */
  let fishTimers = [];
  const clearFishTimers = () => { fishTimers.forEach(clearTimeout); fishTimers = []; };

  function renderFish() {
    if (S.tab !== 'fish') return;
    const f = S.fish;
    const pond = $('#pond'), msg = $('#pondMsg'), btn = $('#fishBtn');
    if (!pond) return;
    pond.classList.toggle('bite', f.state === 'bite');
    let text;
    if (f.state === 'idle') text = `<span class="big">🎣</span>${t('fishIdle')}`;
    else if (f.state === 'waiting') text = `<span class="big">🎣</span>${t('fishWait')}`;
    else if (f.state === 'bite') text = `<span class="big">❗</span>${t('fishBite')}`;
    else text = `<span class="big">${f.emoji}</span>${esc(f.msg)}`;
    msg.innerHTML = text;
    btn.textContent = (f.state === 'waiting' || f.state === 'bite') ? t('reel') : t('cast');
  }

  async function fishAction() {
    if (S.busy) return;
    const f = S.fish;
    S.busy = true;
    try {
      if (f.state === 'idle' || f.state === 'result') {
        const r = await api('/api/fish/cast', {});
        S.fish = { state: 'waiting' };
        clearFishTimers();
        fishTimers.push(setTimeout(() => {
          if (S.fish.state !== 'waiting') return;
          S.fish.state = 'bite';
          renderFish();
          fishTimers.push(setTimeout(() => {
            if (S.fish.state !== 'bite') return;
            S.fish = { state: 'result', msg: t('missed'), emoji: '💨' };
            renderFish();
          }, r.window + 200));
        }, r.delay));
      } else {
        clearFishTimers();
        const r = await api('/api/fish/reel', {});
        if (r.result === 'caught') {
          setMe(r.me);
          const fish = S.cfg.fish[r.fish];
          S.fish = { state: 'result', msg: `${t('caught')} ${t('fish_' + r.fish)}!`, emoji: fish.emoji };
          renderHeader();
          renderInv();
        } else {
          S.fish = { state: 'result', msg: t(r.result), emoji: r.result === 'early' ? '🙈' : '💨' };
        }
      }
    } catch (ex) { toast(errText(ex)); S.fish = { state: 'idle' }; }
    S.busy = false;
    renderFish();
  }

  /* ------------------------------------------------------------------ */
  /* social: friends + chat                                              */
  /* ------------------------------------------------------------------ */
  function renderSocial(main) {
    main.innerHTML = `
      ${segment('social', ['friends', 'chat'])}
      <div id="socialBody"></div>`;
    if (S.sub.social === 'chat') { S.unread = 0; renderNav(); renderChatView(); }
    else renderFriends();
  }

  async function loadFriends() {
    try {
      S.friends = (await api('/api/friends')).friends;
      if (S.tab === 'social' && S.sub.social === 'friends' && !S.visit) renderFriendList();
    } catch { /* ignore */ }
  }

  function renderFriends() {
    const body = $('#socialBody');
    if (!body) return;
    if (S.visit) {
      const v = S.visit;
      body.innerHTML = `
        <div class="card">
          <div class="row">
            ${avatar(v.look, 44)}
            <div class="grow"><b>${t('farmOf')} ${esc(v.name)}</b><small>${t('level')} ${v.level}</small></div>
            <button class="btn small ghost" id="backBtn" type="button">${t('back')}</button>
          </div>
        </div>
        <div class="grid" id="vgrid"></div>
        <div class="card"><b>🏡 ${t('yardTitle')}</b><div class="grid yardgrid" id="vyard" style="margin-top:8px"></div></div>
        <div class="card"><b>🐔 ${t('pen')}</b><div class="grid pen" id="vpen" style="margin-top:8px"></div></div>`;
      updateVisit();
      return;
    }
    body.innerHTML = `
      <div class="card">
        <form class="addrow" id="friendForm">
          <input type="text" id="friendInput" maxlength="16" autocapitalize="none" placeholder="${t('friendName')}">
          <button class="btn small" type="submit">${t('addFriend')}</button>
        </form>
      </div>
      <div class="card" id="flist">${t('loading')}</div>`;
    renderFriendList();
    loadFriends();
  }

  function renderFriendList() {
    const el = $('#flist');
    if (!el) return;
    if (!S.friends.length) { el.innerHTML = `<span class="hint">${t('noFriends')}</span>`; return; }
    el.innerHTML = S.friends.map((f) => `
      <div class="row">
        ${avatar(f.look, 40)}
        <div class="grow"><b>${esc(f.name)}</b>
          <small><span class="on-dot ${f.online ? 'online' : ''}"></span>@${esc(f.username)} · ${t('level')} ${f.level}</small></div>
        <button class="btn small" data-visit="${esc(f.username)}" type="button">${t('visit')}</button>
        <button class="btn small ghost" data-unfriend="${esc(f.username)}" type="button" aria-label="${t('remove')}">✕</button>
      </div>`).join('');
  }

  function updateVisit() {
    if (!S.visit) return;
    syncCells($('#vgrid'), 'plot', plotCells(S.visit.plots), true);
    syncCells($('#vyard'), 'yard', yardCells(S.visit.yard), true);
    syncCells($('#vpen'), 'animal', penCells(S.visit.animals), true);
  }

  async function visitFriend(username) {
    try {
      S.visit = await api('/api/farm/' + encodeURIComponent(username));
      renderFriends();
    } catch (ex) { toast(errText(ex)); }
  }

  function renderChatView() {
    const body = $('#socialBody');
    if (!body) return;
    body.innerHTML = `
      <div class="card">
        <b>${t('chatTitle')}</b> <small id="onlineCount"></small>
        <div class="chatbox" id="chatbox"></div>
        <form class="addrow" id="chatForm" style="margin-top:8px">
          <input type="text" id="chatInput" maxlength="200" placeholder="${t('typeMsg')}" autocomplete="off">
          <button class="btn small" type="submit">${t('send')}</button>
        </form>
      </div>`;
    renderChat(true);
  }

  async function pollChat() {
    if (!S.me) return;
    try {
      const r = await api('/api/chat?since=' + S.chatSince);
      S.online = r.online;
      const chatOpen = S.tab === 'social' && S.sub.social === 'chat';
      if (r.messages.length) {
        S.chat.push(...r.messages);
        S.chat = S.chat.slice(-100);
        S.chatSince = r.messages[r.messages.length - 1].id;
        if (chatOpen) renderChat(false);
        else {
          S.unread += r.messages.filter((m) => m.user !== S.me.username).length;
          renderNav();
        }
      }
      const oc = $('#onlineCount');
      if (oc) oc.textContent = `· 🟢 ${S.online} ${t('online')}`;
    } catch { /* ignore */ }
  }

  function renderChat(forceBottom) {
    const box = $('#chatbox');
    if (!box) return;
    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
    box.innerHTML = S.chat.map((m) => {
      const d = new Date(m.t);
      return `<div class="msg-line ${m.user === S.me.username ? 'me' : ''}"><b>${esc(m.name)}:</b> ${esc(m.text)}<small>${pad(d.getHours())}:${pad(d.getMinutes())}</small></div>`;
    }).join('');
    if (forceBottom || nearBottom) box.scrollTop = box.scrollHeight;
    const oc = $('#onlineCount');
    if (oc) oc.textContent = `· 🟢 ${S.online} ${t('online')}`;
  }

  /* ------------------------------------------------------------------ */
  /* loops                                                               */
  /* ------------------------------------------------------------------ */
  let tickCount = 0;
  function tick() {
    if (!S.me) return;
    tickCount++;
    if (S.tab === 'farm') {
      if (S.sub.farm === 'crops') syncCells($('#grid'), 'plot', plotCells(S.me.plots), false);
      else syncCells($('#pen'), 'animal', penCells(S.me.animals), false);
    } else if (S.tab === 'social' && S.sub.social === 'friends' && S.visit) updateVisit();
    else if (S.tab === 'village' && tickCount % 30 === 0) renderEventList();
  }

  async function refreshMe() {
    try {
      setMe(await api('/api/me'));
      renderHeader();
    } catch { /* ignore */ }
  }

  /* ------------------------------------------------------------------ */
  /* events (delegated)                                                  */
  /* ------------------------------------------------------------------ */
  function switchLang() {
    S.lang = S.lang === 'km' ? 'en' : 'km';
    localStorage.setItem('lang', S.lang);
    document.documentElement.lang = S.lang === 'km' ? 'km' : 'en';
    if (S.me) renderGame(); else renderAuth();
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('button');
    if (!el) return;
    const d = el.dataset;

    if (d.kind) {
      if (el.classList.contains('view')) return;
      const i = Number(d.i);
      if (d.kind === 'plot') return plotAction(i);
      if (d.kind === 'animal') return animalAction(i);
      if (d.kind === 'yard') return yardAction(i);
    }
    if (el.id === 'langBtn') return switchLang();
    if (el.id === 'logoutBtn') return logout();
    if (d.mode) {
      const uEl = $('#f_user');
      const pEl = $('#f_pass');
      const rEl = $('#f_remember');
      if (uEl) S.form.username = uEl.value;
      if (pEl) S.form.password = pEl.value;
      if (rEl) S.remember = rEl.checked;
      S.authMode = d.mode;
      return renderAuth();
    }
    if (d.look) {
      S.look[d.look] = Number(d.i);
      $('#preview').innerHTML = avatar(S.look, 96);
      document.querySelectorAll(`[data-look="${d.look}"]`).forEach((b) => b.classList.toggle('on', b === el));
      return;
    }
    if (d.tab) {
      if (d.tab === S.tab) return;
      S.tab = d.tab;
      renderNav();
      return renderTab();
    }
    if (d.sub) {
      const [group, val] = d.sub.split(':');
      if (S.sub[group] === val && !(group === 'social' && S.visit)) return;
      S.sub[group] = val;
      if (group === 'social') S.visit = null;
      return renderTab();
    }
    if (d.seed) {
      if (d.seed !== 'fert' && S.me.level < S.cfg.crops[d.seed].level) { toast(`${t('needLevel')} ${S.cfg.crops[d.seed].level}`); return; }
      S.seed = d.seed;
      return updateSeeds();
    }
    if (d.pick) { S.pick = d.pick; return updateVillage(); }
    if (d.buy) return buy(d.buy);
    if (d.claim) return claimGift(d.claim);
    if (el.id === 'sellBtn') return sellAll();
    if (el.id === 'fishBtn') return fishAction();
    if (el.id === 'backBtn') { S.visit = null; return renderFriends(); }
    if (d.visit) return visitFriend(d.visit);
    if (d.unfriend) {
      api('/api/friends/remove', { username: d.unfriend })
        .then((r) => {
          if (r && r.me) setMe(r.me);
          loadFriends();
        })
        .catch((ex) => toast(errText(ex)));
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'f_user') S.form.username = e.target.value;
    if (e.target.id === 'f_pass') S.form.password = e.target.value;
    if (e.target.id === 'f_name') S.form.name = e.target.value;
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'f_remember') {
      S.remember = e.target.checked;
      try { localStorage.setItem('srok_remember', S.remember ? '1' : '0'); } catch {}
    }
  });

  document.addEventListener('submit', async (e) => {
    if (e.target.id === 'authForm') return submitAuth(e);
    e.preventDefault();
    if (e.target.id === 'friendForm') {
      const input = $('#friendInput');
      const name = input.value.trim();
      if (!name) return;
      try {
        const r = await api('/api/friends', { username: name });
        if (r && r.me) setMe(r.me);
        input.value = '';
        loadFriends();
      } catch (ex) { toast(errText(ex)); }
    }
    if (e.target.id === 'chatForm') {
      const input = $('#chatInput');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      try { await api('/api/chat', { text }); pollChat(); }
      catch (ex) { toast(errText(ex)); input.value = text; }
    }
  });

  /* ------------------------------------------------------------------ */
  /* boot                                                                */
  /* ------------------------------------------------------------------ */
  async function boot() {
    document.documentElement.lang = S.lang === 'km' ? 'km' : 'en';
    app.innerHTML = `<div class="auth"><div class="logo"><h1>🌾</h1><p>${t('loading')}</p></div></div>`;
    try {
      S.cfg = await api('/api/config');
    } catch {
      app.innerHTML = `<div class="auth"><div class="card">${t('err_network')}</div></div>`;
      return;
    }
    if (S.token) {
      try {
        setMe(await api('/api/me'));
        enterGame();
        return;
      } catch {
        if (S.form.username && S.form.password) {
          try {
            const vault = getVault(S.form.username);
            const body = { username: S.form.username, password: S.form.password };
            if (vault) body.backup = vault;
            const r = await api('/api/login', body);
            S.token = r.token;
            localStorage.setItem('token', S.token);
            setMe(r.me, r.authVault);
            enterGame();
            return;
          } catch { /* proceed to renderAuth */ }
        }
        S.token = '';
        localStorage.removeItem('token');
      }
    }
    const lastUser = localStorage.getItem('last_user');
    if (lastUser) S.form.username = lastUser;
    renderAuth();
  }

  window.addEventListener('storage', (e) => {
    if (S.me && e.key === 'srok_vault_' + S.me.username.toLowerCase()) {
      try {
        const updated = JSON.parse(e.newValue);
        if (updated && updated.username === S.me.username) {
          S.me = { ...S.me, ...updated };
          renderHeader();
          if (S.tab === 'farm') updateFarm();
        }
      } catch {}
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && S.token && S.me) {
      refreshMe();
    }
  });

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  boot();
})();
