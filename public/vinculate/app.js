/* Vinculate · prototipo navegable de alta fidelidad. Todo el estado vive en memoria. */
(function () {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const app = $('#app'), toastEl = $('#toast');

/* ───────────────────────── utilidades ───────────────────────── */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESC = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const dLong = d => `${DIA[d.getDay()]} ${d.getDate()} de ${MESL[d.getMonth()]}`;
const dShort = d => `${d.getDate()} ${MESC[d.getMonth()]} ${d.getFullYear()}`;
const diffDays = d => Math.round((d - window.TODAY) / 864e5);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const H = n => { const h = Math.floor(n), m = Math.round((n - h) * 60); return `${h}:${pad(m)}`; };
const rng = r => `${H(r[0])} – ${H(r[1])} h`;
const km = k => `${k.toFixed(1).replace('.', ',')} km`;
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const hash = s => { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; };
const { CENTERS, CAMPAIGNS, LIB } = window;
const centerById = id => CENTERS.find(c => c.id === id);
const campById = id => CAMPAIGNS.find(k => k.id === id);

/* Íconos lineales */
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  nav: '<path d="m3 11 18-8-8 18-2-8z"/>',
  right: '<path d="m9 6 6 6-6 6"/>', left: '<path d="m15 6-6 6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  drop: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
  sliders: '<path d="M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10M20 18h0"/><circle cx="15" cy="6" r="2.2"/><circle cx="9" cy="12" r="2.2"/><circle cx="17" cy="18" r="2.2"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3 3l18 18M10.6 5.1A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6A16.6 16.6 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4-.9M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  map: '<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  logout: '<path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M16 8l4 4-4 4M20 12H9"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="m11 21 2-6-3-3 1-5 3 3 3 1M8 12l-2 3"/>',
  bus: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 21v-3M16 21v-3M8 15h.01M16 15h.01"/>',
  car: '<path d="M5 16V11l2-5h10l2 5v5M3 16h18M7 19v-3M17 19v-3M7.5 13h.01M16.5 13h.01"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>',
  target: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  sparkle: '<path d="M12 4v4M12 16v4M4 12h4M16 12h4"/>',
};
const I = (n, s = 22, c = '') => `<svg class="ic ${c}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const MARK = (s = 34) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#BE3D3D"/><path d="M16 6.5s6 6.2 6 10.5a6 6 0 0 1-12 0c0-4.3 6-10.5 6-10.5z" fill="#FFFBF5"/><path d="M13 17.8a3 3 0 0 0 3 3" stroke="#BE3D3D" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>`;

/* ───────────────────────── estado ───────────────────────── */
const S = {
  view: 'welcome', stack: [], logged: false, tab: 'home', dir: null,
  slide: 0, authTab: 'register', forgotSent: false, obStep: 0,
  show: {}, err: {}, sheet: null,
  user: { ...window.USER },
  form: {
    reg: { email: '', pass: '' }, login: { email: '', pass: '' }, forgot: { email: '' },
    prof: { nombre: '', apellido: '', nacimiento: '', localidad: '' },
    edit: { nombre: '', apellido: '', nacimiento: '', localidad: '' },
    cons: { priv: false, datos: false }, don: { center: '', date: '' },
  },
  prefs: { ubic: true, radio: 5, rec: true, dias: 60, camp: true, zona: 5, turno: true, antes: '1 día', resumen: 'Cada 2 semanas', op: true, pausa: false },
  find: { seg: 'centros', q: '', dist: 'any', tipo: 'all', turnos: false, region: 'all', sel: null },
  hist: 'all', nTab: 'all',
  donations: window.DONATIONS.map(d => ({ ...d })),
  notifs: window.NOTIFS.map(n => ({ ...n })),
  booking: null, slot: { date: null, time: null }, libQ: '', open: {},
};
const MAP = { cx: 880, cy: 560, z: 1.1 };
const getP = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
const setP = (o, p, v) => { const k = p.split('.'); const l = k.pop(); getP(o, k.join('.')) [l] = v; };

const current = () => { const t = S.stack[S.stack.length - 1]; return t ? t : { name: S.view, params: {} }; };
function go(name, params = {}) { S.stack.push({ name, params }); S.dir = 'in-r'; render(true); }
function back() { if (S.stack.length) { S.stack.pop(); S.dir = 'in-l'; render(true); } }
function root(view, tab) { S.stack = []; S.view = view; if (tab) S.tab = tab; S.dir = 'in-r'; S.sheet = null; render(true); }
function tab(t) { S.tab = t; S.view = t; S.stack = []; S.dir = null; S.sheet = null; render(true); }
function sheet(type, params = {}) { S.sheet = { type, params }; render(); }
function closeSheet() { S.sheet = null; render(); }
let toastT;
function toast(msg) { toastEl.innerHTML = I('check', 18) + `<span>${esc(msg)}</span>`; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2600); }
const unread = () => S.notifs.filter(n => !n.read).length;
const latestDon = () => [...S.donations].sort((a, b) => b.date.localeCompare(a.date))[0];

/* ───────────────────────── componentes ───────────────────────── */
const chip = (t, c = '') => `<span class="chip ${c}">${t}</span>`;
const statusChip = e => e === 'confirmada' ? chip(I('check', 13) + 'Confirmada', 'ok') : chip(I('clock', 13) + 'Pendiente de validación', 'warn');
const btn = (label, a, o = {}) => `<button class="btn ${o.v || 'primary'} ${o.full === false ? '' : 'full'} ${o.sm ? 'sm' : ''}" data-a="${a}" ${Object.entries(o.d || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')} ${o.dis ? 'disabled' : ''}>${o.ic ? I(o.ic, 20) : ''}${label}</button>`;
const bell = () => { const c = unread(); return `<button class="icbtn" data-a="go" data-n="notifications" aria-label="Notificaciones${c ? ` (${c} sin leer)` : ''}">${I('bell', 21)}${c ? `<span class="badge">${c}</span>` : ''}</button>`; };
const tabHead = (title, sub) => `<div class="tabhead"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${bell()}</div>`;
const subHead = (title, right = '') => `<div class="subhead ${right ? 'has-right' : ''}"><button class="icbtn plain" data-a="back" aria-label="Volver">${I('left', 24)}</button><h2>${title}</h2>${right}</div>`;
const secHead = (t, link, a, d = '') => `<div class="sechead"><h2>${t}</h2>${link ? `<button data-a="${a}" ${d}>${link}</button>` : ''}</div>`;
const sw = (on, a, d = '') => `<button class="switch ${on ? 'on' : ''}" role="switch" aria-checked="${on}" data-a="${a}" ${d}></button>`;
const note = (t, c = '', ic = 'info') => `<div class="note ${c}">${I(ic, 18)}<div>${t}</div></div>`;
const DISCLAIMER = 'La evaluación final para donar la realiza siempre el personal de salud del centro. Vinculate no determina si una persona está habilitada.';
function field({ id, label, type = 'text', ph = '', path, hint, auto, maxlen }) {
  const v = getP(S.form, path) ?? ''; const e = S.err[path];
  const isPw = type === 'password', shown = S.show[path];
  return `<div class="field ${e ? 'err' : ''}"><label for="${id}">${label}</label>
    <div class="${isPw ? 'pw' : ''}"><input class="input" id="${id}" type="${isPw && shown ? 'text' : type}" placeholder="${esc(ph)}" value="${esc(v)}" data-bind="${path}" ${auto ? `autocomplete="${auto}"` : ''} ${type === 'date' ? `max="${iso(window.TODAY)}"` : ''}>
    ${isPw ? `<button type="button" data-a="showpw" data-p="${path}" aria-label="${shown ? 'Ocultar' : 'Mostrar'} contraseña">${I(shown ? 'eyeoff' : 'eye', 20)}</button>` : ''}</div>
    ${e ? `<div class="msg">${I('info', 14)}${e}</div>` : hint ? `<div class="hint">${hint}</div>` : ''}</div>`;
}
function selectLoc(path, id = 'loc') {
  const v = getP(S.form, path); const e = S.err[path];
  return `<div class="field ${e ? 'err' : ''}"><label for="${id}">Localidad</label><select class="input" id="${id}" data-bind="${path}"><option value="">Elegí tu localidad</option>
    ${Object.entries(window.LOCALIDADES).map(([r, a]) => `<optgroup label="${r === 'CABA' ? 'Ciudad Autónoma de Buenos Aires' : 'Gran Buenos Aires'}">${a.map(l => { const val = `${l}, ${r}`; return `<option ${v === val ? 'selected' : ''}>${val}</option>`; }).join('')}</optgroup>`).join('')}</select>
    ${e ? `<div class="msg">${I('info', 14)}${e}</div>` : ''}</div>`;
}
const seg = (opts, cur, a) => `<div class="seg" role="tablist">${opts.map(([k, l]) => `<button role="tab" aria-selected="${k === cur}" class="${k === cur ? 'on' : ''}" data-a="${a}" data-id="${k}">${l}</button>`).join('')}</div>`;
const opts = (list, cur, a, extra = '') => `<div class="opts">${list.map(([k, l]) => `<button class="opt ${String(k) === String(cur) ? 'on' : ''}" data-a="${a}" data-id="${k}" ${extra}>${l}</button>`).join('')}</div>`;
const li = (ic, t, s, a, d = '', right = I('right', 18, 'chev')) => `<button class="li" data-a="${a}" ${d}><span class="lic">${I(ic, 20)}</span><span class="grow"><span class="lt">${t}</span>${s ? `<br><span class="ls">${s}</span>` : ''}</span>${right}</button>`;
const kv = (a, b) => `<div class="kvrow"><span>${a}</span><span>${b}</span></div>`;
const footer = inner => `<div class="footer">${inner}</div>`;
const navBar = a => `<nav class="nav" aria-label="Principal">${[['home', 'Inicio', 'home'], ['find', 'Encontrar', 'compass'], ['history', 'Mi historial', 'history'], ['profile', 'Mi perfil', 'user']].map(([k, l, ic]) => `<button class="navb ${k === a ? 'on' : ''}" data-a="tab" data-id="${k}" ${k === a ? 'aria-current="page"' : ''}>${I(ic, 23)}<span>${l}</span></button>`).join('')}</nav>`;
const screen = (inner, cls = '') => `<div class="screen ${cls} ${S.dir || ''}">${inner}</div>`;
const photo = (v, cls = '') => `<div class="ph ph-${v} ${cls}" role="img" aria-label="Fotografía ilustrativa"></div>`;

/* horarios y turnos */
const todayHours = c => { const d = window.TODAY.getDay(); const r = d === 0 ? null : d === 6 ? c.hrs.sat : c.hrs.wk; return r ? `Hoy ${rng(r)}` : 'Hoy cerrado'; };
const hoursRows = c => { const d = window.TODAY.getDay(); return [['Lunes a viernes', rng(c.hrs.wk), d >= 1 && d <= 5], ['Sábado', c.hrs.sat ? rng(c.hrs.sat) : 'Cerrado', d === 6], ['Domingo', 'Cerrado', d === 0]]; };
function slotDays(kind, e) {
  const out = [];
  if (kind === 'campaign') { let d = parse(e.date); const end = parse(e.dateEnd || e.date); while (d <= end) { out.push({ d: new Date(d), hrs: e.hrs }); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); } return out; }
  for (let i = 1; out.length < 6 && i < 20; i++) { const d = new Date(window.TODAY.getFullYear(), window.TODAY.getMonth(), window.TODAY.getDate() + i); const w = d.getDay(); const r = w === 0 ? null : w === 6 ? e.hrs.sat : e.hrs.wk; if (r) out.push({ d, hrs: r }); }
  return out;
}
function slotsFor(id, day) { const out = []; for (let t = day.hrs[0]; t < day.hrs[1] - 0.01; t += 0.5) out.push({ t: H(t), free: hash(id + iso(day.d) + t) % 10 < 6 }); return out; }

/* tarjetas de centro y campaña */
const centerCard = c => `<div class="card ccard" role="button" tabindex="0" data-a="go" data-n="center" data-id="${c.id}">
  ${photo(c.ph, 'thumb')}<div style="flex:1;min-width:0"><div class="cname">${esc(c.name)}</div>
  <div class="csub">${I('pin', 14)}${esc(c.zona)} · ${km(c.km)}</div>
  <div class="cmeta"><span>${I('clock', 14)}${todayHours(c)}</span>${c.turnos ? chip('Turnos', 'red') : ''}</div></div>${I('right', 18, 'chev')}</div>`;
const campCard = k => { const d = parse(k.date); return `<div class="card kcard" role="button" tabindex="0" data-a="go" data-n="campaign" data-id="${k.id}">
  <div class="dateblock"><b>${d.getDate()}</b><span>${MESC[d.getMonth()]}</span></div>
  <div style="flex:1;min-width:0"><div class="t3" style="line-height:1.25">${esc(k.name)}</div>
  <div class="kv" style="margin-top:6px">${I('clock', 15)}${k.dateEnd ? `${d.getDate()} al ${parse(k.dateEnd).getDate()} de ${MESL[d.getMonth()]} · ` : ''}${rng(k.hrs)}</div>
  <div class="kv" style="margin-top:3px">${I('pin', 15)}${esc(k.zona)} · ${km(k.km)}</div>
  <div style="margin-top:9px">${k.turnos ? chip('Con turnos', 'red') : chip('Sin turno previo')}</div></div></div>`; };
const acc = (key, q, a, tag) => `<div class="acc ${S.open[key] ? 'open' : ''}"><button data-a="acc" data-id="${key}" aria-expanded="${!!S.open[key]}">${tag ? chip(tag, tag === 'Mito' ? 'red' : 'ok') : ''}<span style="flex:1">${q}</span>${I('down', 20)}</button><div class="ans"><div><p>${a}</p></div></div></div>`;

/* ───────────────────────── pantallas ───────────────────────── */
const SCREENS = {};

/* 1 · Bienvenida */
SCREENS.welcome = () => {
  const sl = [
    { t: 'Donar sangre, más simple', p: 'Encontrá centros de hemoterapia y campañas cerca tuyo, con información clara y confiable.', ph: 'b',
      fl: `<div class="card ccard" style="pointer-events:none"><div class="ph ph-a thumb"></div><div style="flex:1"><div class="cname">Instituto de Hemoterapia Palermo</div><div class="csub">${I('pin', 14)}Palermo · 1,9 km</div><div class="cmeta"><span>${I('clock', 14)}Hoy 7:30 – 13:00 h</span>${chip('Turnos', 'red')}</div></div></div>` },
    { t: 'Un recordatorio cuando tenga sentido', p: 'Te avisamos entre donaciones y cuando haya campañas nuevas en tu zona. Vos elegís cuándo y cuánto.', ph: 'd',
      fl: `<div class="card" style="pointer-events:none"><div style="display:flex;gap:12px"><span class="lic" style="width:38px;height:38px;border-radius:12px;background:var(--red-t);color:var(--red);display:grid;place-items:center;flex:none">${I('bell', 20)}</span><div><div class="t3" style="line-height:1.25">Pasaron 7 semanas desde tu última donación</div><div class="small" style="margin-top:3px">Consultá con un centro los requisitos vigentes.</div></div></div></div>` },
    { t: 'Tu recorrido como donante', p: 'Guardá tu historial y consultá cuando quieras la biblioteca con información de fuentes sanitarias.', ph: 'e',
      fl: `<div class="card" style="pointer-events:none"><div class="kvrow" style="border:0;padding-top:0"><span>Última donación</span><span>4 jun 2026</span></div><div class="kvrow"><span>Estado</span><span>${statusChip('confirmada')}</span></div></div>` },
  ][S.slide];
  const last = S.slide === 2;
  return screen(`<div class="welcome" style="display:flex;flex-direction:column;flex:1;min-height:0">
    <div class="wv fade" key="${S.slide}">${photo(sl.ph)}<div class="logo">${MARK(34)}Vinculate</div><div class="float">${sl.fl}</div></div>
    <div class="wcard"><h1 class="t1">${sl.t}</h1><p class="lead" style="margin-top:8px;min-height:72px">${sl.p}</p>
      <div class="dots">${[0, 1, 2].map(i => `<i class="${i === S.slide ? 'on' : ''}"></i>`).join('')}</div>
      ${last ? `<div class="stack" style="gap:10px">${btn('Crear cuenta', 'to', { d: { v: 'auth', t: 'register' } })}${btn('Ya tengo cuenta', 'to', { v: 'ghost', d: { v: 'auth', t: 'login' } })}</div>`
        : `<div style="display:flex;gap:10px">${btn('Saltar', 'slide', { v: 'ghost', d: { id: 2 } })}${btn('Siguiente', 'slide', { d: { id: S.slide + 1 } })}</div>`}
      <p class="small" style="text-align:center;margin-top:14px">App gratuita · Vinculate no evalúa si podés donar</p></div></div>`, 'welcome');
};

/* 2 · Registro / inicio de sesión */
SCREENS.auth = () => {
  const reg = S.authTab === 'register', p = reg ? 'reg' : 'login';
  const sc = (() => { const v = S.form.reg.pass; return [v.length >= 8, /[a-z]/.test(v) && /[A-Z]/.test(v), /\d/.test(v), /[^\w\s]/.test(v) || v.length >= 12].filter(Boolean).length; })();
  return screen(`${subHead('')}
    <div class="body"><div class="pad stack" style="gap:20px;padding-bottom:30px">
      <div>${MARK(40)}<h1 class="t1" style="margin-top:14px">${reg ? 'Creá tu cuenta' : 'Ingresá a tu cuenta'}</h1><p class="lead" style="margin-top:6px">${reg ? 'Es gratis y lleva menos de un minuto.' : 'Qué bueno verte de nuevo.'}</p></div>
      ${seg([['register', 'Crear cuenta'], ['login', 'Ingresar']], S.authTab, 'authtab')}
      <div class="stack" style="gap:16px">
        ${field({ id: 'em', label: 'Correo electrónico', type: 'email', ph: 'nombre@correo.com', path: `${p}.email`, auto: 'email' })}
        ${field({ id: 'pw', label: 'Contraseña', type: 'password', ph: reg ? 'Mínimo 8 caracteres' : 'Tu contraseña', path: `${p}.pass`, auto: reg ? 'new-password' : 'current-password' })}
        ${reg ? `<div class="strength" id="strength" aria-hidden="true">${[0, 1, 2, 3].map(i => `<i class="${i < sc ? 'on' : ''} ${sc >= 3 ? 'ok' : ''}"></i>`).join('')}</div>` : `<button class="linkb" style="justify-self:start" data-a="go" data-n="forgot">¿Olvidaste tu contraseña?</button>`}
      </div>
      ${btn(reg ? 'Crear cuenta' : 'Ingresar', reg ? 'register' : 'login')}
      ${reg ? `<p class="legal">Al continuar vas a poder revisar nuestra <a data-a="sheet" data-id="privacy">política de privacidad</a> antes de terminar de configurar tu perfil.</p>` : ''}
      <div class="note">${I('info', 18)}<div>Prototipo: usá cualquier correo válido y una contraseña de 8 caracteres o más.</div></div>
    </div></div>`);
};
SCREENS.forgot = () => screen(`${subHead('Recuperar contraseña')}<div class="body"><div class="pad stack" style="gap:20px;padding-top:8px">
  ${S.forgotSent ? `<div class="card fade" style="text-align:center;padding:30px 22px"><div class="bigcheck">${I('mail', 34)}</div><h2 class="t2" style="margin-top:18px">Revisá tu correo</h2><p class="muted" style="margin-top:8px">Si <b>${esc(S.form.forgot.email)}</b> tiene una cuenta, te enviamos un enlace para crear una nueva contraseña. Puede tardar unos minutos.</p></div>
    ${btn('Volver a ingresar', 'to', { d: { v: 'auth', t: 'login' } })}${btn('Reenviar enlace', 'resend', { v: 'text' })}`
  : `<div><h1 class="t1">¿Olvidaste tu contraseña?</h1><p class="lead" style="margin-top:6px">Ingresá tu correo y te enviamos un enlace para crear una nueva.</p></div>
    ${field({ id: 'fe', label: 'Correo electrónico', type: 'email', ph: 'nombre@correo.com', path: 'forgot.email', auto: 'email' })}${btn('Enviar enlace', 'forgot')}`}
</div></div>`);

/* 3 · Onboarding */
SCREENS.onboarding = () => {
  const st = S.obStep, steps = 4;
  const head = `<div class="subhead"><button class="icbtn plain" data-a="${st ? 'obback' : 'to'}" ${st ? '' : 'data-v="auth" data-t="register"'} aria-label="Volver">${I('left', 24)}</button><div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="4" aria-valuenow="${st + 1}">${[0, 1, 2, 3].map(i => `<i class="${i <= st ? 'on' : ''}"></i>`).join('')}</div><span class="small" style="width:42px;text-align:right">${st + 1}/${steps}</span></div>`;
  let c = '', cta = 'Continuar';
  if (st === 0) c = `<div><h1 class="t1">Contanos quién sos</h1><p class="lead" style="margin-top:6px">Solo pedimos lo necesario para personalizar tu experiencia.</p></div>
    <div class="stack" style="gap:16px">${field({ id: 'nm', label: 'Nombre', ph: 'Ej.: Lucía', path: 'prof.nombre', auto: 'given-name' })}${field({ id: 'ap', label: 'Apellido', ph: 'Ej.: Fernández', path: 'prof.apellido', auto: 'family-name' })}
    ${field({ id: 'fn', label: 'Fecha de nacimiento', type: 'date', path: 'prof.nacimiento' })}${selectLoc('prof.localidad')}</div>
    ${note('No te pedimos datos médicos. Si podés donar o no lo define el personal de salud en el centro.', 'solid', 'shield')}`;
  if (st === 1) c = `<div><h1 class="t1">Ubicación y avisos</h1><p class="lead" style="margin-top:6px">Configuralo ahora; podés cambiarlo cuando quieras en tu perfil.</p></div>
    <div class="list"><div class="li"><span class="grow"><span class="lt">Usar mi ubicación aproximada</span><br><span class="ls">Solo para ordenar centros por cercanía. No se comparte con las instituciones.</span></span>${sw(S.prefs.ubic, 'pref', 'data-k="ubic"')}</div></div>
    <div class="card"><div class="t3">Radio de búsqueda</div><div style="margin-top:12px">${opts([[3, '3 km'], [5, '5 km'], [10, '10 km'], [20, '20 km']], S.prefs.radio, 'prefv', 'data-k="radio"')}</div></div>
    <div class="list">${[['rec', 'Recordatorios entre donaciones', 'Te avisamos para que consultes oportunidades.'], ['camp', 'Campañas nuevas en mi zona', 'Cuando una institución publique una.'], ['turno', 'Recordatorios de turno', 'Solo si reservás un turno.']].map(([k, t, s]) => `<div class="li"><span class="grow"><span class="lt">${t}</span><br><span class="ls">${s}</span></span>${sw(S.prefs[k], 'pref', `data-k="${k}"`)}</div>`).join('')}</div>`;
  if (st === 2) c = `<div><h1 class="t1">Cómo funciona Vinculate</h1><p class="lead" style="margin-top:6px">Una guía corta para empezar.</p></div>
    <div class="stack" style="gap:12px">${[['1', 'Encontrá', 'Explorá centros de hemoterapia y campañas cercanas, con horarios y turnos cuando la institución los publica.'], ['2', 'Donás en el centro', 'La entrevista y la evaluación las hace el personal de salud. Vinculate no determina si estás habilitada o habilitado.'], ['3', 'Registrá y volvé', 'Guardá tu historial y recibí recordatorios para consultar nuevas oportunidades, sin presiones.']].map(([n, t, s]) => `<div class="card how"><span class="num">${n}</span><div><div class="t3">${t}</div><p class="muted" style="margin-top:3px;font-size:14.5px">${s}</p></div></div>`).join('')}</div>`;
  if (st === 3) { cta = 'Empezar'; c = `<div><h1 class="t1">Tu privacidad</h1><p class="lead" style="margin-top:6px">Tratamos tus datos con cuidado y de forma transparente.</p></div>
    <div class="card stack" style="gap:12px">${['Guardamos solo datos básicos de tu perfil y tu historial.', 'No pedimos ni almacenamos información médica.', 'Podés descargar o eliminar tus datos cuando quieras.', 'Cumplimos con la Ley 25.326 de Protección de Datos Personales.'].map(t => `<div style="display:flex;gap:10px">${I('check', 20, 'chev')}<span style="font-size:14.5px">${t}</span></div>`).join('')}<button class="linkb" style="justify-self:start" data-a="sheet" data-id="privacy">Leer el resumen de la política</button></div>
    <div class="stack" style="gap:14px">${[['priv', 'Leí y acepto la <a data-a="sheet" data-id="privacy">política de privacidad</a>.'], ['datos', 'Acepto el tratamiento de mis datos personales para las funciones de la aplicación.']].map(([k, t]) => `<div class="crow ${S.err['cons.' + k] ? 'err' : ''}" role="checkbox" aria-checked="${S.form.cons[k]}" tabindex="0" data-a="cons" data-k="${k}"><span class="check ${S.form.cons[k] ? 'on' : ''}">${I('check', 16)}</span><span>${t}</span></div>${S.err['cons.' + k] ? `<div class="msg" style="font-size:12.5px;color:var(--red-d);margin-top:-6px;padding-left:36px">Es necesario aceptarlo para continuar.</div>` : ''}`).join('')}</div>`; }
  return screen(`${head}<div class="body"><div class="pad stack fade" style="gap:20px;padding-bottom:20px" key="${st}">${c}</div></div>${footer(btn(cta, 'obnext'))}`);
};

/* 4 · Inicio */
SCREENS.home = () => {
  const near = CENTERS.filter(c => c.km <= 3).length, soon = CAMPAIGNS.filter(k => { const d = diffDays(parse(k.date)); return d >= 0 && d <= 14; }).length;
  const ld = latestDon(), ldd = parse(ld.date), wk = Math.floor(-diffDays(ldd) / 7);
  const nextRem = new Date(ldd.getFullYear(), ldd.getMonth(), ldd.getDate() + S.prefs.dias);
  const b = S.booking;
  return screen(`<div class="body">
    <div class="tabhead" style="padding-bottom:6px"><div class="logo">${MARK(34)}Vinculate</div>${bell()}</div>
    <div class="greet"><small>${cap(dLong(window.TODAY))}</small><h1 class="t1">Hola, ${esc(S.user.nombre)}</h1></div>
    <div class="hero"><div class="eyebrow">${I('pin', 16)}Cerca de ${esc(S.user.localidad.split(',')[0])}</div>
      <h2>${near} centros a menos de 3 km</h2><p>Y ${soon} campañas en las próximas dos semanas.</p>
      <button class="btn light" data-a="findnear">Explorar cerca de mí ${I('right', 18)}</button></div>
    ${b ? `<div class="sp" style="height:14px"></div><div class="pad"><div class="card turnos-card fade"><div style="display:flex;gap:12px;align-items:flex-start"><span class="lic" style="width:40px;height:40px;border-radius:13px;background:var(--red);color:#fff;display:grid;place-items:center;flex:none">${I('cal', 20)}</span><div style="flex:1"><div class="small" style="font-weight:650;color:var(--red-d)">Tu turno reservado</div><div class="t3" style="margin-top:2px">${esc(b.name)}</div><div class="muted" style="font-size:14px">${cap(dLong(parse(b.date)))} · ${b.time} h</div></div></div>
      <div style="display:flex;gap:8px;margin-top:14px">${btn('Cómo llegar', 'sheet', { v: 'ghost', sm: true, d: { id: 'directions', kind: b.kind, ref: b.id } })}${btn('Cancelar turno', 'sheet', { v: 'ghost', sm: true, d: { id: 'cancel' } })}</div></div></div>` : ''}
    ${secHead('Próximas campañas', 'Ver todas', 'findcamp')}
    <div class="hscroll">${CAMPAIGNS.filter(k => diffDays(parse(k.date)) >= 0).slice(0, 4).map(k => { const d = parse(k.date); return `<div class="card ccamp" role="button" tabindex="0" data-a="go" data-n="campaign" data-id="${k.id}"><div style="position:relative">${photo(k.ph)}<div class="dt"><b>${d.getDate()}</b><span>${MESC[d.getMonth()]}</span></div></div><div class="in"><div class="t3" style="line-height:1.25;min-height:40px">${esc(k.name)}</div><div class="kv" style="margin-top:6px">${I('pin', 15)}${esc(k.zona)} · ${km(k.km)}</div></div></div>`; }).join('')}</div>
    <div class="pad stack" style="margin-top:26px">
      <div class="card" role="button" tabindex="0" data-a="tab" data-id="history"><div style="display:flex;justify-content:space-between;align-items:center"><span class="small" style="font-weight:650">Tu última donación registrada</span>${statusChip(ld.estado)}</div>
        <div class="t2" style="margin-top:8px">${cap(dLong(ldd))}</div><div class="muted" style="font-size:14px;margin-top:2px">${esc(ld.center)} · hace ${wk} semanas</div></div>
      ${S.prefs.rec && !S.prefs.pausa ? `<div class="card" role="button" tabindex="0" data-a="notifprefs"><div style="display:flex;gap:12px"><span class="lic" style="width:40px;height:40px;border-radius:13px;background:var(--beige);color:var(--red);display:grid;place-items:center;flex:none">${I('bell', 20)}</span><div style="flex:1"><div class="small" style="font-weight:650">Próximo recordatorio</div><div class="t3" style="margin-top:2px">${cap(dLong(nextRem))}</div><div class="muted" style="font-size:14px;margin-top:3px">Te avisamos para que consultes oportunidades y requisitos vigentes con un centro.</div></div></div></div>`
        : `<div class="card" role="button" tabindex="0" data-a="notifprefs"><div style="display:flex;gap:12px;align-items:center"><span class="lic" style="width:40px;height:40px;border-radius:13px;background:var(--beige);color:var(--ink3);display:grid;place-items:center;flex:none">${I('bell', 20)}</span><div style="flex:1"><div class="t3">Recordatorios desactivados</div><div class="muted" style="font-size:14px">Activalos cuando quieras desde preferencias.</div></div>${I('right', 18, 'chev')}</div></div>`}
    </div>
    ${secHead('Información útil', 'Biblioteca', 'go', 'data-n="library"')}
    <div class="tiles"><div class="card tile" role="button" tabindex="0" data-a="go" data-n="article" data-id="requisitos"><span class="lic">${I('check', 22)}</span><div><div class="t3">Requisitos generales</div><div class="small">Lo básico para donar</div></div></div>
      <div class="card tile" role="button" tabindex="0" data-a="go" data-n="article" data-id="proceso"><span class="lic">${I('drop', 22)}</span><div><div class="t3">Cómo es el proceso</div><div class="small">Paso a paso</div></div></div></div>
    <div class="pad" style="margin:22px 0 28px">${note(DISCLAIMER)}</div></div>${navBar('home')}`);
};

/* 5 y 6 · Encontrar: listado, mapa y campañas */
function fCenters() {
  const f = S.find, q = norm(f.q.trim());
  return CENTERS.filter(c => (!q || [c.name, c.zona, c.addr, c.region].some(x => norm(x).includes(q))) && (f.dist === 'any' || c.km <= +f.dist) && (f.tipo === 'all' || c.tipo === f.tipo) && (!f.turnos || c.turnos) && (f.region === 'all' || c.region === f.region)).sort((a, b) => a.km - b.km);
}
function fCamps() {
  const f = S.find, q = norm(f.q.trim());
  return CAMPAIGNS.filter(k => diffDays(parse(k.dateEnd || k.date)) >= 0 && (!q || [k.name, k.zona, k.place].some(x => norm(x).includes(q))) && (f.dist === 'any' || k.km <= +f.dist) && (!f.turnos || k.turnos) && (f.region === 'all' || k.zona.includes(f.region === 'CABA' ? 'CABA' : 'GBA'))).sort((a, b) => a.date.localeCompare(b.date));
}
const activeFilters = () => (S.find.dist !== 'any') + (S.find.tipo !== 'all') + S.find.turnos + (S.find.region !== 'all');
function mapSVG(list) {
  let g = '<rect x="-400" y="-400" width="2400" height="2200" fill="#EFE2CF"/>';
  for (let x = 0; x <= 1600; x += 50) g += `<path d="M${x} 0V1400" stroke="#E6D6C0" stroke-width="1.5"/>`;
  for (let y = 0; y <= 1400; y += 50) g += `<path d="M0 ${y}H1600" stroke="#E6D6C0" stroke-width="1.5"/>`;
  g += '<path d="M960 -400H2000V1500H1500L1380 700 1250 560 1130 380 1050 250 1010 120 990 -400Z" fill="#D2D5D0"/>';
  g += '<path d="M700 905Q900 885 1000 835T1250 705" stroke="#D2D5D0" stroke-width="20" fill="none" stroke-linecap="round"/>';
  g += '<rect x="925" y="480" width="150" height="95" rx="28" fill="#DCE0C8"/><rect x="765" y="615" width="62" height="56" rx="14" fill="#DCE0C8"/><rect x="560" y="520" width="90" height="60" rx="18" fill="#DCE0C8"/>';
  [['M0 905 L760 740 L1180 650', 'Av. Rivadavia', 330, 855, -13], ['M560 640 L868 545 L1180 440', 'Av. Santa Fe', 640, 590, -17], ['M640 280 L915 430 L1000 480', 'Av. Cabildo', 700, 330, 28], ['M480 780 L835 672 L1120 585', 'Av. Corrientes', 960, 606, -15], ['M960 40 L990 215 L1030 330', 'Av. Maipú', 1018, 120, 80], ['M1000 960 L1080 880 L1200 780', 'Av. Mitre', 1190, 830, -38]]
    .forEach(([d, l, x, y, r]) => { g += `<path d="${d}" stroke="#FFFBF5" stroke-width="9" fill="none" stroke-linejoin="round" stroke-linecap="round"/><text x="${x}" y="${y}" font-size="17" fill="#8D7F73" font-weight="600" transform="rotate(${r} ${x} ${y})">${l}</text>`; });
  g += '<text x="1290" y="250" font-size="26" fill="#8E9490" font-style="italic" font-weight="500">Río de la Plata</text><text x="560" y="740" font-size="22" fill="#A5978A" font-weight="700" letter-spacing="3">CABA</text><text x="220" y="760" font-size="20" fill="#A5978A" font-weight="700" letter-spacing="2">GBA OESTE</text><text x="700" y="120" font-size="20" fill="#A5978A" font-weight="700" letter-spacing="2">GBA NORTE</text><text x="960" y="1010" font-size="20" fill="#A5978A" font-weight="700" letter-spacing="2">GBA SUR</text>';
  const pins = list.map(c => { const on = S.find.sel === c.id; return `<g data-pin="${c.id}" data-x="${c.x}" data-y="${c.y}" style="cursor:pointer"><g transform="scale(${on ? 1.25 : 1})"><path d="M0 0c-9-10-15-16-15-23a15 15 0 0 1 30 0c0 7-6 13-15 23z" fill="${on ? '#8F2626' : '#BE3D3D'}" stroke="#FFFBF5" stroke-width="2.5"/><circle cy="-23" r="5.5" fill="#FFFBF5"/></g></g>`; }).join('');
  const me = '<g data-pin="me" data-x="800" data-y="620"><circle r="22" fill="rgba(43,37,35,.14)"/><circle r="8" fill="#2B2523" stroke="#FFFBF5" stroke-width="3"/></g>';
  return `<svg id="map" viewBox="0 0 700 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Mapa esquemático con la ubicación de los centros">${g}${me}${pins}</svg>`;
}
SCREENS.find = () => {
  const f = S.find, cs = fCenters(), ks = fCamps(), n = activeFilters();
  const ctl = `<div class="pad stack" style="gap:12px;padding-bottom:12px">
    <div class="search">${I('search', 20)}<input class="input" id="q" type="search" placeholder="Buscar por localidad o zona" value="${esc(f.q)}" data-find="q" aria-label="Buscar por localidad o zona">${f.q ? `<button class="clear" data-a="clearq" aria-label="Borrar búsqueda">${I('x', 18)}</button>` : ''}</div>
    ${seg([['centros', 'Centros'], ['mapa', 'Mapa'], ['campanas', 'Campañas']], f.seg, 'fseg')}</div>
    <div class="hscroll" style="padding-bottom:12px"><button class="fchip ${n ? 'on' : ''}" data-a="sheet" data-id="filters">${I('sliders', 17)}Filtros${n ? ` · ${n}` : ''}</button>
      <button class="fchip ${f.dist === '3' ? 'on' : ''}" data-a="quick" data-id="dist">Hasta 3 km</button><button class="fchip ${f.turnos ? 'on' : ''}" data-a="quick" data-id="turnos">Con turnos</button>
      <button class="fchip ${f.region === 'CABA' ? 'on' : ''}" data-a="quick" data-id="CABA">CABA</button><button class="fchip ${f.region === 'GBA' ? 'on' : ''}" data-a="quick" data-id="GBA">GBA</button></div>`;
  let body;
  if (f.seg === 'mapa') {
    const sel = f.sel && centerById(f.sel);
    body = `<div class="mapwrap">${mapSVG(cs)}<div class="mapctl"><button class="icbtn" data-a="zoom" data-id="in" aria-label="Acercar">${I('plus', 20)}</button><button class="icbtn" data-a="zoom" data-id="out" aria-label="Alejar">${I('minus', 20)}</button><button class="icbtn" data-a="zoom" data-id="me" aria-label="Centrar en mi ubicación">${I('target', 20)}</button></div>
      ${sel ? `<div class="card mapcard" style="padding:12px"><div class="ccard" style="padding:0;cursor:default">${photo(sel.ph, 'thumb')}<div style="flex:1;min-width:0"><div class="cname">${esc(sel.name)}</div><div class="csub">${I('pin', 14)}${esc(sel.addr)} · ${km(sel.km)}</div><div class="cmeta"><span>${I('clock', 14)}${todayHours(sel)}</span>${sel.turnos ? chip('Turnos', 'red') : ''}</div></div></div><div style="display:flex;gap:8px;margin-top:12px">${btn('Ver ficha', 'go', { sm: true, d: { n: 'center', id: sel.id } })}${btn('Cómo llegar', 'sheet', { sm: true, v: 'ghost', d: { id: 'directions', kind: 'center', ref: sel.id } })}</div></div>` : `<div class="mapnote">Mapa esquemático · ${cs.length} centros</div>`}</div>`;
    return screen(`${tabHead('Encontrar', 'Centros y campañas de donación')}${ctl}${body}${navBar('find')}`);
  }
  if (f.seg === 'centros') body = cs.length ? `<div class="pad stack"><div class="small">${cs.length} ${cs.length === 1 ? 'centro' : 'centros'} · ordenados por cercanía</div>${cs.map(centerCard).join('')}</div>` : empty('No encontramos centros con esos filtros', 'Probá ampliar la distancia o quitar algún filtro.');
  else body = ks.length ? `<div class="pad stack"><div class="small">${ks.length} ${ks.length === 1 ? 'campaña' : 'campañas'} · próximas fechas</div>${ks.map(campCard).join('')}</div>` : empty('No hay campañas con esos filtros', 'Las instituciones publican campañas nuevas todas las semanas.');
  return screen(`${tabHead('Encontrar', 'Centros y campañas de donación')}<div class="body">${ctl}${body}<div class="pad" style="margin:20px 0 26px">${note('Cada institución mantiene su información actualizada. Ante cualquier duda, confirmá por teléfono antes de ir.')}</div></div>${navBar('find')}`);
};
const empty = (t, s) => `<div class="empty fade"><span class="lic">${I('search', 24)}</span><div class="t3">${t}</div><div class="small">${s}</div><button class="btn text" data-a="clearfilters">Limpiar filtros</button></div>`;

/* 7 · Ficha de centro */
SCREENS.center = p => {
  const c = centerById(p.id), camps = CAMPAIGNS.filter(k => k.org === c.id && diffDays(parse(k.dateEnd || k.date)) >= 0);
  return screen(`<div class="body"><div class="cover">${photo(c.ph, '')}<button class="icbtn back" data-a="back" aria-label="Volver">${I('left', 24)}</button></div>
    <div class="sheetcard"><div class="stack" style="gap:18px">
      <div><div style="display:flex;gap:8px;flex-wrap:wrap">${chip(c.tipoL)}${chip(I('pin', 13) + km(c.km) + ' de tu ubicación', 'paper')}</div><h1 class="t1" style="margin-top:10px;font-size:25px">${esc(c.name)}</h1>
        <div class="kv" style="margin-top:6px">${I('pin', 16)}${esc(c.addr)}, ${esc(c.zona)}</div><div class="small" style="margin-top:6px">Información actualizada: ${c.updated}</div></div>
      ${c.turnos ? `<div class="card turnos-card"><div style="display:flex;gap:12px"><span style="color:var(--red)">${I('cal', 24)}</span><div><div class="t3">Turnos publicados por la institución</div><p class="muted" style="font-size:14px;margin-top:2px">Hay horarios disponibles en los próximos días. Podés reservar desde la aplicación.</p></div></div></div>`
        : note('Esta institución no publica turnos en Vinculate. Se atiende por orden de llegada dentro del horario de atención. Consultá por teléfono si tenés dudas.', 'solid', 'info')}
      <div class="card"><div class="t3" style="margin-bottom:12px">Horarios de atención</div><div class="hrs">${hoursRows(c).map(([a, b, t]) => `<div class="${t ? 'today' : ''}"><span>${a}${t ? ' · hoy' : ''}</span><span>${b}</span></div>`).join('')}</div></div>
      <div class="list">${li('phone', c.phone, 'Llamar a la institución', 'toast', `data-m="Llamando a ${esc(c.name)}…"`)}${li('mail', c.email, 'Escribir un correo', 'toast', 'data-m="Abriendo tu app de correo…"')}${li('globe', c.web, 'Sitio web', 'toast', 'data-m="Abriendo el sitio de la institución…"', '')}</div>
      <div class="card"><div class="t3" style="margin-bottom:10px">Información disponible</div><div class="stack" style="gap:10px">${c.services.map(s => `<div style="display:flex;gap:10px;font-size:15px">${I('check', 18, 'chev')}${s}</div>`).join('')}</div><p class="small" style="margin-top:12px">${esc(c.note)}</p></div>
      ${camps.length ? `<div><div class="t3" style="margin-bottom:10px">Campañas de esta institución</div><div class="stack" style="gap:10px">${camps.map(campCard).join('')}</div></div>` : ''}
      ${note(DISCLAIMER)}</div></div></div>
    ${footer(c.turnos ? `${btn('Ver turnos disponibles', 'go', { d: { n: 'slots', kind: 'center', id: c.id } })}<button class="icbtn" style="width:52px;height:52px;border-radius:16px;flex:none" data-a="sheet" data-id="directions" data-kind="center" data-ref="${c.id}" aria-label="Cómo llegar">${I('nav', 22)}</button>`
      : `${btn('Cómo llegar', 'sheet', { d: { id: 'directions', kind: 'center', ref: c.id } })}<button class="icbtn" style="width:52px;height:52px;border-radius:16px;flex:none" data-a="toast" data-m="Llamando a ${esc(c.name)}…" aria-label="Llamar">${I('phone', 22)}</button>`)}`);
};

/* 8 · Campaña (detalle) */
SCREENS.campaign = p => {
  const k = campById(p.id), org = centerById(k.org), d = parse(k.date), rem = !!S.open['rem_' + k.id];
  return screen(`${subHead('Campaña')}<div class="body"><div class="pad stack" style="gap:18px;padding-bottom:24px">
    <div class="herophoto">${photo(k.ph, '')}</div>
    <div><div style="display:flex;gap:8px;flex-wrap:wrap">${k.turnos ? chip('Con turnos', 'red') : chip('Sin turno previo')}${chip(I('pin', 13) + km(k.km), 'paper')}</div><h1 class="t1" style="margin-top:10px;font-size:25px">${esc(k.name)}</h1></div>
    <div class="card"><div class="kvrow"><span>${I('cal', 16)} Fecha</span><span>${k.dateEnd ? `${d.getDate()} al ${parse(k.dateEnd).getDate()} de ${MESL[d.getMonth()]}` : cap(dLong(d))}</span></div>${kv('Horario', rng(k.hrs))}${kv('Lugar', esc(k.place.split(' · ')[0]))}${kv('Dirección', esc(k.place.split(' · ')[1] || k.zona))}${kv('Organiza', esc(org.name))}</div>
    <div><div class="t3">Sobre la jornada</div><p class="muted" style="margin-top:6px">${esc(k.desc)}</p></div>
    <div class="card"><div class="t3" style="margin-bottom:10px">Qué llevar</div><div class="stack" style="gap:8px">${k.bring.map(b => `<div style="display:flex;gap:10px">${I('check', 18, 'chev')}${b}</div>`).join('')}</div></div>
    <div class="list"><div class="li"><span class="lic">${I('bell', 20)}</span><span class="grow"><span class="lt">Recordarme esta campaña</span><br><span class="ls">Un aviso el día anterior</span></span>${sw(rem, 'remind', `data-id="${k.id}"`)}</div>${li('cal', 'Agregar al calendario', '', 'toast', 'data-m="Campaña agregada a tu calendario"')}${li('flag', 'Ver institución organizadora', esc(org.name), 'go', `data-n="center" data-id="${org.id}"`)}</div>
    ${k.turnos ? '' : note('Esta campaña no requiere turno: se atiende por orden de llegada durante el horario de la jornada.', 'solid')}${note(DISCLAIMER)}</div></div>
    ${footer(k.turnos ? `${btn('Ver turnos disponibles', 'go', { d: { n: 'slots', kind: 'campaign', id: k.id } })}<button class="icbtn" style="width:52px;height:52px;border-radius:16px;flex:none" data-a="sheet" data-id="directions" data-kind="campaign" data-ref="${k.id}" aria-label="Cómo llegar">${I('nav', 22)}</button>` : btn('Cómo llegar', 'sheet', { d: { id: 'directions', kind: 'campaign', ref: k.id } }))}`);
};

/* 9 · Turnos disponibles */
SCREENS.slots = p => {
  const e = p.kind === 'center' ? centerById(p.id) : campById(p.id), days = slotDays(p.kind, e);
  if (!S.slot.date || S.slot.owner !== p.id) { S.slot = { date: iso(days[0].d), time: null, owner: p.id }; }
  const day = days.find(x => iso(x.d) === S.slot.date) || days[0], sl = slotsFor(p.id, day), free = sl.filter(s => s.free).length;
  return screen(`${subHead('Turnos disponibles')}<div class="body"><div class="pad stack" style="gap:16px;padding-bottom:20px">
    <div><div class="t2" style="line-height:1.2">${esc(e.name)}</div><div class="kv" style="margin-top:4px">${I('pin', 15)}${esc(p.kind === 'center' ? e.addr + ', ' + e.zona : e.place)}</div></div>
    ${note(`Turnos publicados por la institución. Última actualización: ${p.kind === 'center' ? e.updated : 'hoy 08:40'}. La disponibilidad puede cambiar.`, 'solid', 'refresh')}</div>
    <div class="days" role="tablist" aria-label="Elegí un día">${days.map(x => `<button class="day ${iso(x.d) === iso(day.d) ? 'on' : ''}" role="tab" data-a="slotday" data-id="${iso(x.d)}"><small>${DIA[x.d.getDay()].slice(0, 3)}</small><b>${x.d.getDate()}</b><small>${MESC[x.d.getMonth()]}</small></button>`).join('')}</div>
    <div class="sechead" style="margin-top:22px"><h2 style="font-size:17px">${cap(dLong(day.d))}</h2><span class="small">${free} disponibles</span></div>
    <div class="slots">${sl.map(s => `<button class="slot ${S.slot.time === s.t ? 'on' : ''}" ${s.free ? '' : 'disabled'} data-a="slottime" data-id="${s.t}" aria-pressed="${S.slot.time === s.t}">${s.t}</button>`).join('')}</div>
    <div class="legend" style="margin-top:14px"><span>Los horarios tachados están completos.</span></div>
    <div class="pad" style="margin-top:18px">${note(DISCLAIMER)}</div></div>
    ${footer(`<div style="flex:1">${S.slot.time ? `<div class="small" style="margin-bottom:6px;text-align:center">${cap(dLong(day.d))} · ${S.slot.time} h</div>` : ''}${btn(S.slot.time ? 'Reservar turno' : 'Elegí un horario', 'sheet', { dis: !S.slot.time, d: { id: 'confirm', kind: p.kind, ref: p.id } })}</div>`)}`);
};

/* 10 · Historial */
SCREENS.history = () => {
  const all = [...S.donations].sort((a, b) => b.date.localeCompare(a.date)), list = all.filter(d => S.hist === 'all' || d.estado === (S.hist === 'ok' ? 'confirmada' : 'pendiente'));
  const conf = all.filter(d => d.estado === 'confirmada').length, pend = all.length - conf, ctr = new Set(all.map(d => d.center)).size;
  let years = '';
  list.forEach((d, i) => { const y = d.date.slice(0, 4); if (i === 0 || list[i - 1].date.slice(0, 4) !== y) years += `<div class="yr">${y}</div>`; const dt = parse(d.date);
    years += `<div class="tli"><div class="rail"><span class="pt ${d.estado === 'pendiente' ? 'pend' : ''}"></span></div><div class="card" role="button" tabindex="0" data-a="go" data-n="donation" data-id="${d.id}"><div class="d1"><div><div class="t3">${dt.getDate()} de ${MESL[dt.getMonth()]}</div><div class="muted" style="font-size:14px;margin-top:2px">${esc(d.center)}</div><div class="small">${esc(d.zona)}</div></div>${I('right', 18, 'chev')}</div><div style="margin-top:10px">${statusChip(d.estado)}</div></div></div>`; });
  return screen(`${tabHead('Mi historial', 'Tu recorrido como donante')}<div class="body">
    <div class="pad stack" style="gap:16px"><div class="card"><div class="stats"><div><b>${conf}</b><span>Confirmadas</span></div><div><b>${pend}</b><span>Pendientes</span></div><div><b>${ctr}</b><span>Centros</span></div></div></div>
    <div style="display:flex;gap:10px;align-items:center"><div style="flex:1">${seg([['all', 'Todas'], ['ok', 'Confirmadas'], ['pend', 'Pendientes']], S.hist, 'hfilter')}</div></div>
    ${btn('Registrar una donación', 'sheet', { v: 'ghost', ic: 'plus', d: { id: 'register' } })}</div>
    <div class="tl">${years || `<div class="empty"><div class="t3">No hay registros en esta vista</div></div>`}</div>
    <div class="pad" style="margin:12px 0 28px"><div class="future">${I('sparkle', 20)}<div><b style="color:var(--ink)">Próximamente: tu impacto personal</b><br>Una mirada a lo que tus donaciones aportan a la comunidad, sin puntos ni rankings.</div></div></div></div>${navBar('history')}`);
};

/* 11 · Detalle de donación */
SCREENS.donation = p => {
  const d = S.donations.find(x => x.id === p.id), dt = parse(d.date), n = [...S.donations].filter(x => x.estado === 'confirmada').sort((a, b) => a.date.localeCompare(b.date)).findIndex(x => x.id === d.id) + 1;
  return screen(`${subHead('Detalle de donación')}<div class="body"><div class="pad stack" style="gap:16px;padding-bottom:26px">
    <div class="card" style="text-align:center;padding:24px 16px"><div class="bigcheck" style="background:${d.estado === 'confirmada' ? 'var(--ok-t)' : 'var(--warn-t)'};color:${d.estado === 'confirmada' ? 'var(--ok)' : 'var(--warn)'}">${I(d.estado === 'confirmada' ? 'drop' : 'clock', 32)}</div>
      <h1 class="t2" style="margin-top:14px">${cap(dLong(dt))}</h1><div class="muted">${dt.getFullYear()}${d.time ? ` · ${d.time} h` : ''}</div><div style="margin-top:12px">${statusChip(d.estado)}</div></div>
    <div class="card">${kv('Centro', esc(d.center))}${kv('Zona', esc(d.zona))}${kv('Tipo', 'Sangre entera')}${kv('Modalidad', n > 1 || d.estado === 'pendiente' ? 'Voluntaria y habitual' : 'Voluntaria')}${kv('Registro', esc(d.origen))}${d.estado === 'confirmada' ? kv('Donación confirmada n.º', n) : ''}</div>
    ${d.estado === 'pendiente' ? note('La institución todavía no confirmó este registro. Cuando lo valide, va a pasar a “Confirmada” y vas a recibir un aviso. Si hay un error, podés eliminarlo.', 'red') : note('Vinculate no guarda resultados ni datos clínicos. Para consultas sobre tu donación, comunicate con la institución.', 'solid', 'shield')}
    <div class="list">${d.cid ? li('pin', 'Ver centro', esc(d.center), 'go', `data-n="center" data-id="${d.cid}"`) : ''}${li('book', 'Qué hacer después de donar', 'Cuidados recomendados', 'go', 'data-n="article" data-id="antes"')}</div>
    ${d.estado === 'pendiente' ? btn('Eliminar este registro', 'sheet', { v: 'ghost', ic: 'trash', d: { id: 'deldon', ref: d.id } }) : ''}</div></div>`);
};

/* 12 · Biblioteca */
SCREENS.library = () => {
  const q = norm(S.libQ.trim()); let res = '';
  if (q) {
    const hits = [];
    LIB.forEach(c => {
      if (c.items) c.items.forEach((it, i) => { if (norm(it.q + ' ' + it.a).includes(q)) hits.push(`<div class="list" style="margin-bottom:10px">${acc(`${c.id}${i}`, esc(it.q), esc(it.a), it.tag)}</div>`); });
      else { const txt = c.title + ' ' + c.desc + ' ' + c.blocks.map(b => [b.p, b.h, ...(b.ul || []), ...(b.steps || []).flat()].join(' ')).join(' '); if (norm(txt).includes(q)) hits.push(`<div class="list" style="margin-bottom:10px">${li(c.icon, c.title, c.desc, 'go', `data-n="article" data-id="${c.id}"`)}</div>`); }
    });
    res = hits.length ? `<div class="pad"><div class="small" style="margin-bottom:10px">${hits.length} resultados</div>${hits.join('')}</div>` : `<div class="empty"><span class="lic">${I('search', 24)}</span><div class="t3">Sin resultados para “${esc(S.libQ)}”</div><div class="small">Probá con otra palabra, por ejemplo “requisitos” o “tatuaje”.</div></div>`;
  }
  return screen(`${subHead('Información', bell())}<div class="body">
    <div class="pad stack" style="gap:14px"><div><h1 class="t1">Biblioteca</h1><p class="lead" style="margin-top:4px">Información clara y confiable sobre la donación de sangre.</p></div>
    <div class="search">${I('search', 20)}<input class="input" id="lq" type="search" placeholder="Buscar en la biblioteca" value="${esc(S.libQ)}" data-find="lq" aria-label="Buscar en la biblioteca">${S.libQ ? `<button class="clear" data-a="clearlq" aria-label="Borrar búsqueda">${I('x', 18)}</button>` : ''}</div></div>
    ${q ? `<div class="sp" style="height:16px"></div>${res}` : `${secHead('Categorías')}<div class="cats">${LIB.map(c => `<div class="card cat" role="button" tabindex="0" data-a="go" data-n="article" data-id="${c.id}"><span class="lic">${I(c.icon, 20)}</span><div><div class="lt">${c.title}</div><div class="ls">${c.desc} · ${c.read}</div></div></div>`).join('')}</div>`}
    <div class="pad" style="margin:24px 0 28px"><div class="stack" style="gap:10px">${note('Fuente: Ministerio de Salud de la Nación (Plan Nacional de Sangre). ' + DISCLAIMER)}</div></div></div>`);
};
SCREENS.article = p => {
  const c = LIB.find(x => x.id === p.id);
  const body = c.items ? `<div class="list">${c.items.map((it, i) => acc(`${c.id}${i}`, esc(it.q), esc(it.a), it.tag)).join('')}</div>`
    : `<div class="prose">${c.blocks.map(b => `${b.h ? `<h3>${b.h}</h3>` : ''}${b.p ? `<p style="${b.h ? '' : 'margin-bottom:4px'}">${b.p}</p>` : ''}${b.ul ? `<ul>${b.ul.map(u => `<li>${u}</li>`).join('')}</ul>` : ''}${b.steps ? `<div class="steps">${b.steps.map(([t, s], i) => `<div class="step"><i>${i + 1}</i><div><b>${t}</b><p>${s}</p></div></div>`).join('')}</div>` : ''}`).join('')}</div>`;
  const others = LIB.filter(x => x.id !== c.id).slice(0, 3);
  return screen(`${subHead(c.title)}<div class="body"><div class="pad stack" style="gap:18px;padding-bottom:26px">
    <div><span class="chip">${I('clock', 13)}${c.read} de lectura</span><h1 class="t1" style="margin-top:10px">${c.title}</h1></div>${body}${note('Fuente: Ministerio de Salud de la Nación (Plan Nacional de Sangre). ' + DISCLAIMER, 'red', 'shield')}
    <div><div class="t3" style="margin-bottom:10px">Seguí leyendo</div><div class="list">${others.map(o => li(o.icon, o.title, o.desc, 'go', `data-n="article" data-id="${o.id}" data-replace="1"`)).join('')}</div></div></div></div>`);
};

/* 13 · Notificaciones */
const NICON = { recordatorio: 'bell', campana: 'flag', registro: 'clock', turno: 'cal' };
function prefsHTML() {
  const P = S.prefs, off = P.pausa;
  const row = (k, t, s, extra = '') => `<div class="card pref" style="${off ? 'opacity:.55' : ''}"><div class="row"><div class="grow"><div class="lt">${t}</div><div class="ls">${s}</div></div>${sw(P[k], 'pref', `data-k="${k}"`)}</div>${P[k] ? extra : ''}</div>`;
  return `<div class="pad stack fade" style="gap:14px;padding-bottom:28px">
    ${row('rec', 'Recordatorios entre donaciones', 'Un aviso a partir de tu última donación registrada.', `<div><div class="small" style="margin-bottom:8px">Avisarme a los</div>${opts([[45, '45 días'], [60, '60 días'], [90, '90 días'], [120, '120 días']], P.dias, 'prefv', 'data-k="dias"')}</div>
      <div class="preview"><small>Así se verá tu aviso</small>Pasaron ${P.dias} días desde tu última donación registrada. Si querés volver a donar, consultá con un centro los requisitos y plazos vigentes.</div>`)}
    ${row('camp', 'Campañas nuevas en mi zona', 'Cuando una institución publique una campaña cerca tuyo.', `<div><div class="small" style="margin-bottom:8px">Dentro de</div>${opts([[3, '3 km'], [5, '5 km'], [10, '10 km'], [20, '20 km']], P.zona, 'prefv', 'data-k="zona"')}</div>`)}
    ${row('turno', 'Recordatorios de turno', 'Solo cuando tengas una reserva confirmada.', `<div><div class="small" style="margin-bottom:8px">Avisarme</div>${opts([['2 horas', '2 h antes'], ['1 día', '1 día antes'], ['2 días', '2 días antes']], P.antes, 'prefv', 'data-k="antes"')}</div>`)}
    ${row('op', 'Resumen de oportunidades', 'Un correo breve con centros y campañas para volver a consultar.', `<div>${opts([['Cada 2 semanas', 'Cada 2 semanas'], ['Una vez al mes', 'Mensual']], P.resumen, 'prefv', 'data-k="resumen"')}</div>`)}
    <div class="card pref"><div class="row"><div class="grow"><div class="lt">Pausar todos los avisos</div><div class="ls">Seguís pudiendo ver tu historial y la biblioteca.</div></div>${sw(P.pausa, 'pref', 'data-k="pausa"')}</div></div>
    ${note('Nunca te vamos a decir que estás habilitada o habilitado para donar. Los avisos te invitan a consultar con la institución.', 'solid', 'shield')}</div>`;
}
SCREENS.notifications = () => {
  const ns = S.notifs.filter(n => S.nTab === 'all' || (S.nTab === 'rec' && (n.tipo === 'recordatorio' || n.tipo === 'turno')));
  const right = S.nTab !== 'prefs' ? `<button class="btn text sm" data-a="readall" style="min-height:40px">Marcar leídas</button>` : '<span style="width:42px"></span>';
  return screen(`${subHead('Notificaciones', right)}<div class="pad" style="padding-bottom:12px">${seg([['all', 'Todas'], ['rec', 'Recordatorios'], ['prefs', 'Preferencias']], S.nTab, 'ntab')}</div>
    <div class="body">${S.nTab === 'prefs' ? prefsHTML() : `<div class="pad" style="padding-bottom:28px">${ns.length ? `<div class="list fade">${ns.map(n => `<div class="nitem ${n.read ? '' : 'unread'}" role="button" tabindex="0" data-a="nopen" data-id="${n.id}"><span class="lic">${I(NICON[n.tipo], 20)}</span><div style="flex:1"><div class="nt">${esc(n.title)}</div><p>${esc(n.text)}</p><div class="when">${n.when}</div></div></div>`).join('')}</div>` : `<div class="empty"><span class="lic">${I('bell', 24)}</span><div class="t3">Sin notificaciones</div><div class="small">Te avisaremos cuando haya novedades útiles.</div></div>`}
      <div style="margin-top:16px">${note('Pocos avisos y siempre útiles. Podés ajustarlos en la pestaña Preferencias.')}</div></div>`}</div>`);
};

/* 14 · Perfil */
SCREENS.profile = () => {
  const u = S.user, ini = (u.nombre[0] || '') + (u.apellido[0] || '');
  return screen(`${tabHead('Mi perfil')}<div class="body">
    <div class="profile-top"><div class="avatar" aria-hidden="true">${esc(ini.toUpperCase())}</div><div><div class="t2">${esc(u.nombre)} ${esc(u.apellido)}</div><div class="muted" style="font-size:14px;margin-top:2px">${esc(u.localidad)}</div><div style="margin-top:8px">${chip('Donante desde ' + u.desde)}</div></div></div>
    <div class="pad stack" style="gap:18px;padding-bottom:30px">
      <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><div class="t3">Mis datos</div><button class="btn text sm" data-a="editprofile" style="min-height:36px">${I('edit', 16)}Editar</button></div>${kv('Correo', esc(u.email))}${kv('Nacimiento', dShort(parse(u.nacimiento)))}${kv('Localidad', esc(u.localidad))}</div>
      <div class="list">${li('bell', 'Notificaciones y recordatorios', S.prefs.pausa ? 'Pausados' : 'Preferencias de avisos', 'notifprefs')}${li('pin', 'Ubicación y búsqueda', `Radio de ${S.prefs.radio} km · ${S.prefs.ubic ? 'ubicación activada' : 'ubicación desactivada'}`, 'sheet', 'data-id="location"')}${li('book', 'Biblioteca de información', 'Requisitos, proceso y preguntas', 'go', 'data-n="library"')}</div>
      <div class="list">${li('shield', 'Privacidad y datos', 'Política y tratamiento de datos', 'sheet', 'data-id="privacy"')}${li('download', 'Descargar mis datos', '', 'toast', 'data-m="Te enviaremos un archivo a tu correo"')}${li('help', 'Ayuda y contacto', '', 'toast', 'data-m="Abriendo centro de ayuda…"')}</div>
      <div class="list">${li('logout', 'Cerrar sesión', '', 'sheet', 'data-id="logout"', '')}${li('trash', 'Eliminar mi cuenta', '', 'sheet', 'data-id="delacc"', '')}</div>
      <p class="small" style="text-align:center">Vinculate · versión de prototipo 0.9<br>Datos ficticios con fines ilustrativos</p></div></div>${navBar('profile')}`);
};
SCREENS.editprofile = () => screen(`${subHead('Editar datos')}<div class="body"><div class="pad stack" style="gap:16px;padding-bottom:20px">
  ${field({ id: 'e1', label: 'Nombre', path: 'edit.nombre', auto: 'given-name' })}${field({ id: 'e2', label: 'Apellido', path: 'edit.apellido', auto: 'family-name' })}${field({ id: 'e3', label: 'Fecha de nacimiento', type: 'date', path: 'edit.nacimiento' })}${selectLoc('edit.localidad', 'e4')}
  <div class="field"><label>Correo electrónico</label><input class="input" value="${esc(S.user.email)}" disabled style="opacity:.6"><div class="hint">Para cambiar tu correo, escribinos desde Ayuda.</div></div></div></div>${footer(btn('Guardar cambios', 'saveprofile'))}`);

/* hojas inferiores */
function sheetHTML() {
  if (!S.sheet) return '';
  const { type, params: p } = S.sheet; let c = '';
  const ent = () => p.kind === 'center' ? centerById(p.ref) : campById(p.ref);
  if (type === 'filters') { const n = fCenters().length; c = `<h2>Filtros</h2><p class="small">Se aplican a centros, mapa y campañas.</p><div class="stack" style="gap:20px;margin-top:16px">
    <div><div class="t3" style="margin-bottom:10px">Cercanía</div>${opts([['any', 'Cualquiera'], ['3', 'Hasta 3 km'], ['10', 'Hasta 10 km']], S.find.dist, 'fset', 'data-k="dist"')}</div>
    <div><div class="t3" style="margin-bottom:10px">Tipo de institución</div>${opts([['all', 'Todas'], ['hemoterapia', 'Centro de hemoterapia'], ['hospital', 'Hospital'], ['clinica', 'Sanatorio adherido']], S.find.tipo, 'fset', 'data-k="tipo"')}</div>
    <div><div class="t3" style="margin-bottom:10px">Zona</div>${opts([['all', 'Todas'], ['CABA', 'CABA'], ['GBA', 'GBA']], S.find.region, 'fset', 'data-k="region"')}</div>
    <div><div class="t3" style="margin-bottom:10px">Turnos</div>${opts([['0', 'Cualquiera'], ['1', 'Con turnos publicados']], S.find.turnos ? '1' : '0', 'fset', 'data-k="turnos"')}</div></div>
    <div style="display:flex;gap:10px;margin-top:22px">${btn('Limpiar', 'clearfilters', { v: 'ghost', d: { keep: 1 } })}${btn(`Ver ${S.find.seg === 'campanas' ? fCamps().length : n} resultados`, 'closeSheet')}</div>`; }
  if (type === 'directions') { const e = ent(), a = p.kind === 'center' ? `${e.addr}, ${e.zona}` : e.place, c0 = p.kind === 'center' ? e : centerById(e.org);
    c = `<h2>Cómo llegar</h2><p class="muted" style="font-size:14.5px">${esc(a)}</p><div class="list" style="margin-top:16px">
      <div class="li"><span class="lic">${I('walk', 20)}</span><span class="grow"><span class="lt">A pie</span><br><span class="ls">${c0.walk && p.kind === 'center' ? `Unos ${c0.walk} min desde Villa Crespo` : 'Lejos para ir caminando'}</span></span></div>
      <div class="li"><span class="lic">${I('bus', 20)}</span><span class="grow"><span class="lt">Transporte público</span><br><span class="ls">${esc(c0.transit)}</span></span></div>
      <div class="li"><span class="lic">${I('car', 20)}</span><span class="grow"><span class="lt">En auto</span><br><span class="ls">${km(e.km)} aprox. desde tu ubicación</span></span></div></div>
      <div class="stack" style="margin-top:18px;gap:10px">${btn('Abrir en la app de mapas', 'toastclose', { ic: 'nav', d: { m: 'Abriendo indicaciones en tu app de mapas…' } })}${btn('Cerrar', 'closeSheet', { v: 'text' })}</div>`; }
  if (type === 'confirm') { const e = ent(), d = parse(S.slot.date); c = `<h2>Confirmá tu turno</h2><div class="card flat" style="margin:14px 0">${kv('Lugar', esc(e.name))}${kv('Fecha', cap(dLong(d)))}${kv('Horario', S.slot.time + ' h')}</div>
    ${note('Recordá que el turno no garantiza la donación: la evaluación la realiza el personal de salud en el centro. Llevá tu DNI.', 'red')}<div class="stack" style="margin-top:18px;gap:10px">${btn('Confirmar turno', 'book', { d: { kind: p.kind, ref: p.ref } })}${btn('Volver', 'closeSheet', { v: 'text' })}</div>`; }
  if (type === 'booked') { const b = S.booking; c = `<div style="text-align:center;padding-top:6px"><div class="bigcheck"><svg class="tick" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div><h2 style="margin-top:16px">Turno reservado</h2><p class="muted">${esc(b.name)}<br>${cap(dLong(parse(b.date)))} · ${b.time} h</p></div>
    <div style="margin-top:16px">${note(`Te vamos a avisar ${S.prefs.antes === '2 horas' ? '2 horas' : S.prefs.antes} antes. Podés cambiarlo en Preferencias.`, 'solid', 'bell')}</div><div class="stack" style="margin-top:18px;gap:10px">${btn('Ir al inicio', 'finishbook')}${btn('Seguir explorando', 'closeSheet', { v: 'text' })}</div>`; }
  if (type === 'cancel') c = `<h2>¿Cancelar tu turno?</h2><p class="muted" style="margin-top:4px">Vamos a liberar el horario para otras personas. Podés reservar otro cuando quieras.</p><div class="stack" style="margin-top:20px;gap:10px">${btn('Sí, cancelar turno', 'cancelbook')}${btn('Mantener turno', 'closeSheet', { v: 'ghost' })}</div>`;
  if (type === 'register') { const f = S.form.don; c = `<h2>Registrar una donación</h2><p class="muted" style="font-size:14.5px;margin-bottom:16px">Quedará como “pendiente de validación” hasta que la institución la confirme.</p><div class="stack" style="gap:14px">
    <div class="field ${S.err['don.center'] ? 'err' : ''}"><label for="dc">Centro o campaña</label><select class="input" id="dc" data-bind="don.center"><option value="">Elegí un centro</option>${CENTERS.map(x => `<option ${f.center === x.name ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}<option ${f.center === 'Otra campaña o centro' ? 'selected' : ''}>Otra campaña o centro</option></select>${S.err['don.center'] ? `<div class="msg">${I('info', 14)}${S.err['don.center']}</div>` : ''}</div>
    ${field({ id: 'dd', label: 'Fecha de la donación', type: 'date', path: 'don.date' })}</div><div class="stack" style="margin-top:20px;gap:10px">${btn('Guardar registro', 'savedon')}${btn('Cancelar', 'closeSheet', { v: 'text' })}</div>`; }
  if (type === 'deldon') c = `<h2>¿Eliminar este registro?</h2><p class="muted" style="margin-top:4px">Solo podés eliminar registros que cargaste vos y aún no fueron validados.</p><div class="stack" style="margin-top:20px;gap:10px">${btn('Eliminar registro', 'deldon', { d: { id: p.ref } })}${btn('Cancelar', 'closeSheet', { v: 'ghost' })}</div>`;
  if (type === 'location') c = `<h2>Ubicación y búsqueda</h2><div class="list" style="margin:14px 0"><div class="li"><span class="grow"><span class="lt">Usar mi ubicación aproximada</span><br><span class="ls">Para ordenar centros por cercanía</span></span>${sw(S.prefs.ubic, 'pref', 'data-k="ubic"')}</div></div><div class="t3" style="margin-bottom:10px">Radio de búsqueda</div>${opts([[3, '3 km'], [5, '5 km'], [10, '10 km'], [20, '20 km']], S.prefs.radio, 'prefv', 'data-k="radio"')}<div style="margin-top:20px">${btn('Listo', 'closeSheet')}</div>`;
  if (type === 'privacy') c = `<h2>Privacidad y datos personales</h2><p class="small">Resumen de la política</p><div class="stack" style="gap:14px;margin-top:14px;font-size:14.5px;color:var(--ink2)">
    <p><b style="color:var(--ink)">Qué datos tratamos.</b> Nombre, apellido, fecha de nacimiento, localidad, correo electrónico e historial de donaciones registrado.</p>
    <p><b style="color:var(--ink)">Qué no pedimos.</b> No solicitamos ni almacenamos información médica ni resultados de estudios.</p>
    <p><b style="color:var(--ink)">Para qué los usamos.</b> Mostrarte centros y campañas cercanos, llevar tu historial y enviarte los avisos que elijas.</p>
    <p><b style="color:var(--ink)">Tus derechos.</b> Podés acceder, rectificar y eliminar tus datos en cualquier momento, conforme a la Ley 25.326 de Protección de Datos Personales y a la Ley 26.529 sobre confidencialidad.</p></div><div style="margin-top:20px">${btn('Entendido', 'closeSheet')}</div>`;
  if (type === 'logout') c = `<h2>¿Cerrar sesión?</h2><p class="muted" style="margin-top:4px">Tu historial y preferencias quedan guardados en tu cuenta.</p><div class="stack" style="margin-top:20px;gap:10px">${btn('Cerrar sesión', 'logout')}${btn('Cancelar', 'closeSheet', { v: 'ghost' })}</div>`;
  if (type === 'delacc') c = `<h2>¿Eliminar tu cuenta?</h2><p class="muted" style="margin-top:4px">Se borrarán tu perfil, historial y preferencias. Esta acción no se puede deshacer.</p><div class="stack" style="margin-top:20px;gap:10px">${btn('Eliminar mi cuenta', 'logout', { d: { m: 'Tu cuenta fue eliminada (simulación)' } })}${btn('Cancelar', 'closeSheet', { v: 'ghost' })}</div>`;
  return `<div class="scrim" data-a="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${c}</div>`;
}

/* ───────────────────────── render ───────────────────────── */
let lastKey = '';
function render(nav) {
  const { name, params } = current();
  const key = name + JSON.stringify(params);
  const prev = $('.body'); const top = prev && !nav ? prev.scrollTop : 0;
  const mapKeep = !nav && name === 'find' && S.find.seg === 'mapa';
  app.innerHTML = SCREENS[name](params) + sheetHTML();
  S.dir = null; lastKey = key;
  const b = $('.body'); if (b && top) b.scrollTop = top;
  if (mapKeep || (name === 'find' && S.find.seg === 'mapa')) bindMap();
  if (nav) app.querySelector('.screen')?.classList.add('fresh');
}
function mapApply() {
  const svg = $('#map'); if (!svg) return; const r = svg.getBoundingClientRect(); if (!r.width) return;
  const vw = 720 / MAP.z, vh = vw * r.height / r.width;
  svg.setAttribute('viewBox', `${MAP.cx - vw / 2} ${MAP.cy - vh / 2} ${vw} ${vh}`);
  const s = vw / r.width;
  svg.querySelectorAll('[data-pin]').forEach(g => g.setAttribute('transform', `translate(${g.dataset.x} ${g.dataset.y}) scale(${s})`));
}
function bindMap() {
  const svg = $('#map'); if (!svg) return; mapApply();
  let down = null;
  svg.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, cx: MAP.cx, cy: MAP.cy, moved: false }; svg.setPointerCapture(e.pointerId); });
  svg.addEventListener('pointermove', e => {
    if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) down.moved = true;
    if (down.moved) { const s = (720 / MAP.z) / svg.getBoundingClientRect().width; MAP.cx = Math.max(-100, Math.min(1700, down.cx - dx * s)); MAP.cy = Math.max(-100, Math.min(1500, down.cy - dy * s)); mapApply(); }
  });
  svg.addEventListener('pointerup', e => {
    const d = down; down = null; if (!d || d.moved) return;
    const pin = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-pin]');
    S.find.sel = pin && pin.dataset.pin !== 'me' ? pin.dataset.pin : null; render();
  });
}

/* ───────────────────────── acciones ───────────────────────── */
const A = {
  go: d => { if (d.replace) { S.stack.pop(); } go(d.n, { id: d.id, kind: d.kind }); },
  back, tab: d => tab(d.id), closeSheet,
  to: d => { if (d.v === 'auth') { S.authTab = d.t || 'register'; S.err = {}; } S.stack = []; root(d.v); },
  slide: d => { S.slide = +d.id; render(); },
  authtab: d => { S.authTab = d.id; S.err = {}; render(); },
  showpw: d => { S.show[d.p] = !S.show[d.p]; render(); },
  register: () => {
    const f = S.form.reg; S.err = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) S.err['reg.email'] = 'Ingresá un correo válido, por ejemplo nombre@correo.com.';
    if (f.pass.length < 8) S.err['reg.pass'] = 'La contraseña debe tener al menos 8 caracteres.';
    if (Object.keys(S.err).length) return render();
    S.obStep = 0; root('onboarding');
  },
  login: () => {
    const f = S.form.login; S.err = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) S.err['login.email'] = 'Ingresá un correo válido.';
    if (f.pass.length < 8) S.err['login.pass'] = 'Ingresá tu contraseña (8 caracteres o más).';
    if (Object.keys(S.err).length) return render();
    S.logged = true; S.tab = 'home'; root('home'); toast('Sesión iniciada');
  },
  forgot: () => { S.err = {}; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(S.form.forgot.email)) { S.err['forgot.email'] = 'Ingresá un correo válido.'; return render(); } S.forgotSent = true; render(); },
  resend: () => toast('Enlace reenviado'),
  obback: () => { S.obStep--; S.err = {}; S.dir = 'in-l'; render(true); },
  obnext: () => {
    const f = S.form.prof; S.err = {};
    if (S.obStep === 0) {
      if (!f.nombre.trim()) S.err['prof.nombre'] = 'Ingresá tu nombre.';
      if (!f.apellido.trim()) S.err['prof.apellido'] = 'Ingresá tu apellido.';
      if (!f.nacimiento || parse(f.nacimiento) > window.TODAY) S.err['prof.nacimiento'] = 'Ingresá una fecha de nacimiento válida.';
      if (!f.localidad) S.err['prof.localidad'] = 'Elegí tu localidad.';
      if (Object.keys(S.err).length) return render();
    }
    if (S.obStep === 3) {
      const c = S.form.cons; if (!c.priv) S.err['cons.priv'] = 1; if (!c.datos) S.err['cons.datos'] = 1;
      if (Object.keys(S.err).length) return render();
      S.user = { ...S.user, nombre: f.nombre.trim(), apellido: f.apellido.trim(), nacimiento: f.nacimiento, localidad: f.localidad };
      S.logged = true; S.tab = 'home'; root('home'); return toast('¡Tu cuenta está lista!');
    }
    S.obStep++; S.dir = 'in-r'; render(true);
  },
  cons: d => { S.form.cons[d.k] = !S.form.cons[d.k]; delete S.err['cons.' + d.k]; render(); },
  pref: (d, el) => { el.classList.toggle('on'); S.prefs[d.k] = !S.prefs[d.k]; setTimeout(render, 170); },
  prefv: d => { const v = d.id; S.prefs[d.k] = ['dias', 'zona', 'radio'].includes(d.k) ? +v : v; render(); },
  notifprefs: () => { S.nTab = 'prefs'; go('notifications'); },
  ntab: d => { S.nTab = d.id; render(); },
  nopen: d => { const n = S.notifs.find(x => x.id === d.id); n.read = true; const [t, id] = n.go; if (t === 'tab') { S.find.seg = 'centros'; S.stack = []; tab(id); } else go(t, { id }); },
  readall: () => { S.notifs.forEach(n => n.read = true); render(); toast('Notificaciones marcadas como leídas'); },
  findnear: () => { S.find = { ...S.find, seg: 'centros', dist: '3' }; tab('find'); },
  findcamp: () => { S.find.seg = 'campanas'; tab('find'); },
  fseg: d => { S.find.seg = d.id; S.find.sel = null; render(); },
  quick: d => { const f = S.find; if (d.id === 'dist') f.dist = f.dist === '3' ? 'any' : '3'; else if (d.id === 'turnos') f.turnos = !f.turnos; else f.region = f.region === d.id ? 'all' : d.id; render(); },
  fset: d => { const f = S.find; if (d.k === 'turnos') f.turnos = d.id === '1'; else f[d.k] = d.id; render(); },
  clearfilters: d => { Object.assign(S.find, { dist: 'any', tipo: 'all', turnos: false, region: 'all', q: d.keep ? S.find.q : '' }); render(); },
  clearq: () => { S.find.q = ''; render(); }, clearlq: () => { S.libQ = ''; render(); },
  zoom: d => { if (d.id === 'in') MAP.z = Math.min(3.2, MAP.z * 1.35); else if (d.id === 'out') MAP.z = Math.max(0.5, MAP.z / 1.35); else { MAP.cx = 800; MAP.cy = 620; MAP.z = 1.4; } mapApply(); },
  hfilter: d => { S.hist = d.id; render(); },
  sheet: d => sheet(d.id, { kind: d.kind, ref: d.ref }),
  acc: (d, el) => { S.open[d.id] = !S.open[d.id]; const a = el.closest('.acc'); a.classList.toggle('open', S.open[d.id]); el.setAttribute('aria-expanded', S.open[d.id]); },
  remind: (d, el) => { el.classList.toggle('on'); S.open['rem_' + d.id] = !S.open['rem_' + d.id]; toast(S.open['rem_' + d.id] ? 'Te vamos a recordar esta campaña' : 'Recordatorio quitado'); },
  slotday: d => { S.slot.date = d.id; S.slot.time = null; render(); },
  slottime: d => { S.slot.time = d.id; render(); },
  book: d => {
    const e = d.kind === 'center' ? centerById(d.ref) : campById(d.ref);
    S.booking = { kind: d.kind, id: d.ref, name: e.name, place: d.kind === 'center' ? e.addr : e.place, date: S.slot.date, time: S.slot.time };
    S.notifs.unshift({ id: 'n' + Date.now(), tipo: 'turno', read: false, when: 'Ahora', title: 'Turno reservado', text: `${e.name}, ${dLong(parse(S.slot.date))} a las ${S.slot.time} h. Recordá llevar tu DNI.`, go: ['tab', 'home'] });
    sheet('booked');
  },
  finishbook: () => { S.sheet = null; S.slot = { date: null, time: null }; tab('home'); toast('Turno guardado en tu inicio'); },
  cancelbook: () => { S.booking = null; S.sheet = null; render(); toast('Turno cancelado'); },
  savedon: () => {
    const f = S.form.don; S.err = {};
    if (!f.center) S.err['don.center'] = 'Elegí dónde donaste.';
    if (!f.date || parse(f.date) > window.TODAY) S.err['don.date'] = 'Ingresá una fecha válida (no futura).';
    if (Object.keys(S.err).length) return render();
    S.donations.push({ id: 'd' + Date.now(), date: f.date, time: '', center: f.center, zona: 'Registro manual', estado: 'pendiente', origen: 'Registrada por vos' });
    S.form.don = { center: '', date: '' }; S.sheet = null; render(); toast('Guardado como pendiente de validación');
  },
  deldon: d => { S.donations = S.donations.filter(x => x.id !== d.id); S.sheet = null; S.stack.pop(); S.dir = 'in-l'; render(true); toast('Registro eliminado'); },
  editprofile: () => { S.form.edit = { nombre: S.user.nombre, apellido: S.user.apellido, nacimiento: S.user.nacimiento, localidad: S.user.localidad }; S.err = {}; go('editprofile'); },
  saveprofile: () => {
    const f = S.form.edit; S.err = {};
    if (!f.nombre.trim()) S.err['edit.nombre'] = 'Ingresá tu nombre.'; if (!f.apellido.trim()) S.err['edit.apellido'] = 'Ingresá tu apellido.';
    if (!f.nacimiento || parse(f.nacimiento) > window.TODAY) S.err['edit.nacimiento'] = 'Fecha inválida.'; if (!f.localidad) S.err['edit.localidad'] = 'Elegí tu localidad.';
    if (Object.keys(S.err).length) return render();
    S.user = { ...S.user, ...f, nombre: f.nombre.trim(), apellido: f.apellido.trim() }; S.stack.pop(); S.dir = 'in-l'; render(true); toast('Datos actualizados');
  },
  logout: d => { S.logged = false; S.sheet = null; S.stack = []; S.slide = 0; S.view = 'welcome'; S.dir = 'in-l'; render(true); if (d.m) toast(d.m); },
  toast: d => toast(d.m), toastclose: d => { S.sheet = null; render(); toast(d.m); },
};

/* ───────────────────────── eventos ───────────────────────── */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el || !app.contains(el)) return;
  if (e.target.closest('a[data-a]') ) e.preventDefault();
  if (el.disabled) return;
  const fn = A[el.dataset.a]; if (fn) fn(el.dataset, el);
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button],[role=checkbox]')) { e.preventDefault(); e.target.click(); } });
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.bind) {
    setP(S.form, t.dataset.bind, t.value); delete S.err[t.dataset.bind];
    if (t.dataset.bind === 'reg.pass') { const v = t.value, sc = [v.length >= 8, /[a-z]/.test(v) && /[A-Z]/.test(v), /\d/.test(v), /[^\w\s]/.test(v) || v.length >= 12].filter(Boolean).length; document.querySelectorAll('#strength i').forEach((i, n) => { i.className = (n < sc ? 'on ' : '') + (sc >= 3 ? 'ok' : ''); }); }
  }
  if (t.dataset.find) { const k = t.dataset.find; const val = t.value; const pos = t.selectionStart; if (k === 'q') S.find.q = val; else S.libQ = val; S.find.sel = null; render(); const n = document.getElementById(t.id); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (_) {} } }
});
document.addEventListener('change', e => { const t = e.target; if (t.tagName === 'SELECT' && t.dataset.bind) { setP(S.form, t.dataset.bind, t.value); delete S.err[t.dataset.bind]; } });
document.addEventListener('click', e => {
  const j = e.target.closest('[data-jump]'); if (!j) return;
  const k = j.dataset.jump; S.sheet = null; S.stack = []; S.dir = null; S.open = {}; S.err = {};
  const logged = () => { S.logged = true; };
  const M = {
    welcome: () => { S.slide = 0; S.view = 'welcome'; },
    auth: () => { S.authTab = 'register'; S.view = 'auth'; },
    onboarding: () => { S.obStep = 0; S.view = 'onboarding'; },
    home: () => { logged(); S.tab = S.view = 'home'; },
    centros: () => { logged(); S.find.seg = 'centros'; S.tab = S.view = 'find'; },
    mapa: () => { logged(); S.find.seg = 'mapa'; S.find.sel = 'palermo'; MAP.cx = 880; MAP.cy = 560; MAP.z = 1.1; S.tab = S.view = 'find'; },
    ficha: () => { logged(); S.tab = S.view = 'find'; S.stack = [{ name: 'center', params: { id: 'palermo' } }]; },
    campanas: () => { logged(); S.find.seg = 'campanas'; S.tab = S.view = 'find'; },
    campana: () => { logged(); S.tab = S.view = 'find'; S.stack = [{ name: 'campaign', params: { id: 'k1' } }]; },
    turnos: () => { logged(); S.slot = { date: null, time: null }; S.tab = S.view = 'find'; S.stack = [{ name: 'slots', params: { kind: 'center', id: 'palermo' } }]; },
    historial: () => { logged(); S.tab = S.view = 'history'; },
    donacion: () => { logged(); S.tab = S.view = 'history'; S.stack = [{ name: 'donation', params: { id: 'd3' } }]; },
    biblioteca: () => { logged(); S.tab = S.view = 'home'; S.stack = [{ name: 'library', params: {} }]; },
    notifs: () => { logged(); S.nTab = 'all'; S.tab = S.view = 'home'; S.stack = [{ name: 'notifications', params: {} }]; },
    perfil: () => { logged(); S.tab = S.view = 'profile'; },
  };
  M[k]?.(); render(true);
});

render(true);
})();
