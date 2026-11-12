/* Raumplaner.com – Rechner */
(function () {
  'use strict';
  var box = document.querySelector('[data-calc]'); if (!box) return;
  var type = box.getAttribute('data-calc'), q = new URLSearchParams(location.search);
  function $(s) { return box.querySelector(s); }
  function n(name, def) { var e = box.querySelector('[name="' + name + '"]'); if (!e) return def || 0; if (e.type === 'checkbox') return e.checked; var v = parseFloat(String(e.value).replace(',', '.')); return isNaN(v) ? (def || 0) : v; }
  function s(name) { var e = box.querySelector('[name="' + name + '"]'); return e ? e.value : ''; }
  function nf(v, d) { return (isFinite(v) ? v : 0).toLocaleString('de-DE', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function eur(v) { return nf(Math.round(v), 0) + ' €'; }
  function o(k, v) { var e = box.querySelector('[data-o="' + k + '"]'); if (e) e.innerHTML = v; }
  function lead(projekt, fl, budget) { var a = box.querySelector('[data-lead]'); if (a) a.href = a.getAttribute('data-base') + '?projekt=' + projekt + (fl ? '&flaeche=' + (Math.round(fl * 10) / 10) : '') + (budget ? '&budget=' + encodeURIComponent(budget) : ''); }
  function setv(name, v) { var e = box.querySelector('[name="' + name + '"]'); if (e && v != null && v !== '') e.value = v; }
  if (q.get('flaeche')) setv('flaeche', q.get('flaeche'));
  if (q.get('umfang')) setv('umfang', q.get('umfang'));

  var calc = {
    area: function () {
      var tot = 0, wf = 0, per = 0, h = n('hoehe', 2.5);
      box.querySelectorAll('.rrow').forEach(function (r) {
        var l = parseFloat((r.querySelector('[data-l]').value || '').replace(',', '.')) || 0, b = parseFloat((r.querySelector('[data-b]').value || '').replace(',', '.')) || 0, f = parseFloat(r.querySelector('[data-f]').value) || 1;
        tot += l * b; wf += l * b * f; per += (l && b) ? 2 * (l + b) : 0;
      });
      o('total', nf(tot, 2) + ' m²'); o('wf', nf(wf, 2) + ' m²'); o('per', nf(per, 2) + ' m'); o('wall', nf(per * h, 1) + ' m²');
      lead('innenarchitekt', wf);
    },
    paint: function () {
      var L = n('laenge'), B = n('breite'), H = n('hoehe', 2.5), U = n('umfang') || 2 * (L + B);
      var wall = Math.max(0, U * H - n('tueren') * 1.8 - n('fenster') * 1.6), ceil = n('decke') ? (L * B || (U / 4) * (U / 4)) : 0, area = wall + ceil;
      var coats = n('anstriche', 2), yieldv = n('ergiebigkeit', 7), litres = area * coats / yieldv * 1.1;
      var best = null;
      for (var a = 0; a <= Math.ceil(litres / 10) + 1; a++) for (var b = 0; b < 2; b++) for (var c = 0; c < 2; c++) for (var d = 0; d < 3; d++) {
        var tl = a * 10 + b * 5 + c * 2.5 + d; if (tl + 1e-9 < litres) continue;
        if (!best || tl < best.t - 1e-9 || (Math.abs(tl - best.t) < 1e-9 && a + b + c + d < best.n)) best = { t: tl, n: a + b + c + d, p: [[10, a], [5, b], [2.5, c], [1, d]] };
      }
      var buy = best ? best.t : 0, packs = best ? best.p.filter(function (x) { return x[1]; }).map(function (x) { return x[1] + ' × ' + nf(x[0], x[0] % 1 ? 1 : 0) + ' l'; }).join(' + ') || '–' : '–';
      o('area', nf(area, 1) + ' m²'); o('wall', nf(wall, 1) + ' m²'); o('ceil', nf(ceil, 1) + ' m²'); o('litres', nf(litres, 1) + ' l'); o('packs', packs);
      o('mat', eur(buy * n('preis', 8) + (area > 0 ? 25 : 0))); o('pro', eur(wall * 8 + ceil * 10) + ' – ' + eur(wall * 15 + ceil * 18));
      lead('maler', L * B || 0);
    },
    floor: function () {
      var A = n('flaeche') || n('laenge') * n('breite'), vs = n('muster', 7) / 100, buyA = A * (1 + vs), pk = n('paket', 2.22), packs = pk ? Math.ceil(buyA / pk) : 0;
      var U = n('umfang') || (A ? 4 * Math.sqrt(A) : 0), sock = Math.max(0, U - n('tueren', 1) * .9) * 1.1, typ = s('belag'), R = { laminat: [15, 30], vinyl: [18, 35], parkett: [25, 60], teppich: [10, 25], fliesen: [35, 85] }[typ] || [15, 30];
      o('buy', nf(packs * pk, 2) + ' m²'); o('packs', packs + ' Pakete'); o('mat', eur(packs * pk * n('preis', 20))); o('sock', nf(sock, 1) + ' m (' + Math.ceil(sock / 2.4) + ' Leisten à 2,40 m)');
      o('tritt', typ === 'fliesen' ? 'nicht nötig' : nf(A * 1.05, 1) + ' m²'); o('pro', eur(A * R[0]) + ' – ' + eur(A * R[1])); o('a', nf(A, 2) + ' m²');
      lead('boden', A);
    },
    wallpaper: function () {
      var U = n('umfang') || 2 * (n('laenge') + n('breite')), H = n('hoehe', 2.5), rl = n('rollenlaenge', 10.05), rb = n('rollenbreite', .53), rp = n('rapport', 0) / 100;
      var eff = Math.max(0, U - n('tueren') * .45 - n('fenster') * .6), strips = rb ? Math.ceil(eff / rb) : 0, per = Math.max(1, Math.floor(rl / (H + rp + .05))), rolls = Math.ceil(strips / per) + (n('reserve') ? 1 : 0);
      o('strips', strips + ' Bahnen'); o('per', per + ' Bahnen pro Rolle'); o('rolls', rolls + ' Rollen'); o('kleister', Math.max(1, Math.ceil(rolls / 5)) + ' Paket(e)'); o('mat', eur(rolls * n('preis', 15))); o('pro', eur(U * H * 15) + ' – ' + eur(U * H * 30));
      lead('maler', 0);
    },
    tiles: function () {
      var A = n('flaeche') || n('laenge') * n('breite'), tl = n('fl', 60) * 10, tb = n('fb', 30) * 10, fu = n('fuge', 3), vs = n('verschnitt', 10) / 100, th = n('dicke', 8);
      var per = (tl + fu) * (tb + fu) / 1e6, cnt = per ? Math.ceil(A * (1 + vs) / per) : 0, buyA = A * (1 + vs), pk = n('paket', 1.44), packs = pk ? Math.ceil(buyA / pk) : 0;
      var glue = A * n('zahnung', 3.2), grout = tl && tb ? (tl + tb) / (tl * tb) * fu * th * 1.6 * A : 0;
      o('cnt', nf(cnt) + ' Fliesen'); o('buy', nf(packs * pk, 2) + ' m² (' + packs + ' Pakete)'); o('glue', nf(glue, 1) + ' kg (' + Math.ceil(glue / 25) + ' × 25-kg-Sack)'); o('grout', nf(grout, 1) + ' kg'); o('mat', eur(packs * pk * n('preis', 30) + Math.ceil(glue / 25) * 25 + Math.ceil(grout / 5) * 15)); o('pro', eur(A * 45) + ' – ' + eur(A * 110));
      lead('fliesen', A);
    },
    cost: function () {
      var A = n('flaeche'), wallA = A * 2.5, reg = n('region', 1), diy = s('ausfuehrung') === 'diy', lo = 0, hi = 0, rows = '';
      box.querySelectorAll('[data-work]:checked').forEach(function (c) {
        var r = c.getAttribute('data-work').split(','), base = c.getAttribute('data-base'), qty = base === 'wall' ? wallA : base === 'stk' ? n('tueren_anzahl', 1) : base === 'bad' ? n('badflaeche', 6) : A;
        var l = qty * +r[0] * reg, h = qty * +r[1] * reg; if (diy) { l *= .35; h *= .45; }
        lo += l; hi += h; rows += '<dt>' + c.getAttribute('data-name') + '</dt><dd>' + eur(l) + ' – ' + eur(h) + '</dd>';
      });
      o('rows', rows || '<dt>Bitte Arbeiten auswählen</dt><dd></dd>'); o('range', lo ? eur(lo) + ' – ' + eur(hi) : '–'); o('mid', lo ? 'Mittelwert ca. ' + eur((lo + hi) / 2) : '');
      var bud = hi < 5000 ? 'unter 5.000 €' : hi < 15000 ? '5.000–15.000 €' : hi < 50000 ? '15.000–50.000 €' : 'über 50.000 €';
      lead('renovierung', A, lo ? bud : '');
    },
    fit: function () {
      var d = [n('m_l'), n('m_h'), n('m_t')].sort(function (a, b) { return a - b; }), dw = n('t_b'), dh = n('t_h'), diag = n('m_diag'), a = n('f_a'), b = n('f_b'), res = [], ok = true, tol = 2;
      if (!d[0] || !dw || !dh) { o('verdict', '–'); o('detail', 'Bitte Maße eingeben.'); return; }
      var door = (d[0] + tol <= dw && d[1] + tol <= dh) || (d[0] + tol <= dh && d[1] + tol <= dw);
      if (door) res.push('✓ <b>Tür:</b> passt hochkant/flach mit dem Querschnitt ' + d[0] + ' × ' + d[1] + ' cm (Tür ' + dw + ' × ' + dh + ' cm).');
      else if (diag && diag + tol <= dw && d[1] + tol <= dh) { door = true; res.push('✓ <b>Tür:</b> passt gekippt – die Diagonaltiefe von ' + diag + ' cm ist kleiner als die Türbreite.'); }
      else { ok = false; res.push('✗ <b>Tür:</b> zu eng. Querschnitt ' + d[0] + ' × ' + d[1] + ' cm, Tür nur ' + dw + ' × ' + dh + ' cm. Tipp: Türblatt aushängen bringt meist 3–5 cm, Füße/Lehnen abschrauben.'); }
      if (a && b) {
        var w = d[0], best = 1e9;
        for (var t = .01; t < Math.PI / 2; t += .002) { var L = a / Math.sin(t) + b / Math.cos(t) - w / (Math.sin(t) * Math.cos(t)); if (L < best) best = L; }
        if (w >= Math.min(a, b)) { ok = false; res.push('✗ <b>Flur-Ecke:</b> das Möbel ist mit ' + w + ' cm breiter als der Flur.'); }
        else if (d[2] <= best - tol) res.push('✓ <b>Flur-Ecke:</b> waagerecht getragen passen bis ca. ' + nf(best) + ' cm Länge um die Ecke – Ihr Möbel hat ' + d[2] + ' cm.');
        else { res.push('⚠ <b>Flur-Ecke:</b> waagerecht passen nur ca. ' + nf(Math.max(0, best)) + ' cm um die Ecke, Ihr Möbel hat ' + d[2] + ' cm. Hochkant anheben kann helfen, wenn die Deckenhöhe es zulässt.'); ok = ok && false; }
      }
      o('verdict', ok ? '<span style="color:#7ee2a8">Passt ✓</span>' : '<span style="color:#ffb08f">Wird eng ✗</span>'); o('detail', res.join('<br><br>'));
    }
  };
  var fn = calc[type];
  function run() { try { fn(); } catch (e) { } }
  box.addEventListener('input', run); box.addEventListener('change', run);
  var add = box.querySelector('[data-add-row]');
  if (add) add.addEventListener('click', function () { var r = box.querySelector('.rrow').cloneNode(true); r.querySelectorAll('input').forEach(function (i) { i.value = ''; }); r.querySelector('[data-name]').value = 'Raum ' + (box.querySelectorAll('.rrow').length + 1); box.querySelector('.rows').appendChild(r); run(); });
  box.addEventListener('click', function (e) { if (e.target.closest('.x') && box.querySelectorAll('.rrow').length > 1) { e.target.closest('.rrow').remove(); run(); } });
  run();
})();
