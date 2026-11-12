/* Raumplaner.com – Möbelkatalog, Symbole & Vorlagen (shared) */
(function (G) {
  'use strict';
  var CATS = [
    ['wohnen', 'Wohnen'], ['schlafen', 'Schlafen'], ['essen', 'Essen'], ['kueche', 'Küche'],
    ['bad', 'Bad'], ['buero', 'Büro'], ['kinder', 'Kinder'], ['bau', 'Türen, Fenster & Bau']
  ];
  // id, name, cat, w, d, h, color, kind, flags (o = opening, n = no clash)
  var RAW = [
    ['sofa3', '3-Sitzer-Sofa', 'wohnen', 220, 95, 85, '#8fa3b8', 'sofa'],
    ['sofa2', '2-Sitzer-Sofa', 'wohnen', 160, 90, 85, '#8fa3b8', 'sofa'],
    ['sofal', 'Ecksofa (L-Form)', 'wohnen', 260, 200, 85, '#8fa3b8', 'sofaL'],
    ['armchair', 'Sessel', 'wohnen', 85, 85, 90, '#c7a27c', 'armchair'],
    ['coffeetable', 'Couchtisch', 'wohnen', 110, 60, 42, '#b9936c', 'table'],
    ['coffeeround', 'Couchtisch rund', 'wohnen', 80, 80, 42, '#b9936c', 'round'],
    ['tvboard', 'TV-Lowboard', 'wohnen', 180, 45, 50, '#d8cbb8', 'sideboard'],
    ['tv', 'Fernseher (Wand)', 'wohnen', 145, 8, 85, '#2b2f36', 'tv', 'n'],
    ['shelf', 'Regal', 'wohnen', 100, 35, 200, '#d9c7a7', 'shelf'],
    ['bookcase', 'Bücherregal', 'wohnen', 80, 30, 200, '#cdb68f', 'shelf'],
    ['sideboard', 'Sideboard', 'wohnen', 160, 45, 80, '#d8cbb8', 'sideboard'],
    ['rug', 'Teppich 160×230', 'wohnen', 230, 160, 1, '#d9b8a3', 'rug', 'n'],
    ['plant', 'Zimmerpflanze', 'wohnen', 50, 50, 120, '#6c9a6b', 'plant'],
    ['floorlamp', 'Stehlampe', 'wohnen', 40, 40, 170, '#f2d27a', 'lamp'],
    ['fireplace', 'Kamin', 'wohnen', 120, 50, 100, '#9b8b7a', 'fireplace'],
    ['piano', 'Klavier', 'wohnen', 150, 60, 125, '#3a3330', 'sideboard'],
    ['bed90', 'Einzelbett 90×200', 'schlafen', 95, 205, 45, '#e3d5c3', 'bed'],
    ['bed140', 'Bett 140×200', 'schlafen', 145, 205, 45, '#e3d5c3', 'bed'],
    ['bed160', 'Doppelbett 160×200', 'schlafen', 165, 205, 45, '#e3d5c3', 'bed'],
    ['bed180', 'Doppelbett 180×200', 'schlafen', 185, 205, 45, '#e3d5c3', 'bed'],
    ['bed200', 'Doppelbett 200×200', 'schlafen', 205, 205, 45, '#e3d5c3', 'bed'],
    ['nightstand', 'Nachttisch', 'schlafen', 45, 40, 55, '#c9ae8a', 'sideboard'],
    ['wardrobe2', 'Kleiderschrank 2-türig', 'schlafen', 100, 60, 200, '#ddd3c4', 'wardrobe'],
    ['wardrobe3', 'Kleiderschrank 3-türig', 'schlafen', 150, 60, 220, '#ddd3c4', 'wardrobe'],
    ['wardrobeslide', 'Schwebetürenschrank', 'schlafen', 200, 65, 220, '#ddd3c4', 'wardrobe'],
    ['dresser', 'Kommode', 'schlafen', 120, 50, 85, '#c9ae8a', 'sideboard'],
    ['vanity', 'Schminktisch', 'schlafen', 100, 45, 75, '#e7d9c9', 'desk'],
    ['dining4', 'Esstisch mit 4 Stühlen', 'essen', 140, 190, 75, '#b9936c', 'dining'],
    ['dining6', 'Esstisch mit 6 Stühlen', 'essen', 190, 190, 75, '#b9936c', 'dining'],
    ['roundtable', 'Esstisch rund', 'essen', 110, 110, 75, '#b9936c', 'round'],
    ['chair', 'Stuhl', 'essen', 45, 50, 90, '#a77f5c', 'chair'],
    ['bench', 'Sitzbank', 'essen', 140, 40, 45, '#a77f5c', 'table'],
    ['kitchenrow', 'Küchenzeile 270 cm', 'kueche', 270, 60, 90, '#eef0f2', 'kitchen'],
    ['counter60', 'Unterschrank 60', 'kueche', 60, 60, 90, '#eef0f2', 'counter'],
    ['counter120', 'Arbeitsplatte 120', 'kueche', 120, 60, 90, '#eef0f2', 'counter'],
    ['sinkunit', 'Spüle', 'kueche', 80, 60, 90, '#eef0f2', 'sink'],
    ['stove', 'Herd / Kochfeld', 'kueche', 60, 60, 90, '#eef0f2', 'stove'],
    ['fridge', 'Kühlschrank', 'kueche', 60, 65, 185, '#f6f7f8', 'fridge'],
    ['dishwasher', 'Geschirrspüler', 'kueche', 60, 60, 85, '#f6f7f8', 'dish'],
    ['island', 'Kochinsel', 'kueche', 180, 90, 90, '#eef0f2', 'counter'],
    ['toilet', 'WC', 'bad', 40, 60, 40, '#ffffff', 'toilet'],
    ['basin', 'Waschtisch', 'bad', 60, 45, 85, '#ffffff', 'basin'],
    ['doublebasin', 'Doppelwaschtisch', 'bad', 120, 50, 85, '#ffffff', 'basin2'],
    ['bathtub', 'Badewanne', 'bad', 170, 75, 60, '#ffffff', 'tub'],
    ['shower', 'Dusche 90×90', 'bad', 90, 90, 200, '#e6f0f6', 'shower'],
    ['shower120', 'Dusche 120×90', 'bad', 120, 90, 200, '#e6f0f6', 'shower'],
    ['washer', 'Waschmaschine', 'bad', 60, 60, 85, '#f6f7f8', 'washer'],
    ['bathcab', 'Hochschrank Bad', 'bad', 40, 35, 180, '#e9e4dc', 'shelf'],
    ['desk', 'Schreibtisch 160', 'buero', 160, 80, 75, '#d8c3a5', 'desk'],
    ['desksmall', 'Schreibtisch 120', 'buero', 120, 60, 75, '#d8c3a5', 'desk'],
    ['officechair', 'Bürostuhl', 'buero', 60, 60, 110, '#3d4652', 'ochair'],
    ['filecab', 'Rollcontainer', 'buero', 40, 55, 60, '#c3c8cf', 'sideboard'],
    ['crib', 'Babybett', 'kinder', 75, 135, 90, '#f3e6d8', 'bed'],
    ['bunk', 'Hochbett', 'kinder', 100, 210, 160, '#d9c2a0', 'bed'],
    ['changing', 'Wickelkommode', 'kinder', 100, 55, 95, '#f3e6d8', 'sideboard'],
    ['toybox', 'Spielkiste', 'kinder', 70, 40, 45, '#f0b765', 'sideboard'],
    ['playmat', 'Spielteppich', 'kinder', 150, 150, 1, '#b7d3e8', 'rug', 'n'],
    ['door80', 'Tür 80 cm', 'bau', 80, 12, 210, '#ffffff', 'door', 'o'],
    ['door90', 'Tür 90 cm', 'bau', 90, 12, 210, '#ffffff', 'door', 'o'],
    ['doubledoor', 'Doppeltür', 'bau', 140, 12, 210, '#ffffff', 'door2', 'o'],
    ['slidingdoor', 'Schiebetür', 'bau', 100, 12, 210, '#ffffff', 'slide', 'o'],
    ['window100', 'Fenster 100 cm', 'bau', 100, 12, 130, '#dcecf7', 'window', 'o'],
    ['window150', 'Fenster 150 cm', 'bau', 150, 12, 130, '#dcecf7', 'window', 'o'],
    ['balconydoor', 'Balkontür', 'bau', 90, 12, 220, '#dcecf7', 'door', 'o'],
    ['wallpart', 'Wandstück', 'bau', 100, 12, 250, '#5b6472', 'wall'],
    ['column', 'Säule / Pfeiler', 'bau', 30, 30, 250, '#8a929c', 'column'],
    ['stairs', 'Treppe', 'bau', 100, 300, 250, '#e8e2d8', 'stairs'],
    ['radiator', 'Heizkörper', 'bau', 100, 12, 60, '#ffffff', 'radiator', 'n'],
    ['label', 'Textfeld', 'bau', 120, 30, 0, '#ffffff', 'label', 'n']
  ];
  var ITEMS = {};
  RAW.forEach(function (r) {
    ITEMS[r[0]] = { id: r[0], name: r[1], cat: r[2], w: r[3], d: r[4], h: r[5], c: r[6], k: r[7], o: (r[8] || '').indexOf('o') > -1, n: (r[8] || '').indexOf('n') > -1 || (r[8] || '').indexOf('o') > -1 };
  });

  var S = '#3b4656';
  function f(n) { return Math.round(n * 10) / 10; }
  function rc(x, y, w, h, fill, rx, extra) {
    return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(Math.max(w, .5)) + '" height="' + f(Math.max(h, .5)) + '"' + (rx ? ' rx="' + f(rx) + '"' : '') + ' fill="' + fill + '" stroke="' + S + '" stroke-width="1.2" vector-effect="non-scaling-stroke"' + (extra || '') + '/>';
  }
  function ln(x1, y1, x2, y2, col, dash) {
    return '<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '" stroke="' + (col || S) + '" stroke-width="1" vector-effect="non-scaling-stroke"' + (dash ? ' stroke-dasharray="4 3"' : '') + '/>';
  }
  function el(cx, cy, rx, ry, fill) {
    return '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + fill + '" stroke="' + S + '" stroke-width="1.2" vector-effect="non-scaling-stroke"/>';
  }
  function shade(hex, p) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function c(v) { return Math.max(0, Math.min(255, Math.round(v + (p < 0 ? v : 255 - v) * p))); }
    return '#' + ((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b)).toString(16).slice(1);
  }
  function chairsAround(w, d, tw, td, fill) {
    var o = '', n = Math.max(1, Math.round(tw / 62)), cw = 42, cd = 40, gap = tw / n;
    for (var i = 0; i < n; i++) {
      var cx = -tw / 2 + gap * (i + .5);
      o += rc(cx - cw / 2, -d / 2, cw, cd, fill, 6) + ln(cx - cw / 2 + 4, -d / 2 + 5, cx + cw / 2 - 4, -d / 2 + 5);
      o += rc(cx - cw / 2, d / 2 - cd, cw, cd, fill, 6) + ln(cx - cw / 2 + 4, d / 2 - 5, cx + cw / 2 - 4, d / 2 - 5);
    }
    return o;
  }
  /** Draw a symbol in local coordinates centred at 0,0 */
  function symbol(k, w, d, c, label) {
    var x = -w / 2, y = -d / 2, o = '', i, n;
    switch (k) {
      case 'bed':
        o = rc(x, y, w, d, shade(c, -.15), 4) + rc(x + 3, y + 3, w - 6, d - 6, c, 3);
        n = w >= 120 ? 2 : 1;
        for (i = 0; i < n; i++) o += rc(x + 8 + i * (w - 16) / n, y + 10, (w - 16) / n - (n > 1 ? 6 : 0), Math.min(38, d * .18), '#fff', 7);
        o += rc(x + 3, y + d * .33, w - 6, d * .67 - 3, shade(c, .35), 3) + ln(x + 3, y + d * .42, x + w - 3, y + d * .42);
        return o;
      case 'sofa':
      case 'armchair':
        var bd = Math.min(24, d * .26), aw = Math.min(16, w * .12);
        o = rc(x, y, w, d, c, 8) + rc(x, y, w, bd, shade(c, -.18), 6) + rc(x, y, aw, d, shade(c, -.1), 6) + rc(x + w - aw, y, aw, d, shade(c, -.1), 6);
        n = k === 'armchair' ? 1 : (w > 190 ? 3 : 2);
        for (i = 1; i < n; i++) o += ln(x + aw + (w - 2 * aw) * i / n, y + bd, x + aw + (w - 2 * aw) * i / n, y + d - 4);
        return o;
      case 'sofaL':
        var t = 92;
        o = '<path d="M' + f(x) + ' ' + f(y) + 'H' + f(x + w) + 'V' + f(y + d) + 'H' + f(x + w - t) + 'V' + f(y + t) + 'H' + f(x) + 'Z" fill="' + c + '" stroke="' + S + '" stroke-width="1.2" vector-effect="non-scaling-stroke"/>';
        o += rc(x, y, w, 22, shade(c, -.18), 5) + rc(x + w - 22, y, 22, d, shade(c, -.18), 5) + rc(x, y, 14, t, shade(c, -.1), 5) + rc(x + w - t, y + d - 14, t, 14, shade(c, -.1), 5);
        o += ln(x + (w - t) / 2, y + 22, x + (w - t) / 2, y + t) + ln(x + w - t, y + t, x + w - 22, y + t);
        return o;
      case 'table': return rc(x, y, w, d, c, 4) + rc(x + 5, y + 5, w - 10, d - 10, 'none', 3, ' opacity=".35"');
      case 'round': return el(0, 0, w / 2, d / 2, c) + el(0, 0, w / 2 - 6, d / 2 - 6, 'none');
      case 'dining':
        var td = d - 100;
        return chairsAround(w, d, w, td, shade(c, -.12)) + rc(x, -td / 2, w, td, c, 5);
      case 'chair': return rc(x + 2, y + 6, w - 4, d - 6, c, 6) + rc(x, y, w, 9, shade(c, -.2), 4);
      case 'desk': return rc(x, y, w, d, c, 3) + rc(-w * .2, y + 6, w * .4, 5, '#2b2f36', 2) + rc(-w * .17, y + d * .45, w * .34, d * .16, '#f2f2f2', 2);
      case 'ochair': return el(0, 3, w / 2 - 4, d / 2 - 6, c) + rc(x + 8, y, w - 16, 12, shade(c, .25), 6);
      case 'wardrobe':
        o = rc(x, y, w, d, c, 2); n = Math.max(1, Math.round(w / 50));
        for (i = 1; i < n; i++) o += ln(x + w * i / n, y + d - 6, x + w * i / n, y + d);
        o += ln(x, y + d - 6, x + w, y + d - 6) + ln(x + 6, y + d / 2 - 2, x + w - 6, y + d / 2 - 2, '#8b95a3', 1);
        return o;
      case 'shelf':
        o = rc(x, y, w, d, c, 2); n = Math.max(1, Math.round(w / 40));
        for (i = 1; i < n; i++) o += ln(x + w * i / n, y, x + w * i / n, y + d);
        return o;
      case 'sideboard':
        o = rc(x, y, w, d, c, 3) + ln(x + 3, y + d - 5, x + w - 3, y + d - 5); n = Math.max(1, Math.round(w / 45));
        for (i = 1; i < n; i++) o += ln(x + w * i / n, y + d - 5, x + w * i / n, y + d);
        return o;
      case 'tv': return rc(x, y, w, d, c, 2);
      case 'rug': return rc(x, y, w, d, c, 4, ' fill-opacity=".55"') + '<rect x="' + f(x + 8) + '" y="' + f(y + 8) + '" width="' + f(w - 16) + '" height="' + f(d - 16) + '" fill="none" stroke="' + shade(c, -.3) + '" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/>';
      case 'plant':
        o = el(0, 0, w * .28, d * .28, '#9b7653');
        for (i = 0; i < 6; i++) { var a = i * Math.PI / 3; o += el(Math.cos(a) * w * .27, Math.sin(a) * d * .27, w * .2, d * .2, i % 2 ? c : shade(c, .2)); }
        return o;
      case 'lamp': return el(0, 0, w / 2, d / 2, c) + ln(-w / 2, 0, w / 2, 0) + ln(0, -d / 2, 0, d / 2) + el(0, 0, w * .15, d * .15, '#fff');
      case 'fireplace': return rc(x, y, w, d, c, 2) + rc(x + w * .2, y + 4, w * .6, d - 10, '#3a2d26', 3);
      case 'counter': return rc(x, y, w, d, c, 2) + ln(x, y + d - 4, x + w, y + d - 4);
      case 'sink': return rc(x, y, w, d, c, 2) + rc(x + w * .15, y + d * .18, w * .7, d * .6, '#dfe7ee', 8) + el(0, 0, 3, 3, '#9aa6b2');
      case 'stove':
        o = rc(x, y, w, d, c, 2) + rc(x + 4, y + 4, w - 8, d - 8, '#2b2f36', 4);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) { o += el(p[0] * w * .2, p[1] * d * .2, w * .13, d * .13, '#555c66'); });
        return o;
      case 'fridge': return rc(x, y, w, d, c, 3) + ln(x, y + d - 6, x + w, y + d - 6) + rc(x + w * .7, y + d - 5, w * .2, 3, '#9aa6b2', 1);
      case 'dish': return rc(x, y, w, d, c, 3) + rc(x + 6, y + 6, w - 12, d - 16, 'none', 3);
      case 'kitchen':
        o = rc(x, y, w, d, c, 2) + ln(x, y + d - 4, x + w, y + d - 4);
        o += rc(x + w * .12, y + d * .18, 65, d * .58, '#dfe7ee', 8);
        var sx = x + w * .62;
        o += rc(sx, y + 6, 60, d - 14, '#2b2f36', 4) + el(sx + 18, y + 20, 8, 8, '#555c66') + el(sx + 42, y + 20, 8, 8, '#555c66') + el(sx + 18, y + d - 22, 8, 8, '#555c66') + el(sx + 42, y + d - 22, 8, 8, '#555c66');
        return o;
      case 'toilet': return rc(x, y, w, d * .3, c, 4) + el(0, y + d * .62, w * .45, d * .38, c) + el(0, y + d * .64, w * .28, d * .24, '#e7eef3');
      case 'basin': return rc(x, y, w, d, c, 4) + el(0, d * .06, w * .34, d * .3, '#e7eef3');
      case 'basin2': return rc(x, y, w, d, c, 4) + el(-w / 4, d * .06, w * .17, d * .3, '#e7eef3') + el(w / 4, d * .06, w * .17, d * .3, '#e7eef3');
      case 'tub': return rc(x, y, w, d, c, 10) + rc(x + 8, y + 8, w - 16, d - 16, '#e7eef3', 22) + el(x + w - 22, 0, 4, 4, '#9aa6b2');
      case 'shower': return rc(x, y, w, d, c, 2) + ln(x, y, x + w, y + d, '#9fb6c8') + ln(x + w, y, x, y + d, '#9fb6c8') + el(0, 0, 5, 5, '#9aa6b2');
      case 'washer': return rc(x, y, w, d, c, 4) + el(0, 2, w * .32, d * .32, '#dfe7ee') + el(0, 2, w * .2, d * .2, '#c3cfda');
      case 'column': return rc(x, y, w, d, c, 0) + ln(x, y, x + w, y + d, '#fff') + ln(x + w, y, x, y + d, '#fff');
      case 'wall': return rc(x, y, w, d, c, 0);
      case 'radiator':
        o = rc(x, y, w, d, c, 1); n = Math.max(2, Math.round(w / 8));
        for (i = 1; i < n; i++) o += ln(x + w * i / n, y, x + w * i / n, y + d, '#9aa6b2');
        return o;
      case 'stairs':
        o = rc(x, y, w, d, c, 0); n = Math.max(3, Math.round(d / 27));
        for (i = 1; i < n; i++) o += ln(x, y + d * i / n, x + w, y + d * i / n);
        o += ln(0, y + d - 10, 0, y + 14, '#e0673a') + '<path d="M' + f(-8) + ' ' + f(y + 26) + 'L0 ' + f(y + 12) + 'L8 ' + f(y + 26) + '" fill="none" stroke="#e0673a" vector-effect="non-scaling-stroke"/>';
        return o;
      case 'door':
        return '<rect x="' + f(x) + '" y="' + f(-d - 2) + '" width="' + f(w) + '" height="' + f(d + 4) + '" fill="#fff"/>' + ln(x, -d, x, 0) + ln(x + w, -d, x + w, 0) +
          ln(x, 0, x, w) + '<path d="M' + f(x + w) + ' 0A' + f(w) + ' ' + f(w) + ' 0 0 1 ' + f(x) + ' ' + f(w) + '" fill="none" stroke="#8b95a3" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>';
      case 'door2':
        var h2 = w / 2;
        return '<rect x="' + f(x) + '" y="' + f(-d - 2) + '" width="' + f(w) + '" height="' + f(d + 4) + '" fill="#fff"/>' + ln(x, -d, x, 0) + ln(x + w, -d, x + w, 0) + ln(x, 0, x, h2) + ln(x + w, 0, x + w, h2) +
          '<path d="M0 0A' + f(h2) + ' ' + f(h2) + ' 0 0 1 ' + f(x) + ' ' + f(h2) + 'M0 0A' + f(h2) + ' ' + f(h2) + ' 0 0 0 ' + f(x + w) + ' ' + f(h2) + '" fill="none" stroke="#8b95a3" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>';
      case 'slide':
        return '<rect x="' + f(x) + '" y="' + f(-d - 2) + '" width="' + f(w) + '" height="' + f(d + 4) + '" fill="#fff"/>' + ln(x, -d, x, 0) + ln(x + w, -d, x + w, 0) + rc(x, -d * .5 + 1, w * .55, 4, '#cfd6de', 1) + rc(x + w * .45, -d * .5 - 5, w * .55, 4, '#cfd6de', 1);
      case 'window':
        return rc(x, -d - 1, w, d + 2, c, 0) + ln(x, -d * .65, x + w, -d * .65) + ln(x, -d * .35, x + w, -d * .35) + ln(0, -d, 0, 0);
      case 'label':
        return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(d) + '" fill="#fff" fill-opacity=".7" stroke="#c9ced6" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/><text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-size="' + f(Math.min(d * .6, w / Math.max(4, (label || 'Text').length) * 1.7)) + '" font-family="Inter,sans-serif" fill="#16202e">' + esc(label || 'Text') + '</text>';
      default: return rc(x, y, w, d, c, 3);
    }
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }

  function area(pts) { var a = 0; for (var i = 0; i < pts.length; i++) { var p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a / 2); }
  function centroid(pts) {
    var a = 0, cx = 0, cy = 0;
    for (var i = 0; i < pts.length; i++) { var p = pts[i], q = pts[(i + 1) % pts.length], cr = p[0] * q[1] - q[0] * p[1]; a += cr; cx += (p[0] + q[0]) * cr; cy += (p[1] + q[1]) * cr; }
    if (!a) return [pts[0][0], pts[0][1]];
    return [cx / (3 * a), cy / (3 * a)];
  }
  function bounds(plan) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    plan.rooms.forEach(function (r) { r.pts.forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }); });
    plan.items.forEach(function (it) { var m = Math.max(it.w, it.d) / 2; x0 = Math.min(x0, it.x - m); y0 = Math.min(y0, it.y - m); x1 = Math.max(x1, it.x + m); y1 = Math.max(y1, it.y + m); });
    if (x0 > x1) { x0 = 0; y0 = 0; x1 = 400; y1 = 300; }
    return [x0, y0, x1, y1];
  }
  function itemSVG(it) {
    var def = ITEMS[it.t] || {}, sx = it.f ? -1 : 1, sy = it.s ? -1 : 1;
    return '<g transform="translate(' + f(it.x) + ' ' + f(it.y) + ') rotate(' + f(it.r || 0) + ')' + (sx < 0 || sy < 0 ? ' scale(' + sx + ' ' + sy + ')' : '') + '">' + symbol(def.k || 'box', it.w, it.d, it.c || def.c || '#ddd', it.label) + '</g>';
  }
  function pts(r) { return r.pts.map(function (p) { return f(p[0]) + ',' + f(p[1]); }).join(' '); }
  function roomsSVG(rooms) {
    return rooms.map(function (r) { return '<polygon points="' + pts(r) + '" fill="#2a3340" stroke="#2a3340" stroke-width="24" stroke-linejoin="miter"/>'; }).join('') +
      rooms.map(function (r) { return '<polygon points="' + pts(r) + '" fill="' + (r.floor || '#efe3cf') + '"/>'; }).join('') +
      rooms.map(function (r) { return '<polygon points="' + pts(r) + '" fill="none" stroke="#2a3340" stroke-width="1.5" vector-effect="non-scaling-stroke"/>'; }).join('');
  }
  /** Static SVG of a plan (thumbnails, export) */
  function planSVG(plan, opt) {
    opt = opt || {};
    var b = bounds(plan), pad = opt.pad == null ? 30 : opt.pad, vb = [b[0] - pad, b[1] - pad, b[2] - b[0] + 2 * pad, b[3] - b[1] + 2 * pad];
    var openings = '', furn = '', labels = '';
    plan.items.forEach(function (it) { var d = ITEMS[it.t] || {}; if (d.o) openings += itemSVG(it); else furn += itemSVG(it); });
    if (opt.labels) plan.rooms.forEach(function (r) {
      var c = centroid(r.pts), fs = Math.max(14, Math.min(28, vb[2] / 30));
      labels += '<text x="' + f(c[0]) + '" y="' + f(c[1]) + '" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600" font-size="' + f(fs) + '" fill="#16202e" paint-order="stroke" stroke="#fff" stroke-width="4">' + esc(r.name || '') + '</text><text x="' + f(c[0]) + '" y="' + f(c[1] + fs * 1.2) + '" text-anchor="middle" font-family="Inter,sans-serif" font-size="' + f(fs * .85) + '" fill="#5a6372" paint-order="stroke" stroke="#fff" stroke-width="4">' + (area(r.pts) / 10000).toFixed(1).replace('.', ',') + ' m²</text>';
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb.map(f).join(' ') + '"' + (opt.attrs || '') + '>' + (opt.bg ? '<rect x="' + f(vb[0]) + '" y="' + f(vb[1]) + '" width="' + f(vb[2]) + '" height="' + f(vb[3]) + '" fill="' + opt.bg + '"/>' : '') +
      roomsSVG(plan.rooms) + furn + openings + labels + '</svg>';
  }

  // ---------- Templates ----------
  var WOOD = '#ead9bd', TILE = '#e3e7eb', LAM = '#efe3cf', CARP = '#e9e2d6';
  function R(name, x, y, w, h, floor) { return { name: name, floor: floor || LAM, pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] }; }
  function I(t, x, y, r, w, d) { var def = ITEMS[t]; return { t: t, x: x, y: y, r: r || 0, w: w || def.w, d: d || def.d, h: def.h, c: def.c }; }
  function T(id, name, cat, desc, rooms, items) { return { id: id, name: name, cat: cat, desc: desc, plan: { v: 1, name: name, rooms: rooms, items: items, dims: [] } }; }
  var TEMPLATES = [
    T('wohnzimmer-20qm', 'Wohnzimmer 20 m²', 'Wohnzimmer', 'Klassische Sofa-TV-Achse mit Leseecke, Teppich und Stauraum.', [R('Wohnzimmer', 0, 0, 500, 400, WOOD)], [
      I('window150', 250, 0), I('door90', 420, 400, 180), I('rug', 210, 200, 0), I('sofa3', 52.5, 200, 270), I('coffeetable', 200, 200, 90),
      I('tvboard', 477.5, 200, 90), I('tv', 496, 200, 90), I('armchair', 230, 345, 180), I('plant', 35, 35), I('floorlamp', 30, 360), I('shelf', 400, 17.5)]),
    T('schlafzimmer-14qm', 'Schlafzimmer 14 m²', 'Schlafzimmer', 'Doppelbett 180×200 mit beidseitigem Zugang und 3-türigem Schrank.', [R('Schlafzimmer', 0, 0, 400, 350, CARP)], [
      I('window100', 200, 0), I('door80', 60, 350, 180), I('bed180', 297.5, 175, 90), I('nightstand', 380, 57.5, 90), I('nightstand', 380, 292.5, 90),
      I('wardrobe3', 30, 175, 270), I('dresser', 210, 25), I('plant', 170, 320)]),
    T('homeoffice-9qm', 'Homeoffice 9 m²', 'Arbeitszimmer', 'Schreibtisch am Fenster, Stauraum an der Wand, Sessel für Calls.', [R('Arbeitszimmer', 0, 0, 300, 300, LAM)], [
      I('window100', 150, 0), I('door80', 240, 300, 180), I('desk', 150, 40), I('officechair', 150, 110, 180), I('shelf', 17.5, 180, 270),
      I('filecab', 255, 30), I('armchair', 240, 170, 90), I('floorlamp', 275, 105)]),
    T('kinderzimmer-11qm', 'Kinderzimmer 11 m²', 'Kinderzimmer', 'Bett in der Ecke, Schreibtisch am Licht, freie Spielfläche in der Mitte.', [R('Kinderzimmer', 0, 0, 350, 320, CARP)], [
      I('window100', 175, 0), I('door80', 290, 320, 180), I('bed90', 50, 105), I('desksmall', 190, 30), I('chair', 190, 88, 180),
      I('wardrobe2', 320, 100, 90), I('playmat', 180, 215), I('toybox', 50, 290, 180)]),
    T('kueche-l-form', 'Küche L-Form 10 m²', 'Küche', 'Küchenzeile am Fenster, Kühlschrank und Arbeitsfläche über Eck, runder Esstisch.', [R('Küche', 0, 0, 350, 300, TILE)], [
      I('window100', 175, 0), I('door80', 350, 240, 90), I('kitchenrow', 135, 30), I('fridge', 32.5, 92.5, 270), I('counter120', 30, 185, 270),
      I('roundtable', 220, 185, 0, 100, 100), I('chair', 220, 108), I('chair', 220, 262, 180)]),
    T('badezimmer-6qm', 'Badezimmer 6 m²', 'Bad', 'Wanne, WC und Waschtisch mit ausreichend Bewegungsfläche.', [R('Bad', 0, 0, 220, 280, TILE)], [
      I('door80', 170, 280, 180), I('bathtub', 85, 37.5), I('toilet', 190, 150, 90), I('basin', 22.5, 150, 270), I('washer', 30, 235, 270)]),
    T('apartment-35qm', '1-Zimmer-Apartment 35 m²', 'Wohnung', 'Schlafen, Wohnen, Essen und Kochen in einem Raum plus Bad und Flur.', [
      R('Wohnen & Schlafen', 0, 0, 450, 500, WOOD), R('Bad', 450, 0, 180, 220, TILE), R('Flur', 450, 220, 180, 280, LAM)], [
      I('door90', 540, 500, 180), I('door80', 450, 460, 90), I('door80', 540, 220, 180), I('window150', 300, 0),
      I('bed160', 110, 102.5), I('nightstand', 215, 20), I('sofa2', 45, 380, 270), I('coffeetable', 150, 380, 90), I('tvboard', 270, 380, 90),
      I('kitchenrow', 420, 125, 90, 240), I('roundtable', 340, 240, 0, 90, 90), I('toilet', 600, 70, 90), I('shower', 495, 45), I('basin', 607.5, 150, 90), I('shelf', 467.5, 400, 270)]),
    T('wohnung-2-zimmer', '2-Zimmer-Wohnung 47 m²', 'Wohnung', 'Wohnküche, Schlafzimmer, Bad und Flur – ideal als Startpunkt für die eigene Wohnung.', [
      R('Wohnküche', 0, 0, 500, 450, WOOD), R('Schlafzimmer', 500, 0, 400, 350, CARP), R('Flur', 500, 350, 180, 250, LAM), R('Bad', 680, 350, 220, 250, TILE)], [
      I('window150', 250, 0), I('window100', 700, 0), I('window100', 0, 225, 90), I('door90', 590, 600, 180), I('door80', 500, 300, 270), I('door80', 500, 400, 90), I('door80', 680, 540, 270),
      I('sofa3', 120, 402.5, 180), I('coffeetable', 120, 300), I('tvboard', 100, 22.5), I('kitchenrow', 470, 125, 90, 240), I('roundtable', 330, 180),
      I('bed160', 797.5, 175, 90), I('wardrobe3', 530, 130, 270), I('nightstand', 880, 70, 90), I('shower', 725, 395), I('toilet', 870, 420, 90), I('basin', 877.5, 500, 90), I('shelf', 517.5, 520, 270)]),
    T('esszimmer-14qm', 'Esszimmer 14 m²', 'Esszimmer', 'Esstisch für sechs Personen mit 90 cm Abstand zu Wand und Sideboard.', [R('Esszimmer', 0, 0, 400, 350, WOOD)], [
      I('window150', 0, 175, 90), I('door90', 330, 350, 180), I('dining6', 200, 185), I('sideboard', 200, 22.5), I('plant', 360, 40), I('floorlamp', 365, 290)])
  ];
  TEMPLATES.forEach(function (t) { t.plan.rooms.forEach(function (r, i) { r.id = 'r' + i; }); t.plan.items.forEach(function (it, i) { it.id = 'i' + i; }); });

  G.RP = { CATS: CATS, ITEMS: ITEMS, symbol: symbol, itemSVG: itemSVG, planSVG: planSVG, area: area, centroid: centroid, bounds: bounds, TEMPLATES: TEMPLATES, esc: esc, shade: shade, roomsSVG: roomsSVG };
})(window);
