/* Raumplaner.com – Site-Skripte */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); }, $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  /* Konfiguration – hier anpassen */
  var CFG = window.RP_CFG = {
    paypalHostedButtonId: '',            // PayPal „Spenden“-Button-ID eintragen, um Direktzahlung zu aktivieren
    supportGoal: 500, supportRaised: 0,  // Monatsziel / bereits erreicht (EUR)
    supporters: [],                      // z. B. ['Anna K.', 'Studio Nord']
    prizes: ['150 € Einrichtungsgutschein', '75 € Einrichtungsgutschein', '25 € Gutschein + Vorstellung auf der Startseite']
  };
  function ep() { var a = [116, 118, 106, 53, 115, 112, 104, 116, 110, 71, 56, 104, 122, 114, 121, 118, 126, 105, 108, 126]; return 'https://formsubmit.co/ajax/' + a.map(function (n) { return String.fromCharCode(n - 7); }).reverse().join(''); }

  // Navigation
  var bg = $('.burger'); if (bg) bg.addEventListener('click', function () { var n = $('.nav'); n.classList.toggle('open'); bg.setAttribute('aria-expanded', n.classList.contains('open')); });
  $$('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });
  $$('[data-cmp]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); if (window.googlefc && googlefc.showRevocationMessage) { googlefc.callbackQueue = googlefc.callbackQueue || []; googlefc.callbackQueue.push(googlefc.showRevocationMessage); } else alert('Die Cookie-Einstellungen werden über das Einwilligungsbanner von Google verwaltet. Sie können Cookies außerdem jederzeit in Ihrem Browser löschen.'); }); });

  // Formulare
  function send(form, extra) {
    var msg = $('.msg', form) || form.parentNode.querySelector('.msg'), btn = $('button[type=submit]', form);
    if (form._hp && form._hp.value) return Promise.resolve(true);
    var data = {}; new FormData(form).forEach(function (v, k) { if (k === '_hp' || v === '') return; data[k] = data[k] ? data[k] + ', ' + v : v; });
    Object.assign(data, { _subject: (form.getAttribute('data-subject') || 'Anfrage') + ' – Raumplaner.com', _template: 'table', _captcha: 'false', Seite: location.href.split('#')[0] }, extra || {});
    if (btn) { btn.disabled = true; btn._t = btn.textContent; btn.textContent = 'Wird gesendet …'; }
    return fetch(ep(), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json(); }).then(function (j) { if (String(j.success) !== 'true') throw j; return true; })
      .catch(function () { if (msg) { msg.className = 'msg err'; msg.textContent = 'Das hat leider nicht geklappt. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es in einem Moment erneut.'; } return false; })
      .finally(function () { if (btn) { btn.disabled = false; btn.textContent = btn._t; } });
  }
  $$('form[data-form]').forEach(function (form) {
    if (form.id === 'lead') return;
    form.addEventListener('submit', function (e) {
      e.preventDefault(); if (!form.reportValidity()) return;
      send(form).then(function (ok) {
        if (!ok) return; var msg = $('.msg', form) || form.parentNode.querySelector('.msg');
        if (msg) { msg.className = 'msg ok'; msg.textContent = form.getAttribute('data-ok') || 'Vielen Dank! Ihre Nachricht ist angekommen. Wir melden uns in der Regel innerhalb von 1–2 Werktagen.'; }
        form.reset(); prefill();
      });
    });
  });

  // Lead-Assistent
  var lead = $('#lead');
  if (lead) {
    var steps = $$('.wiz-step', lead), bars = $$('.wiz-prog i'), cur = 0;
    var show = function (i) { cur = i; steps.forEach(function (s, k) { s.classList.toggle('on', k === i); }); bars.forEach(function (b, k) { b.classList.toggle('on', k <= i); }); var t = lead.getBoundingClientRect().top; if (t < 0) window.scrollBy(0, t - 90); };
    var valid = function (i) { var ok = true; $$('input,select,textarea', steps[i]).forEach(function (f) { if (ok && !f.checkValidity()) { f.reportValidity(); ok = false; } }); return ok; };
    lead.addEventListener('click', function (e) {
      if (e.target.closest('[data-next]')) { e.preventDefault(); if (valid(cur)) show(Math.min(cur + 1, steps.length - 1)); }
      if (e.target.closest('[data-prev]')) { e.preventDefault(); show(Math.max(cur - 1, 0)); }
    });
    $$('.wiz-step:first-of-type input[type=radio]', lead).forEach(function (r) { r.addEventListener('change', function () { setTimeout(function () { show(1); }, 180); }); });
    lead.addEventListener('submit', function (e) {
      e.preventDefault(); if (!valid(cur)) return;
      send(lead, { _subject: 'Neue Projektanfrage (Lead) – Raumplaner.com' }).then(function (ok) { if (ok) { lead.hidden = true; $('#lead-done').hidden = false; window.scrollTo(0, $('#lead-done').offsetTop - 100); try { sessionStorage.removeItem('rp_lead'); } catch (er) { } } });
    });
  }
  function prefill() {
    var q = new URLSearchParams(location.search), st = {}, ct = {};
    try { st = JSON.parse(sessionStorage.getItem('rp_lead') || '{}'); ct = JSON.parse(sessionStorage.getItem('rp_contest') || '{}'); } catch (e) { }
    if (lead) {
      var pj = q.get('projekt'); if (pj) { var r = $('input[name="Projekt"][value="' + pj + '"]', lead) || $('input[name="Projekt"][data-k="' + pj + '"]', lead); if (r) r.checked = true; }
      if (q.get('flaeche') || st.area) lead.Flaeche_m2.value = q.get('flaeche') || st.area;
      if (st.link) { lead.Planungslink.value = st.link; $('#plan-note').hidden = false; $('#plan-note b').textContent = st.name || 'Ihre Planung'; }
      if (st.rooms) lead.Raeume.value = st.rooms;
      if (q.get('budget')) lead.Budget.value = q.get('budget');
      if (q.get('quelle') || q.get('projekt')) lead.Quelle.value = q.get('quelle') || ('rechner-' + q.get('projekt'));
    }
    var cf = $('#contest-form'); if (cf && ct.link) { cf.Planungslink.value = ct.link; if (ct.name) cf.Titel.value = ct.name; }
    var sf = $('#support-form'); if (sf && q.get('betrag')) sf.Betrag.value = q.get('betrag');
    var af = $('form[data-form="ads"]'); if (af && q.get('paket')) { var o = $('option[value="' + q.get('paket') + '"]', af); if (o) o.selected = true; }
  }
  prefill();

  // Tipp des Tages (rotiert täglich automatisch)
  var TIPS = [
    'Planen Sie vor Laufwegen mindestens 70–90 cm frei – dann fühlt sich ein Raum großzügig an.',
    'Der ideale Abstand zwischen Sofa und Couchtisch liegt bei 40–50 cm.',
    'Hinter Esstischstühlen sollten 80–100 cm Platz bleiben, damit man bequem aufstehen kann.',
    'Ein Teppich wirkt am besten, wenn mindestens die Vorderbeine aller Sitzmöbel darauf stehen.',
    'Vor dem Kleiderschrank brauchen Sie rund 90 cm, damit Türen und Schubladen voll aufgehen.',
    'Neben dem Bett genügen 60–70 cm Durchgang – beim Doppelbett am besten auf beiden Seiten.',
    'Messen Sie Türen und Treppenhaus, bevor Sie große Möbel kaufen – unser „Passt das?“-Rechner hilft.',
    'Helle Wände und eine dunklere Bodenfarbe lassen kleine Räume höher und ruhiger wirken.',
    'Planen Sie Licht in drei Ebenen: Grundlicht, Zonenlicht und Akzentlicht.',
    'Für den Schreibtisch sind 500 Lux am Arbeitsplatz ein guter Richtwert.',
    'Die Arbeitshöhe in der Küche liegt etwa 10–15 cm unter Ihrer Ellenbogenhöhe.',
    'Das Arbeitsdreieck Kühlschrank – Spüle – Herd sollte zusammen 4–7 m nicht überschreiten.',
    'Spiegel gegenüber dem Fenster holen spürbar mehr Tageslicht in den Raum.',
    'Hohe Regale an der Schmalseite lassen lange, schmale Räume ausgewogener wirken.',
    'Ein Fernseher sollte mit der Bildmitte etwa auf Augenhöhe im Sitzen hängen (ca. 100–110 cm).',
    'Für Full-HD gilt als Sitzabstand ca. die 2,5-fache Bilddiagonale, bei 4K reicht das 1,5-Fache.',
    'Vor WC und Waschbecken sollten mindestens 70 cm Bewegungsfläche bleiben.',
    'Stellen Sie das Bett nicht direkt unter das Fenster, wenn es dort zieht oder der Heizkörper sitzt.',
    'Mit der Farbregel 60-30-10 (Haupt-, Neben-, Akzentfarbe) wirkt ein Raum stimmig.',
    'Beine an Möbeln (sichtbarer Boden darunter) lassen kleine Räume luftiger wirken.',
    'Rechnen Sie bei Laminat etwa 5–10 % Verschnitt ein, bei diagonaler Verlegung eher 15 %.',
    'Steckdosen gleich im Grundriss mitplanen: hinter Sofa, Bett und Schreibtisch werden sie oft vergessen.',
    'Ein Eingangsbereich braucht eine Ablage: Kommode, Haken oder Bank verhindern Chaos.',
    'Im Homeoffice sollte das Fenster seitlich zum Bildschirm liegen – so vermeiden Sie Blendung.',
    'Raumteiler wie offene Regale gliedern große Räume, ohne Licht zu schlucken.',
    'Messen Sie Raumhöhe, Fensterbrüstung und Heizkörper – sie bestimmen, was wo Platz hat.',
    'Planen Sie Stauraum zuerst, Deko zuletzt: Ordnung ist die halbe Gestaltung.',
    'Gardinen knapp unter der Decke aufhängen – das streckt den Raum optisch.',
    'Gerade im Kinderzimmer: freie Spielfläche von mindestens 1,5 × 1,5 m einplanen.',
    'Fotografieren Sie Ihren Plan aus der 3D-Ansicht und teilen Sie ihn vor dem Kauf mit Familie oder Mitbewohnern.',
    'Holen Sie für größere Umbauten immer mehrere Angebote ein – die Preise variieren oft deutlich.'
  ];
  var doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
  $$('[data-tip]').forEach(function (e) { e.textContent = TIPS[doy % TIPS.length]; });

  // Vorlagen & Pläne (benötigt catalog.js)
  if (window.RP) {
    var T = RP.TEMPLATES, rel = (document.body.getAttribute('data-root') || '');
    $$('[data-hero-plan]').forEach(function (e) { var t = T[[6, 7, 0][doy % 3]]; e.innerHTML = RP.planSVG(t.plan, { labels: true, attrs: ' role="img" aria-label="Beispiel-Grundriss: ' + t.name + '"' }); });
    $$('[data-tpl-grid]').forEach(function (g) {
      var lim = +g.getAttribute('data-limit') || 99, start = g.hasAttribute('data-rotate') ? Math.floor(doy / 7) % T.length : 0, list = [];
      for (var i = 0; i < Math.min(lim, T.length); i++) list.push(T[(start + i) % T.length]);
      g.innerHTML = list.map(function (t) {
        var a = t.plan.rooms.reduce(function (s, r) { return s + RP.area(r.pts); }, 0);
        return '<div class="card tpl"><span class="tag">' + t.cat + '</span>' + (g.hasAttribute('data-rotate') && t === list[0] ? ' <span class="tag a">Vorlage der Woche</span>' : '') + '<h3>' + t.name + '</h3>' + RP.planSVG(t.plan, { labels: true, attrs: ' role="img" aria-label="Grundriss ' + t.name + '"' }) + '<p>' + t.desc + ' <b>' + (a / 1e4).toFixed(1).replace('.', ',') + ' m²</b></p><a class="btn sm" href="' + rel + 'raumplaner/?vorlage=' + t.id + '">Vorlage öffnen &amp; anpassen</a></div>';
      }).join('');
    });
  }

  if (window.RP) $$('[data-tpl-one]').forEach(function (c) {
    var t = RP.TEMPLATES.filter(function (x) { return x.id === c.getAttribute('data-tpl-one'); })[0]; if (!t) return;
    c.innerHTML = RP.planSVG(t.plan, { labels: true, attrs: ' role="img" aria-label="Grundriss ' + t.name + '"' }) + '<p><b>' + t.name + '</b> – ' + t.desc + '</p><a class="btn sm" href="' + (document.body.getAttribute('data-root') || '') + 'raumplaner/?vorlage=' + t.id + '">Vorlage öffnen</a>';
  });

  // Schnellstart
  $$('form[data-quick]').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); var b = f.b.value.replace(',', '.'), l = f.l.value.replace(',', '.'); location.href = f.getAttribute('action') + '?b=' + encodeURIComponent(b) + '&l=' + encodeURIComponent(l) + '&name=' + encodeURIComponent(f.n ? f.n.value : 'Mein Raum'); }); });

  // Wettbewerb: Monatsthema & Countdown (aktualisiert sich automatisch)
  var THEMES = ['Neustart: Das perfekte Homeoffice', 'Kleine Wohnung, große Wirkung (unter 40 m²)', 'Frühlingsfrisches Wohnzimmer', 'Das clevere Kinderzimmer', 'Badezimmer-Makeover', 'Wohnküche zum Zusammensitzen', 'Balkon & Wintergarten als Wohnraum', 'Das erste eigene Zimmer (WG & Studium)', 'Schlafzimmer zum Durchatmen', 'Stauraum-Wunder: Flur & Abstellraum', 'Gemütlicher Altbau', 'Festtafel: Esszimmer für Gäste'];
  var MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var now = new Date(), m = now.getMonth();
  $$('[data-contest-theme]').forEach(function (e) { e.textContent = THEMES[m]; });
  $$('[data-contest-month]').forEach(function (e) { e.textContent = MON[m] + ' ' + now.getFullYear(); });
  $$('[data-contest-next]').forEach(function (e) { e.textContent = MON[(m + 1) % 12] + ': ' + THEMES[(m + 1) % 12]; });
  $$('[data-prize]').forEach(function (e) { e.textContent = CFG.prizes[+e.getAttribute('data-prize')]; });
  var end = new Date(now.getFullYear(), m + 1, 0, 23, 59, 59), cd = $$('[data-countdown]');
  function tick() { var d = Math.max(0, end - new Date()), v = [Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60, Math.floor(d / 1e3) % 60]; cd.forEach(function (c) { $$('b', c).forEach(function (b, i) { b.textContent = String(v[i]).padStart(2, '0'); }); }); }
  if (cd.length) { tick(); setInterval(tick, 1000); }

  // Unterstützen
  var amt = 15, freq = 'einmalig';
  $$('.amounts button').forEach(function (b) { b.addEventListener('click', function () { $$('.amounts button').forEach(function (x) { x.classList.toggle('on', x === b); }); amt = +b.dataset.v; var c = $('#amt-custom'); if (c) c.value = ''; }); });
  var ac = $('#amt-custom'); if (ac) ac.addEventListener('input', function () { $$('.amounts button').forEach(function (x) { x.classList.remove('on'); }); amt = parseFloat(ac.value) || 0; });
  $$('.seg button').forEach(function (b) { b.addEventListener('click', function () { $$('button', b.parentNode).forEach(function (x) { x.classList.toggle('on', x === b); }); freq = b.dataset.v; }); });
  $$('[data-support-go]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (CFG.paypalHostedButtonId && freq === 'einmalig') { window.open('https://www.paypal.com/donate/?hosted_button_id=' + encodeURIComponent(CFG.paypalHostedButtonId) + '&amount=' + amt, '_blank', 'noopener'); return; }
      var f = $('#support-form'); if (f) { f.Betrag.value = amt; f.Rhythmus.value = freq; f.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(function () { f.Name.focus(); }, 500); }
    });
  });
  var gb = $('#goal-bar'); if (gb) { var pct = Math.min(100, CFG.supportRaised / CFG.supportGoal * 100); $('i', gb).style.width = Math.max(pct, 2) + '%'; $('#goal-txt').textContent = CFG.supportRaised + ' € von ' + CFG.supportGoal + ' € Monatsziel'; }
  var sw = $('#supporter-wall'); if (sw) sw.innerHTML = (CFG.supporters.length ? CFG.supporters : ['Ihr Name könnte hier stehen']).map(function (n) { return '<li>💛 ' + n.replace(/</g, '') + '</li>'; }).join('');

  // YouTube (datensparsam: lädt erst nach Klick)
  $$('.yt[data-id]').forEach(function (v) {
    v.addEventListener('click', function () { v.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + v.dataset.id + '?autoplay=1&rel=0" title="' + (v.getAttribute('aria-label') || 'Video') + '" allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>'; });
    v.addEventListener('keydown', function (e) { if (e.key === 'Enter') v.click(); });
  });

  // Tabellenfilter
  $$('[data-filter]').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var q = inp.value.toLowerCase().trim(), box = $(inp.getAttribute('data-filter'));
      $$('tbody tr', box).forEach(function (tr) { tr.hidden = q && tr.textContent.toLowerCase().indexOf(q) < 0; });
      $$('.tblw', box).forEach(function (w) { w.previousElementSibling.hidden = w.hidden = !$$('tbody tr', w).some(function (tr) { return !tr.hidden; }); });
    });
  });
})();
