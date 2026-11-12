/* Raumplaner.com – Online-Raumplaner (2D + 3D). Läuft komplett im Browser, Daten bleiben lokal. */
(function () {
  'use strict';
  var RP = window.RP, ITEMS = RP.ITEMS, $ = function (s, c) { return (c || document).querySelector(s); }, $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var app = $('#planner'); if (!app) return;
  var svg = $('#cv'), stage = $('.pl-stage'), NS = 'http://www.w3.org/2000/svg';
  var L = {}; ['grid', 'walls', 'floors', 'lines', 'items', 'open', 'dims', 'ann', 'sel', 'tmp'].forEach(function (k) { L[k] = $('#L-' + k); });
  var plan, sel = null, tool = 'select', view = { x: -100, y: -100, s: 1 }, undo = [], redo = [], pid, saveT, opts = { grid: true, snap: true, labels: true, dist: true };
  var GRID = 5, WALL = 12, KEY = 'rp:projects', CUR = 'rp:cur';
  var rnd = function (n, g) { return Math.round(n / g) * g; }, uid = function () { return Math.random().toString(36).slice(2, 9); };
  var deg = 180 / Math.PI, fmt = function (cm) { return (cm / 100).toFixed(2).replace('.', ','); };
  var esc = RP.esc;

  // ---------- storage ----------
  function store() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function persist() {
    clearTimeout(saveT); status('Speichert …');
    saveT = setTimeout(function () {
      try { var s = store(); s[pid] = { id: pid, name: plan.name, t: Date.now(), plan: plan }; localStorage.setItem(KEY, JSON.stringify(s)); localStorage.setItem(CUR, pid); status('✓ Lokal gespeichert'); }
      catch (e) { status('Speichern nicht möglich (Browser-Speicher voll/gesperrt)'); }
    }, 400);
  }
  function status(t) { var e = $('#pl-save'); if (e) e.textContent = t; }
  function blank(name) { return { v: 1, name: name || 'Meine Planung', rooms: [], items: [], dims: [] }; }
  function load(p, id, keepView) {
    plan = JSON.parse(JSON.stringify(p)); plan.rooms = plan.rooms || []; plan.items = plan.items || []; plan.dims = plan.dims || [];
    plan.rooms.forEach(function (r) { r.id = r.id || uid(); }); plan.items.forEach(function (i) { i.id = i.id || uid(); });
    pid = id || uid(); sel = null; undo = []; redo = [];
    $('#pl-name').value = plan.name || 'Meine Planung';
    if (!keepView) fit(); render(); persist();
  }
  function snapshot() { undo.push(JSON.stringify(plan)); if (undo.length > 100) undo.shift(); redo = []; }
  function commit() { render(); persist(); }
  function doUndo() { if (!undo.length) return; redo.push(JSON.stringify(plan)); plan = JSON.parse(undo.pop()); sel = null; commit(); }
  function doRedo() { if (!redo.length) return; undo.push(JSON.stringify(plan)); plan = JSON.parse(redo.pop()); sel = null; commit(); }

  // ---------- geometry ----------
  function W() { return stage.clientWidth || 800; } function H() { return stage.clientHeight || 600; }
  function setVB() { svg.setAttribute('viewBox', [view.x, view.y, W() / view.s, H() / view.s].join(' ')); $('#pl-zoom').textContent = Math.round(view.s * 100) + '%'; }
  function toW(e) { var r = svg.getBoundingClientRect(); return [view.x + (e.clientX - r.left) / view.s, view.y + (e.clientY - r.top) / view.s]; }
  function fit() {
    var b = RP.bounds(plan); if (!plan.rooms.length && !plan.items.length) b = [0, 0, 500, 400];
    var pad = 80, w = b[2] - b[0] + 2 * pad, h = b[3] - b[1] + 2 * pad;
    view.s = Math.max(.08, Math.min(4, Math.min(W() / w, H() / h)));
    view.x = b[0] - pad - (W() / view.s - w) / 2; view.y = b[1] - pad - (H() / view.s - h) / 2; setVB(); render();
  }
  function zoomAt(f, cx, cy) {
    var ns = Math.max(.08, Math.min(6, view.s * f)); if (cx == null) { cx = view.x + W() / view.s / 2; cy = view.y + H() / view.s / 2; }
    view.x = cx - (cx - view.x) * view.s / ns; view.y = cy - (cy - view.y) * view.s / ns; view.s = ns; setVB(); render();
  }
  function corners(it) {
    var a = (it.r || 0) / deg, c = Math.cos(a), s = Math.sin(a), hw = it.w / 2, hd = it.d / 2;
    return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(function (p) { return [it.x + p[0] * c - p[1] * s, it.y + p[0] * s + p[1] * c]; });
  }
  function overlap(a, b) {
    var A = corners(a), B = corners(b), polys = [A, B];
    for (var p = 0; p < 2; p++) for (var i = 0; i < 4; i++) {
      var P = polys[p], q = P[(i + 1) % 4], nx = q[1] - P[i][1], ny = P[i][0] - q[0], mnA = 1e9, mxA = -1e9, mnB = 1e9, mxB = -1e9;
      A.forEach(function (v) { var d = v[0] * nx + v[1] * ny; mnA = Math.min(mnA, d); mxA = Math.max(mxA, d); });
      B.forEach(function (v) { var d = v[0] * nx + v[1] * ny; mnB = Math.min(mnB, d); mxB = Math.max(mxB, d); });
      var len = Math.hypot(nx, ny) || 1; if ((mxA - mnB) / len < 1 || (mxB - mnA) / len < 1) return false;
    }
    return true;
  }
  function clashes() {
    var arr = plan.items.filter(function (i) { var d = ITEMS[i.t]; return d && !d.n; }), out = {};
    for (var a = 0; a < arr.length; a++) for (var b = a + 1; b < arr.length; b++) if (overlap(arr[a], arr[b])) { out[arr[a].id] = 1; out[arr[b].id] = 1; }
    return out;
  }
  function inside(pt, pts) {
    var c = false; for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var a = pts[i], b = pts[j]; if (((a[1] > pt[1]) !== (b[1] > pt[1])) && (pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0])) c = !c;
    } return c;
  }
  function roomAt(pt) { for (var i = plan.rooms.length - 1; i >= 0; i--) if (inside(pt, plan.rooms[i].pts)) return plan.rooms[i]; return null; }
  function snapOpening(it, force) {
    var best = null;
    plan.rooms.forEach(function (r) {
      r.pts.forEach(function (p, i) {
        var q = r.pts[(i + 1) % r.pts.length], dx = q[0] - p[0], dy = q[1] - p[1], L2 = dx * dx + dy * dy; if (!L2) return;
        var len = Math.sqrt(L2), t = ((it.x - p[0]) * dx + (it.y - p[1]) * dy) / L2, m = Math.min(.5, it.w / 2 / len);
        t = Math.max(m, Math.min(1 - m, t));
        var px = p[0] + t * dx, py = p[1] + t * dy, dist = Math.hypot(it.x - px, it.y - py);
        if ((force || dist < 45 / Math.max(view.s, .5) + 20) && (!best || dist < best.d)) best = { d: dist, x: px, y: py, a: Math.atan2(dy, dx) * deg, n: [-dy / len, dx / len], r: r };
      });
    });
    if (!best) return false;
    it.x = best.x; it.y = best.y;
    var inw = inside([best.x + best.n[0] * 8, best.y + best.n[1] * 8], best.r.pts);
    it.r = ((inw ? best.a : best.a + 180) % 360 + 360) % 360;
    return true;
  }

  // ---------- render ----------
  function el(tag, attrs, parent, html) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (html) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
  var raf = 0; function render() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; draw(); }); }
  function draw() {
    setVB();
    var s = view.s, fs = 12 / s, rooms = plan.rooms, cl = clashes(), ptsStr = function (r) { return r.pts.map(function (p) { return p.join(','); }).join(' '); };
    $('#grid-bg').setAttribute('style', 'display:' + (opts.grid ? 'block' : 'none'));
    var g = $('#grid-bg'); g.setAttribute('x', view.x); g.setAttribute('y', view.y); g.setAttribute('width', W() / s); g.setAttribute('height', H() / s);
    L.walls.innerHTML = rooms.map(function (r) { return '<polygon points="' + ptsStr(r) + '" fill="#2a3340" stroke="#2a3340" stroke-width="' + WALL * 2 + '" stroke-linejoin="miter"/>'; }).join('');
    L.floors.innerHTML = rooms.map(function (r) { return '<polygon data-room="' + r.id + '" points="' + ptsStr(r) + '" fill="' + (r.floor || '#efe3cf') + '"' + (sel && sel.id === r.id ? ' class="rsel"' : '') + '/>'; }).join('');
    L.lines.innerHTML = rooms.map(function (r) { return '<polygon points="' + ptsStr(r) + '" fill="none" stroke="#2a3340" stroke-width="1.5" vector-effect="non-scaling-stroke"/>'; }).join('');
    var fi = '', op = '';
    plan.items.forEach(function (it) {
      var d = ITEMS[it.t] || { k: 'box', c: '#ddd' }, sx = it.f ? -1 : 1, sy = it.s ? -1 : 1;
      var hit = d.o ? '<rect x="' + (-it.w / 2) + '" y="' + (-it.d - 4) + '" width="' + it.w + '" height="' + (it.d + Math.min(it.w, 40)) + '" fill="transparent"/>' : '<rect x="' + (-it.w / 2) + '" y="' + (-it.d / 2) + '" width="' + it.w + '" height="' + it.d + '" fill="transparent"/>';
      var gs = '<g class="it' + (cl[it.id] ? ' clash' : '') + (sel && sel.id === it.id ? ' on' : '') + '" data-id="' + it.id + '" transform="translate(' + it.x + ' ' + it.y + ') rotate(' + (it.r || 0) + ')' + (sx < 0 || sy < 0 ? ' scale(' + sx + ' ' + sy + ')' : '') + '">' +
        RP.symbol(d.k, it.w, it.d, it.c || d.c, it.label) + hit +
        (cl[it.id] ? '<rect x="' + (-it.w / 2) + '" y="' + (-it.d / 2) + '" width="' + it.w + '" height="' + it.d + '" fill="rgba(220,38,38,.12)" stroke="#dc2626" stroke-width="2" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"/>' : '') + '</g>';
      if (d.o) op += gs; else fi += gs;
    });
    L.items.innerHTML = fi; L.open.innerHTML = op;
    // dims
    L.dims.innerHTML = plan.dims.map(function (dm, i) { return dimLine(dm.a, dm.b, fs, 'dm', i); }).join('');
    // annotations: edge lengths & room labels
    var an = '';
    if (opts.labels) rooms.forEach(function (r) {
      var A = RP.area(r.pts), sgn = signedArea(r.pts) > 0 ? 1 : -1;
      r.pts.forEach(function (p, i) {
        var q = r.pts[(i + 1) % r.pts.length], dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy); if (len < 20) return;
        var nx = dy / len * sgn, ny = -dx / len * sgn, mx = (p[0] + q[0]) / 2 + nx * (WALL + fs * 1.1), my = (p[1] + q[1]) / 2 + ny * (WALL + fs * 1.1);
        var ang = Math.atan2(dy, dx) * deg; if (ang > 90 || ang < -90) ang += 180;
        an += '<text x="' + mx + '" y="' + my + '" font-size="' + fs + '" class="elen" transform="rotate(' + ang + ' ' + mx + ' ' + my + ')">' + fmt(len) + ' m</text>';
      });
      var c = RP.centroid(r.pts);
      an += '<text x="' + c[0] + '" y="' + c[1] + '" font-size="' + fs * 1.15 + '" class="rname">' + esc(r.name || 'Raum') + '</text><text x="' + c[0] + '" y="' + (c[1] + fs * 1.35) + '" font-size="' + fs + '" class="rarea">' + (A / 1e4).toFixed(2).replace('.', ',') + ' m²</text>';
    });
    L.ann.innerHTML = an;
    drawSel(fs); panel(cl); summary();
  }
  function signedArea(p) { var a = 0; for (var i = 0; i < p.length; i++) { var q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return a / 2; }
  function dimLine(a, b, fs, cls, idx) {
    var len = Math.hypot(b[0] - a[0], b[1] - a[1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * deg; if (ang > 90 || ang < -90) ang += 180;
    var nx = -(b[1] - a[1]) / (len || 1) * fs * .5, ny = (b[0] - a[0]) / (len || 1) * fs * .5;
    return '<g class="' + cls + '"' + (idx != null ? ' data-dim="' + idx + '"' : '') + '><line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"/>' +
      '<line x1="' + (a[0] - nx) + '" y1="' + (a[1] - ny) + '" x2="' + (a[0] + nx) + '" y2="' + (a[1] + ny) + '"/><line x1="' + (b[0] - nx) + '" y1="' + (b[1] - ny) + '" x2="' + (b[0] + nx) + '" y2="' + (b[1] + ny) + '"/>' +
      '<text x="' + mx + '" y="' + (my) + '" dy="' + (-fs * .45) + '" font-size="' + fs + '" transform="rotate(' + ang + ' ' + mx + ' ' + my + ')">' + fmt(len) + ' m</text></g>';
  }
  function drawSel(fs) {
    var h = '', r = 7 / view.s;
    if (sel && sel.type === 'item') {
      var it = byId(sel.id); if (!it) { sel = null; return; }
      var d = ITEMS[it.t] || {}, ry = d.o ? -it.d : -it.d / 2;
      h += '<g transform="translate(' + it.x + ' ' + it.y + ') rotate(' + (it.r || 0) + ')"><rect class="selbox" x="' + (-it.w / 2 - 3 / view.s) + '" y="' + (ry - 3 / view.s) + '" width="' + (it.w + 6 / view.s) + '" height="' + ((d.o ? it.d : it.d) + 6 / view.s) + '"/>' +
        '<line class="selbox" x1="0" y1="' + ry + '" x2="0" y2="' + (ry - 26 / view.s) + '"/><circle data-h="rot" class="hdl rot" cx="0" cy="' + (ry - 26 / view.s) + '" r="' + r + '"/>' +
        (d.o ? '<circle data-h="res" class="hdl" cx="' + it.w / 2 + '" cy="' + (-it.d / 2) + '" r="' + r + '"/>' : '<circle data-h="res" class="hdl" cx="' + it.w / 2 + '" cy="' + it.d / 2 + '" r="' + r + '"/>') + '</g>';
      if (opts.dist && !d.o) h += distances(it, fs);
    } else if (sel && sel.type === 'room') {
      var rm = roomById(sel.id); if (!rm) { sel = null; return; }
      rm.pts.forEach(function (p, i) {
        var q = rm.pts[(i + 1) % rm.pts.length];
        h += '<circle data-h="m:' + i + '" class="hdl mid" cx="' + (p[0] + q[0]) / 2 + '" cy="' + (p[1] + q[1]) / 2 + '" r="' + r * .8 + '"/>';
      });
      rm.pts.forEach(function (p, i) { h += '<circle data-h="v:' + i + '" class="hdl" cx="' + p[0] + '" cy="' + p[1] + '" r="' + r + '"/>'; });
    }
    L.sel.innerHTML = h;
    var bar = $('#pl-selbar'); bar.hidden = !sel;
    if (sel) $('#sb-rot').hidden = sel.type !== 'item';
  }
  function distances(it, fs) {
    var rr = ((it.r || 0) % 180 + 180) % 180; if (rr % 90 > 1 && rr % 90 < 89) return '';
    var rm = roomAt([it.x, it.y]); if (!rm) return '';
    var hw = (Math.abs(rr - 90) < 1 ? it.d : it.w) / 2, hd = (Math.abs(rr - 90) < 1 ? it.w : it.d) / 2, o = '';
    var hits = { l: -1e9, r: 1e9, t: -1e9, b: 1e9 };
    rm.pts.forEach(function (p, i) {
      var q = rm.pts[(i + 1) % rm.pts.length];
      if ((p[1] - it.y) * (q[1] - it.y) <= 0 && p[1] !== q[1]) { var x = p[0] + (it.y - p[1]) * (q[0] - p[0]) / (q[1] - p[1]); if (x < it.x) hits.l = Math.max(hits.l, x); else hits.r = Math.min(hits.r, x); }
      if ((p[0] - it.x) * (q[0] - it.x) <= 0 && p[0] !== q[0]) { var y = p[1] + (it.x - p[0]) * (q[1] - p[1]) / (q[0] - p[0]); if (y < it.y) hits.t = Math.max(hits.t, y); else hits.b = Math.min(hits.b, y); }
    });
    function dl(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1]) > 2 ? dimLine(a, b, fs * .9, 'dist') : ''; }
    if (hits.l > -1e9 && it.x - hw > hits.l) o += dl([hits.l, it.y], [it.x - hw, it.y]);
    if (hits.r < 1e9 && it.x + hw < hits.r) o += dl([it.x + hw, it.y], [hits.r, it.y]);
    if (hits.t > -1e9 && it.y - hd > hits.t) o += dl([it.x, hits.t], [it.x, it.y - hd]);
    if (hits.b < 1e9 && it.y + hd < hits.b) o += dl([it.x, it.y + hd], [it.x, hits.b]);
    return o;
  }
  function byId(id) { for (var i = 0; i < plan.items.length; i++) if (plan.items[i].id === id) return plan.items[i]; }
  function roomById(id) { for (var i = 0; i < plan.rooms.length; i++) if (plan.rooms[i].id === id) return plan.rooms[i]; }

  // ---------- panels ----------
  var FLOORS = [['#ead9bd', 'Holz/Parkett'], ['#efe3cf', 'Laminat hell'], ['#c9a882', 'Holz dunkel'], ['#e3e7eb', 'Fliesen grau'], ['#f4f1ea', 'Fliesen hell'], ['#e9e2d6', 'Teppich'], ['#d8d4cc', 'Beton'], ['#dfe9dc', 'Vinyl salbei']];
  var lastPanel = '';
  function panel(cl) {
    var p = $('#pl-props'), h = '', key = sel ? sel.type + sel.id + JSON.stringify(sel.type === 'item' ? byId(sel.id) : roomById(sel.id)) : 'none' + plan.rooms.length + plan.items.length + Object.keys(cl).length + JSON.stringify(plan.rooms.map(function (r) { return [r.name, RP.area(r.pts)]; }));
    if (key === lastPanel || (document.activeElement && p.contains(document.activeElement) && document.activeElement.tagName !== 'BUTTON')) return; lastPanel = key;
    if (sel && sel.type === 'item') {
      var it = byId(sel.id), d = ITEMS[it.t] || { name: 'Objekt' };
      h = '<h3>' + esc(d.name) + '</h3>' + (cl[it.id] ? '<p class="warn">⚠ Überschneidet sich mit einem anderen Möbel.</p>' : '') +
        '<label>Bezeichnung<input data-p="label" value="' + esc(it.label || '') + '" placeholder="' + esc(d.name) + '"></label>' +
        '<div class="pg"><label>Breite (cm)<input type="number" data-p="w" value="' + Math.round(it.w) + '" min="5" step="1"></label><label>Tiefe (cm)<input type="number" data-p="d" value="' + Math.round(it.d) + '" min="5" step="1"></label>' +
        '<label>Höhe (cm)<input type="number" data-p="h" value="' + Math.round(it.h || d.h || 0) + '" min="0" step="1"></label><label>Drehung (°)<input type="number" data-p="r" value="' + Math.round(it.r || 0) + '" step="15"></label>' +
        '<label>X (cm)<input type="number" data-p="x" value="' + Math.round(it.x) + '"></label><label>Y (cm)<input type="number" data-p="y" value="' + Math.round(it.y) + '"></label></div>' +
        '<label>Farbe<input type="color" data-p="c" value="' + (it.c || d.c || '#dddddd') + '"></label>' +
        '<div class="pb"><label class="ck"><input type="checkbox" data-p="f"' + (it.f ? ' checked' : '') + '> Spiegeln</label>' + (d.o ? '<label class="ck"><input type="checkbox" data-p="s"' + (it.s ? ' checked' : '') + '> Öffnung nach außen</label>' : '') + '</div>' +
        '<div class="pb"><button data-a="rot90">⟳ 90°</button><button data-a="dup">Duplizieren</button><button data-a="front">Nach vorne</button><button data-a="back">Nach hinten</button><button data-a="del" class="dang">Löschen</button></div>';
    } else if (sel && sel.type === 'room') {
      var r = roomById(sel.id), A = RP.area(r.pts), per = 0, rect = isRect(r);
      r.pts.forEach(function (p, i) { var q = r.pts[(i + 1) % r.pts.length]; per += Math.hypot(q[0] - p[0], q[1] - p[1]); });
      h = '<h3>Raum</h3><label>Name<input data-r="name" value="' + esc(r.name || '') + '"></label>' +
        (rect ? '<div class="pg"><label>Breite (cm)<input type="number" data-r="rw" value="' + Math.round(rect.w) + '" min="50"></label><label>Länge (cm)<input type="number" data-r="rh" value="' + Math.round(rect.h) + '" min="50"></label></div>' : '<p class="muted">Eckpunkte direkt im Plan ziehen. Doppelklick auf einen Eckpunkt entfernt ihn, die Punkte auf den Kanten fügen neue Ecken hinzu.</p>') +
        '<p class="kpi"><b>' + (A / 1e4).toFixed(2).replace('.', ',') + ' m²</b> Fläche · ' + fmt(per) + ' m Umfang · Wandfläche ca. ' + (per / 100 * 2.5).toFixed(1).replace('.', ',') + ' m² (2,50 m Höhe)</p>' +
        '<label>Boden</label><div class="floors">' + FLOORS.map(function (fl) { return '<button data-floor="' + fl[0] + '" title="' + fl[1] + '" style="background:' + fl[0] + '"' + (r.floor === fl[0] ? ' class="on"' : '') + '></button>'; }).join('') + '<input type="color" data-r="floor" value="' + (r.floor || '#efe3cf') + '" title="Eigene Farbe"></div>' +
        '<div class="pb"><button data-a="rdup">Duplizieren</button><button data-a="del" class="dang">Raum löschen</button></div>' +
        '<a class="btn sm" href="../rechner/bodenbelag/?flaeche=' + (A / 1e4).toFixed(2) + '">Bodenbelag berechnen →</a> <a class="btn sm b" href="../rechner/wandfarbe/?umfang=' + (per / 100).toFixed(2) + '">Wandfarbe berechnen →</a>';
    } else {
      var tot = plan.rooms.reduce(function (s, r) { return s + RP.area(r.pts); }, 0), nc = Object.keys(cl).length;
      h = '<h3>Ihre Planung</h3><p class="kpi"><b>' + (tot / 1e4).toFixed(2).replace('.', ',') + ' m²</b> in ' + plan.rooms.length + ' Raum/Räumen · ' + plan.items.filter(function (i) { return !(ITEMS[i.t] || {}).o; }).length + ' Möbel</p>' +
        (nc ? '<p class="warn">⚠ ' + nc + ' Möbel überschneiden sich (rot markiert).</p>' : '') +
        (plan.rooms.length ? '<ul class="rlist">' + plan.rooms.map(function (r) { return '<li><button data-selroom="' + r.id + '">' + esc(r.name || 'Raum') + '</button><span>' + (RP.area(r.pts) / 1e4).toFixed(2).replace('.', ',') + ' m²</span></li>'; }).join('') + '</ul>' : '<p class="muted">Noch kein Raum. Legen Sie mit <b>＋ Raum</b> ein Rechteck an oder zeichnen Sie einen Grundriss mit <b>✎ Zeichnen</b>.</p>') +
        '<div class="cta-box"><b>Planung umsetzen?</b><p>Holen Sie sich bis zu 3 kostenlose Angebote von Innenarchitekten &amp; Handwerkern – Ihre Planung wird automatisch mitgeschickt.</p><button class="btn sm" data-a="lead">Kostenlose Angebote erhalten</button></div>' +
        '<div class="pb"><button data-a="share">🔗 Link teilen</button><button data-a="contest">🏆 Am Wettbewerb teilnehmen</button></div>' +
        '<p class="muted small">Tipp: Klicken Sie ein Möbel an, um Maße, Farbe und Drehung zu ändern. Abstände zu den Wänden werden automatisch angezeigt.</p>';
    }
    p.innerHTML = h;
  }
  function isRect(r) {
    if (r.pts.length !== 4) return null; var p = r.pts, xs = p.map(function (a) { return a[0]; }), ys = p.map(function (a) { return a[1]; });
    var x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys);
    var ok = p.every(function (a) { return (a[0] === x0 || a[0] === x1) && (a[1] === y0 || a[1] === y1); });
    return ok ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
  }
  function summary() {
    var tot = plan.rooms.reduce(function (s, r) { return s + RP.area(r.pts); }, 0);
    $('#pl-area').textContent = (tot / 1e4).toFixed(2).replace('.', ',') + ' m²';
  }
  $('#pl-props').addEventListener('input', function (e) {
    var t = e.target, k = t.getAttribute('data-p'), rk = t.getAttribute('data-r');
    if (k && sel && sel.type === 'item') {
      var it = byId(sel.id); if (!t._snap) { snapshot(); t._snap = 1; }
      if (k === 'label') it.label = t.value; else if (k === 'c') it.c = t.value; else if (k === 'f' || k === 's') it[k] = t.checked;
      else { var v = parseFloat(t.value); if (isNaN(v)) return; if ((k === 'w' || k === 'd') && v < 5) return; it[k] = v; }
      render(); persist();
    } else if (rk && sel && sel.type === 'room') {
      var r = roomById(sel.id); if (!t._snap) { snapshot(); t._snap = 1; }
      if (rk === 'name') r.name = t.value; else if (rk === 'floor') r.floor = t.value;
      else { var rc = isRect(r), val = parseFloat(t.value); if (!rc || isNaN(val) || val < 50) return; var w = rk === 'rw' ? val : rc.w, hh = rk === 'rh' ? val : rc.h; r.pts = [[rc.x, rc.y], [rc.x + w, rc.y], [rc.x + w, rc.y + hh], [rc.x, rc.y + hh]]; }
      render(); persist();
    }
  });
  $('#pl-props').addEventListener('change', function (e) { e.target._snap = 0; lastPanel = ''; render(); });
  $('#pl-props').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.floor && sel) { snapshot(); roomById(sel.id).floor = b.dataset.floor; lastPanel = ''; commit(); return; }
    if (b.dataset.selroom) { sel = { type: 'room', id: b.dataset.selroom }; lastPanel = ''; render(); return; }
    action(b.dataset.a);
  });
  function action(a) {
    var it = sel && sel.type === 'item' ? byId(sel.id) : null;
    switch (a) {
      case 'rot90': if (it) { snapshot(); it.r = ((it.r || 0) + 90) % 360; commit(); } break;
      case 'dup':
        if (it) { snapshot(); var c = JSON.parse(JSON.stringify(it)); c.id = uid(); c.x += 30; c.y += 30; plan.items.push(c); sel = { type: 'item', id: c.id }; commit(); }
        else if (sel && sel.type === 'room') action('rdup'); break;
      case 'rdup': var r = roomById(sel.id); if (r) { snapshot(); var b = RP.bounds({ rooms: plan.rooms, items: [] }), xs = r.pts.map(function (p) { return p[0]; }), off = b[2] - Math.min.apply(0, xs) + 60; var nr = { id: uid(), name: (r.name || 'Raum') + ' (Kopie)', floor: r.floor, pts: r.pts.map(function (p) { return [p[0] + off, p[1]]; }) }; plan.rooms.push(nr); sel = { type: 'room', id: nr.id }; commit(); } break;
      case 'front': if (it) { snapshot(); plan.items.splice(plan.items.indexOf(it), 1); plan.items.push(it); commit(); } break;
      case 'back': if (it) { snapshot(); plan.items.splice(plan.items.indexOf(it), 1); plan.items.unshift(it); commit(); } break;
      case 'del':
        if (!sel) break; snapshot();
        if (sel.type === 'item') plan.items = plan.items.filter(function (i) { return i.id !== sel.id; }); else plan.rooms = plan.rooms.filter(function (r) { return r.id !== sel.id; });
        sel = null; commit(); break;
      case 'props': app.classList.add('show-props'); break;
      case 'lead': goLead(); break;
      case 'share': share(); break;
      case 'contest': encode().then(function (link) { try { sessionStorage.setItem('rp_contest', JSON.stringify({ link: link, name: plan.name })); } catch (e) { } location.href = '../wettbewerb/#teilnehmen'; }); break;
    }
  }

  // ---------- library ----------
  var lib = $('#pl-lib-list'), cat = 'wohnen';
  function libRender() {
    var q = ($('#pl-search').value || '').toLowerCase().trim();
    lib.innerHTML = Object.keys(ITEMS).map(function (k) { return ITEMS[k]; }).filter(function (d) { return q ? d.name.toLowerCase().indexOf(q) > -1 : d.cat === cat; }).map(function (d) {
      var m = Math.max(d.w, d.d, 40) * .62, vb = d.o ? (-m) + ' ' + (-m * .7) + ' ' + 2 * m + ' ' + 1.4 * m : (-m) + ' ' + (-m) + ' ' + 2 * m + ' ' + 2 * m;
      return '<button class="lib-it" data-t="' + d.id + '" title="' + esc(d.name) + ' – klicken oder in den Plan ziehen"><svg viewBox="' + vb + '">' + RP.symbol(d.k, d.w, d.d, d.c, '') + '</svg><span>' + esc(d.name) + '<small>' + d.w + '×' + d.d + (d.h ? '×' + d.h : '') + '</small></span></button>';
    }).join('') || '<p class="muted">Nichts gefunden.</p>';
  }
  $('#pl-cats').innerHTML = RP.CATS.map(function (c) { return '<button data-c="' + c[0] + '"' + (c[0] === cat ? ' class="on"' : '') + '>' + c[1] + '</button>'; }).join('');
  $('#pl-cats').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; cat = b.dataset.c; $('#pl-search').value = ''; $$('#pl-cats button').forEach(function (x) { x.classList.toggle('on', x === b); }); libRender(); });
  $('#pl-search').addEventListener('input', libRender);
  function addItem(t, x, y) {
    var d = ITEMS[t]; if (!d) return; snapshot();
    if (x == null) { x = view.x + W() / view.s / 2; y = view.y + H() / view.s / 2; var rm = roomAt([x, y]) || plan.rooms[0]; if (rm && !roomAt([x, y])) { var c = RP.centroid(rm.pts); x = c[0]; y = c[1]; } }
    var it = { id: uid(), t: t, x: rnd(x, GRID), y: rnd(y, GRID), r: 0, w: d.w, d: d.d, h: d.h, c: d.c };
    if (t === 'label') it.label = 'Text';
    if (d.o) snapOpening(it, true);
    plan.items.push(it); sel = { type: 'item', id: it.id }; setTool('select'); commit();
    if (window.innerWidth < 900) app.classList.remove('show-lib');
  }
  // drag from library (pointer based, works on touch)
  var ldrag = null;
  lib.addEventListener('pointerdown', function (e) { var b = e.target.closest('.lib-it'); if (!b) return; ldrag = { t: b.dataset.t, x: e.clientX, y: e.clientY, moved: false, ghost: null }; });
  document.addEventListener('pointermove', function (e) {
    if (!ldrag) return;
    if (!ldrag.moved && Math.hypot(e.clientX - ldrag.x, e.clientY - ldrag.y) > 8) { ldrag.moved = true; ldrag.ghost = document.createElement('div'); ldrag.ghost.className = 'ghost'; ldrag.ghost.textContent = ITEMS[ldrag.t].name; document.body.appendChild(ldrag.ghost); }
    if (ldrag.ghost) { ldrag.ghost.style.left = e.clientX + 'px'; ldrag.ghost.style.top = e.clientY + 'px'; }
  });
  document.addEventListener('pointerup', function (e) {
    if (!ldrag) return; var d = ldrag; ldrag = null; if (d.ghost) d.ghost.remove();
    if (!d.moved) { addItem(d.t); return; }
    var r = svg.getBoundingClientRect(); if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { var p = toW(e); addItem(d.t, p[0], p[1]); }
  });

  // ---------- canvas interaction ----------
  var drag = null, pointers = {}, pinch = null, draft = null, spaceDown = false;
  svg.addEventListener('pointerdown', function (e) {
    pointers[e.pointerId] = [e.clientX, e.clientY];
    if (Object.keys(pointers).length === 2) { var ps = Object.values(pointers); pinch = { d: Math.hypot(ps[0][0] - ps[1][0], ps[0][1] - ps[1][1]), s: view.s }; drag = null; return; }
    svg.setPointerCapture(e.pointerId); app.classList.remove('show-lib', 'show-props');
    var p = toW(e), t = e.target;
    if (tool === 'pan' || e.button === 1 || spaceDown) { drag = { k: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y }; return; }
    if (tool === 'room') { roomClick(p, e); return; }
    if (tool === 'measure') { var a = opts.snap ? [rnd(p[0], GRID), rnd(p[1], GRID)] : p; drag = { k: 'dim', a: a, b: a }; return; }
    var hdl = t.closest('[data-h]');
    if (hdl) {
      var hk = hdl.getAttribute('data-h');
      if (sel.type === 'item') { drag = { k: hk === 'rot' ? 'rot' : 'res', it: byId(sel.id), snap: false }; return; }
      var rm = roomById(sel.id), idx = +hk.split(':')[1];
      if (hk[0] === 'm') { snapshot(); var q = rm.pts[(idx + 1) % rm.pts.length], np = [rnd((rm.pts[idx][0] + q[0]) / 2, GRID), rnd((rm.pts[idx][1] + q[1]) / 2, GRID)]; rm.pts.splice(idx + 1, 0, np); drag = { k: 'vtx', r: rm, i: idx + 1, snap: true }; render(); return; }
      drag = { k: 'vtx', r: rm, i: idx, snap: false }; return;
    }
    var ig = t.closest('[data-id]');
    if (ig) { var it = byId(ig.getAttribute('data-id')); sel = { type: 'item', id: it.id }; drag = { k: 'move', it: it, ox: p[0] - it.x, oy: p[1] - it.y, snap: false, sx: e.clientX, sy: e.clientY }; lastPanel = ''; render(); return; }
    var dg = t.closest('[data-dim]');
    if (dg) { snapshot(); plan.dims.splice(+dg.getAttribute('data-dim'), 1); commit(); return; }
    var rg = t.closest('[data-room]');
    if (rg) { var r = roomById(rg.getAttribute('data-room')); var was = sel && sel.id === r.id; sel = { type: 'room', id: r.id }; lastPanel = ''; drag = was ? { k: 'rmove', r: r, p: p, orig: r.pts.map(function (x) { return x.slice(); }), snap: false } : { k: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, click: true }; render(); return; }
    sel = null; lastPanel = ''; render();
    drag = { k: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
  });
  svg.addEventListener('pointermove', function (e) {
    var p = toW(e); $('#pl-xy').textContent = fmt(p[0]) + ' / ' + fmt(p[1]) + ' m';
    if (pointers[e.pointerId]) pointers[e.pointerId] = [e.clientX, e.clientY];
    if (pinch) { var ps = Object.values(pointers); if (ps.length < 2) return; var d = Math.hypot(ps[0][0] - ps[1][0], ps[0][1] - ps[1][1]), r = svg.getBoundingClientRect(); var cx = view.x + ((ps[0][0] + ps[1][0]) / 2 - r.left) / view.s, cy = view.y + ((ps[0][1] + ps[1][1]) / 2 - r.top) / view.s; zoomAt(pinch.s * d / pinch.d / view.s, cx, cy); return; }
    if (tool === 'room' && draft) { draftMove(p, e); return; }
    if (!drag) return;
    var g = opts.snap && !e.altKey ? GRID : .1;
    function once() { if (!drag.snap) { snapshot(); drag.snap = true; } }
    switch (drag.k) {
      case 'pan': view.x = drag.vx - (e.clientX - drag.sx) / view.s; view.y = drag.vy - (e.clientY - drag.sy) / view.s; setVB(); render(); break;
      case 'move':
        if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 3 && !drag.snap) return; once();
        drag.it.x = rnd(p[0] - drag.ox, g); drag.it.y = rnd(p[1] - drag.oy, g);
        if ((ITEMS[drag.it.t] || {}).o) snapOpening(drag.it); render(); break;
      case 'rot': once(); var a = Math.atan2(p[1] - drag.it.y, p[0] - drag.it.x) * deg + 90; drag.it.r = ((e.altKey ? Math.round(a) : rnd(a, 15)) % 360 + 360) % 360; render(); break;
      case 'res':
        once(); var it = drag.it, an = -(it.r || 0) / deg, dx = p[0] - it.x, dy = p[1] - it.y, lx = dx * Math.cos(an) - dy * Math.sin(an), ly = dx * Math.sin(an) + dy * Math.cos(an);
        it.w = Math.max(10, rnd(Math.abs(lx) * 2, g)); if (!(ITEMS[it.t] || {}).o) it.d = Math.max(10, rnd(Math.abs(ly) * 2, g)); render(); break;
      case 'vtx': once(); var sp = snapPt(p, g, drag.r, drag.i); drag.r.pts[drag.i] = sp; render(); break;
      case 'rmove': once(); var ddx = rnd(p[0] - drag.p[0], g), ddy = rnd(p[1] - drag.p[1], g); drag.r.pts = drag.orig.map(function (q) { return [q[0] + ddx, q[1] + ddy]; }); render(); break;
      case 'dim': var b = opts.snap ? [rnd(p[0], GRID), rnd(p[1], GRID)] : p; if (!e.shiftKey) { if (Math.abs(b[0] - drag.a[0]) < Math.abs(b[1] - drag.a[1]) * .2) b[0] = drag.a[0]; else if (Math.abs(b[1] - drag.a[1]) < Math.abs(b[0] - drag.a[0]) * .2) b[1] = drag.a[1]; } drag.b = b; L.tmp.innerHTML = dimLine(drag.a, b, 12 / view.s, 'dm'); break;
    }
  });
  function endPtr(e) {
    delete pointers[e.pointerId]; if (pinch && Object.keys(pointers).length < 2) { pinch = null; drag = null; return; }
    if (!drag) return; var d = drag; drag = null;
    if (d.k === 'dim') { L.tmp.innerHTML = ''; if (Math.hypot(d.b[0] - d.a[0], d.b[1] - d.a[1]) > 5) { snapshot(); plan.dims.push({ a: d.a, b: d.b }); commit(); } return; }
    if (d.k === 'pan' && d.click && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return;
    if (d.snap) { lastPanel = ''; commit(); }
  }
  svg.addEventListener('pointerup', endPtr); svg.addEventListener('pointercancel', endPtr);
  svg.addEventListener('dblclick', function (e) {
    var h = e.target.closest('[data-h^="v:"]');
    if (h && sel && sel.type === 'room') { var r = roomById(sel.id); if (r.pts.length > 3) { snapshot(); r.pts.splice(+h.getAttribute('data-h').split(':')[1], 1); commit(); } return; }
    if (tool === 'room' && draft && draft.pts.length >= 3) finishRoom();
  });
  svg.addEventListener('wheel', function (e) { e.preventDefault(); var p = toW(e); zoomAt(Math.exp(-e.deltaY * .0015), p[0], p[1]); }, { passive: false });
  function snapPt(p, g, room, skip) {
    var best = null, tol = 12 / view.s;
    plan.rooms.forEach(function (r) { r.pts.forEach(function (q, i) { if (r === room && i === skip) return; var d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < tol && (!best || d < best.d)) best = { d: d, p: q.slice() }; }); });
    return best ? best.p : [rnd(p[0], g), rnd(p[1], g)];
  }

  // room drawing tool
  function roomClick(p, e) {
    var g = opts.snap ? GRID : .1, sp = snapPt(p, g);
    if (!draft) { draft = { pts: [sp], cur: sp }; drawDraft(); return; }
    sp = ortho(draft.pts[draft.pts.length - 1], draft.cur || sp, e);
    var f0 = draft.pts[0];
    if (draft.pts.length >= 3 && Math.hypot(sp[0] - f0[0], sp[1] - f0[1]) < 15 / view.s) { finishRoom(); return; }
    var last = draft.pts[draft.pts.length - 1]; if (Math.hypot(sp[0] - last[0], sp[1] - last[1]) < 1) return;
    draft.pts.push(sp); drawDraft();
  }
  function ortho(a, b, e) { if (e && e.shiftKey) return b; var dx = b[0] - a[0], dy = b[1] - a[1]; if (Math.abs(dx) < Math.abs(dy) * .12) return [a[0], b[1]]; if (Math.abs(dy) < Math.abs(dx) * .12) return [b[0], a[1]]; return b; }
  function draftMove(p, e) { draft.cur = ortho(draft.pts[draft.pts.length - 1], snapPt(p, opts.snap ? GRID : .1), e); drawDraft(); }
  function drawDraft() {
    if (!draft) { L.tmp.innerHTML = ''; return; }
    var all = draft.pts.concat(draft.cur ? [draft.cur] : []), fs = 12 / view.s, h = '<polyline class="draft" points="' + all.map(function (p) { return p.join(','); }).join(' ') + '"/>';
    draft.pts.forEach(function (p, i) { h += '<circle class="hdl' + (i === 0 ? ' first' : '') + '" cx="' + p[0] + '" cy="' + p[1] + '" r="' + 6 / view.s + '"/>'; });
    if (draft.cur && draft.pts.length) h += dimLine(draft.pts[draft.pts.length - 1], draft.cur, fs, 'dm');
    L.tmp.innerHTML = h;
  }
  function finishRoom() {
    if (!draft || draft.pts.length < 3) return; snapshot();
    var r = { id: uid(), name: 'Raum ' + (plan.rooms.length + 1), floor: '#efe3cf', pts: draft.pts }; plan.rooms.push(r); draft = null; L.tmp.innerHTML = '';
    sel = { type: 'room', id: r.id }; setTool('select'); lastPanel = ''; commit();
  }
  function setTool(t) {
    tool = t; draft = null; L.tmp.innerHTML = ''; if (t !== 'select' && sel) { sel = null; lastPanel = ''; render(); }
    $$('[data-tool]').forEach(function (b) { b.classList.toggle('on', b.dataset.tool === t); });
    svg.setAttribute('data-mode', t);
    var hint = { room: 'Klicken Sie Eckpunkt für Eckpunkt. Klick auf den ersten Punkt, Doppelklick oder Enter schließt den Raum. Esc bricht ab.', measure: 'Ziehen Sie eine Maßlinie. Klick auf eine Maßlinie löscht sie.', pan: 'Ziehen, um den Plan zu verschieben.' }[t];
    $('#pl-hint').textContent = hint || ''; $('#pl-hint').hidden = !hint;
  }

  // ---------- toolbar ----------
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-tool],[data-cmd]'); if (!b || !(app.contains(b) || $('#pl-overlay').contains(b))) return;
    if (b.dataset.tool) { setTool(b.dataset.tool); return; }
    var c = b.dataset.cmd;
    switch (c) {
      case 'undo': doUndo(); break; case 'redo': doRedo(); break;
      case 'zin': zoomAt(1.25); break; case 'zout': zoomAt(.8); break; case 'fit': fit(); break;
      case 'rect': openModal('m-rect'); break;
      case 'new': if (confirm('Neue, leere Planung beginnen? Die aktuelle Planung bleibt unter „Projekte“ gespeichert.')) load(blank('Neue Planung')); break;
      case 'projects': projList(); openModal('m-proj'); break;
      case 'export': openModal('m-export'); break;
      case 'share': share(); break;
      case 'help': openModal('m-help'); break;
      case 'lib': app.classList.toggle('show-lib'); app.classList.remove('show-props'); break;
      case 'props': app.classList.toggle('show-props'); app.classList.remove('show-lib'); break;
      case '3d': toggle3D(); break;
      case 'grid': case 'snap': case 'labels': case 'dist': opts[c] = !opts[c]; b.classList.toggle('on', opts[c]); render(); break;
      case 'close': closeModal(); break;
      case 'png': exportPNG(); break; case 'svg': dl(exportSVG(), plan.name + '.svg', 'image/svg+xml'); break;
      case 'json': dl(JSON.stringify(plan, null, 1), plan.name + '.raumplan.json', 'application/json'); break;
      case 'csv': dl(csv(), plan.name + '-moebelliste.csv', 'text/csv'); break;
      case 'print': printPlan(); break;
      case 'import': $('#pl-file').click(); break;
      case 'copy': var inp = $('#share-link'); inp.select(); try { navigator.clipboard.writeText(inp.value); } catch (er) { document.execCommand('copy'); } b.textContent = '✓ Kopiert'; break;
      case 'walls3d': wallLow = !wallLow; build3D(); break;
      case 'sel-rot': action('rot90'); break; case 'sel-dup': action('dup'); break; case 'sel-del': action('del'); break; case 'sel-props': action('props'); break;
    }
  });
  $('#pl-name').addEventListener('input', function () { plan.name = this.value || 'Meine Planung'; persist(); });
  $('#rect-form').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target, w = parseFloat(f.w.value.replace(',', '.')) * 100, h = parseFloat(f.h.value.replace(',', '.')) * 100; if (!(w >= 50 && h >= 50)) return;
    snapshot(); var x = 0, y = 0; if (plan.rooms.length) { var b = RP.bounds({ rooms: plan.rooms, items: [] }); x = b[2] + 40; y = b[1]; }
    var r = { id: uid(), name: f.n.value || ('Raum ' + (plan.rooms.length + 1)), floor: f.fl.value, pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] };
    plan.rooms.push(r); sel = { type: 'room', id: r.id }; closeModal(); lastPanel = ''; commit(); fit();
  });
  $('#pl-file').addEventListener('change', function () {
    var fl = this.files[0]; if (!fl) return; var rd = new FileReader();
    rd.onload = function () { try { var p = JSON.parse(rd.result); if (!p.rooms) throw 0; load(p); closeModal(); } catch (er) { alert('Die Datei ist keine gültige Raumplaner-Datei.'); } }; rd.readAsText(fl); this.value = '';
  });
  function openModal(id) { $$('.pl-modal').forEach(function (m) { m.hidden = m.id !== id; }); $('#pl-overlay').hidden = false; var f = $('#' + id + ' input'); if (f) setTimeout(function () { f.focus(); }, 50); }
  function closeModal() { $('#pl-overlay').hidden = true; }
  $('#pl-overlay').addEventListener('click', function (e) { if (e.target === this) closeModal(); });
  function projList() {
    var s = store(), arr = Object.keys(s).map(function (k) { return s[k]; }).sort(function (a, b) { return b.t - a.t; });
    $('#proj-list').innerHTML = arr.length ? arr.map(function (p) {
      var a = (p.plan.rooms || []).reduce(function (t, r) { return t + RP.area(r.pts); }, 0);
      return '<li><div><b>' + esc(p.name || 'Planung') + '</b><small>' + new Date(p.t).toLocaleString('de-DE') + ' · ' + (a / 1e4).toFixed(1).replace('.', ',') + ' m²</small></div><button class="btn sm" data-open="' + p.id + '">Öffnen</button><button class="btn sm o" data-delp="' + p.id + '">Löschen</button></li>';
    }).join('') : '<li class="muted">Noch keine gespeicherten Planungen.</li>';
  }
  $('#proj-list').addEventListener('click', function (e) {
    var o = e.target.getAttribute('data-open'), d = e.target.getAttribute('data-delp'), s = store();
    if (o && s[o]) { load(s[o].plan, o); closeModal(); }
    if (d && confirm('Diese Planung endgültig löschen?')) { delete s[d]; localStorage.setItem(KEY, JSON.stringify(s)); if (d === pid) load(blank()); projList(); }
  });

  // ---------- export & share ----------
  function dl(data, name, type) { var a = document.createElement('a'), b = data instanceof Blob ? data : new Blob([data], { type: type }); a.href = URL.createObjectURL(b); a.download = name.replace(/[^\wäöüÄÖÜß.\- ]/g, '_'); document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function exportSVG() {
    var s = RP.planSVG(plan, { labels: true, bg: '#ffffff', pad: 70 }), b = RP.bounds(plan), y = b[3] + 55;
    return s.replace('</svg>', '<text x="' + (b[0] - 40) + '" y="' + y + '" font-family="Inter,sans-serif" font-size="16" fill="#5a6372">' + esc(plan.name) + ' · erstellt mit Raumplaner.com</text></svg>');
  }
  function exportPNG() {
    var s = exportSVG(), img = new Image(), vb = s.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number), sc = Math.min(4, 2400 / vb[2]);
    img.onload = function () { var c = document.createElement('canvas'); c.width = vb[2] * sc; c.height = vb[3] * sc; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); c.toBlob(function (bl) { dl(bl, plan.name + '.png'); }); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }
  function groupItems() {
    var m = {}; plan.items.forEach(function (it) { var d = ITEMS[it.t] || { name: it.t }, k = (it.label || d.name) + '|' + Math.round(it.w) + '×' + Math.round(it.d) + '×' + Math.round(it.h || 0); m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).map(function (k) { var p = k.split('|'); return [p[0], p[1], m[k]]; });
  }
  function csv() { return '﻿Artikel;Maße B×T×H (cm);Anzahl\n' + groupItems().map(function (r) { return '"' + r[0].replace(/"/g, '""') + '";' + r[1] + ';' + r[2]; }).join('\n'); }
  function printPlan() {
    var w = window.open('', '_blank'); if (!w) return;
    w.document.write('<!doctype html><html lang="de"><head><meta charset="utf-8"><title>' + esc(plan.name) + '</title><style>body{font-family:Inter,Arial,sans-serif;margin:24px}svg{width:100%;max-height:70vh}table{border-collapse:collapse;width:100%;margin-top:16px}td,th{border:1px solid #ccc;padding:6px;text-align:left}</style></head><body><h1>' + esc(plan.name) + '</h1>' + exportSVG() +
      '<table><tr><th>Raum</th><th>Fläche</th></tr>' + plan.rooms.map(function (r) { return '<tr><td>' + esc(r.name) + '</td><td>' + (RP.area(r.pts) / 1e4).toFixed(2).replace('.', ',') + ' m²</td></tr>'; }).join('') + '</table>' +
      '<table><tr><th>Artikel</th><th>Maße (cm)</th><th>Anzahl</th></tr>' + groupItems().map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>'; }).join('') + '</table><p style="color:#777">Erstellt mit Raumplaner.com</p><script>setTimeout(function(){print()},300)<\/script></body></html>');
    w.document.close();
  }
  function b64u(bytes) { var s = ''; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function slim() { return { v: 1, name: plan.name, rooms: plan.rooms.map(function (r) { return { name: r.name, floor: r.floor, pts: r.pts.map(function (p) { return [Math.round(p[0]), Math.round(p[1])]; }) }; }), items: plan.items.map(function (i) { var o = { t: i.t, x: Math.round(i.x), y: Math.round(i.y), r: Math.round(i.r || 0), w: Math.round(i.w), d: Math.round(i.d), h: Math.round(i.h || 0) }; var d = ITEMS[i.t] || {}; if (i.c && i.c !== d.c) o.c = i.c; if (i.label) o.label = i.label; if (i.f) o.f = 1; if (i.s) o.s = 1; return o; }), dims: plan.dims }; }
  function base() { return location.href.split('#')[0].split('?')[0]; }
  function encode() {
    var json = JSON.stringify(slim());
    if (window.CompressionStream) {
      var cs = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      return new Response(cs).arrayBuffer().then(function (buf) { return base() + '#p=' + b64u(new Uint8Array(buf)); });
    }
    return Promise.resolve(base() + '#j=' + b64u(new TextEncoder().encode(json)));
  }
  function decode(h) {
    if (h.indexOf('#j=') === 0) return Promise.resolve(JSON.parse(new TextDecoder().decode(unb64u(h.slice(3)))));
    if (h.indexOf('#p=') === 0 && window.DecompressionStream) {
      var ds = new Blob([unb64u(h.slice(3))]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return new Response(ds).text().then(JSON.parse);
    }
    return Promise.reject();
  }
  function share() {
    encode().then(function (link) {
      $('#share-link').value = link; var t = encodeURIComponent('Mein Raumplan: ' + plan.name), u = encodeURIComponent(link);
      $('#share-btns').innerHTML = '<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/?text=' + t + '%20' + u + '">WhatsApp</a><a class="btn sm b" href="mailto:?subject=' + t + '&body=' + u + '">E-Mail</a><a class="btn sm o" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + u + '">Facebook</a>';
      $$('[data-cmd="copy"]').forEach(function (b) { b.textContent = 'Kopieren'; }); openModal('m-share');
    });
  }
  function goLead() {
    encode().then(function (link) {
      var tot = plan.rooms.reduce(function (s, r) { return s + RP.area(r.pts); }, 0);
      try { sessionStorage.setItem('rp_lead', JSON.stringify({ link: link, area: (tot / 1e4).toFixed(1), rooms: plan.rooms.map(function (r) { return r.name; }).join(', '), name: plan.name })); } catch (e) { }
      location.href = '../profi-finden/?quelle=planer';
    });
  }

  // ---------- 3D ----------
  var three = null, T3, wallLow = true, is3D = false;
  function toggle3D() {
    is3D = !is3D; app.classList.toggle('is3d', is3D); $$('[data-cmd="3d"]').forEach(function (b) { b.classList.toggle('on', is3D); b.textContent = is3D ? '2D-Ansicht' : '3D-Ansicht'; });
    if (!is3D) { if (three) { three.stop = true; } return; }
    $('#pl-3d-msg').textContent = '3D-Ansicht wird geladen …'; $('#pl-3d-msg').hidden = false;
    var load = T3 ? Promise.resolve() : Promise.all([import('three'), import('three/addons/controls/OrbitControls.js')]).then(function (m) { T3 = Object.assign({}, m[0]); T3.Orbit = m[1].OrbitControls; });
    load.then(function () { $('#pl-3d-msg').hidden = true; build3D(); }).catch(function (err) { console.error(err); $('#pl-3d-msg').textContent = '3D konnte nicht geladen werden. Bitte Internetverbindung prüfen.'; });
  }
  function build3D() {
    if (!T3 || !is3D) return; var host = $('#pl-3d');
    if (!three) {
      var rd = new T3.WebGLRenderer({ antialias: true }); rd.setPixelRatio(Math.min(2, devicePixelRatio)); rd.shadowMap.enabled = true; rd.shadowMap.type = T3.PCFSoftShadowMap; host.appendChild(rd.domElement);
      var cam = new T3.PerspectiveCamera(45, 1, 5, 20000), ctl = new T3.Orbit(cam, rd.domElement); ctl.enableDamping = true; ctl.maxPolarAngle = Math.PI / 2.05;
      three = { rd: rd, cam: cam, ctl: ctl };
    }
    three.stop = false;
    var sc = new T3.Scene(); sc.background = new T3.Color('#eef1f4');
    sc.add(new T3.HemisphereLight(0xffffff, 0xb9b2a6, 1.1));
    var sun = new T3.DirectionalLight(0xffffff, 1.6), b = RP.bounds(plan), cx = (b[0] + b[2]) / 2, cz = (b[1] + b[3]) / 2, size = Math.max(b[2] - b[0], b[3] - b[1], 300);
    sun.position.set(cx + size * .6, size * 1.2, cz + size * .4); sun.target.position.set(cx, 0, cz); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    var sc2 = sun.shadow.camera; sc2.left = sc2.bottom = -size; sc2.right = sc2.top = size; sc2.far = size * 4; sc.add(sun, sun.target);
    var mat = function (c, o) { return new T3.MeshStandardMaterial(Object.assign({ color: c, roughness: .8 }, o || {})); };
    var ground = new T3.Mesh(new T3.PlaneGeometry(size * 6, size * 6), mat('#e4e8ec')); ground.rotation.x = -Math.PI / 2; ground.position.set(cx, -1, cz); ground.receiveShadow = true; sc.add(ground);
    var WH = wallLow ? 100 : 250, wm = mat('#f3f1ec');
    plan.rooms.forEach(function (r) {
      var sh = new T3.Shape(); r.pts.forEach(function (p, i) { if (i) sh.lineTo(p[0], -p[1]); else sh.moveTo(p[0], -p[1]); });
      var fl = new T3.Mesh(new T3.ShapeGeometry(sh), mat(r.floor || '#efe3cf')); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
      var sg = signedArea(r.pts) > 0 ? 1 : -1;
      r.pts.forEach(function (p, i) {
        var q = r.pts[(i + 1) % r.pts.length], dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy); if (len < 1) return;
        var nx = dy / len * sg * WALL / 2, ny = -dx / len * sg * WALL / 2;
        var m = new T3.Mesh(new T3.BoxGeometry(len + WALL * 2, WH, WALL), wm); m.position.set((p[0] + q[0]) / 2 + nx, WH / 2, (p[1] + q[1]) / 2 + ny); m.rotation.y = -Math.atan2(dy, dx); m.castShadow = m.receiveShadow = true; sc.add(m);
      });
    });
    plan.items.forEach(function (it) {
      var d = ITEMS[it.t] || { k: 'box' }, g = new T3.Group(), c = it.c || d.c || '#cccccc', h = Math.max(1, it.h || d.h || 50), k = d.k;
      function box(w, hh, dd, x, y, z, col, o) { var m = new T3.Mesh(new T3.BoxGeometry(Math.max(w, 1), Math.max(hh, 1), Math.max(dd, 1)), mat(col || c, o)); m.position.set(x || 0, (y || 0) + hh / 2, z || 0); m.castShadow = m.receiveShadow = true; g.add(m); return m; }
      function cyl(r1, hh, x, y, z, col) { var m = new T3.Mesh(new T3.CylinderGeometry(r1, r1, hh, 24), mat(col || c)); m.position.set(x || 0, (y || 0) + hh / 2, z || 0); m.castShadow = true; g.add(m); return m; }
      var w = it.w, dd = it.d;
      if (k === 'door' || k === 'door2' || k === 'slide') { if (wallLow) return; box(w, 212, WALL + 6, 0, 0, -WALL / 2, '#a4876a'); }
      else if (k === 'window') { var sill = 90; box(w, h, WALL + 4, 0, sill, -WALL / 2, '#a9cbe3', { transparent: true, opacity: .55, roughness: .1 }); if (wallLow) return; }
      else if (k === 'label' || k === 'tv' && false) return;
      else if (k === 'sofa' || k === 'armchair') { box(w, h * .5, dd, 0, 0, 0); box(w, h * .5, dd * .25, 0, h * .5, -dd * .375); box(w * .1, h * .25, dd, -w * .45, h * .5, 0); box(w * .1, h * .25, dd, w * .45, h * .5, 0); }
      else if (k === 'bed') { box(w, h * .55, dd, 0, 0, 0, RP.shade(c, -.2)); box(w - 6, h * .45, dd - 6, 0, h * .55, 3, '#ffffff'); box(w, 90, 6, 0, 0, -dd / 2 + 3, RP.shade(c, -.25)); box(w * .35, 12, 35, -w * .22, h, -dd / 2 + 30, '#fdfdfd'); if (w > 120) box(w * .35, 12, 35, w * .22, h, -dd / 2 + 30, '#fdfdfd'); }
      else if (k === 'table' || k === 'desk' || k === 'dining') { var td = k === 'dining' ? dd - 100 : dd; box(w, 4, td, 0, h - 4, 0); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { box(5, h - 4, 5, s[0] * (w / 2 - 6), 0, s[1] * (td / 2 - 6), RP.shade(c, -.3)); }); if (k === 'dining') { var n = Math.max(1, Math.round(w / 62)); for (var i = 0; i < n; i++) { var x = -w / 2 + w / n * (i + .5); [-1, 1].forEach(function (s) { box(42, 45, 40, x, 0, s * (dd / 2 - 20), RP.shade(c, -.15)); box(42, 45, 4, x, 45, s * (dd / 2 - 2), RP.shade(c, -.15)); }); } } }
      else if (k === 'round') { var cm = cyl(w / 2, 4, 0, h - 4, 0); cm.scale.z = dd / w; cyl(5, h - 4, 0, 0, 0, RP.shade(c, -.3)); }
      else if (k === 'chair') { box(w, 45, dd - 8, 0, 0, 4); box(w, h - 45, 6, 0, 45, -dd / 2 + 3); }
      else if (k === 'ochair') { cyl(w * .4, 48, 0, 0, 0); box(w * .7, 55, 8, 0, 48, -dd / 2 + 8); }
      else if (k === 'plant') { cyl(w * .25, 35, 0, 0, 0, '#9b7653'); var sp = new T3.Mesh(new T3.SphereGeometry(w * .5, 16, 12), mat(c)); sp.position.set(0, 35 + w * .45, 0); sp.scale.y = (h - 35) / w; sp.castShadow = true; g.add(sp); }
      else if (k === 'lamp') { cyl(3, h - 30, 0, 0, 0, '#555'); var sh = new T3.Mesh(new T3.CylinderGeometry(w * .3, w * .5, 30, 24), mat(c, { emissive: '#7a6a30' })); sh.position.set(0, h - 15, 0); g.add(sh); }
      else if (k === 'rug') box(w, 1, dd, 0, 0, 0, c);
      else if (k === 'tv') box(w, h, dd, 0, 95, 0, c);
      else if (k === 'toilet') { box(w, 75, dd * .3, 0, 0, -dd * .35); var bw = cyl(w * .45, h, 0, 0, dd * .12); bw.scale.z = dd * .38 / (w * .45); }
      else box(w, h, dd, 0, 0, 0);
      g.position.set(it.x, 0, it.y); g.rotation.y = -(it.r || 0) / deg; if (it.f) g.scale.x = -1; sc.add(g);
    });
    three.scene = sc;
    var cam = three.cam; cam.position.set(cx + size * .55, size * .95, cz + size * 1.05); three.ctl.target.set(cx, 60, cz); three.ctl.update();
    var resize = function () { var w = host.clientWidth, h = host.clientHeight; three.rd.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); }; resize(); window.addEventListener('resize', resize);
    (function loop() { if (three.stop || three.scene !== sc) return; three.ctl.update(); three.rd.render(sc, cam); requestAnimationFrame(loop); })();
  }

  // ---------- keyboard ----------
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase(); if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    var k = e.key, mod = e.ctrlKey || e.metaKey;
    if (k === ' ') { spaceDown = true; e.preventDefault(); return; }
    if (mod && k.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
    if (mod && k.toLowerCase() === 'y') { e.preventDefault(); doRedo(); return; }
    if (mod && k.toLowerCase() === 'd') { e.preventDefault(); action('dup'); return; }
    if (mod) return;
    if (k === 'Delete' || k === 'Backspace') { if (sel) { e.preventDefault(); action('del'); } return; }
    if (k === 'Escape') { if (draft) { draft = null; drawDraft(); } else if (!$('#pl-overlay').hidden) closeModal(); else { sel = null; setTool('select'); render(); } return; }
    if (k === 'Enter' && draft) { finishRoom(); return; }
    var it = sel && sel.type === 'item' ? byId(sel.id) : null;
    if (it && /^Arrow/.test(k)) { e.preventDefault(); snapshot(); var st = e.shiftKey ? 10 : 1; if (k === 'ArrowLeft') it.x -= st; if (k === 'ArrowRight') it.x += st; if (k === 'ArrowUp') it.y -= st; if (k === 'ArrowDown') it.y += st; commit(); return; }
    var map = { v: 'select', w: 'room', m: 'measure', h: 'pan' }; if (map[k.toLowerCase()]) { setTool(map[k.toLowerCase()]); return; }
    if (k === 'r' && it) { action('rot90'); return; }
    if (k === 'f') fit(); if (k === '+') zoomAt(1.25); if (k === '-') zoomAt(.8);
  });
  document.addEventListener('keyup', function (e) { if (e.key === ' ') spaceDown = false; });
  window.addEventListener('resize', function () { setVB(); render(); });

  // ---------- init ----------
  libRender(); setTool('select');
  var qs = new URLSearchParams(location.search), s = store(), cur = localStorage.getItem(CUR), tpl = qs.get('vorlage');
  if (location.hash.length > 3) {
    decode(location.hash).then(function (p) { p.name = (p.name || 'Geteilter Plan'); load(p); history.replaceState(null, '', base()); }).catch(function () { load(blank()); });
  } else if (tpl) {
    var T = RP.TEMPLATES.filter(function (t) { return t.id === tpl; })[0]; load(T ? T.plan : blank()); history.replaceState(null, '', base());
  } else if (qs.get('b') && qs.get('l')) {
    var bw = parseFloat(qs.get('b').replace(',', '.')) * 100, bl = parseFloat(qs.get('l').replace(',', '.')) * 100, nm = qs.get('name') || 'Mein Raum', p0 = blank(nm);
    if (bw >= 50 && bl >= 50 && bw < 10000 && bl < 10000) p0.rooms.push({ id: uid(), name: nm, floor: '#ead9bd', pts: [[0, 0], [bw, 0], [bw, bl], [0, bl]] });
    load(p0); history.replaceState(null, '', base());
  } else if (cur && s[cur]) load(s[cur].plan, cur);
  else load(RP.TEMPLATES[0].plan);
  try { if (!localStorage.getItem('rp:intro')) { openModal('m-help'); localStorage.setItem('rp:intro', '1'); } } catch (e) { }
  window.addEventListener('beforeunload', function () { try { var st = store(); st[pid] = { id: pid, name: plan.name, t: Date.now(), plan: plan }; localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } });
})();
