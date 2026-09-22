(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const TODAY = new Date();
  const COMP_LABEL = { 1: "Düşük", 2: "Orta", 3: "Yüksek" };
  const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DARK_GARMENTS = ["black", "pepper", "navy", "green", "maroon"];
  // Sıralı mavi rampa (açık → koyu) — ısı haritası için
  const RAMP = ["#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec", "#5598e7", "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281", "#0d366b"];

  const state = {
    month: TODAY.getMonth(),
    cat: "",
    q: "",
    trendId: null,
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
  const mod = (n, m) => ((n % m) + m) % m;

  /* ---------- Puan modeli ---------- */
  const curveCache = new Map();
  function curve(t) {
    if (curveCache.has(t.id)) return curveCache.get(t.id);
    const vals = MONTHS.map((_, m) => {
      let v = t.base;
      for (const [pm, amp, w] of t.peaks) {
        const d = Math.min(Math.abs(m - pm), 12 - Math.abs(m - pm));
        v = Math.max(v, t.base + (amp - t.base) * Math.exp(-(d * d) / (2 * w * w)));
      }
      if (t.gift) v += m === 10 ? 8 : m === 11 ? 12 : 0;
      return Math.round(Math.max(0, Math.min(100, v)));
    });
    curveCache.set(t.id, vals);
    return vals;
  }
  const score = (t, m) => curve(t)[mod(m, 12)];
  const peakMonth = (t) => { const c = curve(t); return c.indexOf(Math.max(...c)); };
  const isEvergreen = (t) => Math.max(...curve(t)) - Math.min(...curve(t)) < 25;

  // Yer tutucular: {YEAR} = trendin bir sonraki zirvesinin yılı, {NEXT_YEAR} = yaklaşan mezuniyet / yeni yıl
  function fill(str, t) {
    const pm = t.peaks.length ? t.peaks[0][0] : TODAY.getMonth();
    const year = TODAY.getFullYear() + (pm < TODAY.getMonth() ? 1 : 0);
    const nextYear = TODAY.getFullYear() + (TODAY.getMonth() >= 6 ? 1 : 0);
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
    tip.style.left = Math.min(window.innerWidth - tip.offsetWidth - 8, x + 12) + "px";
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
    toast._t = setTimeout(() => t.classList.remove("show"), 1600);
  }

  const arrowBtn = (t) => el("button", {
    class: "go", type: "button", "aria-label": `${t.tr} için Gemini prompt'u oluştur`, title: "Gemini prompt'u oluştur",
    onclick: () => openDrawer(t.id),
  }, "→");

  /* ---------- KPI'lar ---------- */
  function renderKpis(list) {
    const m = state.month;
    const ranked = [...list].sort((a, b) => score(b, m) - score(a, m));
    const top = ranked[0];
    const rising = list.filter((t) => score(t, m) - score(t, m - 1) >= 10);
    const sales = store.get("trendRadar.sales", []);
    const revenue = sales.reduce((s, x) => s + Number(x.revenue || 0), 0);
    const qty = sales.reduce((s, x) => s + Number(x.qty || 0), 0);
    const perTrend = salesByTrend(sales);
    const best = perTrend[0];

    const kpi = (k, v, d) => el("div", { class: "kpi" }, el("div", { class: "k", text: k }), el("div", { class: "v", text: v }), el("div", { class: "d", text: d }));
    $("#kpis").replaceChildren(
      kpi(`${MONTHS_LONG[m]} ayının 1 numarası`, top ? String(score(top, m)) : "—", top ? top.tr : "Sonuç yok"),
      kpi("Yükselen trend", String(rising.length), "geçen aya göre +10 puan ve üzeri"),
      kpi("Toplam gelirim", `$${revenue.toFixed(2)}`, `${qty} adet satış kaydı`),
      kpi("En çok kazandıran", best ? `$${best.revenue.toFixed(0)}` : "—", best ? byId(best.id)?.tr ?? best.id : "Henüz satış girilmedi"),
    );
  }

  /* ---------- Şimdi hazırla ---------- */
  function renderPrep(list) {
    const m = state.month;
    const items = list.map((t) => {
      let best = 0, bestM = m, ahead = 0;
      for (let k = 1; k <= 3; k++) { const s = score(t, m + k); if (s > best) { best = s; bestM = mod(m + k, 12); ahead = k; } }
      return { t, best, bestM, ahead, rise: best - score(t, m) };
    }).filter((x) => x.best >= 55 && x.rise >= 15)
      // En yakın zirve önce (en acil), sonra en yüksek puan
      .sort((a, b) => a.ahead - b.ahead || b.best - a.best).slice(0, 8);

    $("#prepSub").textContent = `· ${MONTHS_LONG[m]} itibarıyla`;
    const box = $("#prepCards");
    if (!items.length) { box.replaceChildren(el("p", { class: "empty", text: "Bu filtrede önümüzdeki aylarda yükselen trend yok." })); return; }
    box.replaceChildren(...items.map(({ t, best, bestM, ahead }) => {
      const when = ahead <= 2 ? "Hemen listele — zaman daralıyor" : `Listeleme için hedef: en geç ${MONTHS_LONG[mod(bestM - 2, 12)]} sonu`;
      return el("article", { class: "card" },
        el("div", { class: "card-top" },
          el("div", {}, el("h3", { text: fill(t.tr, t) }), el("div", { class: "meta", text: CATEGORIES[t.cat] })),
          arrowBtn(t)),
        el("div", { class: "stat" }, el("b", { text: String(score(t, m)) }), el("span", { class: "muted", text: `→ ${best} (${MONTHS_LONG[bestM]} zirvesi)` })),
        sparkline(t, 200, 26),
        el("div", { class: "meta", text: `${when} · Rekabet: ${COMP_LABEL[t.comp]}` }),
      );
    }));
  }

  /* ---------- Sparkline ---------- */
  function sparkline(t, w = 120, h = 24) {
    const c = curve(t);
    const bw = w / 12;
    const svg = svgEl("svg", { class: "spark", width: w, height: h, viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": `${t.tr} 12 aylık eğri: ` + c.map((v, i) => `${MONTHS[i]} ${v}`).join(", ") });
    c.forEach((v, i) => {
      const bh = Math.max(2, (v / 100) * h);
      const r = svgEl("rect", { x: i * bw + 1, y: h - bh, width: bw - 2, height: bh, rx: 1.5 });
      if (i === state.month) r.setAttribute("class", "hi");
      withTip(r, String(v), `${MONTHS_LONG[i]} · ${t.tr}`);
      svg.append(r);
    });
    return svg;
  }

  /* ---------- Sıralama tablosu ---------- */
  function renderRank(list) {
    const m = state.month;
    $("#rankSub").textContent = `· ${MONTHS_LONG[m]}`;
    const ranked = [...list].sort((a, b) => score(b, m) - score(a, m));
    const rows = ranked.map((t, i) => {
      const s = score(t, m);
      const d = s - score(t, m - 1);
      const cls = d > 2 ? "up" : d < -2 ? "down" : "flat";
      const sym = d > 2 ? "▲" : d < -2 ? "▼" : "■";
      const q = encodeURIComponent(fill(t.tags[0], t));
      return el("tr", {},
        el("td", { class: "num", text: String(i + 1) }),
        el("td", { class: "name" }, el("b", { text: fill(t.tr, t) }),
          el("span", { text: `${CATEGORIES[t.cat]}${isEvergreen(t) ? " · her mevsim" : ` · zirve ${MONTHS_LONG[peakMonth(t)]}`}` })),
        el("td", {}, el("div", { class: "score" },
          el("div", { class: "track" }, el("div", { class: "fill", style: `width:${s}%` })),
          el("b", { text: String(s) }))),
        el("td", {}, el("span", { class: `delta ${cls}`, text: `${sym} ${d > 0 ? "+" : ""}${d}` })),
        el("td", { class: "hide-sm" }, sparkline(t)),
        el("td", {}, el("span", { class: "comp" }, el("i", { style: `background:var(--comp-${t.comp})` }), COMP_LABEL[t.comp])),
        el("td", { class: "links" },
          el("a", { href: `https://trends.google.com/trends/explore?geo=US&date=today%2012-m&q=${q}`, target: "_blank", rel: "noopener", text: "Trends" }),
          el("a", { href: `https://www.etsy.com/search?q=${q}`, target: "_blank", rel: "noopener", text: "Etsy" })),
        el("td", {}, arrowBtn(t)),
      );
    });
    $("#rankTable tbody").replaceChildren(...(rows.length ? rows : [el("tr", {}, el("td", { colspan: 8, class: "empty", text: "Sonuç bulunamadı." }))]));
  }

  /* ---------- Isı haritası ---------- */
  function renderHeat(list) {
    const m = state.month;
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
          renderAll();
        } }, "✕")));
    });
    $("#salesTable tbody").replaceChildren(...(rows.length ? rows : [el("tr", {}, el("td", { colspan: 7, class: "empty", text: "Kayıt yok." }))]));
  }

  function setupSalesForm() {
    const form = $("#saleForm");
    form.date.value = TODAY.toISOString().slice(0, 10);
    $("#saleTrend").replaceChildren(...[...TRENDS].sort((a, b) => a.tr.localeCompare(b.tr, "tr")).map((t) => el("option", { value: t.id, text: fill(t.tr, t) })));
    $("#saleProduct").replaceChildren(...Object.entries(PRODUCTS).map(([k, v]) => el("option", { value: k, text: v })));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(form);
      const rec = Object.fromEntries(f.entries());
      rec.qty = Number(rec.qty); rec.revenue = Number(rec.revenue); rec.views = Number(rec.views || 0); rec.favs = Number(rec.favs || 0);
      const all = store.get("trendRadar.sales", []);
      all.push(rec);
      store.set("trendRadar.sales", all);
      toast("Satış kaydedildi");
      renderAll();
    });
    $("#exportBtn").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(store.get("trendRadar.sales", []), null, 2)], { type: "application/json" });
      const a = el("a", { href: URL.createObjectURL(blob), download: `satislar-${TODAY.toISOString().slice(0, 10)}.json` });
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
        renderAll();
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

  function openDrawer(id) {
    const t = byId(id);
    if (!t) return;
    state.trendId = id;
    $("#drawerTitle").textContent = fill(t.tr, t);
    optionList($("#pProduct"), PRODUCTS, t.products);
    optionList($("#pStyle"), STYLES, [t.style]);
    optionList($("#pColor"), GARMENT_COLORS, t.colors);
    $("#pIdea").replaceChildren(...t.ideas.map((i) => el("option", { value: fill(i, t), text: fill(i, t) })), el("option", { value: "", text: "Metinsiz (sadece illüstrasyon)" }));
    $("#pText").value = "";
    $("#tagsOut").textContent = t.tags.map((x) => fill(x, t)).join(", ");
    updatePrompt();
    $("#drawerBg").hidden = false;
    const d = $("#drawer");
    d.classList.add("open");
    d.setAttribute("aria-hidden", "false");
    $("#closeDrawer").focus();
    const counts = store.get("trendRadar.promptCounts", {});
    counts[id] = (counts[id] || 0) + 1;
    store.set("trendRadar.promptCounts", counts);
  }
  function closeDrawer() {
    $("#drawerBg").hidden = true;
    const d = $("#drawer");
    d.classList.remove("open");
    d.setAttribute("aria-hidden", "true");
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
    const peak = MONTHS_EN[peakMonth(t)];
    const season = isEvergreen(t) ? "right now" : `for the ${peak} season`;

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
    const ms = $("#monthSel");
    ms.replaceChildren(...MONTHS_LONG.map((n, i) => el("option", { value: i, text: n + (i === TODAY.getMonth() ? " (bu ay)" : "") })));
    ms.value = state.month;
    ms.addEventListener("change", () => { state.month = Number(ms.value); renderAll(); });
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
    renderKpis(list);
    renderPrep(list);
    renderRank(list);
    renderHeat(list);
    renderSales();
  }

  setupFilters();
  setupSalesForm();
  setupDrawer();
  renderAll();
})();
