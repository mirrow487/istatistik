(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const DAY = 86400000;
  const LISTING_LEAD_DAYS = 45;
  const WIKI_REFRESH_MS = 15 * 60 * 1000;
  const WIKI_CACHE_MS = 60 * 60 * 1000;
  const COMP_LABEL = { 1: "Düşük", 2: "Orta", 3: "Yüksek" };
  const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DARK_GARMENTS = ["black", "pepper", "navy", "green", "maroon"];
  // Sıralı mavi rampa (açık → koyu) — ısı haritası için
  const RAMP = ["#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec", "#5598e7", "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281", "#0d366b"];

  const state = {
    live: true,        // true: skorlar şu anki tarihe göre saniyede bir hesaplanır
    month: new Date().getMonth(),
    cat: "",
    q: "",
    trendId: null,
    wiki: {},          // id -> { views:[...], avg7, change, fetchedAt }
    wikiAt: 0,
  };

  /* ---------- Güvenli localStorage ---------- */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* depolama kapalı olabilir */ }
    },
  };

  /* ---------- Yardımcılar ---------- */
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) if (c != null) node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    return node;
  }
  const svgEl = (tag, attrs = {}) => {
    const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const arrowIcon = () => {
    const s = svgEl("svg", { viewBox: "0 0 24 24", width: 18, height: 18, "aria-hidden": "true" });
    s.append(svgEl("path", { d: "M5 12h14M13 6l6 6-6 6", fill: "none", stroke: "currentColor", "stroke-width": 2.4, "stroke-linecap": "round", "stroke-linejoin": "round" }));
    return s;
  };
  const mod = (n, m) => ((n % m) + m) % m;
  const fmt = (n, d = 2) => n.toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtInt = (n) => Math.round(n).toLocaleString("tr-TR");
  const pad = (n) => String(n).padStart(2, "0");
  function fmtCountdown(ms) {
    if (ms <= 0) return "bugün";
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    return `${d}g ${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  }
  const fmtDate = (d) => d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "short" });
  const setText = (node, text) => { if (node && node.textContent !== text) node.textContent = text; };

  /* ---------- Puan modeli ---------- */
  // Her trend için 12 aylık ham eğri (ay ortası değerleri)
  const rawCache = new Map();
  function rawCurve(t) {
    if (rawCache.has(t.id)) return rawCache.get(t.id);
    const vals = MONTHS.map((_, m) => {
      let v = t.base;
      for (const [pm, amp, w] of t.peaks) {
        const d = Math.min(Math.abs(m - pm), 12 - Math.abs(m - pm));
        v = Math.max(v, t.base + (amp - t.base) * Math.exp(-(d * d) / (2 * w * w)));
      }
      if (t.gift) v += m === 10 ? 8 : m === 11 ? 12 : 0;
      return Math.max(0, Math.min(100, v));
    });
    rawCache.set(t.id, vals);
    return vals;
  }
  const curve = (t) => rawCurve(t).map(Math.round);
  const peakMonth = (t) => { const c = rawCurve(t); return c.indexOf(Math.max(...c)); };
  const isEvergreen = (t) => Math.max(...rawCurve(t)) - Math.min(...rawCurve(t)) < 25;

  // Belirli bir andaki endeks: ay ortası değerleri arasında gün/saat hassasiyetinde enterpolasyon
  function scoreAt(t, date) {
    const raw = rawCurve(t);
    const dim = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const dayFrac = (date.getDate() - 1 + (date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()) / 86400) / dim;
    const pos = date.getMonth() + dayFrac - 0.5;
    const i0 = Math.floor(pos);
    const f = pos - i0;
    return raw[mod(i0, 12)] * (1 - f) + raw[mod(i0 + 1, 12)] * f;
  }
  // Seçili zaman: canlı modda "şimdi", ay modunda o ayın 15'i
  function refDate(now = new Date()) {
    if (state.live) return now;
    const y = now.getFullYear() + (state.month < now.getMonth() ? 1 : 0);
    return new Date(y, state.month, 15, 12);
  }
  const score = (t, d) => scoreAt(t, d);
  const delta30 = (t, d) => scoreAt(t, d) - scoreAt(t, new Date(d.getTime() - 30 * DAY));

  /* ---------- ABD etkinlik tarihleri ---------- */
  function easterSunday(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
  }
  function eventDateIn(t, y) {
    const ev = EVENTS[t.id];
    if (!ev) return new Date(y, peakMonth(t), 15);
    if (ev.easter) return easterSunday(y);
    if (ev.fixed) return new Date(y, ev.fixed[0], ev.fixed[1]);
    const [mon, wd, n] = ev.nth;
    if (n > 0) {
      const first = new Date(y, mon, 1);
      return new Date(y, mon, 1 + mod(wd - first.getDay(), 7) + (n - 1) * 7);
    }
    const last = new Date(y, mon + 1, 0);
    return new Date(y, mon, last.getDate() - mod(last.getDay() - wd, 7));
  }
  // Bir sonraki etkinlik (bugün dahil)
  function nextEvent(t, from) {
    const startOfDay = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    let d = eventDateIn(t, from.getFullYear());
    if (d < startOfDay) d = eventDateIn(t, from.getFullYear() + 1);
    return d;
  }
  const eventName = (t) => EVENTS[t.id]?.name ?? `${MONTHS_LONG[peakMonth(t)]} zirvesi`;

  // Yer tutucular: {YEAR} = trendin bir sonraki zirvesinin yılı, {NEXT_YEAR} = yaklaşan mezuniyet / yeni yıl
  function fill(str, t) {
    const now = new Date();
    const pm = t.peaks.length ? t.peaks[0][0] : now.getMonth();
    const year = now.getFullYear() + (pm < now.getMonth() ? 1 : 0);
    const nextYear = now.getFullYear() + (now.getMonth() >= 6 ? 1 : 0);
    return str.replaceAll("{YEAR}", year).replaceAll("{NEXT_YEAR}", nextYear);
  }

  function filtered() {
    const q = state.q.trim().toLowerCase();
    return TRENDS.filter((t) => {
      if (state.cat && t.cat !== state.cat) return false;
      if (!q) return true;
      return [t.tr, t.en, t.audience, ...t.tags, ...t.ideas].join(" ").toLowerCase().includes(q);
    });
  }
  const byId = (id) => TRENDS.find((t) => t.id === id);

  /* ---------- Tooltip ---------- */
  const tip = $("#tooltip");
  function showTip(evt, value, label) {
    tip.replaceChildren(el("b", { text: value }), el("br"), label);
    tip.hidden = false;
    const r = evt.target.getBoundingClientRect();
    const x = evt.clientX ?? r.left + r.width / 2;
    const y = evt.clientY ?? r.top;
    tip.style.left = Math.max(8, Math.min(window.innerWidth - tip.offsetWidth - 8, x + 12)) + "px";
    tip.style.top = Math.max(8, y - tip.offsetHeight - 10) + "px";
  }
  const hideTip = () => { tip.hidden = true; };
  function withTip(node, value, label) {
    node.addEventListener("pointermove", (e) => showTip(e, value, label));
    node.addEventListener("pointerleave", hideTip);
    node.addEventListener("focus", (e) => showTip(e, value, label));
    node.addEventListener("blur", hideTip);
    return node;
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 1800);
  }

  const arrowBtn = (t) => el("button", {
    class: "go", type: "button", "aria-label": `${t.tr} için Gemini prompt'u oluştur`, title: "Gemini prompt'u oluştur",
    onclick: () => openDrawer(t.id),
  }, arrowIcon());

  function deltaPill(d, suffix = "") {
    const cls = d > 0.5 ? "up" : d < -0.5 ? "down" : "flat";
    const sym = d > 0.5 ? "▲" : d < -0.5 ? "▼" : "■";
    return { cls: `pill ${cls}`, text: `${sym} ${d > 0 ? "+" : ""}${fmt(d, 1)}${suffix}` };
  }

  /* ---------- Canlı bileşenlerin referansları (her saniye güncellenir) ---------- */
  let liveRefs = { rows: new Map(), cards: [], events: [], kpi: {} };

  /* ---------- Hero ---------- */
  function renderHeroEvents(now) {
    const list = TRENDS.filter((t) => EVENTS[t.id] && t.id !== "xmasfamily")
      .map((t) => ({ t, d: nextEvent(t, now) }))
      .sort((a, b) => a.d - b.d)
      .filter((x, i, arr) => arr.findIndex((y) => EVENTS[y.t.id].name === EVENTS[x.t.id].name) === i)
      .slice(0, 4);
    liveRefs.events = list.map(({ t, d }) => {
      const cd = el("span");
      const sub = el("small");
      const li = el("li", {},
        el("span", { class: "ev", text: EVENTS[t.id].name }),
        el("span", { class: "dt", text: fmtDate(d) }),
        el("span", { class: "cd" }, cd, sub));
      return { li, cd, sub, d };
    });
    $("#heroEvents").replaceChildren(...liveRefs.events.map((x) => x.li));
  }

  /* ---------- KPI'lar ---------- */
  function renderKpis() {
    const kpi = (icon, k) => {
      const v = el("div", { class: "v" });
      const d = el("div", { class: "d" });
      return { node: el("div", { class: "kpi" }, el("div", { class: "k" }, el("span", { class: "dot", text: icon }), k), v, d), v, d };
    };
    const a = kpi("★", "1 numara");
    const b = kpi("↗", "Yükselen trend (30 gün)");
    const c = kpi("W", "En çok ilgi artışı");
    const e = kpi("$", "Toplam gelirim");
    liveRefs.kpi = { a, b, c, e };
    $("#kpis").replaceChildren(a.node, b.node, c.node, e.node);
  }

  function updateKpis(list, d) {
    const { a, b, c, e } = liveRefs.kpi;
    const ranked = [...list].sort((x, y) => score(y, d) - score(x, d));
    const top = ranked[0];
    setText(a.v, top ? fmt(score(top, d)) : "—");
    setText(a.d, top ? fill(top.tr, top) : "Sonuç yok");
    const rising = list.filter((t) => delta30(t, d) >= 8);
    setText(b.v, String(rising.length));
    setText(b.d, rising.length ? rising.sort((x, y) => delta30(y, d) - delta30(x, d)).slice(0, 2).map((t) => fill(t.tr, t)).join(", ") : "şu an yükselen yok");
    const wikiBest = list.filter((t) => state.wiki[t.id]?.change != null).sort((x, y) => state.wiki[y.id].change - state.wiki[x.id].change)[0];
    setText(c.v, wikiBest ? `${state.wiki[wikiBest.id].change > 0 ? "+" : ""}${fmt(state.wiki[wikiBest.id].change, 0)}%` : "—");
    setText(c.d, wikiBest ? `${fill(wikiBest.tr, wikiBest)} · Wikipedia` : "Wikipedia verisi bekleniyor");
    const sales = store.get("trendRadar.sales", []);
    const revenue = sales.reduce((s, x) => s + Number(x.revenue || 0), 0);
    const qty = sales.reduce((s, x) => s + Number(x.qty || 0), 0);
    setText(e.v, `$${revenue.toFixed(2)}`);
    setText(e.d, `${qty} adet · ${sales.length} kayıt`);

    // Hero
    if (top) {
      setText($("#heroTop"), fill(top.tr, top));
      const s5 = fmt(score(top, d), 5);
      setText($("#heroScore"), s5.slice(0, -3));
      setText($("#heroFine"), s5.slice(-3));
      const p = deltaPill(delta30(top, d), " / 30g");
      const hd = $("#heroDelta");
      hd.className = "pill"; setText(hd, p.text);
    }
  }

  /* ---------- Şimdi hazırla ---------- */
  function renderPrep(list) {
    const d = refDate();
    const items = list.map((t) => {
      let best = 0, bestAhead = 0;
      for (let k = 7; k <= 100; k += 7) {
        const s = score(t, new Date(d.getTime() + k * DAY));
        if (s > best) { best = s; bestAhead = k; }
      }
      return { t, best, bestAhead, rise: best - score(t, d), ev: nextEvent(t, d) };
    }).filter((x) => x.best >= 55 && x.rise >= 12)
      .sort((a, b) => a.ev - b.ev).slice(0, 8);

    setText($("#prepSub"), state.live ? "Canlı · şimdi" : `${MONTHS_LONG[state.month]} ortası`);
    const box = $("#prepCards");
    liveRefs.cards = [];
    if (!items.length) { box.replaceChildren(el("p", { class: "empty", text: "Bu filtrede önümüzdeki haftalarda yükselen trend yok." })); return; }
    box.replaceChildren(...items.map(({ t, best, ev }) => {
      const cur = el("b");
      const evCd = el("b");
      const listCd = el("b");
      const listBox = el("div", {}, el("small", { text: "Listeleme son gün" }), listCd);
      liveRefs.cards.push({ t, cur, evCd, listCd, listBox, ev });
      return el("article", { class: "card" },
        el("div", { class: "card-top" },
          el("div", {}, el("h3", { text: fill(t.tr, t) }), el("div", { class: "meta", text: `${CATEGORIES[t.cat]} · Rekabet ${COMP_LABEL[t.comp]}` })),
          arrowBtn(t)),
        el("div", { class: "stat" }, cur, el("span", { class: "muted", text: `→ ${fmt(best, 0)} zirve` })),
        sparkline(t, 220, 28),
        el("div", { class: "timer" },
          el("div", {}, el("small", { text: eventName(t) }), evCd),
          listBox),
      );
    }));
  }

  /* ---------- Sparkline (model, 12 ay) ---------- */
  function sparkline(t, w = 120, h = 24) {
    const c = curve(t);
    const bw = w / 12;
    const cur = refDate().getMonth();
    const svg = svgEl("svg", { class: "spark", width: w, height: h, viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": `${t.tr} 12 aylık eğri: ` + c.map((v, i) => `${MONTHS[i]} ${v}`).join(", ") });
    c.forEach((v, i) => {
      const bh = Math.max(2, (v / 100) * h);
      const r = svgEl("rect", { x: i * bw + 1, y: h - bh, width: bw - 2, height: bh, rx: 1.5 });
      if (i === cur) r.setAttribute("class", "hi");
      withTip(r, String(v), `${MONTHS_LONG[i]} · ${t.tr}`);
      svg.append(r);
    });
    return svg;
  }

  /* ---------- Wikipedia çizgisi (gerçek veri, son 30 gün) ---------- */
  function wikiLine(t, w = 90, h = 28) {
    const data = state.wiki[t.id];
    const views = data.views.slice(-30);
    const max = Math.max(1, ...views);
    const pts = views.map((v, i) => [(i / Math.max(1, views.length - 1)) * w, h - 2 - (v / max) * (h - 4)]);
    const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
    const svg = svgEl("svg", { class: "wline", width: w, height: h, viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": `${t.tr} Wikipedia son 30 gün görüntülenme` });
    svg.append(svgEl("path", { class: "area", d: `${line}L${w},${h}L0,${h}Z` }), svgEl("path", { d: line }));
    withTip(svg, `${fmtInt(data.avg7)} / gün`, `Son 7 gün ort. · ${WIKI[t.id].replaceAll("_", " ")}`);
    return svg;
  }
  function wikiCell(t) {
    const data = state.wiki[t.id];
    if (!data) return el("span", { class: "wiki-na", text: state.wikiAt ? "veri yok" : "yükleniyor…" });
    const p = deltaPill(data.change, "%");
    return el("div", { class: "wiki" },
      wikiLine(t),
      el("div", { class: "nums" }, el("b", { text: fmtInt(data.avg7) }), el("small", {}, el("span", { class: p.cls, text: p.text.replace(",0", "") }))));
  }

  /* ---------- Sıralama tablosu ---------- */
  function renderRank(list) {
    const d = refDate();
    setText($("#rankSub"), state.live ? "Canlı · her saniye" : `${MONTHS_LONG[state.month]} ortası`);
    const ranked = [...list].sort((a, b) => score(b, d) - score(a, d));
    liveRefs.rows = new Map();
    const rows = ranked.map((t, i) => {
      const numSpan = el("span", { class: i < 3 ? "top" : null, text: String(i + 1) });
      const scoreB = el("b");
      const fillBar = el("div", { class: "fill" });
      const deltaSpan = el("span");
      const q = encodeURIComponent(fill(t.tags[0], t));
      const wikiTd = el("td", {}, wikiCell(t));
      const tr = el("tr", { "data-id": t.id },
        el("td", { class: "num" }, numSpan),
        el("td", { class: "name" }, el("b", { text: fill(t.tr, t) }),
          el("span", { text: `${CATEGORIES[t.cat]}${isEvergreen(t) ? " · her mevsim" : ` · zirve ${MONTHS_LONG[peakMonth(t)]}`}` })),
        el("td", {}, el("div", { class: "score" }, el("div", { class: "track" }, fillBar), scoreB)),
        el("td", {}, deltaSpan),
        el("td", { class: "hide-sm" }, sparkline(t)),
        wikiTd,
        el("td", { class: "hide-sm" }, el("span", { class: "comp" }, el("i", { style: `background:var(--comp-${t.comp})` }), COMP_LABEL[t.comp])),
        el("td", { class: "links hide-sm" },
          el("a", { href: `https://trends.google.com/trends/explore?geo=US&date=today%203-m&q=${q}`, target: "_blank", rel: "noopener", text: "Trends" }),
          el("a", { href: `https://www.etsy.com/search?q=${q}`, target: "_blank", rel: "noopener", text: "Etsy" })),
        el("td", {}, arrowBtn(t)),
      );
      liveRefs.rows.set(t.id, { t, tr, numSpan, scoreB, fillBar, deltaSpan, wikiTd });
      return tr;
    });
    $("#rankTable tbody").replaceChildren(...(rows.length ? rows : [el("tr", {}, el("td", { colspan: 9, class: "empty", text: "Sonuç bulunamadı." }))]));
  }

  function updateRank(d) {
    const refs = [...liveRefs.rows.values()];
    if (!refs.length) return;
    for (const r of refs) {
      const s = score(r.t, d);
      setText(r.scoreB, fmt(s));
      r.fillBar.style.width = `${s}%`;
      const p = deltaPill(delta30(r.t, d));
      if (r.deltaSpan.className !== p.cls) r.deltaSpan.className = p.cls;
      setText(r.deltaSpan, p.text);
    }
    // Sıra değiştiyse satırları yeniden diz
    const sorted = [...refs].sort((a, b) => score(b.t, d) - score(a.t, d));
    const tbody = $("#rankTable tbody");
    const current = [...tbody.children].map((tr) => tr.dataset.id);
    if (sorted.some((r, i) => r.t.id !== current[i])) {
      sorted.forEach((r, i) => {
        tbody.append(r.tr);
        setText(r.numSpan, String(i + 1));
        r.numSpan.className = i < 3 ? "top" : "";
        if (current[i] !== r.t.id) { r.tr.classList.remove("flash"); void r.tr.offsetWidth; r.tr.classList.add("flash"); }
      });
    }
  }

  function updateWikiCells() {
    for (const r of liveRefs.rows.values()) r.wikiTd.replaceChildren(wikiCell(r.t));
  }

  /* ---------- Isı haritası ---------- */
  function renderHeat(list) {
    const m = refDate().getMonth();
    const sorted = [...list].sort((a, b) => (isEvergreen(a) - isEvergreen(b)) || (peakMonth(a) - peakMonth(b)));
    const head = el("tr", {}, el("th", {}), ...MONTHS.map((mn, i) => el("th", { class: i === m ? "cur" : null, text: mn })), el("th", {}));
    const rows = sorted.map((t) => el("tr", {},
      el("th", { class: "rowh", scope: "row", text: fill(t.tr, t) }),
      ...curve(t).map((v, i) => {
        const cell = el("div", { class: "cell", tabindex: "0", style: `background:${RAMP[Math.round((v / 100) * (RAMP.length - 1))]}`, "aria-label": `${t.tr}, ${MONTHS_LONG[i]}: ${v}` });
        withTip(cell, String(v), `${MONTHS_LONG[i]} · ${t.tr}`);
        return el("td", { class: i === m ? "cur" : null }, cell);
      }),
      el("td", {}, arrowBtn(t)),
    ));
    $("#heatTable").replaceChildren(el("thead", {}, head), el("tbody", {}, ...rows));
  }

  /* ---------- Saniyelik tick ---------- */
  function tick() {
    const now = new Date();
    const d = refDate(now);
    setText($("#nyClock"), now.toLocaleTimeString("tr-TR", { timeZone: "America/New_York", hour12: false }));
    setText($("#trClock"), now.toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", hour12: false }));

    for (const x of liveRefs.events) {
      setText(x.cd, fmtCountdown(x.d - now));
      const lb = x.d.getTime() - LISTING_LEAD_DAYS * DAY - now.getTime();
      setText(x.sub, lb > 0 ? `listele: ${Math.ceil(lb / DAY)} gün` : "listeleme geç kaldı");
    }
    // Etkinlik geçtiyse listeyi yenile
    if (liveRefs.events.some((x) => x.d.getTime() + DAY < now.getTime())) renderHeroEvents(now);

    for (const c of liveRefs.cards) {
      setText(c.cur, fmt(score(c.t, d)));
      setText(c.evCd, fmtCountdown(c.ev - now));
      const lb = c.ev.getTime() - LISTING_LEAD_DAYS * DAY - now.getTime();
      setText(c.listCd, lb > 0 ? fmtCountdown(lb) : "Geçti — hemen listele!");
      c.listBox.classList.toggle("late", lb <= 0);
    }

    updateRank(d);
    updateKpis(filtered(), d);

    if (state.trendId) {
      const t = byId(state.trendId);
      setText($("#drawerMeta"), `Endeks ${fmt(score(t, d))} · ${eventName(t)}: ${fmtCountdown(nextEvent(t, now) - now)}`);
    }
  }

  /* ---------- Wikipedia (gerçek ilgi verisi) ---------- */
  const ymd = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
  async function fetchWiki(t, start, end) {
    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(WIKI[t.id])}/daily/${start}/${end}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    const json = await res.json();
    const views = json.items.map((i) => i.views);
    if (views.length < 14) throw new Error("az veri");
    const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
    const avg7 = avg(views.slice(-7));
    const prev7 = avg(views.slice(-14, -7));
    return { views, avg7, change: prev7 ? ((avg7 - prev7) / prev7) * 100 : 0 };
  }
  async function loadWiki(force = false) {
    const cached = store.get("trendRadar.wiki", null);
    if (!force && cached && Date.now() - cached.at < WIKI_CACHE_MS) {
      state.wiki = cached.data; state.wikiAt = cached.at;
      afterWiki();
      return;
    }
    const end = new Date(Date.now() - DAY);
    const start = new Date(end.getTime() - 44 * DAY);
    const queue = [...TRENDS];
    const result = {};
    let ok = 0;
    async function worker() {
      while (queue.length) {
        const t = queue.shift();
        try { result[t.id] = await fetchWiki(t, ymd(start), ymd(end)); ok++; } catch { /* bu makale için veri yok */ }
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    if (ok) {
      state.wiki = result; state.wikiAt = Date.now();
      store.set("trendRadar.wiki", { at: state.wikiAt, data: result });
    } else if (cached) {
      state.wiki = cached.data; state.wikiAt = cached.at;
    } else {
      state.wikiAt = -1;
    }
    afterWiki();
  }
  function afterWiki() {
    updateWikiCells();
    updateWikiStatus();
  }
  function updateWikiStatus() {
    const s = $("#wikiStatus");
    if (state.wikiAt === -1) setText(s, "şu an alınamadı (internet/engelleyici?)");
    else if (state.wikiAt) {
      const mins = Math.floor((Date.now() - state.wikiAt) / 60000);
      setText(s, `${mins < 1 ? "az önce" : `${mins} dk önce`} güncellendi`);
    }
  }

  /* ---------- Satış kayıtları ---------- */
  function salesByTrend(sales) {
    const agg = {};
    for (const s of sales) {
      const a = (agg[s.trend] ||= { id: s.trend, revenue: 0, qty: 0 });
      a.revenue += Number(s.revenue || 0);
      a.qty += Number(s.qty || 0);
    }
    return Object.values(agg).sort((a, b) => b.revenue - a.revenue);
  }

  function renderSales() {
    const sales = store.get("trendRadar.sales", []);
    const agg = salesByTrend(sales);
    const max = Math.max(1, ...agg.map((a) => a.revenue));
    $("#salesChart").replaceChildren(...(agg.length ? agg.slice(0, 12).map((a) => {
      const name = byId(a.id)?.tr ?? a.id;
      const row = el("div", { class: "bar-row", tabindex: "0" },
        el("span", { text: name, title: name }),
        el("div", { class: "track" }, el("div", { class: "fill", style: `width:${(a.revenue / max) * 100}%` })),
        el("b", { text: `$${a.revenue.toFixed(0)}` }));
      withTip(row, `$${a.revenue.toFixed(2)}`, `${name} · ${a.qty} adet`);
      return row;
    }) : [el("p", { class: "empty", text: "Henüz satış kaydı yok." })]));

    const rows = sales.map((s, idx) => ({ s, idx })).sort((a, b) => (b.s.date || "").localeCompare(a.s.date || "")).map(({ s, idx }) => {
      const conv = Number(s.views) > 0 ? `%${((Number(s.qty) / Number(s.views)) * 100).toFixed(1)}` : "—";
      return el("tr", {},
        el("td", { text: s.date }),
        el("td", { text: byId(s.trend)?.tr ?? s.trend }),
        el("td", { text: PRODUCTS[s.product] ? PRODUCTS[s.product].split(" (")[0] : s.product }),
        el("td", { text: String(s.qty) }),
        el("td", { text: `$${Number(s.revenue).toFixed(2)}` }),
        el("td", { text: conv }),
        el("td", {}, el("button", { class: "del", type: "button", "aria-label": "Kaydı sil", onclick: () => {
          const all = store.get("trendRadar.sales", []);
          all.splice(idx, 1);
          store.set("trendRadar.sales", all);
          renderSales();
        } }, "✕")));
    });
    $("#salesTable tbody").replaceChildren(...(rows.length ? rows : [el("tr", {}, el("td", { colspan: 7, class: "empty", text: "Kayıt yok." }))]));
  }

  function setupSalesForm() {
    const form = $("#saleForm");
    const today = new Date();
    form.date.value = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    $("#saleTrend").replaceChildren(...[...TRENDS].sort((a, b) => a.tr.localeCompare(b.tr, "tr")).map((t) => el("option", { value: t.id, text: fill(t.tr, t) })));
    $("#saleProduct").replaceChildren(...Object.entries(PRODUCTS).map(([k, v]) => el("option", { value: k, text: v })));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const rec = Object.fromEntries(new FormData(form).entries());
      rec.qty = Number(rec.qty); rec.revenue = Number(rec.revenue); rec.views = Number(rec.views || 0); rec.favs = Number(rec.favs || 0);
      const all = store.get("trendRadar.sales", []);
      all.push(rec);
      store.set("trendRadar.sales", all);
      toast("Satış kaydedildi");
      renderSales();
    });
    $("#exportBtn").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(store.get("trendRadar.sales", []), null, 2)], { type: "application/json" });
      const a = el("a", { href: URL.createObjectURL(blob), download: `satislar-${form.date.value}.json` });
      document.body.append(a); a.click(); a.remove();
    });
    $("#importInp").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!Array.isArray(data)) throw new Error();
        store.set("trendRadar.sales", data);
        toast(`${data.length} kayıt içe aktarıldı`);
        renderSales();
      } catch { toast("Geçersiz dosya"); }
      e.target.value = "";
    });
  }

  /* ---------- Gemini prompt paneli ---------- */
  const PRODUCT_EN = {
    tee: "unisex t-shirt",
    cc: "garment-dyed Comfort Colors style t-shirt",
    sweat: "crewneck sweatshirt",
    hoodie: "pullover hoodie",
    kids: "kids t-shirt / baby bodysuit",
  };
  const PLACE_EN = {
    front: "large front chest print on a 4500 x 5400 px portrait canvas (4:5 ratio, 300 DPI equivalent)",
    pocket: "small left-chest pocket print on a square 1:1 canvas; keep it simple and legible at about 4 inches wide",
    back: "large back print on a 4500 x 5400 px portrait canvas (4:5 ratio, 300 DPI equivalent)",
  };

  function optionList(select, entries, first) {
    const ordered = [...first.filter((k) => entries[k]), ...Object.keys(entries).filter((k) => !first.includes(k))];
    select.replaceChildren(...ordered.map((k) => el("option", { value: k, text: typeof entries[k] === "string" ? entries[k] : entries[k].tr })));
    select.value = ordered[0];
  }

  let lastFocus = null;
  function openDrawer(id) {
    const t = byId(id);
    if (!t) return;
    lastFocus = document.activeElement;
    state.trendId = id;
    $("#drawerTitle").textContent = fill(t.tr, t);
    optionList($("#pProduct"), PRODUCTS, t.products);
    optionList($("#pStyle"), STYLES, [t.style]);
    optionList($("#pColor"), GARMENT_COLORS, t.colors);
    $("#pIdea").replaceChildren(...t.ideas.map((i) => el("option", { value: fill(i, t), text: fill(i, t) })), el("option", { value: "", text: "Metinsiz (sadece illüstrasyon)" }));
    $("#pText").value = "";
    $("#tagsOut").textContent = t.tags.map((x) => fill(x, t)).join(", ");
    updatePrompt();
    tick();
    $("#drawerBg").hidden = false;
    const d = $("#drawer");
    d.classList.add("open");
    d.setAttribute("aria-hidden", "false");
    $("#closeDrawer").focus();
  }
  function closeDrawer() {
    if (!state.trendId) return;
    state.trendId = null;
    $("#drawerBg").hidden = true;
    const d = $("#drawer");
    d.classList.remove("open");
    d.setAttribute("aria-hidden", "true");
    lastFocus?.focus?.();
  }

  function buildPrompt() {
    const t = byId(state.trendId);
    const product = $("#pProduct").value;
    const style = STYLES[$("#pStyle").value];
    const colorKey = $("#pColor").value;
    const garment = GARMENT_COLORS[colorKey].en;
    const dark = DARK_GARMENTS.includes(colorKey);
    const text = $("#pText").value.trim() || $("#pIdea").value;
    const n = Number($("#pVar").value);
    let bg = $("#pBg").value;

    const contrast = dark
      ? "use light, bright and saturated colors so the design pops on a dark fabric; do not use black or very dark elements."
      : "use darker, saturated colors so the design reads clearly on a light fabric; do not use white or very pale elements.";
    let bgLine;
    if (bg === "transparent") bgLine = "transparent background (PNG with alpha channel), no background color or scenery at all.";
    else {
      if (bg === "auto") bg = dark ? "black" : "white";
      bgLine = bg === "white"
        ? "plain, solid pure white (#FFFFFF) background with no shadows, gradients, textures or scenery, so it can be removed cleanly."
        : "plain, solid pure black (#000000) background with no shadows, gradients, textures or scenery, so it can be removed cleanly.";
    }
    const season = isEvergreen(t) ? "right now" : `for the ${MONTHS_EN[peakMonth(t)]} season`;

    return [
      `Create an original, print-ready graphic design for a ${PRODUCT_EN[product]} that will be sold on Etsy to customers in the United States.`,
      "",
      `THEME: ${fill(t.en, t)}.`,
      text
        ? `MAIN TEXT: "${text}" — spell it exactly like this in English and make it the focal point of the design.`
        : "MAIN TEXT: none — illustration only, no words or letters anywhere.",
      `STYLE: ${style.en}.`,
      `AUDIENCE: ${t.audience}.`,
      `GARMENT COLOR: ${garment} — ${contrast}`,
      `COLORS: limit the palette to 3–5 flat, harmonious colors that feel on-trend in the US ${season}.`,
      `LAYOUT: ${PLACE_EN[$("#pPlace").value]}. One single, centered, isolated artwork; nothing touching the canvas edges; no lines thinner than 2 mm when printed; bold, clean shapes suitable for DTG printing.`,
      `BACKGROUND: ${bgLine}`,
      "AVOID: t-shirt mockups, models, garments, frames, borders, watermarks, signatures, extra or misspelled text, trademarked characters, brand names, sports team or league logos, celebrity likenesses and copyrighted quotes.",
      `OUTPUT: ${n === 1 ? "1 design" : `${n} clearly different variations (different composition and typography)`} at the highest resolution possible.`,
    ].join("\n");
  }
  const updatePrompt = () => { if (state.trendId) $("#promptOut").textContent = buildPrompt(); };

  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = el("textarea", {}, text);
      document.body.append(ta); ta.select();
      try { document.execCommand("copy"); } catch { /* yok say */ }
      ta.remove();
    }
    toast(msg);
  }

  function setupDrawer() {
    ["#pProduct", "#pStyle", "#pColor", "#pBg", "#pIdea", "#pVar", "#pPlace"].forEach((s) => $(s).addEventListener("change", updatePrompt));
    $("#pText").addEventListener("input", updatePrompt);
    $("#closeDrawer").addEventListener("click", closeDrawer);
    $("#drawerBg").addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
    $("#copyPrompt").addEventListener("click", () => copy($("#promptOut").textContent, "Prompt kopyalandı — Gemini'ye yapıştır"));
    $("#copyTags").addEventListener("click", () => copy($("#tagsOut").textContent, "Etiketler kopyalandı"));
  }

  /* ---------- Filtreler & tema ---------- */
  function setupFilters() {
    const now = new Date();
    const ms = $("#monthSel");
    const liveBtn = $("#liveBtn");
    ms.replaceChildren(el("option", { value: "", text: "Ay seç…" }), ...MONTHS_LONG.map((n, i) => el("option", { value: i, text: n + (i === now.getMonth() ? " (bu ay)" : "") })));
    ms.addEventListener("change", () => {
      if (ms.value === "") { state.live = true; } else { state.live = false; state.month = Number(ms.value); }
      liveBtn.classList.toggle("active", state.live);
      renderAll();
    });
    liveBtn.addEventListener("click", () => { state.live = true; ms.value = ""; liveBtn.classList.add("active"); renderAll(); });
    const cs = $("#catSel");
    cs.append(...Object.entries(CATEGORIES).map(([k, v]) => el("option", { value: k, text: v })));
    cs.addEventListener("change", () => { state.cat = cs.value; renderAll(); });
    $("#searchInp").addEventListener("input", (e) => { state.q = e.target.value; renderAll(); });

    const saved = store.get("trendRadar.theme", null);
    if (saved) document.documentElement.dataset.theme = saved;
    $("#themeBtn").addEventListener("click", () => {
      const cur = document.documentElement.dataset.theme
        || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      store.set("trendRadar.theme", next);
    });
  }

  function renderAll() {
    const list = filtered();
    renderPrep(list);
    renderRank(list);
    renderHeat(list);
    tick();
  }

  setupFilters();
  setupSalesForm();
  setupDrawer();
  renderHeroEvents(new Date());
  renderKpis();
  renderSales();
  renderAll();
  setInterval(tick, 1000);
  setInterval(updateWikiStatus, 30000);
  loadWiki();
  setInterval(() => loadWiki(true), WIKI_REFRESH_MS);
})();
