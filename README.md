# Raumplaner.com

Kostenloser Online-Raumplaner ohne Anmeldung (2D/3D), Rechner, Ratgeber, Lead-Generierung („Profi finden“), Wettbewerb, Unterstützen, Werben, Karriere.

**Hosting:** GitHub Pages (main / root, Jekyll-Build durch GitHub). Kein Backend.

## Struktur
- `_layouts/d.html` – Layout aller Seiten (Kontakt-Banner, Header, Footer, AdSense)
- `*/index.html` – Seiten (Front Matter + Inhalt)
- `assets/js/planner.js` – Raumplaner (SVG 2D, three.js 3D per CDN)
- `assets/js/catalog.js` – Möbelkatalog, Symbole, Vorlagen
- `assets/js/calc.js` – Rechner · `assets/js/site.js` – Formulare, Wettbewerb, Rotation, Konfiguration
- `ads.txt`, `sitemap.xml`, `robots.txt`, `sw.js`, `manifest.webmanifest`

## Konfiguration (`assets/js/site.js`, Objekt `CFG`)
- `paypalHostedButtonId` – PayPal-Spendenbutton aktivieren
- `supportGoal`, `supportRaised`, `supporters` – Unterstützerziel und -wand
- `prizes` – Wettbewerbspreise

## Formulare
Alle Formulare senden per FormSubmit (AJAX). Die Zieladresse steht nicht im HTML. Erste Einsendung löst eine einmalige Aktivierungs-E-Mail von FormSubmit aus – bestätigen.

## Livegang
1. Settings → Pages → Deploy from a branch → `main` / `/ (root)`
2. Custom Domain `raumplaner.com` eintragen; DNS: A-Records 185.199.108.153, .109.153, .110.153, .111.153; `www` CNAME → `webworksa1.github.io`
3. AdSense: Website hinzufügen, Datenschutz & Mitteilungen (Google-CMP) für EWR/UK aktivieren, Auto Ads einschalten.
