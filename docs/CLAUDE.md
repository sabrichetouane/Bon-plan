# docs/ — PFE Deliverables

This folder is the **academic** side of the project: UML diagrams and the Node scripts that
generate the report and the defence slides. Nothing here ships in the app bundle.

Context: **PFE — BTS Informatique de Gestion**, host company **Info Plus** (`infoplus`).

---

## 1. Diagrams (PlantUML source)

| File | Diagram |
| --- | --- |
| [1-mcd.puml](1-mcd.puml) | Modèle Conceptuel de Données |
| [2-usecase.puml](2-usecase.puml) | Cas d'utilisation |
| [3-class-diagram.puml](3-class-diagram.puml) | Diagramme de classes |

Rendered PNGs sit beside them (`diagram-mcd.png`, `diagram-usecase.png`,
`diagram-class.png`) — copied in from `pfeee/`. Regenerate via
<https://www.plantuml.com/plantuml/uml>, the VS Code `jebbs.plantuml` extension (`Alt+D`),
or `java -jar plantuml.jar 1-mcd.puml`. See [README.md](README.md).

### MCD entities

`UTILISATEUR` · `VILLE` · `CATEGORIE` · `LIEU` · `PHOTO` · `AVIS` · `FAVORI` ·
`ITINERAIRE_ITEM`

### Class diagram

`Utilisateur` · `Ville` · `Categorie` · abstract `Lieu` → `Restaurant` / `Cafe` / `Plage` /
`LieuNature` / `Activite` / `Magasin` · `Photo` · `Avis` · `Favori` (association class) ·
`Itineraire` → `ActiviteItineraire`. Enums `Langue {EN,FR,AR}`, `ThemeMode {LIGHT,DARK}`.

### Use cases — 23 total, 2 actors

Actors: **Touriste**, **Système de cartes (Apple/Google Maps)**.
UC1–UC23 cover browsing, search/filter, detail + gallery + reviews, share/call/website,
map + marker filter + directions, favorites, itinerary add/remove/blank, theme, language,
city, logout.

---

## 2. Diagrams vs. reality — what exists only on paper

The diagrams describe the **intended** system; `src/` implements a subset. This gap is
the natural roadmap.

| Modelled | Status in code |
| --- | --- |
| `UTILISATEUR` (email, password, signup date) | ❌ no auth, no user record — Profile is a fixed placeholder |
| `Utilisateur.seConnecter()` / UC23 "Se déconnecter" | ❌ logout Alert has no handler; there is no login screen at all |
| `AVIS` / `Avis` entity, UC7 "Lire les avis" | ⚠️ 2 hardcoded reviews shown on every place; no per-place data, no write path |
| `FAVORI` with `date_ajout` | ⚠️ favorites are an in-memory `Set<id>`, no timestamp, lost on reload |
| `ITINERAIRE_ITEM` persisted per user | ⚠️ in-memory only; `Itineraire.date` is not modelled in code |
| `VILLE` + `vit_dans` / `situe_dans` | ⚠️ ChooseCity lists 6 cities but the choice is discarded; all data is Bizerte |
| `CATEGORIE` as a table with FK from `LIEU` | ⚠️ categories are one array; a place's category is implied by which array holds it |
| `PHOTO` with `ordre_affichage` | ⚠️ `gallery: []` array, no ordering field |
| `Lieu` subclasses (Restaurant/Cafe/Plage/…) with own attributes (`typeCuisine`, `wifi`, `surveillance`, `niveauDifficulte`, `guideDisponible`, `horaires`…) | ❌ one flat `Place` shape for all six types |
| `Itineraire.calculerDureeTotale()` | ✅ implemented inline in `ItineraryScreen` |
| `Lieu.obtenirItineraire()` / `partager()` / `appeler()` / `ouvrirSiteWeb()` | ✅ all four work in `PlaceDetailScreen` |
| UC1–UC6, UC11, UC12, UC15–UC22 | ✅ implemented |

**Reading:** the three highest-value features to close the gap, in order, are
**auth + real user**, **per-place reviews with a write path**, and **persistence**.

---

## 3. Generator scripts

Run with plain `node` **from inside `docs/`**. They use the `docx` and `pptxgenjs`
dependencies declared in the root `package.json`.

| Command | Output |
| --- | --- |
| `node build-rapport-pfe.js` | `Rapport-PFE-Bon-Plan-Bizerte.docx` — the full ~1900-line PFE report |
| `node build-docx.js` | `Bon-Plan-Bizerte-Explication-Code.docx` — code walkthrough |
| `node build-docx-full.js` | `Bon-Plan-Bizerte-Guide-Complet.docx` |
| `node build-pptx.js` | `BonPlanBizerte-PFF.pptx` — defence slides, built from scratch with `pptxgenjs` |
| `node make-logo-v2.js` | `infoplus-logo.png` (400×400) |
| `node make-app-mockups.js` | `mockup-{splash,onboarding,home,category,detail,itinerary,map,profile}.png` |

`make-logo.js` is the superseded v1 — both write `infoplus-logo.png`, so run
`make-logo-v2.js` last (or only). `PFF-template.pptx` sits here as a reference deck; no
script reads it.

The mockup PNGs are **script-drawn**, not real screenshots. If you change a screen's
design, re-run `make-app-mockups.js` so the report figures stay accurate.

The report hardcodes brand facts that must stay in sync with
[../src/theme/colors.js](../src/theme/colors.js): primary `#1D2BEF`, splash gradient
`#0E1BCF → #1D2BEF → #3A46FF`, text `#0F1226`.
