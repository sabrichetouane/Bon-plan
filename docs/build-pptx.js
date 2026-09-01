// Build a "Bon Plan Bizerte" PFP-style presentation matching the structure
// of E:\Présentation de PFF.PPTX but for our React Native app.
// Run:  node build-pptx.js
// Output: BonPlanBizerte-PFF.pptx

const path = require('path');
const PPTX = require(path.join('..', 'node_modules', 'pptxgenjs'));

const pres = new PPTX();
pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches (16:9)
pres.author = 'Houssem Daas';
pres.title  = 'Bon Plan Bizerte — Présentation PFF';

// ----- Palette (matches the app's blue identity) ----------------------------
const C = {
  primary:    '1D2BEF',   // App primary blue
  primaryDk:  '0E1BCF',
  primarySoft:'E8EAFE',
  text:       '0F1226',
  textSec:    '6B7080',
  textMuted:  '9AA0B4',
  border:     'EDEFF5',
  bgLight:    'F6F7FB',
  white:      'FFFFFF',
  accent:     'FFC542',
};

const FONT_HEAD = 'Calibri';
const FONT_BODY = 'Calibri';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Small reusable: blue colored block + numbered chip in the top-left corner
function blueChapterCover(pres, { chapter, number, items = [] }) {
  const s = pres.addSlide();
  s.background = { color: C.primary };

  // Big chapter title
  s.addText(chapter, {
    x: 0.6, y: 2.4, w: 12, h: 1.6,
    fontFace: FONT_HEAD, fontSize: 60, bold: true, color: C.white,
  });

  // Big number bottom-right
  s.addText(number, {
    x: 11.2, y: 5.2, w: 1.8, h: 1.8,
    fontFace: FONT_HEAD, fontSize: 130, bold: true, color: C.white,
    align: 'right',
  });

  // Optional bullet list under title
  if (items.length) {
    s.addText(
      items.map(t => ({ text: t, options: { bullet: { type: 'bullet' }, color: C.white, fontSize: 16 } })),
      { x: 0.6, y: 4.2, w: 8, h: 1.8, fontFace: FONT_BODY }
    );
  }

  // Footer
  s.addText('Bon Plan Bizerte', {
    x: 0.6, y: 6.9, w: 6, h: 0.4,
    fontFace: FONT_BODY, fontSize: 11, color: C.white, italic: true,
  });
  return s;
}

// Standard content slide header (light bg with primary title bar)
function contentHeader(slide, title, sectionTag) {
  slide.background = { color: C.white };
  // Section tag pill (top-left)
  slide.addShape('roundRect', {
    x: 0.5, y: 0.4, w: 1.5, h: 0.35,
    fill: { color: C.primarySoft }, line: { color: C.primarySoft },
    rectRadius: 0.18,
  });
  slide.addText(sectionTag, {
    x: 0.5, y: 0.4, w: 1.5, h: 0.35,
    fontFace: FONT_BODY, fontSize: 10, color: C.primary, bold: true,
    align: 'center', valign: 'middle',
  });
  // Title
  slide.addText(title, {
    x: 0.5, y: 0.9, w: 12, h: 0.7,
    fontFace: FONT_HEAD, fontSize: 32, bold: true, color: C.text,
  });
  // Underline accent
  slide.addShape('rect', {
    x: 0.5, y: 1.6, w: 0.6, h: 0.06,
    fill: { color: C.primary }, line: { color: C.primary },
  });
  // Footer
  slide.addText('Bon Plan Bizerte — Présentation PFF', {
    x: 0.5, y: 7.1, w: 8, h: 0.3,
    fontFace: FONT_BODY, fontSize: 9, color: C.textMuted,
  });
}

// ---------------------------------------------------------------------------
// SLIDE 1 — Title slide
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.primary };

  // Decorative blob top-right
  s.addShape('ellipse', {
    x: 9.5, y: -2, w: 6, h: 6,
    fill: { color: C.primaryDk }, line: { color: C.primaryDk },
  });
  s.addShape('ellipse', {
    x: -2, y: 5, w: 5.5, h: 5.5,
    fill: { color: C.primaryDk }, line: { color: C.primaryDk },
  });

  // App icon (in white rounded card)
  s.addShape('roundRect', {
    x: 5.8, y: 0.6, w: 1.7, h: 1.7,
    fill: { color: C.white }, line: { color: C.white },
    rectRadius: 0.22,
  });
  s.addImage({ path: 'app-icon.png', x: 5.95, y: 0.75, w: 1.4, h: 1.4 });

  // Title block
  s.addText('Présentation de Projet de Fin de Formation', {
    x: 0.6, y: 2.7, w: 12.2, h: 0.6,
    fontFace: FONT_BODY, fontSize: 18, color: 'FFFFFF', italic: true,
    align: 'center',
  });
  s.addText('Conception et développement\nd’une application mobile\nde découverte touristique\npour la ville de Bizerte', {
    x: 0.6, y: 3.3, w: 12.2, h: 2.2,
    fontFace: FONT_HEAD, fontSize: 36, bold: true, color: C.white,
    align: 'center',
  });

  // Author / supervisor / year
  s.addText([
    { text: 'Réalisé par : ', options: { color: 'CDD3FF', fontSize: 14 } },
    { text: 'Houssem Daas\n', options: { color: C.white, bold: true, fontSize: 16 } },
    { text: 'Encadré par : ', options: { color: 'CDD3FF', fontSize: 14 } },
    { text: 'Mme/M. <Encadrant>\n', options: { color: C.white, bold: true, fontSize: 16 } },
    { text: 'Année de formation : ', options: { color: 'CDD3FF', fontSize: 14 } },
    { text: '2025 / 2026', options: { color: C.white, bold: true, fontSize: 16 } },
  ], {
    x: 0.6, y: 5.9, w: 12.2, h: 1.4,
    fontFace: FONT_BODY, align: 'center',
  });
}

// ---------------------------------------------------------------------------
// SLIDE 2 — PLAN (Table of contents)
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addText('PLAN', {
    x: 0.6, y: 0.5, w: 12, h: 1,
    fontFace: FONT_HEAD, fontSize: 48, bold: true, color: C.primary,
  });
  s.addShape('rect', {
    x: 0.6, y: 1.5, w: 0.6, h: 0.06,
    fill: { color: C.primary }, line: { color: C.primary },
  });

  const plan = [
    { num: '01', label: 'Introduction' },
    { num: '02', label: 'Spécification des besoins' },
    { num: '03', label: 'Conception' },
    { num: '04', label: 'Réalisation' },
    { num: '05', label: 'Conclusion et perspectives' },
  ];
  plan.forEach((p, i) => {
    const x = 0.7 + (i % 2) * 6.3;
    const y = 2.0 + Math.floor(i / 2) * 1.55;
    // number circle
    s.addShape('ellipse', {
      x, y, w: 0.85, h: 0.85,
      fill: { color: C.primary }, line: { color: C.primary },
    });
    s.addText(p.num, {
      x, y, w: 0.85, h: 0.85,
      fontFace: FONT_HEAD, fontSize: 18, bold: true, color: C.white,
      align: 'center', valign: 'middle',
    });
    // label
    s.addText(p.label, {
      x: x + 1.1, y: y + 0.1, w: 5, h: 0.6,
      fontFace: FONT_HEAD, fontSize: 20, bold: true, color: C.text,
      valign: 'middle',
    });
  });
}

// ---------------------------------------------------------------------------
// SLIDE 3 — Section divider: Introduction
// ---------------------------------------------------------------------------
blueChapterCover(pres, { chapter: 'Introduction', number: '01' });

// ---------------------------------------------------------------------------
// SLIDE 4 — Contexte général
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  contentHeader(s, 'Contexte général', 'INTRODUCTION');
  s.addText(
    'Bizerte, ville côtière du nord de la Tunisie, attire chaque année de nombreux ' +
    'visiteurs grâce à son vieux port, ses plages (Corniche, Rimel, La Grotte) et ' +
    'son riche patrimoine (Kasbah, Médina, Cap Blanc). Cependant, l’information ' +
    'touristique reste éparpillée entre Facebook, Google Maps et de simples bouches ' +
    'à oreilles. Les touristes peinent à trouver une plateforme unique qui ' +
    'centralise restaurants, cafés, sites naturels, activités et boutiques avec ' +
    'photos réelles, avis et localisation précise.',
    {
      x: 0.7, y: 2.0, w: 12, h: 3.8,
      fontFace: FONT_BODY, fontSize: 16, color: C.text,
      paraSpaceAfter: 12, lineSpacingMultiple: 1.25,
    }
  );
}

// ---------------------------------------------------------------------------
// SLIDE 5 — Objectif du projet
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  contentHeader(s, 'Objectif du projet', 'INTRODUCTION');
  s.addText(
    'L’objectif est de concevoir et développer une application mobile multiplateforme ' +
    '(iOS / Android) baptisée Bon Plan Bizerte permettant à l’utilisateur de :',
    { x: 0.7, y: 1.95, w: 12, h: 0.9, fontFace: FONT_BODY, fontSize: 16, color: C.text, lineSpacingMultiple: 1.25 }
  );
  const goals = [
    'Découvrir les lieux par catégorie (Food, Coffee, Beach, Nature, Activity, Shopping).',
    'Visualiser chaque lieu sur une carte interactive avec coordonnées GPS réelles.',
    'Construire son propre itinéraire journalier (planning horaire avec durée).',
    'Gérer ses favoris, partager un lieu, appeler ou ouvrir le site web.',
    'Profiter d’une interface bilingue/trilingue (EN/FR/AR) et d’un mode clair/sombre.',
  ];
  s.addText(
    goals.map(g => ({ text: g, options: { bullet: { type: 'bullet' }, fontSize: 15, color: C.text, paraSpaceAfter: 6 } })),
    { x: 0.9, y: 2.95, w: 11.6, h: 3.6, fontFace: FONT_BODY, lineSpacingMultiple: 1.25 }
  );
}

// ---------------------------------------------------------------------------
// SLIDE 6 — Section divider: Spécification des besoins
// ---------------------------------------------------------------------------
blueChapterCover(pres, {
  chapter: 'Spécification\ndes besoins',
  number: '02',
  items: ['Identification des acteurs', 'Besoins fonctionnels', 'Besoins non fonctionnels'],
});

// ---------------------------------------------------------------------------
// SLIDE 7 — Identification des acteurs
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  contentHeader(s, 'Identification des acteurs', 'SPÉCIFICATION');

  // Two cards
  const cards = [
    {
      x: 0.7, y: 2.0, title: 'Le Touriste',
      icon: '👤',
      body: 'Acteur principal. Parcourt les catégories, consulte les détails, ' +
            'ajoute aux favoris, planifie sa journée et utilise la carte. ' +
            'Peut changer la langue et le thème.',
    },
    {
      x: 6.95, y: 2.0, title: 'Système de cartes',
      icon: '🗺',
      body: 'Acteur externe : Apple Maps (iOS) et Google Maps (Android). ' +
            'Reçoit les coordonnées GPS d’un lieu pour calculer l’itinéraire ' +
            'depuis la position actuelle du touriste.',
    },
  ];
  cards.forEach(card => {
    s.addShape('roundRect', {
      x: card.x, y: card.y, w: 5.8, h: 4.6,
      fill: { color: C.bgLight }, line: { color: C.border }, rectRadius: 0.18,
    });
    // top blue strip header
    s.addShape('roundRect', {
      x: card.x, y: card.y, w: 5.8, h: 1.2,
      fill: { color: C.primary }, line: { color: C.primary }, rectRadius: 0.18,
    });
    s.addText(card.title, {
      x: card.x + 0.3, y: card.y + 0.18, w: 5.3, h: 0.8,
      fontFace: FONT_HEAD, fontSize: 22, bold: true, color: C.white,
    });
    s.addText(card.icon, {
      x: card.x + 0.3, y: card.y + 0.6, w: 5.3, h: 0.6,
      fontFace: FONT_HEAD, fontSize: 14, color: 'CDD3FF',
    });
    s.addText(card.body, {
      x: card.x + 0.4, y: card.y + 1.5, w: 5, h: 2.9,
      fontFace: FONT_BODY, fontSize: 14, color: C.text, lineSpacingMultiple: 1.3,
    });
  });
}

// ---------------------------------------------------------------------------
// SLIDE 8 — Besoins fonctionnels
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  contentHeader(s, 'Besoins fonctionnels', 'SPÉCIFICATION');
  const items = [
    'Inscription, connexion, réinitialisation du mot de passe, gestion du profil.',
    'Consultation des lieux par catégorie : Food, Coffee, Beach, Nature, Activity, Shopping.',
    'Recherche et filtres (par note, par budget, par favoris).',
    'Fiche détaillée d’un lieu : photos, description, avis, prix, contact.',
    'Carte interactive avec marqueurs colorés et fiche flottante.',
    'Ajout / retrait de favoris et planification d’itinéraires sur plusieurs jours.',
    'Contribution : proposer un nouveau lieu avec ses propres photos, publier un avis noté.',
    'Modération par un administrateur : approuver, masquer ou supprimer lieux, plans et avis.',
    'Partage, appel téléphonique direct, ouverture du site web.',
    'Internationalisation EN / FR / AR (avec mise en page RTL) et thème clair / sombre.',
  ];
  s.addText(
    items.map(t => ({ text: t, options: { bullet: { type: 'bullet' }, fontSize: 14, color: C.text, paraSpaceAfter: 6 } })),
    { x: 0.8, y: 1.95, w: 11.7, h: 5, fontFace: FONT_BODY, lineSpacingMultiple: 1.25 }
  );
}

// ---------------------------------------------------------------------------
// SLIDE 9 — Besoins non fonctionnels (3x2 grid like the template)
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  contentHeader(s, 'Besoins non fonctionnels', 'SPÉCIFICATION');

  const grid = [
    { title: 'Sécurité',      body: 'Mots de passe hachés (SHA-256 + sel), rôles utilisateur / administrateur, données locales privées à l’application.' },
    { title: 'Performance',   body: 'Démarrage rapide grâce à Expo, images en cache, navigation fluide.' },
    { title: 'Fiabilité',     body: 'Contraintes d’intégrité en base, transactions, fonctionnement complet hors ligne.' },
    { title: 'Simplicité',    body: 'Interface intuitive inspirée des standards iOS / Material Design.' },
    { title: 'Portabilité',   body: 'Une seule base de code React Native pour iOS, Android et Web.' },
    { title: 'Accessibilité', body: 'Mode sombre, multilingue EN/FR/AR avec RTL, zones tactiles de 44 pt, textes redimensionnables.' },
  ];
  grid.forEach((g, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.6 + col * 4.2;
    const y = 2.0 + row * 2.4;
    // icon circle
    s.addShape('ellipse', {
      x, y, w: 0.7, h: 0.7,
      fill: { color: C.primary }, line: { color: C.primary },
    });
    s.addText(String(i + 1), {
      x, y, w: 0.7, h: 0.7,
      fontFace: FONT_HEAD, fontSize: 16, bold: true, color: C.white,
      align: 'center', valign: 'middle',
    });
    // title
    s.addText(g.title, {
      x: x + 0.9, y: y + 0.05, w: 3.3, h: 0.45,
      fontFace: FONT_HEAD, fontSize: 17, bold: true, color: C.text,
    });
    // body
    s.addText(g.body, {
      x: x + 0.9, y: y + 0.55, w: 3.3, h: 1.6,
      fontFace: FONT_BODY, fontSize: 11, color: C.textSec, lineSpacingMultiple: 1.25,
    });
  });
}

// ---------------------------------------------------------------------------
// SLIDE 10 — Section divider: Conception
// ---------------------------------------------------------------------------
blueChapterCover(pres, {
  chapter: 'Conception',
  number: '03',
  items: ['Diagramme de cas d’utilisation', 'Diagramme de classes', 'MCD (Merise)'],
});

// ---------------------------------------------------------------------------
// SLIDE 11 — Use case diagram
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  contentHeader(s, 'Diagramme de cas d’utilisation', 'CONCEPTION');
  s.addImage({
    path: 'diagram-usecase.png',
    x: 0.7, y: 1.85, w: 12, h: 4.95,
  });
  s.addText(
    'Le touriste interagit avec toutes les fonctionnalités de l’application ; ' +
    'le système de cartes externe (Apple/Google Maps) est sollicité pour calculer l’itinéraire.',
    { x: 0.7, y: 6.85, w: 12, h: 0.3, fontFace: FONT_BODY, fontSize: 10, italic: true, color: C.textMuted }
  );
}

// ---------------------------------------------------------------------------
// SLIDE 12 — Class diagram
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  contentHeader(s, 'Diagramme de classes', 'CONCEPTION');
  s.addImage({
    path: 'diagram-class.png',
    x: 0.7, y: 1.85, w: 12, h: 4.95,
  });
  s.addText(
    'La classe abstraite Lieu est spécialisée en Restaurant, Café, Plage, LieuNature, ' +
    'Activité et Magasin. Le favori est une classe d’association entre Utilisateur et Lieu.',
    { x: 0.7, y: 6.85, w: 12, h: 0.3, fontFace: FONT_BODY, fontSize: 10, italic: true, color: C.textMuted }
  );
}

// ---------------------------------------------------------------------------
// SLIDE 13 — MCD
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  contentHeader(s, 'Modèle Conceptuel de Données (MCD)', 'CONCEPTION');
  s.addImage({
    path: 'diagram-mcd.png',
    x: 0.7, y: 1.85, w: 12, h: 4.95,
  });
  s.addText(
    'MCD (notation Merise) : 8 entités principales et 7 associations. Les cardinalités ' +
    '(0,n) / (1,1) garantissent l’intégrité des liaisons Utilisateur — Lieu — Avis — Favori.',
    { x: 0.7, y: 6.85, w: 12, h: 0.3, fontFace: FONT_BODY, fontSize: 10, italic: true, color: C.textMuted }
  );
}

// ---------------------------------------------------------------------------
// SLIDE 14 — Section divider: Réalisation
// ---------------------------------------------------------------------------
blueChapterCover(pres, {
  chapter: 'Réalisation',
  number: '04',
  items: [
    'Environnement logiciel',
    'Langages et frameworks',
    'Architecture et base de données',
    'Rôles et modération',
    'Captures d’écran',
  ],
});

// ---------------------------------------------------------------------------
// SLIDE 15 — Environnement logiciel
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  contentHeader(s, 'Environnement logiciel', 'RÉALISATION');
  const tools = [
    { name: 'Windows 11', desc: 'Système d’exploitation de développement' },
    { name: 'Visual Studio Code', desc: 'Éditeur de code principal' },
    { name: 'Expo Go (iOS / Android)', desc: 'Test instantané sur appareil physique' },
    { name: 'Node.js + npm', desc: 'Gestionnaire de paquets et runtime' },
    { name: 'Git + GitHub', desc: 'Versionnage et sauvegarde du code' },
    { name: 'PlantUML', desc: 'Génération des diagrammes UML' },
  ];
  tools.forEach((t, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.7 + col * 6.2;
    const y = 2.0 + row * 1.45;
    s.addShape('roundRect', {
      x, y, w: 5.8, h: 1.25,
      fill: { color: C.bgLight }, line: { color: C.border }, rectRadius: 0.1,
    });
    s.addShape('rect', {
      x: x + 0.15, y: y + 0.25, w: 0.12, h: 0.75,
      fill: { color: C.primary }, line: { color: C.primary },
    });
    s.addText(t.name, {
      x: x + 0.4, y: y + 0.15, w: 5.3, h: 0.5,
      fontFace: FONT_HEAD, fontSize: 15, bold: true, color: C.text,
    });
    s.addText(t.desc, {
      x: x + 0.4, y: y + 0.62, w: 5.3, h: 0.5,
      fontFace: FONT_BODY, fontSize: 11, color: C.textSec,
    });
  });
}

// ---------------------------------------------------------------------------
// SLIDE 16 — Langages & frameworks
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  contentHeader(s, 'Langages et frameworks', 'RÉALISATION');
  const langs = [
    { label: 'JavaScript (ES6+)', detail: 'Langage principal — async / await, destructuration' },
    { label: 'React 19 + React Native 0.81', detail: 'Composants fonctionnels et hooks (useState, useMemo, useContext)' },
    { label: 'Expo SDK 54', detail: 'Build, Splash Screen, expo-linear-gradient, expo-asset' },
    { label: 'expo-sqlite', detail: 'Base de données relationnelle embarquée — 10 tables' },
    { label: 'expo-crypto', detail: 'Hachage SHA-256 des mots de passe, avec sel aléatoire' },
    { label: 'expo-image-picker', detail: 'Import de photos depuis la galerie ou l’appareil photo' },
    { label: 'React Navigation 7', detail: 'Stack + Bottom Tabs pour la navigation entre écrans' },
    { label: 'react-native-maps', detail: 'Carte native Apple Maps / Google Maps avec marqueurs' },
    { label: '@expo/vector-icons (Ionicons)', detail: 'Bibliothèque d’icônes vectorielles' },
  ];
  s.addText(
    langs.map(l => ([
      // 9 entries now instead of 6, so the type is a little smaller to keep
      // the whole list on one slide.
      { text: l.label + '\n', options: { bold: true, fontSize: 13, color: C.text } },
      { text: l.detail + '\n', options: { fontSize: 10, color: C.textSec, paraSpaceAfter: 5 } },
    ])).flat(),
    { x: 0.8, y: 1.95, w: 11.7, h: 5, fontFace: FONT_BODY, lineSpacingMultiple: 1.2 }
  );
}

// ---------------------------------------------------------------------------
// SLIDE 17 — Architecture logicielle et base de données
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  contentHeader(s, 'Architecture et base de données', 'RÉALISATION');

  // --- Left: the three layers, as a simple stack -----------------------------
  const layers = [
    { name: 'Écrans (screens/)', desc: '19 écrans — ne contiennent aucune requête SQL' },
    { name: 'Composants partagés (components/)', desc: 'Carte, en-tête, champ, boutons — une seule définition' },
    { name: 'Dépôts (db/*Repo.js)', desc: 'Toutes les requêtes SQL, regroupées par sujet' },
    { name: 'SQLite (bonplan.db)', desc: 'Fichier unique sur le téléphone — 10 tables' },
  ];
  layers.forEach((l, i) => {
    const y = 2.0 + i * 1.18;
    const isDb = i === layers.length - 1;
    s.addShape('roundRect', {
      x: 0.7, y, w: 6.0, h: 1.0,
      fill: { color: isDb ? C.primary : C.bgLight },
      line: { color: isDb ? C.primary : C.border },
      rectRadius: 0.1,
    });
    s.addText(l.name, {
      x: 0.95, y: y + 0.12, w: 5.5, h: 0.4,
      fontFace: FONT_HEAD, fontSize: 13, bold: true,
      color: isDb ? C.white : C.text,
    });
    s.addText(l.desc, {
      x: 0.95, y: y + 0.52, w: 5.5, h: 0.4,
      fontFace: FONT_BODY, fontSize: 10,
      color: isDb ? C.primarySoft : C.textSec,
    });
    // A downward arrow between the layers.
    if (i < layers.length - 1) {
      s.addText('▼', {
        x: 3.5, y: y + 0.98, w: 0.4, h: 0.22,
        fontFace: FONT_BODY, fontSize: 10, color: C.textMuted, align: 'center',
      });
    }
  });

  // --- Right: the tables -----------------------------------------------------
  s.addText('Les 10 tables', {
    x: 7.2, y: 1.95, w: 5.5, h: 0.35,
    fontFace: FONT_HEAD, fontSize: 14, bold: true, color: C.text,
  });

  const tables = [
    'users — comptes, rôle, langue, thème',
    'session — qui est connecté sur ce téléphone',
    'categories — les 6 catégories',
    'places — les lieux + leur statut de modération',
    'place_photos — la galerie de chaque lieu',
    'favorites — clé primaire (user, lieu)',
    'comments — les avis notés',
    'plans / plan_items — les itinéraires',
    'meta — indicateur d’initialisation',
  ];
  s.addText(
    tables.map((t) => ({
      text: t,
      options: { bullet: { type: 'bullet' }, fontSize: 11, color: C.text, paraSpaceAfter: 5 },
    })),
    { x: 7.4, y: 2.4, w: 5.3, h: 3.6, fontFace: FONT_BODY, lineSpacingMultiple: 1.15 }
  );

  s.addText(
    'Règle d’architecture : un écran n’écrit jamais de SQL. Il appelle un dépôt. ' +
    'Remplacer SQLite par une API distante ne modifierait que le dossier db/.',
    { x: 0.7, y: 6.85, w: 12, h: 0.35, fontFace: FONT_BODY, fontSize: 10, italic: true, color: C.textMuted }
  );
}

// ---------------------------------------------------------------------------
// SLIDE 18 — Rôles et modération
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  contentHeader(s, 'Rôles et modération du contenu', 'RÉALISATION');

  // Two role cards, side by side.
  const roles = [
    {
      x: 0.7,
      title: 'Utilisateur',
      color: C.bgLight,
      textColor: C.text,
      lines: [
        'Consulter, rechercher, filtrer les lieux',
        'Ajouter aux favoris',
        'Publier et modifier un avis noté',
        'Planifier des itinéraires sur plusieurs jours',
        'Proposer un nouveau lieu, avec ses photos',
      ],
    },
    {
      x: 6.95,
      title: 'Administrateur',
      color: C.primarySoft,
      textColor: C.text,
      lines: [
        'Tout ce que fait un utilisateur',
        'Approuver ou rejeter les lieux proposés',
        'Masquer un lieu, un plan ou un avis',
        'Supprimer définitivement un contenu',
        'Créer des comptes et attribuer les rôles',
      ],
    },
  ];

  roles.forEach((r) => {
    s.addShape('roundRect', {
      x: r.x, y: 1.9, w: 5.7, h: 3.1,
      fill: { color: r.color }, line: { color: C.border }, rectRadius: 0.12,
    });
    s.addText(r.title, {
      x: r.x + 0.35, y: 2.05, w: 5.0, h: 0.45,
      fontFace: FONT_HEAD, fontSize: 17, bold: true, color: C.primary,
    });
    s.addText(
      r.lines.map((l) => ({
        text: l,
        options: { bullet: { type: 'bullet' }, fontSize: 11, color: r.textColor, paraSpaceAfter: 5 },
      })),
      { x: r.x + 0.45, y: 2.55, w: 4.9, h: 2.3, fontFace: FONT_BODY, lineSpacingMultiple: 1.15 }
    );
  });

  // The moderation states, as a row of three pills.
  s.addText('Cycle de vie d’un contenu proposé', {
    x: 0.7, y: 5.25, w: 12, h: 0.35,
    fontFace: FONT_HEAD, fontSize: 14, bold: true, color: C.text,
  });

  const states = [
    { label: 'En attente', desc: 'visible par son auteur\net les administrateurs' },
    { label: 'Approuvé', desc: 'visible par tout le monde' },
    { label: 'Masqué', desc: 'retiré de l’application,\nconservé en base' },
  ];
  states.forEach((st, i) => {
    const x = 0.7 + i * 4.15;
    s.addShape('roundRect', {
      x, y: 5.7, w: 3.8, h: 1.0,
      fill: { color: C.white }, line: { color: C.primary }, rectRadius: 0.5,
    });
    s.addText(st.label, {
      x, y: 5.82, w: 3.8, h: 0.3,
      fontFace: FONT_HEAD, fontSize: 13, bold: true, color: C.primary, align: 'center',
    });
    s.addText(st.desc, {
      x, y: 6.12, w: 3.8, h: 0.5,
      fontFace: FONT_BODY, fontSize: 9, color: C.textSec, align: 'center',
    });
    if (i < states.length - 1) {
      s.addText('→', {
        x: x + 3.85, y: 6.0, w: 0.3, h: 0.3,
        fontFace: FONT_BODY, fontSize: 14, color: C.textMuted, align: 'center',
      });
    }
  });
}

// ---------------------------------------------------------------------------
// SLIDE 19 — Captures d'écran
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  contentHeader(s, 'Captures d’écran', 'RÉALISATION');

  // The mockups are 750x1500 (a 1:2 phone shape), so a 1.55in width needs a
  // 3.1in height to keep them undistorted.
  const shots = [
    { file: 'mockup-home.png', label: 'Accueil' },
    { file: 'mockup-category.png', label: 'Catégorie' },
    { file: 'mockup-detail.png', label: 'Fiche lieu' },
    { file: 'mockup-map.png', label: 'Carte' },
    { file: 'mockup-itinerary.png', label: 'Itinéraire' },
    { file: 'mockup-profile.png', label: 'Profil' },
  ];

  const shotW = 1.55;
  const shotH = 3.1;
  const gap = 0.42;
  // Centre the row of six on the 13.33in slide.
  const totalW = shots.length * shotW + (shots.length - 1) * gap;
  const startX = (13.33 - totalW) / 2;

  shots.forEach((shot, i) => {
    const x = startX + i * (shotW + gap);
    s.addImage({ path: shot.file, x, y: 2.1, w: shotW, h: shotH });
    s.addText(shot.label, {
      x: x - 0.15, y: 5.35, w: shotW + 0.3, h: 0.3,
      fontFace: FONT_BODY, fontSize: 11, color: C.textSec, align: 'center',
    });
  });

  s.addText(
    'Interface commune à tous les écrans : bleu #1D2BEF, cartes à coins arrondis, ' +
    'icônes Ionicons, thème clair / sombre et mise en page adaptée au sens de lecture arabe.',
    { x: 0.7, y: 6.0, w: 12, h: 0.6, fontFace: FONT_BODY, fontSize: 11, color: C.text, align: 'center' }
  );
}

// ---------------------------------------------------------------------------
// SLIDE 20 — Section divider: Conclusion et perspectives
// ---------------------------------------------------------------------------
blueChapterCover(pres, {
  chapter: 'Conclusion\net perspectives',
  number: '05',
});

// ---------------------------------------------------------------------------
// SLIDE 18 — Conclusion
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  contentHeader(s, 'Conclusion', 'CONCLUSION');
  s.addText(
    'Bon Plan Bizerte centralise en une seule application mobile l’information ' +
    'touristique de la ville : 28 lieux réels (restaurants, cafés, plages, sites ' +
    'naturels, activités, boutiques) avec photos authentiques, coordonnées GPS et ' +
    'avis. L’application ne se limite plus à la consultation : elle repose sur une ' +
    'base de données SQLite embarquée qui conserve comptes, favoris, avis et ' +
    'itinéraires entre deux lancements, et sur un modèle de rôles permettant aux ' +
    'visiteurs de proposer des lieux et aux administrateurs de les modérer. ' +
    'Le projet a permis de mettre en pratique la conception UML/Merise, la ' +
    'modélisation relationnelle et le développement multiplateforme en React ' +
    'Native, avec un fort accent sur l’expérience utilisateur (multilingue avec ' +
    'RTL, mode sombre, carte interactive, partage natif).',
    { x: 0.7, y: 2.0, w: 12, h: 4.5, fontFace: FONT_BODY, fontSize: 16, color: C.text, lineSpacingMultiple: 1.35 }
  );
}

// ---------------------------------------------------------------------------
// SLIDE 19 — Perspectives
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  contentHeader(s, 'Perspectives', 'CONCLUSION');
  const persp = [
    'Serveur distant et synchronisation : partager comptes, avis et lieux entre plusieurs appareils.',
    'Géolocalisation réelle : trier les lieux par distance et centrer la carte sur l’utilisateur.',
    'Horaires d’ouverture par lieu, afin de remplacer l’indicateur « Ouvert » générique.',
    'Réservation en ligne (restaurants, activités, hébergements).',
    'Notifications push pour les événements locaux et bons plans.',
    'Extension à d’autres villes tunisiennes (Tunis, Sousse, Hammamet, Djerba).',
    'Traduction du contenu des lieux, aujourd’hui saisi dans une seule langue.',
  ];
  s.addText(
    persp.map(p => ({ text: p, options: { bullet: { type: 'bullet' }, fontSize: 15, color: C.text, paraSpaceAfter: 8 } })),
    { x: 0.9, y: 1.95, w: 11.6, h: 5, fontFace: FONT_BODY, lineSpacingMultiple: 1.3 }
  );
}

// ---------------------------------------------------------------------------
// SLIDE 20 — Merci
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.primary };
  s.addShape('ellipse', {
    x: 9.5, y: -2, w: 6, h: 6,
    fill: { color: C.primaryDk }, line: { color: C.primaryDk },
  });
  s.addShape('ellipse', {
    x: -2, y: 5, w: 5.5, h: 5.5,
    fill: { color: C.primaryDk }, line: { color: C.primaryDk },
  });
  s.addText('Merci pour votre attention', {
    x: 0.5, y: 3.0, w: 12.3, h: 1.2,
    fontFace: FONT_HEAD, fontSize: 54, bold: true, color: C.white,
    align: 'center',
  });
  s.addText('Bon Plan Bizerte — découvrez la ville autrement', {
    x: 0.5, y: 4.4, w: 12.3, h: 0.6,
    fontFace: FONT_BODY, fontSize: 18, color: 'CDD3FF', italic: true,
    align: 'center',
  });
}

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------
pres.writeFile({ fileName: 'BonPlanBizerte-PFF.pptx' }).then(name => {
  console.log('Generated: ' + name);
}).catch(err => {
  console.error('Failed: ' + err);
  process.exit(1);
});
