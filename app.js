/* ============================================================
   ATHLETE PROFILE BUILDER — Application Logic
   ============================================================ */

'use strict';

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function inchesToFeet(in_) {
  return `${Math.floor(in_ / 12)}'${in_ % 12}"`;
}

// ──────────────────────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────────────────────
const state = {
  screenIndex:      0,
  identitySubStep:  1,

  // Identity
  name:         '',
  position:     '',   // Forward | Midfielder | Defender | Goalkeeper
  height:       70,   // inches
  weight:       175,  // lbs
  jerseyNumber: '',
  dominantFoot: '',   // Left | Right | Both

  // Stats
  statsMethod:  '',   // link | manual
  statsLink:    '',
  gamesPlayed:  '',

  // Field-player stats
  goals: '', assists: '', shots: '', minutes: '', passAcc: '', tackles: '',

  // Goalkeeper stats
  saves: '', cleanSheets: '', gaa: '',

  // Cards
  highlights:   [],   // [{id}]
  experience:   [],
  testimonials: [],

  // Academics
  showAcademics: false,
  gpa: '', ncaaId: '', major: '',
  honors: [],

  // Personality
  personalityTags: [],

  // Media (preview / fallback: photoDataUrl; persisted URL: photoStorageUrl)
  photoDataUrl: null,
  photoStorageUrl: null,
  photoObjectUrl: null,
  statsPublic:  true,
  photoPublic:  true,

  // Contact
  email: '', phone: '', instagram: '', parentEmail: '',

  confirmed: false,
};

// ──────────────────────────────────────────────────────────────
// SCREEN FLOW
// ──────────────────────────────────────────────────────────────
const SCREENS = [
  'start',
  'identity',
  'stats-method',
  'stats',
  'highlights',
  'academics',
  'experience',
  'testimonials',
  'personality',
  'media',
  'contact',
  'confirmation',
];

function currentScreen() { return SCREENS[state.screenIndex]; }

// ──────────────────────────────────────────────────────────────
// NAVIGATION
// ──────────────────────────────────────────────────────────────
function goNext() {
  const id = currentScreen();

  // Identity: advance sub-steps first
  if (id === 'identity' && state.identitySubStep < 4) {
    advanceIdentitySub(1);
    return;
  }

  // Stats-method: require a selection
  if (id === 'stats-method' && !state.statsMethod) {
    flashMissing($('method-cards'));
    return;
  }

  const next = state.screenIndex + 1;
  if (next >= SCREENS.length) return;

  transitionTo(state.screenIndex, next, 'fwd');
  state.screenIndex = next;
  onScreenEnter(SCREENS[next]);
  refreshNav();
  refreshDots();
}

function goBack() {
  const id = currentScreen();

  // Identity: reverse sub-steps first
  if (id === 'identity' && state.identitySubStep > 1) {
    advanceIdentitySub(-1);
    return;
  }

  const prev = state.screenIndex - 1;
  if (prev < 0) return;

  transitionTo(state.screenIndex, prev, 'bck');
  state.screenIndex = prev;
  onScreenEnter(SCREENS[prev]);
  refreshNav();
  refreshDots();
}

function transitionTo(fromIdx, toIdx, dir) {
  const from = document.querySelector(`[data-screen="${SCREENS[fromIdx]}"]`);
  const to   = document.querySelector(`[data-screen="${SCREENS[toIdx]}"]`);

  from.classList.remove('active');
  from.classList.add(dir === 'fwd' ? 'exit-left' : 'exit-right');

  // Position incoming screen off-screen instantly, then animate in
  to.style.transition = 'none';
  to.style.transform  = dir === 'fwd' ? 'translateX(48px)' : 'translateX(-48px)';
  to.style.opacity    = '0';

  // Force reflow
  to.getBoundingClientRect();

  to.style.transition = '';
  to.classList.add('active');
  to.style.transform  = '';
  to.style.opacity    = '';

  setTimeout(() => from.classList.remove('exit-left', 'exit-right'), 400);
}

function onScreenEnter(id) {
  if (id === 'stats') showStatsPanel();
  if (id === 'confirmation') buildConfirmation();

  // Seed empty cards on first visit
  if (id === 'highlights'  && state.highlights.length === 0)   addHighlightCard();
  if (id === 'experience'  && state.experience.length === 0)   addExperienceCard();
  if (id === 'testimonials' && state.testimonials.length === 0) {/* wait for user choice */}
}

function flashMissing(el) {
  el.style.outline = '2px solid var(--error)';
  setTimeout(() => (el.style.outline = ''), 800);
}

// ──────────────────────────────────────────────────────────────
// NAV BAR & DOTS
// ──────────────────────────────────────────────────────────────
function refreshNav() {
  const id   = currentScreen();
  const back = $('nav-back');
  const next = $('nav-next');

  back.style.visibility = id === 'start' ? 'hidden' : 'visible';
  next.style.display    = id === 'confirmation' ? 'none' : 'flex';
}

function refreshDots() {
  const container = $('progress-dots');
  container.innerHTML = '';
  // Dots for screens 1–11 (exclude start)
  for (let i = 1; i < SCREENS.length; i++) {
    const dot = document.createElement('div');
    dot.className = 'p-dot';
    if      (i === state.screenIndex) dot.classList.add('active');
    else if (i <  state.screenIndex) dot.classList.add('done');
    container.appendChild(dot);
  }
}

// ──────────────────────────────────────────────────────────────
// IDENTITY SUB-STEPS
// ──────────────────────────────────────────────────────────────
function advanceIdentitySub(delta) {
  const next = state.identitySubStep + delta;
  if (next < 1 || next > 4) return;

  const cur = $(`id-sub-${state.identitySubStep}`);
  const nxt = $(`id-sub-${next}`);

  // Slide out
  cur.style.animation = 'none';
  cur.classList.remove('active');

  // Slide in
  nxt.style.animation = '';
  nxt.classList.add('active');

  state.identitySubStep = next;
  refreshIdentityDots();

  // Show stat badges on step 3
  $('badge-ht').classList.toggle('visible', next === 3);
  $('badge-wt').classList.toggle('visible', next === 3);
}

function refreshIdentityDots() {
  for (let i = 1; i <= 4; i++) {
    const dot = $(`id-dot-${i}`);
    dot.className = 'id-dot';
    if      (i < state.identitySubStep) dot.classList.add('done');
    else if (i === state.identitySubStep) dot.classList.add('active');
  }
}

// ──────────────────────────────────────────────────────────────
// SILHOUETTE
// ──────────────────────────────────────────────────────────────
function setPose(pose) {
  $('silhouette-svg').setAttribute('data-pose', pose);
}

function updateJerseyOverlay(num) {
  const el = $('jersey-text');
  el.textContent = num || '00';
  el.setAttribute('opacity', num && num.length > 0 ? '1' : '0');
}

function updateFootClasses(foot) {
  const svg = $('silhouette-svg');
  svg.classList.remove('foot-left', 'foot-right', 'foot-both');
  if (foot === 'Left')  svg.classList.add('foot-left');
  if (foot === 'Right') svg.classList.add('foot-right');
  if (foot === 'Both')  svg.classList.add('foot-both');
}

// ──────────────────────────────────────────────────────────────
// STATS PANEL ROUTING
// ──────────────────────────────────────────────────────────────
function showStatsPanel() {
  const lp = $('stats-link-panel');
  const fp = $('stats-field-panel');
  const gp = $('stats-gk-panel');

  lp.classList.add('hidden');
  fp.classList.add('hidden');
  gp.classList.add('hidden');

  if (state.statsMethod === 'link') {
    lp.classList.remove('hidden');
  } else if (state.position === 'Goalkeeper') {
    gp.classList.remove('hidden');
    staggerReveal('gk-stats-grid');
  } else {
    fp.classList.remove('hidden');
    staggerReveal('field-stats-grid');
  }
}

function staggerReveal(gridId) {
  const cards = $$('.stat-card', $(gridId));
  cards.forEach((c, i) => {
    c.classList.remove('reveal');
    setTimeout(() => c.classList.add('reveal'), i * 110);
  });
}

// ──────────────────────────────────────────────────────────────
// CARD SYSTEMS
// ──────────────────────────────────────────────────────────────
let _hlCount = 0;
function addHighlightCard() {
  _hlCount++;
  const id = `hl-${Date.now()}`;
  state.highlights.push({ id });

  const card = document.createElement('div');
  card.className = 'entry-card';
  card.dataset.id = id;
  card.innerHTML = `
    <div class="entry-card-header">
      <span class="entry-card-label">Highlight #${_hlCount}</span>
      <button class="remove-btn" aria-label="Remove">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    <div class="entry-card-body">
      <div class="card-field">
        <label>HIGHLIGHT TITLE</label>
        <input type="text" placeholder="e.g., State Championship Winning Goal"/>
      </div>
      <div class="card-row">
        <div class="card-field">
          <label>OPPONENT / EVENT</label>
          <input type="text" placeholder="vs. Westview High"/>
        </div>
        <div class="card-field">
          <label>DATE</label>
          <input type="text" placeholder="e.g., Fall 2024"/>
        </div>
      </div>
      <div class="card-field">
        <label>DESCRIPTION</label>
        <textarea rows="3" placeholder="Tell the story behind this moment…"></textarea>
      </div>
      <div class="card-field">
        <label>MEDIA URL <span style="opacity:.45;font-size:.55rem;">(OPTIONAL)</span></label>
        <input type="url" class="field-input highlight-media-url" placeholder="https://youtube.com/..."/>
      </div>
      <div class="card-field">
        <label>MEDIA <span style="opacity:.45;font-size:.55rem;">(OPTIONAL)</span></label>
        <input type="file" class="highlight-file-input" accept="image/*,video/*" style="display:none;" aria-hidden="true"/>
        <div class="media-drop" tabindex="0" role="button" aria-label="Upload highlight video or image">
          <span class="material-symbols-outlined">cloud_upload</span>
          <span class="media-drop-label">Click or drop video / image (max 50 MB)</span>
        </div>
        <p class="highlight-upload-status" aria-live="polite"></p>
      </div>
    </div>`;

  card.querySelector('.remove-btn').addEventListener('click', () => {
    card.remove();
    state.highlights = state.highlights.filter(h => h.id !== id);
    updateStrength();
  });

  wireHighlightMedia(card, id);
  $('highlights-container').appendChild(card);
  updateStrength();
}

let _expCount = 0;
function addExperienceCard() {
  _expCount++;
  const id  = `exp-${Date.now()}`;
  const rec = { id, type: 'Activity' };
  state.experience.push(rec);

  const card = document.createElement('div');
  card.className = 'entry-card';
  card.dataset.id = id;
  card.innerHTML = `
    <div class="entry-card-header">
      <div class="exp-types">
        <button class="exp-type-btn active">Activity</button>
        <button class="exp-type-btn">Service</button>
        <button class="exp-type-btn">Work</button>
      </div>
      <button class="remove-btn" aria-label="Remove">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    <div class="entry-card-body">
      <div class="card-field">
        <label>TITLE / ROLE</label>
        <input type="text" placeholder="e.g., Youth Soccer Coach Volunteer"/>
      </div>
      <div class="card-field">
        <label>DESCRIPTION</label>
        <textarea rows="2" placeholder="Brief description…"></textarea>
      </div>
    </div>`;

  const types = ['Activity', 'Service', 'Work'];
  $$('.exp-type-btn', card).forEach((btn, i) => {
    btn.addEventListener('click', () => {
      $$('.exp-type-btn', card).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      rec.type = types[i];
    });
  });

  card.querySelector('.remove-btn').addEventListener('click', () => {
    card.remove();
    state.experience = state.experience.filter(e => e.id !== id);
    updateStrength();
  });

  $('experience-container').appendChild(card);
  updateStrength();
}

let _testCount = 0;
function addTestimonialCard() {
  _testCount++;
  const id = `test-${Date.now()}`;
  state.testimonials.push({ id });

  const card = document.createElement('div');
  card.className = 'entry-card';
  card.dataset.id = id;
  card.innerHTML = `
    <div class="entry-card-header">
      <span class="entry-card-label">Reference #${_testCount}</span>
      <button class="remove-btn" aria-label="Remove">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    <div class="entry-card-body">
      <div class="card-row">
        <div class="card-field">
          <label>COACH / MENTOR NAME</label>
          <input type="text" placeholder="Full Name"/>
        </div>
        <div class="card-field">
          <label>ROLE / TITLE</label>
          <input type="text" placeholder="Head Coach, XYZ High School"/>
        </div>
      </div>
      <div class="card-field">
        <label>QUOTE</label>
        <textarea rows="3" placeholder='"This athlete demonstrates exceptional…"'></textarea>
      </div>
    </div>`;

  card.querySelector('.remove-btn').addEventListener('click', () => {
    card.remove();
    state.testimonials = state.testimonials.filter(t => t.id !== id);
    updateStrength();
  });

  $('testimonials-container').appendChild(card);
  updateStrength();
}

// ──────────────────────────────────────────────────────────────
// PROFILE STRENGTH
// ──────────────────────────────────────────────────────────────
function calcStrength() {
  let p = 0;
  if (state.name)         p += 8;
  if (state.position)     p += 8;
  if (state.height !== 70 || state.weight !== 175) p += 4;
  if (state.jerseyNumber) p += 3;
  if (state.dominantFoot) p += 5;
  if (state.gamesPlayed)  p += 5;
  if (state.statsMethod)  p += 10;
  const hasStats = state.goals || state.assists || state.saves || state.cleanSheets;
  if (hasStats)           p += 5;
  if (state.highlights.length >= 1) p += 10;
  if (state.highlights.length >= 2) p += 5;
  if (state.showAcademics && state.gpa) p += 8;
  if (state.experience.length >= 1) p += 5;
  if (state.testimonials.length >= 1) p += 7;
  if (state.personalityTags.length >= 3) p += 7;
  if (state.photoDataUrl || state.photoStorageUrl) p += 8;
  if (state.email)        p += 8;
  return Math.min(p, 100);
}

const LEVELS = [
  [0, 20,  'Just Starting'],
  [21, 40, 'Building Up'],
  [41, 60, 'Taking Shape'],
  [61, 80, 'Looking Strong'],
  [81, 99, 'Almost There'],
  [100, 100, 'ELITE'],
];
function levelLabel(pct) {
  return (LEVELS.find(([lo, hi]) => pct >= lo && pct <= hi) || LEVELS[0])[2];
}

function setRing(el, pct, circumference) {
  if (!el) return;
  el.style.strokeDashoffset = circumference - (pct / 100) * circumference;
}

function updateStrength() {
  const pct = calcStrength();
  const pctStr = `${pct}%`;

  // Start screen
  const sNum = $('start-strength-num');
  if (sNum) sNum.textContent = pct;
  setRing($('start-ring'), pct, 163);

  // Preview panel
  const ppct = $('preview-pct');
  if (ppct) ppct.textContent = pctStr;
  setRing($('preview-ring'), pct, 214);

  const fill = $('strength-bar-fill');
  if (fill) fill.style.width = pctStr;

  const lvl = $('strength-level');
  if (lvl) lvl.textContent = levelLabel(pct);

  // FAB
  const fab = $('fab-pct');
  if (fab) fab.textContent = pctStr;

  // Confirmation ring
  setRing($('confirm-ring'), pct, 402);
  const cpct = $('confirm-pct-text');
  if (cpct) cpct.textContent = `${pct}% COMPLETE`;

  refreshChecklist();
  refreshMiniCard();
}

function refreshChecklist() {
  const items = {
    'cl-identity':   !!(state.name && state.position && state.dominantFoot),
    'cl-stats':      !!(state.gamesPlayed && state.statsMethod),
    'cl-highlights': state.highlights.length >= 1,
    'cl-academics':  state.showAcademics && !!state.gpa,
    'cl-contact':    !!state.email,
  };
  for (const [elId, done] of Object.entries(items)) {
    const item = $(elId);
    if (!item) continue;
    const icon = item.querySelector('.cl-icon');
    item.classList.toggle('done', done);
    icon.classList.toggle('done', done);
    icon.textContent = done ? 'check_circle' : 'radio_button_unchecked';
  }
}

function refreshMiniCard() {
  const gEl = (id) => $(id);

  const n = gEl('mini-name');
  if (n) n.textContent = state.name || 'YOUR NAME';

  const p = gEl('mini-pos-badge');
  if (p) p.textContent = state.position || 'Position';

  const f = gEl('mini-foot-badge');
  if (f) f.textContent = state.dominantFoot ? `${state.dominantFoot} Foot` : 'Foot';

  const j = gEl('mini-jersey');
  if (j) j.textContent = state.jerseyNumber ? `#${state.jerseyNumber}` : '#';

  const gp = gEl('mini-gp');
  if (gp) gp.textContent = state.gamesPlayed || '--';

  const isGK = state.position === 'Goalkeeper';
  const s1 = gEl('mini-s1'), l1 = gEl('mini-l1');
  const s2 = gEl('mini-s2'), l2 = gEl('mini-l2');
  if (s1) s1.textContent = isGK ? (state.saves || '--') : (state.goals || '--');
  if (l1) l1.textContent = isGK ? 'SV' : 'G';
  if (s2) s2.textContent = isGK ? (state.cleanSheets || '--') : (state.assists || '--');
  if (l2) l2.textContent = isGK ? 'CS' : 'A';

  const tags = gEl('mini-tags');
  if (tags) {
    tags.innerHTML = state.personalityTags.slice(0, 3)
      .map(t => `<span class="sum-p-tag">${t}</span>`).join('');
  }

  const av = gEl('mini-avatar');
  if (av) {
    const src = state.photoStorageUrl || state.photoDataUrl;
    av.innerHTML = src
      ? `<img src="${src}" alt="Profile"/>`
      : `<span class="material-symbols-outlined">person</span>`;
  }
}

// ──────────────────────────────────────────────────────────────
// CONFIRMATION SCREEN POPULATION
// ──────────────────────────────────────────────────────────────
function buildConfirmation() {
  updateStrength();

  const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };

  set('sum-name',     state.name     || '—');
  set('sum-position', state.position || '—');
  set('sum-foot',     state.dominantFoot ? `${state.dominantFoot} Foot` : '—');
  set('sum-jersey',   state.jerseyNumber ? `#${state.jerseyNumber}` : '#—');
  set('sum-gp',       state.gamesPlayed || '—');

  const isGK = state.position === 'Goalkeeper';
  set('sum-stat1', isGK ? (state.saves        || '—') : (state.goals   || '—'));
  set('sum-lbl1',  isGK ? 'Saves' : 'Goals');
  set('sum-stat2', isGK ? (state.cleanSheets  || '—') : (state.assists || '—'));
  set('sum-lbl2',  isGK ? 'CS'    : 'Assists');

  set('sum-email', state.email || '—');

  const tags = $('sum-tags');
  if (tags) {
    tags.innerHTML = state.personalityTags.map(t => `<span class="sum-p-tag">${t}</span>`).join('');
  }

  const av = $('sum-avatar');
  if (av) {
    const src = state.photoStorageUrl || state.photoDataUrl;
    av.innerHTML = src
      ? `<img src="${src}" alt="Photo"/>`
      : `<span class="material-symbols-outlined">person</span>`;
  }
}

// ──────────────────────────────────────────────────────────────
// SUPABASE INTAKE (column names match ogform.html → "Student Athlete Intake Form CSV")
// ──────────────────────────────────────────────────────────────
const INTAKE_TABLE = 'Student Athlete Intake Form CSV';

function getSupabaseClient() {
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;
  if (!url || !key || typeof supabase === 'undefined') return null;
  return supabase.createClient(url, key);
}

function getIntakeStorageBucket() {
  return window.SUPABASE_STORAGE_BUCKET || 'athlete-intake';
}

/**
 * Uploads to Supabase Storage and returns the bucket’s public URL.
 * Create a public bucket named in SUPABASE_STORAGE_BUCKET (default athlete-intake)
 * with policies allowing anon INSERT and public SELECT on objects.
 */
async function uploadToIntakeStorage(client, folder, file) {
  const bucket = getIntakeStorageBucket();
  const rawExt = file.name && file.name.includes('.') ? file.name.split('.').pop() : '';
  const ext = rawExt.replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase() || 'bin';
  const path = `${folder.replace(/^\/+|\/+$/g, '')}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const { data, error } = await client.storage.from(bucket).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  const { data: pub } = client.storage.from(bucket).getPublicUrl(data.path);
  if (!pub?.publicUrl) throw new Error('Could not resolve public URL for upload.');
  return pub.publicUrl;
}

function revokePhotoObjectUrl() {
  if (state.photoObjectUrl) {
    URL.revokeObjectURL(state.photoObjectUrl);
    state.photoObjectUrl = null;
  }
}

async function handleProfilePhotoFile(file) {
  const max = 5 * 1024 * 1024;
  if (file.size > max) {
    alert('Photo must be 5 MB or smaller.');
    return;
  }

  const img = $('photo-actual');
  const icon = $('photo-placeholder-icon');
  const status = $('photo-upload-status');

  revokePhotoObjectUrl();
  const objUrl = URL.createObjectURL(file);
  state.photoObjectUrl = objUrl;
  state.photoDataUrl = null;
  state.photoStorageUrl = null;

  img.src = objUrl;
  img.style.display = 'block';
  icon.style.display = 'none';

  const client = getSupabaseClient();
  if (!client) {
    if (status) status.textContent = '';
    const reader = new FileReader();
    reader.onload = ev => {
      state.photoDataUrl = ev.target.result;
      revokePhotoObjectUrl();
      img.src = state.photoDataUrl;
      updateStrength();
    };
    reader.readAsDataURL(file);
    return;
  }

  if (status) {
    status.textContent = 'Uploading…';
    status.classList.remove('upload-err', 'upload-ok');
  }

  const slug = (state.name || 'athlete').replace(/[^a-z0-9-_]/gi, '-').replace(/-+/g, '-').slice(0, 48) || 'athlete';
  try {
    const url = await uploadToIntakeStorage(client, `profiles/${slug}`, file);
    state.photoStorageUrl = url;
    state.photoDataUrl = null;
    revokePhotoObjectUrl();
    img.src = url;
    if (status) {
      status.textContent = 'Uploaded — ready to publish';
      status.classList.add('upload-ok');
    }
    updateStrength();
  } catch (err) {
    console.error(err);
    if (status) {
      status.textContent = '';
      status.classList.add('upload-err');
    }
    alert(
      'Photo upload failed: ' + (err.message || err) +
        '\n\nCreate a public Storage bucket named "' + getIntakeStorageBucket() +
        '" and allow anonymous uploads (see supabase-config.example.js).'
    );
    const reader = new FileReader();
    reader.onload = ev => {
      state.photoDataUrl = ev.target.result;
      img.src = state.photoDataUrl;
      updateStrength();
    };
    reader.readAsDataURL(file);
  }
}

/** If the user only has a data-URL preview, upload once before row insert. */
async function ensureProfilePhotoUploadedForPublish(client) {
  if (!client || state.photoStorageUrl || !state.photoDataUrl) return;
  if (!String(state.photoDataUrl).startsWith('data:')) return;
  try {
    const res = await fetch(state.photoDataUrl);
    const blob = await res.blob();
    const file = new File([blob], 'profile.jpg', { type: blob.type || 'image/jpeg' });
    const slug = (state.name || 'athlete').replace(/[^a-z0-9-_]/gi, '-').replace(/-+/g, '-').slice(0, 48) || 'athlete';
    state.photoStorageUrl = await uploadToIntakeStorage(client, `profiles/${slug}`, file);
    state.photoDataUrl = null;
    revokePhotoObjectUrl();
    const img = $('photo-actual');
    if (img) img.src = state.photoStorageUrl;
  } catch (e) {
    console.warn('Profile photo could not be uploaded before publish', e);
  }
}

function wireHighlightMedia(card, hlId) {
  const fileInput = card.querySelector('.highlight-file-input');
  const drop = card.querySelector('.media-drop');
  const urlInput = card.querySelector('.highlight-media-url');
  const status = card.querySelector('.highlight-upload-status');
  const label = drop.querySelector('.media-drop-label');
  if (!fileInput || !drop || !urlInput) return;

  const maxBytes = 50 * 1024 * 1024;

  const runUpload = async (file) => {
    if (!file) return;
    if (file.size > maxBytes) {
      alert('Highlight file must be under 50 MB.');
      return;
    }
    const client = getSupabaseClient();
    if (!client) {
      alert('Supabase is not configured. Copy supabase-config.example.js to supabase-config.js.');
      return;
    }

    if (status) {
      status.textContent = 'Uploading…';
      status.classList.remove('upload-err', 'upload-ok');
    }
    drop.classList.add('media-drop-uploading');

    try {
      const url = await uploadToIntakeStorage(client, `highlights/${hlId}`, file);
      urlInput.value = url;
      if (label) label.textContent = file.name;
      if (status) {
        status.textContent = 'Uploaded — URL filled above';
        status.classList.add('upload-ok');
      }
    } catch (err) {
      console.error(err);
      if (status) {
        status.textContent = err.message || 'Upload failed';
        status.classList.add('upload-err');
      }
      alert(
        'Highlight upload failed: ' + (err.message || err) +
          '\n\nCreate a public Storage bucket named "' + getIntakeStorageBucket() +
          '" and allow anonymous uploads (see supabase-config.example.js).'
      );
    } finally {
      drop.classList.remove('media-drop-uploading');
      fileInput.value = '';
    }
  };

  drop.addEventListener('click', () => fileInput.click());
  drop.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });
  fileInput.addEventListener('change', e => runUpload(e.target.files[0]));

  ['dragenter', 'dragover'].forEach(evName => {
    drop.addEventListener(evName, e => {
      e.preventDefault();
      e.stopPropagation();
      drop.classList.add('media-drop-dragover');
    });
  });
  drop.addEventListener('dragleave', e => {
    e.preventDefault();
    if (!drop.contains(e.relatedTarget)) drop.classList.remove('media-drop-dragover');
  });
  drop.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    drop.classList.remove('media-drop-dragover');
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) runUpload(f);
  });
}

function collectHighlightsForIntake() {
  return $$('#highlights-container .entry-card').slice(0, 3).map(card => {
    const texts = card.querySelectorAll('.entry-card-body input[type="text"]');
    const urlIn = card.querySelector('.highlight-media-url');
    const ta = card.querySelector('.entry-card-body textarea');
    return {
      title: texts[0]?.value?.trim() || '',
      opponent: texts[1]?.value?.trim() || '',
      date: texts[2]?.value?.trim() || '',
      description: ta?.value?.trim() || '',
      media_url: urlIn?.value?.trim() || '',
    };
  });
}

function collectExperienceForIntake() {
  return $$('#experience-container .entry-card').slice(0, 3).map(card => {
    const id = card.dataset.id;
    const rec = state.experience.find(e => e.id === id);
    const titleIn = card.querySelector('.entry-card-body input[type="text"]');
    const descTa = card.querySelector('.entry-card-body textarea');
    return {
      type: rec?.type || 'Activity',
      title: titleIn?.value?.trim() || '',
      description: descTa?.value?.trim() || '',
    };
  });
}

function collectTestimonialsForIntake() {
  return $$('#testimonials-container .entry-card').slice(0, 3).map(card => {
    const texts = card.querySelectorAll('.entry-card-body input[type="text"]');
    const ta = card.querySelector('.entry-card-body textarea');
    return {
      name: texts[0]?.value?.trim() || '',
      role: texts[1]?.value?.trim() || '',
      quote: ta?.value?.trim() || '',
    };
  });
}

/** Maps wizard state + cards to Supabase row keys (snake_case) per ogform.html */
function buildIntakePayload() {
  const data = {};
  const set = (key, val) => {
    if (val === undefined || val === null) return;
    const s = typeof val === 'string' ? val.trim() : val;
    if (s === '') return;
    data[key] = typeof val === 'string' ? val.trim() : val;
  };

  set('name', state.name);
  set('email', state.email);
  set('phone', state.phone);
  set('instagram', state.instagram);
  set('parent_email', state.parentEmail);
  if (state.photoStorageUrl) set('profile_photo_url', state.photoStorageUrl);
  else if (state.photoDataUrl) set('profile_photo_url', state.photoDataUrl);

  set('position', state.position);
  set('height_inches', String(state.height));
  set('weight_lbs', String(state.weight));
  set('jersey_number', state.jerseyNumber);
  set('dominant_foot', state.dominantFoot);

  if (state.statsMethod === 'link') set('stats_method', 'link');
  else if (state.statsMethod === 'manual') set('stats_method', 'manual');

  set('stats_link', state.statsLink);
  set('games_played', state.gamesPlayed);
  set('goals', state.goals);
  set('assists', state.assists);
  set('shots', state.shots);
  set('minutes', state.minutes);
  set('pass_accuracy', state.passAcc);
  set('tackles', state.tackles);
  set('saves', state.saves);
  set('clean_sheets', state.cleanSheets);
  set('goals_against_avg', state.gaa);

  data.stats_public = state.statsPublic ? 'yes' : 'no';
  data.photo_public = state.photoPublic ? 'yes' : 'no';

  data.show_academics = state.showAcademics ? 'yes' : 'no';
  set('gpa', state.gpa);
  set('ncaa_id', state.ncaaId);
  set('major', state.major);

  state.honors.slice(0, 5).forEach((h, i) => set(`honor_${i + 1}`, h));

  collectHighlightsForIntake().forEach((h, i) => {
    const n = i + 1;
    set(`highlight_${n}_title`, h.title);
    set(`highlight_${n}_opponent`, h.opponent);
    set(`highlight_${n}_date`, h.date);
    set(`highlight_${n}_description`, h.description);
    set(`highlight_${n}_media_url`, h.media_url);
  });

  collectExperienceForIntake().forEach((ex, i) => {
    const n = i + 1;
    set(`experience_${n}_type`, ex.type);
    set(`experience_${n}_title`, ex.title);
    set(`experience_${n}_description`, ex.description);
  });

  collectTestimonialsForIntake().forEach((t, i) => {
    const n = i + 1;
    set(`testimonial_${n}_name`, t.name);
    set(`testimonial_${n}_role`, t.role);
    set(`testimonial_${n}_quote`, t.quote);
  });

  state.personalityTags.slice(0, 5).forEach((t, i) => set(`personality_tag_${i + 1}`, t));

  return data;
}

// ──────────────────────────────────────────────────────────────
// WIRE UP ALL EVENT HANDLERS
// ──────────────────────────────────────────────────────────────
function wireHandlers() {

  // ── Navigation buttons ─────────────────────────────────────
  $('start-cta').addEventListener('click', goNext);
  $('nav-next').addEventListener('click', goNext);
  $('nav-back').addEventListener('click', goBack);
  $('header-back').addEventListener('click', goBack);

  // ── Identity: Name ─────────────────────────────────────────
  $('athlete-name').addEventListener('input', e => {
    state.name = e.target.value.trim();
    $('silhouette-nametag').textContent = state.name.toUpperCase();
    $('silhouette-svg').classList.toggle('has-name', state.name.length > 0);
    $('name-hint').style.opacity = state.name.length > 1 ? '1' : '0';
    updateStrength();
  });

  // ── Identity: Position ─────────────────────────────────────
  $$('#position-grid .pos-card').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('#position-grid .pos-card').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.position = btn.dataset.pos;
      setPose(state.position === 'Goalkeeper' ? 'gk' : 'field');
      updateStrength();
    });
  });

  // ── Identity: Height slider ─────────────────────────────────
  $('height-slider').addEventListener('input', e => {
    const v = parseInt(e.target.value);
    state.height = v;
    const str = inchesToFeet(v);
    $('height-display').textContent = str;
    $('badge-ht-val').textContent   = str;
    updateStrength();
  });

  // ── Identity: Weight slider ─────────────────────────────────
  $('weight-slider').addEventListener('input', e => {
    const v = parseInt(e.target.value);
    state.weight = v;
    $('weight-display').textContent = `${v} LBS`;
    $('badge-wt-val').textContent   = `${v} lb`;
    updateStrength();
  });

  // ── Identity: Jersey number ─────────────────────────────────
  $('jersey-input').addEventListener('input', e => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
    e.target.value    = v;
    state.jerseyNumber = v;
    updateJerseyOverlay(v);
    updateStrength();
  });

  // ── Identity: Dominant foot ─────────────────────────────────
  $$('#foot-grid .foot-card').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('#foot-grid .foot-card').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.dominantFoot = btn.dataset.foot;
      updateFootClasses(state.dominantFoot);
      $('identity-achievement').classList.add('show');
      updateStrength();
    });
  });

  // ── Stats method ────────────────────────────────────────────
  $$('#method-cards .method-card').forEach(card => {
    card.addEventListener('click', () => {
      $$('#method-cards .method-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.statsMethod = card.dataset.method;
      updateStrength();
    });
  });

  // ── Stats: games played (field) ─────────────────────────────
  $('games-field').addEventListener('input', e => {
    state.gamesPlayed = e.target.value;
    updateStrength();
  });

  // ── Stats: games played (GK) ───────────────────────────────
  $('games-gk').addEventListener('input', e => {
    state.gamesPlayed = e.target.value;
    updateStrength();
  });

  // ── Stats: link URL ─────────────────────────────────────────
  $('stats-link-url').addEventListener('input', e => {
    state.statsLink = e.target.value;
    if (e.target.value.length > 12) {
      setTimeout(() => {
        $('link-success').classList.add('show');
        updateStrength();
      }, 900);
    }
  });

  // ── Stats: field player inputs (event delegation) ───────────
  $('field-stats-grid').addEventListener('input', e => {
    const key = e.target.dataset.key;
    if (key) { state[key] = e.target.value; updateStrength(); }
  });

  // ── Stats: GK inputs (event delegation) ────────────────────
  $('gk-stats-grid').addEventListener('input', e => {
    const key = e.target.dataset.key;
    if (key) { state[key] = e.target.value; updateStrength(); }
  });

  // ── Highlights: add button ──────────────────────────────────
  $('add-highlight-btn').addEventListener('click', addHighlightCard);

  // ── Academics: choice buttons ───────────────────────────────
  $('acad-yes').addEventListener('click', () => {
    state.showAcademics = true;
    $('academics-fields').classList.remove('hidden');
    $('acad-yes').style.opacity  = '1';
    $('acad-skip').style.opacity = '.45';
    updateStrength();
  });
  $('acad-skip').addEventListener('click', () => {
    state.showAcademics = false;
    $('academics-fields').classList.add('hidden');
    $('acad-yes').style.opacity  = '.45';
    $('acad-skip').style.opacity = '1';
    updateStrength();
  });

  $('gpa-input').addEventListener('input',   e => { state.gpa    = e.target.value; updateStrength(); });
  $('ncaa-input').addEventListener('input',  e => { state.ncaaId = e.target.value; });
  $('major-input').addEventListener('input', e => { state.major  = e.target.value; });

  $$('#honors-pool .honor-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      const h = chip.dataset.honor;
      if (chip.classList.contains('selected')) state.honors.push(h);
      else state.honors = state.honors.filter(x => x !== h);
    });
  });

  // ── Experience: add button ──────────────────────────────────
  $('add-experience-btn').addEventListener('click', addExperienceCard);

  // ── Testimonials: choice ────────────────────────────────────
  $('test-yes').addEventListener('click', () => {
    $('testimonials-fields').classList.remove('hidden');
    $('test-yes').style.opacity  = '1';
    $('test-skip').style.opacity = '.45';
    if (state.testimonials.length === 0) addTestimonialCard();
    updateStrength();
  });
  $('test-skip').addEventListener('click', () => {
    $('testimonials-fields').classList.add('hidden');
    $('test-yes').style.opacity  = '.45';
    $('test-skip').style.opacity = '1';
  });
  $('add-testimonial-btn').addEventListener('click', addTestimonialCard);

  // ── Personality tags ────────────────────────────────────────
  $('personality-pool').addEventListener('click', e => {
    const tag = e.target.closest('.p-tag');
    if (!tag) return;
    const t = tag.dataset.tag;
    if (tag.classList.contains('selected')) {
      tag.classList.remove('selected');
      state.personalityTags = state.personalityTags.filter(x => x !== t);
    } else {
      if (state.personalityTags.length >= 5) return;
      tag.classList.add('selected');
      state.personalityTags.push(t);
    }
    $('tag-count').textContent = state.personalityTags.length;
    // Disable unselected tags at max
    $$('#personality-pool .p-tag:not(.selected)').forEach(el =>
      el.classList.toggle('disabled', state.personalityTags.length >= 5)
    );
    updateStrength();
  });

  $('add-tag-btn').addEventListener('click', () => {
    const input = $('custom-tag-input');
    const val   = input.value.trim();
    if (!val || state.personalityTags.length >= 5) return;

    const btn = document.createElement('button');
    btn.className  = 'p-tag selected';
    btn.dataset.tag = val;
    btn.textContent = val;

    btn.addEventListener('click', () => {
      btn.remove();
      state.personalityTags = state.personalityTags.filter(x => x !== val);
      $('tag-count').textContent = state.personalityTags.length;
      updateStrength();
    });

    $('personality-pool').appendChild(btn);
    state.personalityTags.push(val);
    $('tag-count').textContent = state.personalityTags.length;
    input.value = '';
    updateStrength();
  });

  // ── Media: profile photo → Supabase Storage (or data URL fallback)
  $('photo-file').addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    handleProfilePhotoFile(file);
    e.target.value = '';
  });

  // ── Media: privacy toggles ──────────────────────────────────
  $('toggle-stats').addEventListener('click', () => {
    const el = $('toggle-stats');
    el.classList.toggle('on');
    state.statsPublic = el.classList.contains('on');
    el.setAttribute('aria-checked', String(state.statsPublic));
  });
  $('toggle-photo').addEventListener('click', () => {
    const el = $('toggle-photo');
    el.classList.toggle('on');
    state.photoPublic = el.classList.contains('on');
    el.setAttribute('aria-checked', String(state.photoPublic));
  });

  // ── Contact ─────────────────────────────────────────────────
  $('contact-email').addEventListener('input',     e => { state.email       = e.target.value; updateStrength(); });
  $('contact-phone').addEventListener('input',     e => { state.phone       = e.target.value; });
  $('contact-instagram').addEventListener('input', e => { state.instagram   = e.target.value; });
  $('contact-parent').addEventListener('input',    e => { state.parentEmail = e.target.value; });

  // ── Confirmation checkbox ───────────────────────────────────
  $('confirm-cb').addEventListener('change', e => {
    state.confirmed     = e.target.checked;
    $('publish-btn').disabled = !state.confirmed;
  });

  // ── Publish → Supabase (same table + columns as ogform.html)
  $('publish-btn').addEventListener('click', async () => {
    const btn = $('publish-btn');
    const client = getSupabaseClient();
    if (!client) {
      alert('Supabase is not configured. Copy supabase-config.example.js to supabase-config.js and set SUPABASE_URL and SUPABASE_ANON_KEY.');
      return;
    }

    const origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> SUBMITTING…';

    await ensureProfilePhotoUploadedForPublish(client);
    const payload = buildIntakePayload();
    const { error } = await client.from(INTAKE_TABLE).insert([payload]);

    if (error) {
      console.error(error);
      btn.disabled = false;
      btn.innerHTML = origHtml;
      alert('Could not save your profile: ' + error.message);
      return;
    }

    localStorage.setItem('athleteProfile', JSON.stringify(state));
    btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> PROFILE PUBLISHED!';
    btn.style.background = 'linear-gradient(135deg,var(--secondary),var(--secondary-dim))';
    btn.style.color = 'var(--on-secondary)';
    btn.style.boxShadow = '0 0 36px rgba(0,238,252,.35)';
  });

  // ── Save & Exit ─────────────────────────────────────────────
  $('save-exit').addEventListener('click', () => {
    localStorage.setItem('athleteProfileDraft', JSON.stringify(state));
    // Flash confirm
    const btn = $('save-exit');
    const orig = btn.textContent;
    btn.textContent = 'SAVED ✓';
    setTimeout(() => (btn.textContent = orig), 1500);
  });

  // ── Mobile: preview FAB & overlay ──────────────────────────
  const panel   = $('preview-panel');
  const overlay = $('preview-overlay');

  $('preview-fab').addEventListener('click', () => {
    panel.classList.add('open');
    overlay.classList.add('visible');
  });
  overlay.addEventListener('click', () => {
    panel.classList.remove('open');
    overlay.classList.remove('visible');
  });
}

// ──────────────────────────────────────────────────────────────
// INITIALISE
// ──────────────────────────────────────────────────────────────
function init() {
  wireHandlers();
  refreshNav();
  refreshDots();
  updateStrength();

  // Set initial slider display values
  $('height-display').textContent = inchesToFeet(state.height);
  $('weight-display').textContent = `${state.weight} LBS`;
  $('badge-ht-val').textContent   = inchesToFeet(state.height);
  $('badge-wt-val').textContent   = `${state.weight} lb`;
}

document.addEventListener('DOMContentLoaded', init);
