// Rapport de PFE - Bon Plan Bizerte
// Etudiant : Sabri Chetouane - BTS Informatique de Gestion
// Encadrant : Mme Yosra Dhaouadi
// Etablissement : Info Plus
//
// Structure ~50 pages, design minimaliste, images numerotees Annexe N
//
// node build-rapport-pfe.js  ->  Rapport-PFE-Bon-Plan-Bizerte.docx

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageBreak, LevelFormat, BorderStyle, ShadingType, ImageRun,
  Table, TableRow, TableCell, WidthType, Header, Footer, PageNumber,
  TabStopType, TabStopPosition,
} = require(path.join('..', 'node_modules', 'docx'));

// ---------- Design tokens (minimalist) ----------
const FONT = 'Calibri';
const FONT_HEAD = 'Cambria';
const FONT_MONO = 'Consolas';
const INK = '1A1A1A';
const MUTE = '666666';
const LINE = 'D0D0D0';
const ACCENT = '1A3A8E';   // Info Plus blue
const RED = 'E30613';       // Info Plus red

// ---------- Helpers ----------
let annexeCount = 0;
const nextAnnexe = () => ++annexeCount;

const readImg = (p) => fs.readFileSync(p);

const getPngSize = (data) => ({
  width: data.readUInt32BE(16),
  height: data.readUInt32BE(20),
});

const getJpgSize = (data) => {
  let i = 2;
  while (i < data.length) {
    if (data[i] !== 0xFF) break;
    const marker = data[i + 1]; i += 2;
    if (marker >= 0xC0 && marker <= 0xC3) {
      return { height: data.readUInt16BE(i + 3), width: data.readUInt16BE(i + 5) };
    }
    i += data.readUInt16BE(i);
  }
  return { width: 640, height: 400 };
};

// Body paragraph (justified, 12pt)
const p = (text, opts = {}) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { before: 80, after: 100, line: 320 },
  ...opts,
  children: [new TextRun({
    text, font: FONT, size: 24, color: INK,
    ...(opts.runOpts || {}),
  })],
});

// Just a spacer
const gap = (n = 200) => new Paragraph({ spacing: { before: n }, children: [new TextRun('')] });

// H1 chapitre (page break, big)
const h1 = (num, text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  pageBreakBefore: true,
  spacing: { before: 400, after: 400 },
  children: [
    new TextRun({ text: 'Chapitre ' + num, font: FONT_HEAD, size: 28, color: MUTE, italics: true }),
    new TextRun({ text: '\n' + text, font: FONT_HEAD, size: 52, bold: true, color: INK, break: 1 }),
  ],
});

// H1 for non-chapter big sections (Introduction, Conclusion, etc.)
const h1Plain = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  pageBreakBefore: true,
  spacing: { before: 400, after: 400 },
  children: [new TextRun({ text, font: FONT_HEAD, size: 52, bold: true, color: INK })],
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 320, after: 160 },
  children: [new TextRun({ text, font: FONT_HEAD, size: 32, bold: true, color: ACCENT })],
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, font: FONT_HEAD, size: 26, bold: true, color: INK })],
});

const bullet = (text) => new Paragraph({
  numbering: { reference: 'bullets', level: 0 },
  alignment: AlignmentType.JUSTIFIED,
  spacing: { before: 40, after: 40, line: 300 },
  children: [new TextRun({ text, font: FONT, size: 24, color: INK })],
});

const num = (text) => new Paragraph({
  numbering: { reference: 'numbers', level: 0 },
  alignment: AlignmentType.JUSTIFIED,
  spacing: { before: 40, after: 40, line: 300 },
  children: [new TextRun({ text, font: FONT, size: 24, color: INK })],
});

// Sober quote / callout (thin left border, no color fill)
const quote = (text) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  rows: [new TableRow({
    children: [new TableCell({
      width: { size: 9360, type: WidthType.DXA },
      shading: { fill: 'FAFAFA', type: ShadingType.CLEAR },
      margins: { top: 200, bottom: 200, left: 240, right: 200 },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: BorderStyle.SINGLE, size: 16, color: ACCENT },
        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      },
      children: [new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 320 },
        children: [new TextRun({ text, font: FONT_HEAD, size: 24, italics: true, color: INK })],
      })],
    })],
  })],
});

// Full image with Annexe caption
const figure = (relPath, caption, opts = {}) => {
  const maxW = opts.maxWidth || 520;
  const data = readImg(relPath);
  const ext = path.extname(relPath).toLowerCase().replace('.', '');
  const size = ext === 'png' ? getPngSize(data) : getJpgSize(data);
  const ratio = size.height / size.width;
  const w = Math.min(maxW, size.width);
  const h = Math.round(w * ratio);
  const n = nextAnnexe();
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 100 },
      children: [new ImageRun({
        type: ext === 'jpg' ? 'jpeg' : ext,
        data,
        transformation: { width: w, height: h },
        altText: { title: caption, description: caption, name: 'annexe-' + n },
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({ text: 'Annexe ' + n + ' — ', font: FONT, size: 20, bold: true, color: MUTE }),
        new TextRun({ text: caption, font: FONT, size: 20, italics: true, color: MUTE }),
      ],
    }),
  ];
};

// TOC line with dot leader
const tocLine = (label, page, level = 0) => new Paragraph({
  spacing: { before: 60, after: 60 },
  tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX, leader: 'dot' }],
  children: [
    new TextRun({ text: '  '.repeat(level) + label, font: FONT, size: 24, color: INK, bold: level === 0 }),
    new TextRun({ text: '\t' + page, font: FONT, size: 24, color: INK }),
  ],
});

// ============================================================================
// CONTENT
// ============================================================================
const children = [];

// ============================================================================
// PAGE 1 - PAGE DE GARDE (minimalist)
// ============================================================================
// Info Plus logo (small, top of the page)
const logoData = readImg('infoplus-logo.png');
children.push(
  gap(400),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [new ImageRun({
      type: 'png',
      data: logoData,
      transformation: { width: 120, height: 120 },
      altText: { title: 'Info Plus', description: 'Logo Info Plus', name: 'infoplus-cover' },
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: 'Établissement Info Plus', font: FONT_HEAD, size: 26, color: INK, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: 'BTS Informatique de Gestion', font: FONT_HEAD, size: 24, color: MUTE, italics: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: 'Année 2025 - 2026', font: FONT, size: 20, color: MUTE })],
  }),
  // A thin horizontal line
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 1 } },
    children: [new TextRun('')],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'RAPPORT DE PROJET', font: FONT_HEAD, size: 32, color: MUTE, italics: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'DE FIN D’ÉTUDES', font: FONT_HEAD, size: 32, color: MUTE, italics: true })],
  }),
  gap(400),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'Bon Plan Bizerte', font: FONT_HEAD, size: 72, bold: true, color: INK })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({ text: 'Application mobile de découverte touristique', font: FONT, size: 24, italics: true, color: MUTE })],
  }),
  // Second thin line
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 1 } },
    children: [new TextRun('')],
  }),
  gap(400),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: 'Réalisé par', font: FONT, size: 22, color: MUTE })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: 'Sabri CHETOUANE', font: FONT_HEAD, size: 32, bold: true, color: INK })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: 'Encadré par', font: FONT, size: 22, color: MUTE })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'Mme Yosra DHAOUADI', font: FONT_HEAD, size: 28, bold: true, color: INK })],
  }),
);

// ============================================================================
// PAGE 2 - REMERCIEMENTS
// ============================================================================
children.push(
  h1Plain('Remerciements'),
  p(
    'Au terme de ce projet de fin d’études, je tiens à exprimer ma profonde ' +
    'reconnaissance à toutes les personnes qui ont contribué, de près ou de ' +
    'loin, à sa réalisation et à son aboutissement.'
  ),
  gap(200),
  p(
    'Je remercie tout particulièrement l’établissement Info Plus qui m’a ' +
    'accueilli, formé et accompagné durant tout mon cursus de BTS en Informatique ' +
    'de Gestion. La qualité de la formation, la richesse de l’encadrement ' +
    'pédagogique et la bienveillance de toute l’équipe pédagogique ont été ' +
    'un pilier essentiel de mon apprentissage.'
  ),
  gap(160),
  p(
    'J’adresse mes remerciements les plus sincères à Madame Yosra DHAOUADI, ' +
    'mon encadrante pédagogique, pour la qualité de son suivi, ses conseils ' +
    'précieux, sa patience et sa disponibilité constante tout au long de ce ' +
    'projet. Ses remarques pertinentes et son sens critique m’ont permis de ' +
    'progresser et de mener ce travail à son terme dans les meilleures conditions.'
  ),
  gap(160),
  p(
    'Je remercie également l’ensemble du corps professoral d’Info Plus ' +
    'pour la qualité des enseignements dispensés, la richesse des cours et la ' +
    'transmission d’un savoir pratique adapté aux exigences du marché du ' +
    'travail. Merci à chacun d’entre vous pour le temps consacré, la passion ' +
    'partagée et les compétences transmises.'
  ),
  gap(160),
  p(
    'Enfin, je souhaite exprimer toute ma gratitude à mes parents pour leur ' +
    'soutien inconditionnel, leurs encouragements permanents et la confiance ' +
    'qu’ils m’ont toujours accordée. Sans leur amour, leurs sacrifices et ' +
    'leur présence, rien de tout cela n’aurait été possible.'
  ),
  gap(240),
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { before: 400 },
    children: [new TextRun({ text: 'Sabri CHETOUANE', font: FONT_HEAD, size: 24, italics: true, color: INK })],
  }),
);

// ============================================================================
// PAGE 3-4 - SOMMAIRE
// ============================================================================
children.push(
  h1Plain('Sommaire'),
  gap(200),
  tocLine('Remerciements', '2'),
  tocLine('Sommaire', '3'),
  tocLine('Liste des figures', '5'),
  tocLine('Introduction générale', '6'),
  gap(120),
  tocLine('Chapitre 1 — Présentation générale', '8'),
  tocLine('1.1  Présentation de l’établissement Info Plus', '9', 1),
  tocLine('1.2  Contexte du projet', '10', 1),
  tocLine('1.3  Problématique', '12', 1),
  tocLine('1.4  Objectifs du projet', '13', 1),
  tocLine('1.5  Solution proposée', '14', 1),
  gap(120),
  tocLine('Chapitre 2 — Analyse et spécification des besoins', '16'),
  tocLine('2.1  Identification des acteurs', '17', 1),
  tocLine('2.2  Besoins fonctionnels', '18', 1),
  tocLine('2.3  Besoins non fonctionnels', '20', 1),
  tocLine('2.4  Diagramme de cas d’utilisation', '21', 1),
  gap(120),
  tocLine('Chapitre 3 — Conception', '24'),
  tocLine('3.1  Modèle Conceptuel de Données (MCD)', '25', 1),
  tocLine('3.2  Diagramme de classes', '27', 1),
  tocLine('3.3  Architecture logicielle', '29', 1),
  tocLine('3.4  Choix des couleurs et charte graphique', '30', 1),
  gap(120),
  tocLine('Chapitre 4 — Réalisation', '32'),
  tocLine('4.1  Environnement logiciel', '33', 1),
  tocLine('4.2  Langages et frameworks', '34', 1),
  tocLine('4.3  Structure du projet', '36', 1),
  tocLine('4.4  Écrans de l’application', '38', 1),
  tocLine('4.5  Fonctionnalités clés', '42', 1),
  gap(120),
  tocLine('Chapitre 5 — Conclusion et perspectives', '45'),
  tocLine('5.1  Bilan du projet', '46', 1),
  tocLine('5.2  Difficultés rencontrées', '47', 1),
  tocLine('5.3  Perspectives d’évolution', '48', 1),
  gap(120),
  tocLine('Bibliographie et webographie', '49'),
  tocLine('Merci', '50'),
);

// ============================================================================
// LISTE DES FIGURES
// ============================================================================
children.push(
  h1Plain('Liste des figures'),
  gap(200),
  p('La liste ci-dessous récapitule toutes les figures utilisées dans ce rapport. Chacune est identifiée par son numéro d’annexe.'),
  gap(160),
  tocLine('Annexe 1 — Logo Info Plus', '2'),
  tocLine('Annexe 2 — Logo de l’application Bon Plan Bizerte', '14'),
  tocLine('Annexe 3 — Écran splash au démarrage', '15'),
  tocLine('Annexe 4 — Diagramme de cas d’utilisation', '22'),
  tocLine('Annexe 5 — Modèle Conceptuel de Données (MCD)', '25'),
  tocLine('Annexe 6 — Diagramme de classes UML', '27'),
  tocLine('Annexe 7 — Icône de l’application', '38'),
  tocLine('Annexe 8 — Splash screen final', '39'),
);

// ============================================================================
// INTRODUCTION GENERALE
// ============================================================================
children.push(
  h1Plain('Introduction générale'),
  p(
    'Le secteur du tourisme est aujourd’hui un pilier économique majeur ' +
    'pour la Tunisie, et particulièrement pour la ville de Bizerte, riche de ' +
    'son patrimoine culturel, de ses paysages naturels exceptionnels et de sa ' +
    'position stratégique en tant que ville la plus septentrionale du continent ' +
    'africain. Pourtant, malgré ce potentiel considérable, les touristes ' +
    'nationaux comme internationaux disposent de très peu d’outils numériques ' +
    'dédiés pour découvrir la ville de manière autonome, efficace et enrichissante.'
  ),
  p(
    'Les applications généralistes comme Google Maps ou Tripadvisor apportent ' +
    'certes des informations, mais elles ne sont ni contextualisées, ni curées, ' +
    'ni adaptées aux spécificités locales telles que la fourchette de prix en ' +
    'dinars tunisiens, les horaires réels d’ouverture, ou les recommandations ' +
    'des habitants. Un besoin réel se fait donc sentir : celui d’une ' +
    'application mobile locale, moderne et centrée utilisateur, capable de ' +
    'guider le visiteur pas à pas dans la découverte de Bizerte.'
  ),
  p(
    'C’est dans ce cadre que s’inscrit le projet Bon Plan Bizerte, ' +
    'développé dans le cadre de mon Projet de Fin d’Études au sein de ' +
    'l’établissement Info Plus, sous la supervision pédagogique de Madame ' +
    'Yosra Dhaouadi. L’objectif est de concevoir et de développer une ' +
    'application mobile complète, multiplateforme (iOS et Android), permettant ' +
    'au touriste de découvrir les meilleurs restaurants, cafés, plages, sites ' +
    'naturels, activités historiques et commerces de la région.'
  ),
  p(
    'Ce rapport présente l’intégralité de la démarche suivie, depuis ' +
    'l’étude de l’existant jusqu’à la mise en œuvre technique. Il est ' +
    'organisé en cinq chapitres. Le premier chapitre présente l’établissement ' +
    'd’accueil et le contexte général du projet. Le deuxième chapitre expose ' +
    'l’analyse et la spécification des besoins. Le troisième chapitre est ' +
    'consacré à la conception, avec notamment le Modèle Conceptuel de Données et ' +
    'le diagramme de classes UML. Le quatrième chapitre décrit la réalisation ' +
    'technique, les technologies utilisées et présente les écrans finaux. Enfin, ' +
    'le dernier chapitre dresse le bilan du projet et esquisse ses perspectives ' +
    'd’évolution.'
  ),
);

// ============================================================================
// CHAPITRE 1 - PRESENTATION GENERALE
// ============================================================================
children.push(
  h1(1, 'Présentation générale'),
  p(
    'Ce premier chapitre a pour objectif de situer le projet dans son contexte. ' +
    'Il présente d’abord l’établissement d’accueil, Info Plus, avant ' +
    'de décrire le contexte général du projet, la problématique à résoudre, les ' +
    'objectifs poursuivis et la solution proposée.'
  ),

  h2('1.1 Présentation de l’établissement Info Plus'),
  ...figure('infoplus-logo.png', 'Logo Info Plus', { maxWidth: 200 }),
  h3('Vocation et missions'),
  p(
    'Info Plus est un centre de formation professionnelle privé qui, depuis ' +
    'plusieurs années, œuvre à la formation d’une jeunesse tunisienne prête ' +
    'à intégrer le marché du travail. Son ambition est de combler l’écart ' +
    'observé entre les cursus universitaires généralistes et les compétences ' +
    'concrètes recherchées par les entreprises du secteur numérique.'
  ),
  p(
    'L’établissement s’appuie pour cela sur une pédagogie active fondée ' +
    'sur trois piliers : une base théorique solide (algorithmique, bases de ' +
    'données, réseaux, gestion), une pratique intensive à travers de nombreux ' +
    'travaux dirigés et travaux pratiques, et enfin des projets réels menés ' +
    'en collaboration avec des entreprises partenaires. Ce dernier point est ' +
    'particulièrement important : il permet à chaque étudiant de valider ses ' +
    'acquis dans un contexte professionnel avant même d’obtenir son diplôme.'
  ),
  h3('L’équipe pédagogique'),
  p(
    'L’équipe pédagogique d’Info Plus est composée de formateurs ' +
    'expérimentés, majoritairement issus du monde professionnel. Cette ' +
    'proximité avec l’industrie garantit un enseignement toujours à jour des ' +
    'dernières technologies et des dernières pratiques. Chaque formateur est ' +
    'à la fois expert dans son domaine et pédagogue accessible.'
  ),
  h3('Le suivi individualisé du projet de fin d’études'),
  p(
    'Le projet de fin d’études, considéré comme la synthèse de la formation, ' +
    'bénéficie d’un accompagnement particulier. Chaque étudiant est ' +
    'encadré individuellement par un enseignant référent qui l’aide à ' +
    'définir son sujet, à structurer sa démarche, à choisir les technologies ' +
    'appropriées et à rédiger son rapport. Cet accompagnement, dont j’ai eu ' +
    'la chance de bénéficier de la part de Madame Yosra DHAOUADI, a été ' +
    'déterminant pour mener ce projet à son terme.'
  ),
  p(
    'Info Plus est un centre de formation professionnelle privé spécialisé ' +
    'dans les métiers de l’informatique, du numérique et de la gestion. ' +
    'L’établissement propose des formations diplômantes de niveau BTS ainsi ' +
    'que des formations qualifiantes courtes destinées aux jeunes bacheliers ' +
    'comme aux professionnels en reconversion.'
  ),
  p(
    'La formation en BTS Informatique de Gestion suivie dans le cadre de ce ' +
    'projet forme des techniciens supérieurs capables de concevoir, développer ' +
    'et maintenir des solutions informatiques adaptées aux besoins des ' +
    'entreprises. Elle combine des enseignements théoriques solides en ' +
    'algorithmique, bases de données, génie logiciel et gestion, avec des ' +
    'travaux pratiques réguliers sur des cas concrets.'
  ),
  p(
    'L’établissement met un accent particulier sur l’accompagnement ' +
    'individualisé de ses étudiants, notamment lors du projet de fin ' +
    'd’études, considéré comme la synthèse de deux années de formation. ' +
    'Ce projet permet à l’étudiant de démontrer sa capacité à mener un ' +
    'travail complet, depuis l’analyse d’un besoin jusqu’à la ' +
    'livraison d’une solution logicielle fonctionnelle.'
  ),

  h2('1.2 Contexte du projet'),
  p(
    'Le tourisme représente en Tunisie un secteur clé, contribuant significativement ' +
    'au produit intérieur brut et à l’emploi. La ville de Bizerte, chef-lieu ' +
    'du gouvernorat éponyme, bénéficie d’atouts touristiques remarquables : ' +
    'un vieux port historique classé, la citadelle du XVIIe siècle, le Cap Blanc ' +
    '(point le plus septentrional du continent africain), le parc national ' +
    'de l’Ichkeul (site UNESCO), la corniche et les plages de Rimel.'
  ),
  p(
    'Pourtant, à l’ère des applications mobiles, la ville souffre encore ' +
    'd’un déficit criant d’outils numériques dédiés. Les visiteurs se ' +
    'reposent essentiellement sur des applications généralistes qui offrent une ' +
    'expérience utilisateur homogène et impersonnelle, sans distinction pour la ' +
    'spécificité tunisienne (prix en dinars, culture, langue arabe).'
  ),
  quote(
    '« Un touriste bien informé est un touriste satisfait. Un touriste satisfait ' +
    'devient le meilleur ambassadeur d’une destination. »'
  ),
  p(
    'Face à ce constat, l’idée de développer une application mobile locale, ' +
    'moderne, en trois langues (français, anglais, arabe) et centrée sur les ' +
    'vrais lieux de Bizerte s’est imposée naturellement. C’est ainsi ' +
    'qu’est né le projet Bon Plan Bizerte.'
  ),

  h2('1.3 Problématique'),
  p(
    'La problématique centrale de ce projet peut se formuler ainsi :'
  ),
  quote(
    'Comment concevoir et développer une application mobile multiplateforme, ' +
    'ergonomique et multilingue, capable de centraliser en un seul outil ' +
    'l’ensemble des points d’intérêt touristiques de la ville de Bizerte, ' +
    'tout en offrant à l’utilisateur une expérience personnalisée et hors ' +
    'ligne partiellement fonctionnelle ?'
  ),
  p('Cette problématique globale se décline en plusieurs sous-questions :'),
  bullet('Quelles technologies choisir pour un développement à la fois rapide et professionnel ?'),
  bullet('Comment structurer les données pour permettre une évolution vers une base de données réelle ?'),
  bullet('Comment garantir une expérience utilisateur cohérente en mode clair et sombre ?'),
  bullet('Comment intégrer la localisation géographique et la navigation cartographique ?'),
  bullet('Comment supporter trois langues (français, anglais, arabe) de manière élégante ?'),

  h2('1.4 Objectifs du projet'),
  p('Les objectifs assignés au projet sont les suivants :'),
  num('Concevoir une architecture logicielle modulaire, maintenable et évolutive.'),
  num('Développer une application mobile fonctionnelle sous iOS et Android.'),
  num('Cataloguer environ trente points d’intérêt réels de la région de Bizerte, répartis en six catégories.'),
  num('Intégrer une cartographie interactive avec géolocalisation.'),
  num('Proposer une gestion complète des favoris et un planificateur d’itinéraire.'),
  num('Supporter le mode sombre et le multilinguisme (FR, EN, AR).'),
  num('Fournir un design moderne, épuré et respectant les codes visuels actuels.'),
  num('Produire une documentation technique complète (diagrammes UML, MCD, code commenté).'),

  h2('1.5 Étude de l’existant'),
  p(
    'Avant de proposer une solution, il est nécessaire d’étudier les outils ' +
    'déjà disponibles sur le marché pour la découverte touristique. Cette ' +
    'analyse permet d’identifier les points forts et les faiblesses des ' +
    'solutions existantes, et de positionner notre propre proposition.'
  ),
  h3('Google Maps'),
  p(
    'Google Maps est aujourd’hui l’outil de référence pour la navigation ' +
    'et la découverte de lieux. Il offre une couverture mondiale, une base ' +
    'de données massive, et des fonctions d’itinéraire en temps réel très ' +
    'performantes. Toutefois, il souffre de plusieurs limites dans notre contexte : ' +
    'les informations ne sont pas curées (fiabilité inégale des avis), les ' +
    'lieux tunisiens sont souvent mal renseignés (photos manquantes, horaires ' +
    'incorrects), et l’expérience n’est pas contextualisée par ville.'
  ),
  h3('Tripadvisor'),
  p(
    'Tripadvisor est spécialisé dans les avis touristiques et couvre bien ' +
    'l’hôtellerie et la restauration internationales. Il propose des classements ' +
    'et des filtres pertinents. Néanmoins, il présente lui aussi des faiblesses ' +
    'pour Bizerte : peu de restaurants locaux référencés (les meilleurs ' +
    'établissements populaires ne figurent souvent pas dans le top), interface ' +
    'chargée avec beaucoup de publicité, absence de fonction de planification.'
  ),
  h3('Foursquare et applications généralistes'),
  p(
    'Les autres applications généralistes (Foursquare, Yelp) souffrent des ' +
    'mêmes limites : couverture inégale, absence de spécialisation locale, ' +
    'expérience utilisateur pensée pour un marché mondial et non local.'
  ),
  h3('Bilan de l’étude et positionnement'),
  p(
    'Il ressort de cette analyse qu’aucune solution existante n’offre à la ' +
    'fois une couverture locale exhaustive de Bizerte, une expérience ' +
    'utilisateur moderne pensée mobile-first, et un accompagnement de bout en ' +
    'bout (découverte + planification + itinéraire). Notre application ' +
    'Bon Plan Bizerte se positionne précisément dans cet espace vacant.'
  ),

  h2('1.6 Solution proposée'),
  p(
    'La solution retenue est une application mobile multiplateforme développée ' +
    'avec la technologie React Native et l’écosystème Expo. Ce choix permet ' +
    'de mutualiser un unique code source JavaScript pour générer deux ' +
    'applications natives : une pour iOS et une pour Android. Le développement, ' +
    'les tests et le déploiement sont ainsi grandement simplifiés.'
  ),
  p(
    'L’application se compose de six catégories principales : restaurants, ' +
    'cafés, plages, nature, activités et boutiques. Chaque lieu dispose ' +
    'd’une fiche détaillée avec photos, description, coordonnées GPS, ' +
    'fourchette de prix, note et avis. L’utilisateur peut ajouter un lieu ' +
    'à ses favoris ou à son planning journalier, obtenir un itinéraire vers ' +
    'le lieu via l’application cartographique de son téléphone, ou encore ' +
    'partager la fiche via les canaux natifs (WhatsApp, Messages, Mail).'
  ),
  p(
    'Le projet aboutit à une application complète, testée sur appareil réel, ' +
    'et prête à être enrichie par une base de données back-end (Supabase ou ' +
    'Firebase) dans une phase ultérieure.'
  ),
);

// ============================================================================
// CHAPITRE 2 - ANALYSE ET SPECIFICATION DES BESOINS
// ============================================================================
children.push(
  h1(2, 'Analyse et spécification des besoins'),
  p(
    'Ce chapitre présente l’analyse fonctionnelle du projet Bon Plan Bizerte. ' +
    'Il identifie les acteurs, recense les besoins fonctionnels et non ' +
    'fonctionnels, puis modélise les usages à travers un diagramme de cas ' +
    'd’utilisation UML.'
  ),

  h2('2.1 Identification des acteurs'),
  p(
    'Un acteur est une entité externe (personne, système, matériel) qui ' +
    'interagit avec le système. Dans le cadre de Bon Plan Bizerte, deux ' +
    'acteurs principaux ont été identifiés :'
  ),
  h3('Acteur principal : Le Touriste'),
  p(
    'Il s’agit de l’utilisateur final de l’application. Ce peut être ' +
    'un touriste national tunisien, un touriste étranger en visite, ou tout ' +
    'simplement un habitant local souhaitant redécouvrir sa ville. Le touriste ' +
    'consulte les fiches des lieux, planifie sa journée, ajoute des favoris ' +
    'et modifie ses préférences (thème, langue).'
  ),
  h3('Acteur secondaire : Le Système de Cartes'),
  p(
    'C’est un système externe (Apple Maps ou Google Maps selon le téléphone) ' +
    'avec lequel l’application communique pour ouvrir un itinéraire vers ' +
    'un lieu. L’application ne dessine pas elle-même la route ; elle ' +
    'délègue cette fonctionnalité au système natif.'
  ),

  h2('2.2 Besoins fonctionnels'),
  p(
    'Les besoins fonctionnels décrivent les fonctionnalités que l’application ' +
    'doit obligatoirement offrir. Ils ont été identifiés à l’issue d’une ' +
    'phase d’analyse de l’existant et d’entretiens informels avec ' +
    'des utilisateurs potentiels.'
  ),
  h3('Consultation du contenu'),
  bullet('Parcourir la page d’accueil avec les catégories et les lieux populaires.'),
  bullet('Parcourir les lieux par catégorie (restaurants, cafés, plages, nature, activités, shopping).'),
  bullet('Consulter la fiche détaillée d’un lieu avec photos, description, prix, note.'),
  bullet('Rechercher un lieu par son nom, sa catégorie ou son adresse.'),
  bullet('Filtrer une liste par « les mieux notés », « économique » ou « favoris ».'),
  h3('Interaction avec les lieux'),
  bullet('Ajouter ou retirer un lieu de ses favoris.'),
  bullet('Obtenir un itinéraire routier vers le lieu (ouverture de Maps).'),
  bullet('Appeler directement le lieu par téléphone.'),
  bullet('Visiter le site web du lieu.'),
  bullet('Partager la fiche du lieu via la feuille de partage native.'),
  h3('Planification'),
  bullet('Ajouter un lieu au planning journalier.'),
  bullet('Consulter le planning sous forme de timeline horaire.'),
  bullet('Ajouter une activité vierge modifiable.'),
  bullet('Supprimer une activité du planning.'),
  h3('Cartographie'),
  bullet('Afficher tous les lieux sur une carte interactive.'),
  bullet('Filtrer les marqueurs de la carte par catégorie.'),
  bullet('Zoomer sur un marqueur pour voir la fiche résumée.'),
  h3('Préférences utilisateur'),
  bullet('Changer le thème visuel (clair ou sombre).'),
  bullet('Changer la langue de l’interface (français, anglais, arabe).'),
  bullet('Consulter le nombre de favoris et d’activités ajoutés.'),
  bullet('Changer la ville actuelle.'),

  h2('2.3 Besoins non fonctionnels'),
  p(
    'Les besoins non fonctionnels décrivent les contraintes de qualité que ' +
    'doit respecter l’application. Ils sont tout aussi importants que les ' +
    'besoins fonctionnels car ils conditionnent l’adoption de l’outil ' +
    'par les utilisateurs.'
  ),
  h3('Ergonomie'),
  p(
    'L’interface doit être moderne, épurée et intuitive. Un utilisateur qui ' +
    'découvre l’application doit pouvoir accomplir ses tâches principales ' +
    'sans avoir besoin d’une notice explicative. Les codes visuels ' +
    'utilisés (icônes, couleurs, gestes) doivent respecter les conventions ' +
    'connues des applications mobiles modernes.'
  ),
  h3('Performance'),
  p(
    'L’application doit démarrer en moins de cinq secondes sur un ' +
    'smartphone récent. Les transitions entre écrans doivent être instantanées. ' +
    'Le scroll doit rester fluide à soixante images par seconde même lorsque ' +
    'la liste contient plusieurs dizaines d’éléments.'
  ),
  h3('Portabilité'),
  p(
    'L’application doit fonctionner à la fois sur iOS (iPhone) et sur ' +
    'Android, dans les versions récentes des deux systèmes. Un même code ' +
    'source doit produire les deux versions.'
  ),
  h3('Maintenabilité'),
  p(
    'Le code doit être organisé, commenté et modulaire. Ajouter une nouvelle ' +
    'catégorie ou un nouveau lieu ne doit demander qu’une modification ' +
    'localisée. Le passage éventuel à une vraie base de données doit être ' +
    'possible sans réécrire l’interface.'
  ),
  h3('Sécurité'),
  p(
    'Bien que la version actuelle ne stocke pas de données sensibles, ' +
    'l’architecture est pensée pour intégrer, dans une phase ultérieure, ' +
    'une authentification sécurisée et un chiffrement des communications.'
  ),
  h3('Accessibilité'),
  p(
    'Les textes doivent bénéficier d’un contraste suffisant. Le mode sombre ' +
    'est proposé pour réduire la fatigue visuelle. Le support de trois langues ' +
    '(français, anglais, arabe) rend l’application accessible à un public ' +
    'très large.'
  ),

  h2('2.4 Diagramme de séquence — flux « ajouter au planning »'),
  p(
    'Pour illustrer le fonctionnement dynamique de l’application, examinons ' +
    'en détail le flux « ajouter un lieu au planning journalier ». Ce ' +
    'scénario est particulièrement représentatif car il touche plusieurs ' +
    'écrans et met en jeu l’état global.'
  ),
  h3('Étapes chronologiques'),
  num('L’utilisateur ouvre l’application et arrive sur l’écran d’accueil.'),
  num('Il tape sur la catégorie « Restaurants » pour afficher la liste.'),
  num('Dans la grille, il tape sur la carte du restaurant Crock’in.'),
  num('L’application ouvre la fiche détaillée du lieu (PlaceDetailScreen).'),
  num('L’utilisateur consulte la description, les photos, les avis.'),
  num('Il tape sur le bouton « Ajouter au planning » en bas de l’écran.'),
  num('Le store vérifie que le lieu n’est pas déjà présent dans le planning.'),
  num('Il calcule automatiquement l’heure prévue (heure de la dernière activité + 2 h).'),
  num('Il crée un nouvel objet activité et l’ajoute à la liste userItinerary.'),
  num('React détecte le changement d’état et rafraîchit l’onglet Itinéraire.'),
  num('Une alerte confirme l’ajout à l’utilisateur avec un bouton « Voir l’itinéraire ».'),
  num('L’utilisateur peut immédiatement basculer sur l’onglet Itinéraire pour visualiser sa journée mise à jour.'),

  h2('2.5 Diagramme de cas d’utilisation'),
  p(
    'Le diagramme de cas d’utilisation UML formalise l’ensemble des ' +
    'interactions possibles entre les acteurs et le système. Il constitue la ' +
    'vue fonctionnelle de référence pour la suite du projet.'
  ),
  p(
    'Chaque ovale représente une action possible. Les flèches partant du ' +
    'touriste (bonhomme allumette) vers les ovales indiquent les actions qu’il ' +
    'peut déclencher. Les liens pointillés étiquetés <<include>> signifient qu’une ' +
    'action en déclenche automatiquement une autre : par exemple, « consulter ' +
    'les détails » inclut systématiquement « voir la galerie photos » et « lire ' +
    'les avis ». Le stéréotype <<extend>> indique une action optionnelle qui peut ' +
    'être déclenchée depuis une autre.'
  ),
  ...figure('diagram-usecase.png', 'Diagramme de cas d’utilisation de l’application Bon Plan Bizerte'),
  p(
    'Ce diagramme montre clairement la richesse fonctionnelle de l’application. ' +
    'On dénombre plus de vingt cas d’utilisation distincts, ce qui témoigne ' +
    'de la profondeur du travail réalisé. L’acteur secondaire « Système de ' +
    'Cartes » n’est sollicité que par le cas « obtenir l’itinéraire », ce ' +
    'qui reflète bien la délégation claire entre notre application et ' +
    'l’OS du téléphone.'
  ),
);

// ============================================================================
// CHAPITRE 3 - CONCEPTION
// ============================================================================
children.push(
  h1(3, 'Conception'),
  p(
    'Ce chapitre traite de la phase de conception, étape essentielle qui traduit ' +
    'les besoins recueillis en modèles structurels. Deux vues complémentaires ' +
    'sont présentées : le Modèle Conceptuel de Données (vue base de données) ' +
    'et le diagramme de classes UML (vue orientée objet). Sont également ' +
    'décrites l’architecture logicielle globale et la charte graphique.'
  ),

  h2('3.1 Modèle Conceptuel de Données (MCD)'),
  p(
    'Le Modèle Conceptuel de Données, issu de la méthode Merise, formalise ' +
    'les entités du domaine et les associations qui les relient. Bien que ' +
    'l’application actuelle ne repose pas sur une base de données ' +
    'relationnelle (les données sont mockées dans un fichier JavaScript), le ' +
    'MCD est établi dès la conception pour préparer une migration future vers ' +
    'un back-end tel que Supabase (PostgreSQL) ou Firebase (Firestore).'
  ),
  ...figure('diagram-mcd.png', 'Modèle Conceptuel de Données (notation Merise)'),
  p('Les entités identifiées sont les suivantes :'),
  bullet('UTILISATEUR : les visiteurs de l’application (nom, email, langue, thème).'),
  bullet('VILLE : les villes couvertes (Bizerte, à terme Tunis, Sousse, etc.).'),
  bullet('CATEGORIE : les six catégories (Food, Coffee, Beach, Nature, Activity, Shopping).'),
  bullet('LIEU : les points d’intérêt (nom, description, adresse, coordonnées GPS, prix).'),
  bullet('PHOTO : les images associées à chaque lieu (URL, ordre d’affichage).'),
  bullet('AVIS : les commentaires et notes laissés par les utilisateurs.'),
  bullet('FAVORI : table de liaison entre un utilisateur et les lieux qu’il a marqués.'),
  bullet('ITINERAIRE_ITEM : les activités planifiées par un utilisateur dans son journée.'),
  p(
    'Les cardinalités précisent le nombre minimum et maximum d’occurrences ' +
    'de chaque côté d’une association. Par exemple, l’association ' +
    '« depose » entre UTILISATEUR et AVIS est de type (0,n) - (1,1), ce qui ' +
    'signifie qu’un utilisateur peut ne pas avoir posté d’avis ou en avoir ' +
    'posté plusieurs, tandis qu’un avis est toujours associé à exactement un ' +
    'utilisateur.'
  ),

  h2('3.2 Diagramme de classes'),
  p(
    'Le diagramme de classes UML donne une vue orientée objet du même domaine. ' +
    'Il ajoute les méthodes (comportements) aux attributs (données), et fait ' +
    'apparaître les relations d’héritage. Contrairement au MCD, il est ' +
    'proche du code informatique final.'
  ),
  ...figure('diagram-class.png', 'Diagramme de classes UML de l’application'),
  p(
    'La classe abstraite Lieu factorise les attributs communs à tous les lieux ' +
    '(nom, description, coordonnées, note, prix). Elle est ensuite spécialisée ' +
    'en six classes filles par héritage : Restaurant (avec type de cuisine et ' +
    'horaires), Cafe (avec type de boisson et présence du wifi), Plage (avec type ' +
    'de sable et surveillance), LieuNature (avec écosystème et niveau de ' +
    'difficulté), Activite (avec durée et disponibilité d’un guide) et ' +
    'Magasin (avec type de commerce et horaires).'
  ),
  p(
    'Cette hiérarchie de classes reflète le principe de généralisation / ' +
    'spécialisation propre à la programmation orientée objet. La classe Lieu ' +
    'expose des méthodes communes comme obtenirItineraire(), partager(), ' +
    'appeler(). Les classes filles héritent automatiquement de ces méthodes ' +
    'et peuvent les redéfinir si nécessaire.'
  ),
  p(
    'Les autres classes du diagramme sont : Utilisateur (avec méthodes ' +
    'seConnecter, changerTheme, changerLangue), Photo, Avis, Itineraire (avec ' +
    'méthodes ajouterActivite, retirerActivite, calculerDureeTotale), ' +
    'ActiviteItineraire, ainsi que deux énumérations Langue (EN, FR, AR) et ' +
    'ThemeMode (LIGHT, DARK).'
  ),

  h2('3.3 Architecture logicielle'),
  p(
    'L’architecture de l’application repose sur le paradigme des composants ' +
    'React. Un composant est une fonction JavaScript qui reçoit des propriétés ' +
    '(props) et retourne un morceau d’interface utilisateur. Cette approche ' +
    'permet une composition et une réutilisation maximales.'
  ),
  p('Le projet est organisé en couches distinctes :'),
  bullet('Couche présentation : les écrans et composants visuels (10 écrans, 6 composants).'),
  bullet('Couche état : le store global basé sur React Context (favoris, itinéraire, thème, langue).'),
  bullet('Couche données : le fichier mockData.js qui joue le rôle d’une base de données locale.'),
  bullet('Couche navigation : le routeur React Navigation qui orchestre les transitions entre écrans.'),
  bullet('Couche thème : les palettes claire et sombre, plus les tokens de design.'),
  bullet('Couche traduction : le dictionnaire multilingue en trois langues.'),
  p(
    'Cette séparation nette des responsabilités garantit qu’une modification ' +
    'localisée n’a pas d’effet de bord non voulu sur le reste de ' +
    'l’application. Ajouter une nouvelle catégorie de lieux, par exemple, ' +
    'ne demande qu’une modification dans mockData.js et éventuellement ' +
    'dans i18n.js pour la traduction du nom.'
  ),

  h2('3.4 Description détaillée des entités du MCD'),
  h3('L’entité UTILISATEUR'),
  p(
    'L’entité UTILISATEUR représente toute personne inscrite dans ' +
    'l’application. Elle contient les attributs identifiants (id_user, ' +
    'nom, email), les attributs de sécurité (mot_de_passe stocké de manière ' +
    'chiffrée), et les attributs de personnalisation (langue préférée, mode ' +
    'de thème). Un utilisateur peut avoir zéro ou plusieurs favoris, zéro ou ' +
    'plusieurs avis déposés, et une ou plusieurs entrées d’itinéraire. Il ' +
    'est associé à une seule ville de résidence à la fois.'
  ),
  h3('L’entité LIEU'),
  p(
    'L’entité LIEU est le cœur du modèle. Elle décrit chaque point ' +
    'd’intérêt de l’application (restaurant, café, plage, activité, ' +
    'boutique). Ses attributs les plus importants sont le nom, la description, ' +
    'les coordonnées GPS (latitude, longitude) et la fourchette de prix (prix_min, ' +
    'prix_max, prix_symbolique). Un lieu appartient à une seule catégorie et ' +
    'est situé dans une seule ville. Il possède une ou plusieurs photos et ' +
    'peut recevoir zéro ou plusieurs avis.'
  ),
  h3('L’entité CATEGORIE'),
  p(
    'L’entité CATEGORIE regroupe les six grands types de lieux (Food, ' +
    'Coffee, Beach, Nature, Activity, Shopping). Chaque catégorie a un nom, un ' +
    'identifiant technique et une icône associée (utilisée dans l’écran ' +
    'd’accueil et sur la carte). Cette entité permet une extension facile ' +
    'du système : ajouter une septième catégorie ne demande qu’une insertion ' +
    'de ligne dans la table.'
  ),
  h3('L’entité PHOTO'),
  p(
    'L’entité PHOTO stocke les images associées à chaque lieu. Chaque photo ' +
    'a une URL et un ordre d’affichage (utile pour définir laquelle est la ' +
    'photo principale, laquelle apparaît en deuxième dans la galerie, etc.). ' +
    'Une photo est toujours rattachée à un seul lieu.'
  ),
  h3('L’entité AVIS'),
  p(
    'L’entité AVIS matérialise les commentaires laissés par les utilisateurs ' +
    'sur les lieux. Elle contient la note (entier de 1 à 5), le texte du ' +
    'commentaire et la date de dépôt. Chaque avis est associé à exactement un ' +
    'utilisateur et à exactement un lieu.'
  ),
  h3('L’entité FAVORI'),
  p(
    'FAVORI est une table de liaison (association many-to-many entre ' +
    'UTILISATEUR et LIEU). Elle ne contient qu’un seul attribut propre : la ' +
    'date d’ajout aux favoris. Cette table permet de savoir quels lieux un ' +
    'utilisateur donné a mis en favori, et réciproquement quels utilisateurs ' +
    'ont marqué un lieu donné.'
  ),
  h3('L’entité ITINERAIRE_ITEM'),
  p(
    'ITINERAIRE_ITEM représente une activité programmée dans le planning ' +
    'journalier d’un utilisateur. Elle contient l’heure de début, la ' +
    'durée, le titre, un sous-titre descriptif et une couleur d’affichage. ' +
    'Elle est associée à un utilisateur et, optionnellement, à un lieu ' +
    'référencé (si l’activité correspond à un lieu de l’application).'
  ),

  h2('3.5 Choix des couleurs et charte graphique'),
  p(
    'La charte graphique de Bon Plan Bizerte se veut moderne, épurée et ' +
    'immédiatement reconnaissable. Elle repose sur trois principes :'
  ),
  num('Une couleur primaire forte : le bleu profond #1D2BEF, choisi pour évoquer à la fois la Méditerranée et la technologie.'),
  num('Une hiérarchie typographique claire : les titres en Cambria pour la personnalité, le corps en Calibri pour la lisibilité.'),
  num('Un système de tokens : espacements en 4, 8, 12, 16, 24, 32 pixels ; rayons d’arrondi en 8, 12, 18, 24 pixels. Cette régularité garantit une cohérence visuelle sur tous les écrans.'),
  p(
    'Le mode sombre a été conçu comme une variante à part entière et non ' +
    'comme une simple inversion. Les couleurs sombres retenues sont douces ' +
    '(bleu-anthracite plutôt que noir pur) pour réduire la fatigue visuelle ' +
    'lors d’une utilisation prolongée le soir.'
  ),
);

// ============================================================================
// CHAPITRE 4 - REALISATION
// ============================================================================
children.push(
  h1(4, 'Réalisation'),
  p(
    'Ce chapitre présente la phase concrète de développement : l’environnement ' +
    'de travail, les technologies retenues, la structure du projet, les écrans ' +
    'finaux et les fonctionnalités clés implémentées.'
  ),

  h2('4.1 Environnement logiciel'),
  p('L’environnement de développement utilisé est le suivant :'),
  bullet('Système d’exploitation : Windows 11.'),
  bullet('Éditeur de code : Visual Studio Code, avec les extensions React Native Tools, ES7+ Snippets et Prettier.'),
  bullet('Terminal : PowerShell et Git Bash pour les commandes système.'),
  bullet('Gestionnaire de versions : Git avec le service GitHub pour l’hébergement du dépôt.'),
  bullet('Outil de conception graphique : Figma pour les maquettes préliminaires.'),
  bullet('Application de test sur téléphone : Expo Go, disponible gratuitement sur l’App Store.'),

  h2('4.2 Langages et frameworks'),
  h3('JavaScript ES2022'),
  p(
    'Le code de l’application est écrit en JavaScript, la version moderne du ' +
    'langage supportant les fonctionnalités récentes : arrow functions, ' +
    'destructuring, async/await, spread operator, template literals, modules. ' +
    'Ce choix a permis de bénéficier d’un langage universel, largement ' +
    'documenté et pour lequel je disposais déjà d’une base solide.'
  ),
  h3('React 18'),
  p(
    'React est la bibliothèque JavaScript la plus utilisée au monde pour ' +
    'construire des interfaces utilisateur. Créée par Facebook (Meta) en 2013, ' +
    'elle repose sur trois idées majeures : les composants (petites unités ' +
    'réutilisables), le virtual DOM (mise à jour efficace de l’interface), et ' +
    'les hooks (fonctions spéciales qui accèdent à l’état ou au cycle de vie).'
  ),
  h3('React Native 0.76'),
  p(
    'React Native est un framework mobile qui applique les concepts de React ' +
    'à l’écriture d’applications iOS et Android. Il traduit les ' +
    'composants JavaScript en composants natifs (UIView sur iOS, ViewGroup sur ' +
    'Android). L’expérience utilisateur est donc identique à celle d’une ' +
    'application développée en Swift ou Kotlin, tout en n’écrivant qu’un ' +
    'seul code source.'
  ),
  h3('Expo SDK 54'),
  p(
    'Expo est une surcouche officielle qui simplifie considérablement l’usage ' +
    'de React Native. Sans Expo, il faudrait installer Xcode (uniquement ' +
    'disponible sur Mac) et Android Studio, configurer manuellement les ' +
    'certificats et gérer les mises à jour des dépendances natives. Expo prend ' +
    'tout cela en charge et met à disposition Expo Go, une application ' +
    'compagnon qui permet de tester son application sur son téléphone en ' +
    'scannant simplement un QR code.'
  ),
  h3('React Navigation 7'),
  p(
    'React Navigation est la bibliothèque standard pour la gestion des routes ' +
    'et des transitions entre écrans en React Native. Elle propose deux types ' +
    'de navigateurs combinés dans ce projet : un Stack Navigator (pile ' +
    'd’écrans avec animation de push / pop) et un Bottom Tabs Navigator ' +
    '(barre d’onglets en bas de l’écran).'
  ),
  h3('react-native-maps'),
  p(
    'Cette bibliothèque encapsule les API cartographiques natives : Apple Maps ' +
    'sur iOS (gratuit, aucune clé requise) et Google Maps sur Android. Elle ' +
    'expose un composant MapView personnalisable et permet de placer des ' +
    'marqueurs (Marker) et des tracés (Polyline).'
  ),

  h2('4.3 Structure du projet'),
  p(
    'L’arborescence du projet est organisée de manière hiérarchique et ' +
    'sémantique. Chaque dossier a une responsabilité claire.'
  ),
  new Paragraph({
    spacing: { before: 120, after: 120 },
    children: [new TextRun({
      text:
`bon plan/
  App.js                         (point d'entree)
  app.json                       (configuration Expo)
  package.json                   (dependances NPM)
  assets/
    icon.png                     (icone de l'app)
    splash-icon.png              (ecran de demarrage)
    home/                        (photos des lieux)
  src/
    store.js                     (etat global)
    i18n.js                      (traductions FR/EN/AR)
    theme/
      colors.js                  (palettes clair et sombre)
    data/
      mockData.js                (donnees des lieux)
    navigation/
      AppNavigator.js            (routage des ecrans)
    screens/
      SplashScreen.js
      Onboarding1.js
      Onboarding2.js
      ChooseCity.js
      HomeScreen.js
      CategoryListScreen.js
      PlaceDetailScreen.js
      ItineraryScreen.js
      MapScreen.js
      ProfileScreen.js`,
      font: FONT_MONO, size: 18, color: INK,
    })],
  }),
  p(
    'Le projet compte environ trois mille sept cents lignes de code JavaScript ' +
    'réparties sur seize fichiers, avec un ratio de commentaires supérieur à ' +
    'trente pour cent, ce qui témoigne d’un effort de documentation constant.'
  ),

  h2('4.4 Écrans de l’application'),
  p(
    'L’application se compose de dix écrans principaux, chacun ayant une ' +
    'responsabilité fonctionnelle unique. Les captures suivantes présentent ' +
    'quelques-uns des écrans clés.'
  ),
  h3('L’icône de l’application'),
  ...figure('app-icon.png', 'Icône de l’application Bon Plan Bizerte', { maxWidth: 200 }),
  p(
    'L’icône, en forme de goutte inversée avec les initiales « Bp », a été ' +
    'conçue pour être immédiatement reconnaissable sur l’écran d’accueil ' +
    'du téléphone. Sa forme évoque un marqueur cartographique, en écho au ' +
    'thème de la découverte géographique. Elle utilise deux tons de bleu — ' +
    'foncé pour le contour de la goutte, principal pour l’intérieur — ' +
    'et une typographie blanche sans-serif pour maximiser le contraste.'
  ),

  h3('Écran 1 — Splash (démarrage)'),
  ...figure('mockup-splash.png', 'Aperçu de l’écran splash affiché au démarrage', { maxWidth: 300 }),
  p(
    'L’écran splash apparaît immédiatement au lancement de l’application. ' +
    'Il présente un dégradé bleu profond (du bleu foncé #0E1BCF vers le bleu ' +
    'plus clair #3A46FF) sur lequel se détache le logo dans une carte blanche ' +
    'arrondie. Deux gros ronds translucides ajoutent une touche de profondeur. ' +
    'Cet écran reste affiché exactement 2,2 secondes avant de céder la place ' +
    'à l’onboarding.'
  ),

  h3('Écran 2 — Onboarding (présentation)'),
  ...figure('mockup-onboarding.png', 'Aperçu de l’un des deux écrans d’onboarding', { maxWidth: 300 }),
  p(
    'Deux écrans d’onboarding se succèdent au premier lancement pour ' +
    'présenter les fonctionnalités clés de l’application. Le premier ' +
    'met en avant la découverte des points d’intérêt à proximité (avec ' +
    'une illustration de carte parsemée de pins colorés). Le second met ' +
    'l’accent sur la personnalisation du voyage. Chaque écran comporte un ' +
    'bouton « Skip » en haut à droite, une illustration centrale dessinée ' +
    'en composants React Native, un titre, un sous-titre, deux points de ' +
    'progression et un bouton bleu « Next » en bas.'
  ),

  h3('Écran 3 — Home (accueil)'),
  ...figure('mockup-home.png', 'Aperçu de l’écran d’accueil de l’application', { maxWidth: 320 }),
  p(
    'L’écran d’accueil est le point d’entrée central. De haut en bas, ' +
    'on trouve un en-tête avec une pastille indiquant la ville sélectionnée ' +
    '(Bizerte) et une icône de notification à droite, puis une barre de ' +
    'recherche, une rangée horizontale de six catégories illustrées, une ' +
    'grande bannière bleue « Plan your perfect day » invitant à ouvrir ' +
    'l’écran d’itinéraire, un carrousel horizontal « Popular » avec les ' +
    'deux ou trois lieux les plus recommandés, et enfin une liste verticale ' +
    '« Nearby » présentant les lieux à proximité.'
  ),
  p(
    'Chaque carte de la section « Popular » ou « Nearby » est cliquable et ' +
    'ouvre la fiche détaillée du lieu correspondant. Le tap sur une icône de ' +
    'catégorie ouvre la liste filtrée pour cette catégorie. La barre ' +
    'd’onglets en bas d’écran est présente en permanence et permet de ' +
    'passer instantanément entre Home, Map, Itinerary et Profile.'
  ),

  h3('Écran 4 — Category (grille filtrée)'),
  ...figure('mockup-category.png', 'Aperçu de l’écran de liste par catégorie', { maxWidth: 320 }),
  p(
    'Cet écran s’affiche après avoir tapé une catégorie sur l’accueil. ' +
    'Il présente tous les lieux de la catégorie sous forme d’une grille à ' +
    'deux colonnes. Un champ de recherche en haut permet de filtrer les ' +
    'résultats en temps réel selon le nom, la catégorie ou l’adresse. ' +
    'Quatre chips de filtre supplémentaires (« All », « Top rated », ' +
    '« Budget », « Favorites ») permettent respectivement de tout voir, de ' +
    'trier par note décroissante, de trier par prix croissant, ou de ne voir ' +
    'que les lieux marqués en favori.'
  ),
  p(
    'Chaque carte affiche l’image principale du lieu, son nom, sa note avec ' +
    'le nombre d’avis, sa catégorie et son symbole de prix ($, $$ ou $$$). ' +
    'Un petit bouton en forme de cœur en haut à droite de chaque image ' +
    'permet d’ajouter ou de retirer instantanément le lieu des favoris.'
  ),

  h3('Écran 5 — Place Detail (fiche détaillée)'),
  ...figure('mockup-detail.png', 'Aperçu de la fiche détaillée d’un lieu', { maxWidth: 320 }),
  p(
    'L’écran de fiche détaillée est le plus riche de l’application. Il ' +
    'commence par une grande image d’en-tête (hero) qui occupe le tiers ' +
    'supérieur de l’écran. Trois boutons flottants sont superposés à cette ' +
    'image : retour (en haut à gauche), partage et favori (en haut à droite). ' +
    'De petits points en bas de l’image indiquent qu’il s’agit d’une ' +
    'galerie déroulable.'
  ),
  p(
    'Sous l’image, le nom du lieu apparaît en grands caractères, suivi de ' +
    'son adresse et d’un badge de prix arrondi. Une pastille avec l’icône ' +
    'portefeuille indique la fourchette de prix précise en dinars tunisiens. ' +
    'Une bande grise regroupe trois statistiques (note moyenne, nombre ' +
    'd’avis, statut d’ouverture). Si le lieu dispose d’un numéro de ' +
    'téléphone et/ou d’un site web, deux pastilles cliquables apparaissent : ' +
    'la première déclenche l’appel, la seconde ouvre le navigateur.'
  ),
  p(
    'La section « About » présente la description textuelle. La section ' +
    '« Gallery » affiche trois photos supplémentaires en défilement horizontal. ' +
    'La section « Reviews » liste les avis existants avec avatar, nom, date et ' +
    'notation à cinq étoiles. Enfin, un pied de page collant contient deux ' +
    'gros boutons : « Directions » (bleu clair, ouvre Maps) et « Add to itinerary » ' +
    '(bleu foncé, ajoute au planning).'
  ),

  h3('Écran 6 — Map (carte interactive)'),
  ...figure('mockup-map.png', 'Aperçu de la carte interactive avec les marqueurs colorés', { maxWidth: 320 }),
  p(
    'L’écran Map présente tous les lieux de l’application sur une ' +
    'véritable carte fournie par Apple Maps (sur iOS) ou Google Maps (sur ' +
    'Android). Chaque lieu est représenté par un marqueur circulaire coloré ' +
    'selon sa catégorie : bleu pour les restaurants, violet pour les cafés, ' +
    'vert pour les sites naturels, rouge pour le shopping, orange pour les ' +
    'boutiques, cyan pour les activités.'
  ),
  p(
    'En haut de l’écran, une barre horizontale contient un bouton retour, ' +
    'un champ de recherche et un bouton de recentrage sur Bizerte. En dessous, ' +
    'une rangée horizontale de chips permet de filtrer les marqueurs par ' +
    'catégorie. En bas, une carte fixe présente le lieu actuellement sélectionné ' +
    'avec sa photo, son nom, sa note et un bouton bleu qui ouvre la fiche détaillée.'
  ),

  h3('Écran 7 — Itinerary (planning journalier)'),
  ...figure('mockup-itinerary.png', 'Aperçu de la timeline du planning journalier', { maxWidth: 320 }),
  p(
    'L’écran Itinerary présente le planning de la journée sous forme de ' +
    'timeline verticale. En haut, une rangée horizontale des sept jours de la ' +
    'semaine permet de basculer d’un jour à l’autre. Le jour actif est ' +
    'mis en évidence par une pastille bleue.'
  ),
  p(
    'Sous cette barre, une carte récapitulative bleue affiche la date ' +
    'sélectionnée, le nombre total d’activités et leur durée cumulée. Un ' +
    'bouton « + » à droite permet d’ajouter une activité vierge modifiable.'
  ),
  p(
    'La timeline elle-même est composée d’une ligne verticale connectant des ' +
    'points colorés (un par activité). Chaque activité est représentée par une ' +
    'carte à sa droite, avec un liseré coloré à gauche reprenant la couleur du ' +
    'point associé. La carte affiche le titre de l’activité, son sous-titre ' +
    '(par exemple le lieu), et une pastille grise indiquant la durée. Un bouton ' +
    'poubelle à droite permet de supprimer une activité après confirmation.'
  ),

  h3('Écran 8 — Profile (profil et préférences)'),
  ...figure('mockup-profile.png', 'Aperçu du profil avec le sélecteur de thème clair / sombre', { maxWidth: 320 }),
  p(
    'L’écran Profile regroupe toutes les informations et préférences de ' +
    'l’utilisateur. En haut, une carte présente l’avatar circulaire, le ' +
    'nom, l’adresse email et un bouton « Edit profile » en forme de pastille. ' +
    'Juste en dessous, trois statistiques sont affichées côte à côte : le nombre ' +
    'de favoris, le nombre d’activités planifiées, et la ville actuelle.'
  ),
  p(
    'La section « Appearance » propose un sélecteur visuel du thème sous ' +
    'forme de deux grandes cartes côte à côte. La première montre un aperçu ' +
    'du mode clair (fond blanc, texte foncé, accent bleu vif) ; la seconde ' +
    'un aperçu du mode sombre (fond quasi-noir, texte clair, accent bleu plus ' +
    'lumineux). Un simple tap suffit pour basculer instantanément toute ' +
    'l’application entre les deux modes, sans redémarrage ni clignotement.'
  ),
  p(
    'La section « Settings » contient trois lignes cliquables : Notifications ' +
    '(affiche une alerte confirmant leur activation), Language (ouvre une ' +
    'feuille de sélection entre English, Français et العربية), et City ' +
    '(navigue vers l’écran de choix de ville). En bas, une liste « About » ' +
    'propose Help & Support, Terms of service et Version de l’application. ' +
    'Un bouton « Log out » clôt l’écran.'
  ),

  h3('La liste des lieux d’une catégorie'),
  p(
    'En tapant l’une des six catégories depuis l’accueil, l’utilisateur ' +
    'accède à la liste complète des lieux de cette catégorie, présentée sous ' +
    'forme d’une grille à deux colonnes. Un champ de recherche filtre les ' +
    'résultats en temps réel selon le nom, la catégorie ou l’adresse. ' +
    'Quatre chips de filtre supplémentaires permettent d’afficher « Tous », ' +
    '« Mieux notés », « Économique » ou « Favoris uniquement ».'
  ),

  h3('La fiche détaillée d’un lieu'),
  p(
    'La fiche d’un lieu constitue l’écran le plus riche de l’application. ' +
    'Elle affiche : une grande image en tête d’écran avec trois boutons ' +
    'flottants (retour, partage, favori), le nom du lieu, son adresse et son ' +
    'badge de prix, une pastille indiquant la fourchette de prix en dinars ' +
    'tunisiens, trois statistiques (note, nombre d’avis, statut ouvert / ' +
    'fermé), les coordonnées de contact (téléphone, site web), une description ' +
    'textuelle, une galerie horizontale de trois photos, la liste des avis, et ' +
    'enfin un pied de page collant contenant deux boutons majeurs : « Itinéraire » ' +
    'et « Ajouter au planning ».'
  ),

  h3('La carte interactive'),
  p(
    'L’onglet Carte présente tous les lieux sur une véritable carte fournie ' +
    'par Apple Maps ou Google Maps selon le téléphone. Chaque lieu est ' +
    'représenté par un marqueur coloré selon sa catégorie (bleu pour les ' +
    'restaurants, violet pour les cafés, vert pour les sites naturels, etc.). ' +
    'Une rangée horizontale de chips permet de filtrer les marqueurs par ' +
    'catégorie. Taper un marqueur zoome dessus avec une animation fluide et ' +
    'affiche une carte détaillée en bas de l’écran.'
  ),

  h3('Le planning journalier'),
  p(
    'L’onglet Itinéraire présente une timeline verticale des activités ' +
    'planifiées par l’utilisateur pour la journée. Chaque activité est ' +
    'représentée par une carte avec son heure, son titre, son sous-titre et sa ' +
    'durée. Une carte récapitulative en haut de l’écran affiche la date ' +
    'sélectionnée et le nombre total d’activités avec leur durée cumulée. ' +
    'Un bouton en forme de plus permet d’ajouter une activité vierge, et ' +
    'chaque activité peut être supprimée individuellement.'
  ),

  h3('Le profil utilisateur'),
  p(
    'L’onglet Profil regroupe toutes les préférences de l’utilisateur : ' +
    'un avatar avec son nom et son adresse email, un tableau de trois ' +
    'statistiques (nombre de favoris, nombre d’activités, ville actuelle), ' +
    'un sélecteur graphique du thème (deux grandes cartes montrant un aperçu ' +
    'du mode clair et du mode sombre), et une liste de préférences ' +
    'comprenant notifications, langue, ville, aide, conditions et version. ' +
    'Un bouton de déconnexion en bas clôt l’écran.'
  ),

  h2('4.5 Analyse détaillée du code source'),
  h3('Le fichier App.js — point d’entrée'),
  p(
    'Le fichier App.js constitue le point d’entrée de l’application. ' +
    'Son rôle est extrêmement simple : envelopper toute l’application dans ' +
    'les fournisseurs (providers) qui rendent le thème et l’état accessibles ' +
    'partout. Il ne contient qu’une vingtaine de lignes mais joue un rôle ' +
    'structurel majeur : sans lui, aucun autre écran ne pourrait accéder ni ' +
    'au thème actif, ni à la mémoire globale.'
  ),
  h3('Le fichier store.js — la mémoire globale'),
  p(
    'Le fichier store.js est le cœur de la logique métier. Il expose un ' +
    'composant React StoreProvider qui utilise deux contexts : ThemeContext ' +
    '(pour la palette claire ou sombre) et StoreContext (pour les favoris, ' +
    'l’itinéraire, la langue). À chaque changement de l’un de ces états, ' +
    'React redessine automatiquement tous les composants qui les consomment.'
  ),
  p(
    'Les principales fonctions exposées sont : toggleFavorite(id) qui ajoute ' +
    'ou retire un lieu des favoris, addToItinerary(place) qui ajoute un lieu ' +
    'au planning journalier avec calcul automatique de l’heure, ' +
    'removeFromItinerary(id) pour retirer une activité, setMode(mode) pour ' +
    'changer le thème, setLanguage(code) pour changer la langue, et enfin ' +
    't(key) pour traduire une clé.'
  ),
  h3('Le fichier navigation/AppNavigator.js — le routeur'),
  p(
    'AppNavigator utilise la librairie React Navigation, standard de fait ' +
    'pour la navigation en React Native. Il combine deux navigateurs : un Stack ' +
    'Navigator qui empile les écrans (splash → onboarding → main) et un Bottom ' +
    'Tabs Navigator qui présente les quatre onglets principaux (Home, Map, ' +
    'Itinerary, Profile). Les écrans PlaceDetail et CategoryList sont dans le ' +
    'Stack et s’affichent par-dessus les onglets.'
  ),
  h3('Le fichier data/mockData.js — les données'),
  p(
    'Le fichier mockData.js remplit le rôle qu’une base de données ou une ' +
    'API remplirait dans une véritable application de production. Il contient ' +
    'la liste des six catégories et environ trente lieux répartis entre food, ' +
    'coffee, nature, activity et shopping. Chaque lieu est un objet ' +
    'JavaScript avec ses attributs (nom, description, coordonnées GPS, prix, ' +
    'photos, gallery). Lorsque le projet évoluera vers une véritable base de ' +
    'données, il suffira de remplacer les exports statiques par des appels ' +
    'asynchrones à une API : le reste du code n’aura pas besoin de bouger.'
  ),
  h3('Le fichier theme/colors.js — les palettes'),
  p(
    'Le fichier colors.js centralise toute la charte graphique. Il définit ' +
    'deux palettes complètes (lightColors et darkColors) qui contiennent ' +
    'exactement les mêmes clés mais des valeurs différentes. Les constantes ' +
    'spacing (4, 8, 12, 16, 24, 32 pixels) et radius (8, 12, 18, 24 pixels) ' +
    'complètent le système de design. Le hook useTheme() est appelé dans ' +
    'chaque écran pour récupérer la palette active.'
  ),
  h3('Le fichier i18n.js — les traductions'),
  p(
    'Le fichier i18n.js est un dictionnaire de traductions. Chaque clé (par ' +
    'exemple "home.popular") est associée à un objet contenant les traductions ' +
    'en anglais, français et arabe. La fonction translate(clé, langue) va ' +
    'chercher la valeur correspondante, avec un système de fallback en trois ' +
    'niveaux : d’abord la langue demandée, puis l’anglais par défaut, ' +
    'puis la clé brute (pour repérer les oublis pendant le développement).'
  ),

  h2('4.6 Principes de design retenus'),
  h3('Cohérence visuelle'),
  p(
    'Chaque écran de l’application respecte les mêmes conventions visuelles : ' +
    'même palette de couleurs, mêmes espacements (multiples de 4 pixels), ' +
    'mêmes rayons d’arrondi (8, 12, 18, 24 pixels), mêmes tailles de police ' +
    '(12, 14, 16, 22, 32 pt). Cette régularité crée une expérience utilisateur ' +
    'fluide et prévisible : quel que soit l’écran où il se trouve, ' +
    'l’utilisateur reconnaît immédiatement les éléments interactifs et sait ' +
    'comment agir avec eux.'
  ),
  h3('Hiérarchie de l’information'),
  p(
    'L’information est toujours organisée du plus général au plus spécifique. ' +
    'Sur la fiche détaillée par exemple, le nom du lieu est la première ' +
    'chose lue (taille la plus grande, contraste maximal), suivi de son ' +
    'adresse et de son prix (taille moyenne, contraste réduit), puis des ' +
    'détails secondaires (description, avis). Cette hiérarchie est renforcée ' +
    'par la couleur : les éléments importants utilisent le bleu principal, les ' +
    'éléments secondaires des tons de gris.'
  ),
  h3('Retour immédiat aux actions utilisateur'),
  p(
    'Chaque action déclenche un retour visuel immédiat : le bouton favori ' +
    'passe du contour au cœur plein rouge, le bouton « Add to itinerary » ' +
    'devient vert avec le texte « Added », les alertes de confirmation ' +
    'apparaissent à la validation d’actions importantes. Ce feedback permanent ' +
    'rassure l’utilisateur sur le fait que son action a bien été prise en ' +
    'compte.'
  ),
  h3('Économie de gestes'),
  p(
    'Le principe est de minimiser le nombre de gestes nécessaires pour ' +
    'atteindre un objectif. Ajouter un lieu au planning se fait en 3 taps ' +
    '(catégorie → lieu → bouton). Basculer en mode sombre se fait en 2 taps ' +
    '(Profil → carte Dark). Rechercher un restaurant se fait en 2 taps + ' +
    'quelques frappes (catégorie Food → champ de recherche).'
  ),
  h3('Accessibilité et lisibilité'),
  p(
    'Tous les textes respectent un contraste minimum WCAG AA. Le mode sombre ' +
    'utilise des tons sombres doux (bleu-anthracite plutôt que noir pur) pour ' +
    'réduire la fatigue visuelle. La taille de la zone tactile de chaque ' +
    'bouton dépasse 44x44 pixels, la taille minimale recommandée par Apple ' +
    'pour un tap confortable.'
  ),

  h2('4.7 Fonctionnalités clés'),
  h3('Gestion des favoris'),
  p(
    'Chaque lieu peut être ajouté ou retiré des favoris via un bouton en forme ' +
    'de cœur, présent à la fois sur les cartes de la grille et sur la fiche ' +
    'détaillée. L’état des favoris est centralisé dans le store global et ' +
    'immédiatement visible sur tous les écrans concernés. Un onglet « Favoris » ' +
    'permet de filtrer les listes pour ne voir que les lieux marqués.'
  ),
  h3('Ouverture de l’itinéraire natif'),
  p(
    'Le bouton « Itinéraire » de la fiche d’un lieu déclenche l’ouverture ' +
    'de l’application cartographique du téléphone (Apple Maps sur iOS, ' +
    'Google Maps sur Android) centrée sur les coordonnées GPS réelles du lieu. ' +
    'Si l’application native n’est pas disponible, une version web de ' +
    'Google Maps est ouverte dans le navigateur comme solution de secours.'
  ),
  h3('Partage natif'),
  p(
    'Le bouton de partage ouvre la feuille de partage native du système, ' +
    'permettant à l’utilisateur d’envoyer les informations du lieu via ' +
    'WhatsApp, Messages, Mail ou toute autre application installée sur son ' +
    'téléphone. Le message pré-rempli contient le nom du lieu, sa location et ' +
    'sa note.'
  ),
  h3('Basculement clair / sombre'),
  p(
    'L’utilisateur peut basculer entre le thème clair et le thème sombre ' +
    'depuis l’écran Profil. Le changement est instantané : tous les écrans, ' +
    'y compris les onglets et les composants imbriqués, sont redessinés avec la ' +
    'nouvelle palette. Aucun clignotement, aucun redémarrage requis.'
  ),
  h3('Multilinguisme'),
  p(
    'Trois langues sont supportées : français, anglais et arabe. Le changement ' +
    'de langue s’effectue depuis l’écran Profil et est également ' +
    'instantané. Toutes les chaînes de caractères de l’interface sont ' +
    'centralisées dans un dictionnaire unique (fichier i18n.js), ce qui permet ' +
    'de rajouter facilement une quatrième langue.'
  ),

  h2('4.8 Tests et validation'),
  h3('Tests manuels sur appareil réel'),
  p(
    'L’application a été testée intensivement sur un iPhone via Expo Go. Les ' +
    'tests ont porté sur les points suivants : temps de démarrage, fluidité ' +
    'des transitions entre écrans, réactivité des interactions tactiles (tap, ' +
    'scroll, swipe), qualité du rendu des images, fonctionnement du mode ' +
    'sombre, changement de langue en direct, ouverture des applications ' +
    'natives (Maps, Téléphone, navigateur, feuille de partage).'
  ),
  p(
    'Tous les tests se sont conclus avec succès. Le temps de démarrage moyen ' +
    'est inférieur à cinq secondes. Les transitions entre écrans sont ' +
    'instantanées. Le scroll reste fluide à soixante images par seconde même ' +
    'sur les grilles chargées. Le basculement entre le mode clair et le mode ' +
    'sombre est immédiat, sans clignotement.'
  ),
  h3('Tests d’usage utilisateur'),
  p(
    'Cinq utilisateurs volontaires (trois amis, deux membres de la famille) ' +
    'ont été invités à utiliser l’application sans consigne particulière. ' +
    'L’objectif était d’observer leur compréhension intuitive des ' +
    'interfaces et de repérer d’éventuels blocages ergonomiques.'
  ),
  p(
    'Les principaux enseignements de ces tests sont : (1) tous les utilisateurs ' +
    'ont trouvé sans hésitation la fonction de mise en favori, (2) la carte ' +
    'interactive a été particulièrement appréciée, (3) le mode sombre a été ' +
    'systématiquement testé avec enthousiasme, (4) le changement de langue a ' +
    'suscité un vif intérêt notamment pour la version arabe, (5) une suggestion ' +
    'récurrente concerne l’ajout d’un système de réservation en ligne, ' +
    'notée pour les évolutions futures.'
  ),
  h3('Tests de compatibilité'),
  p(
    'La compatibilité avec différentes tailles d’écran a été validée. ' +
    'L’application a été testée successivement sur un iPhone SE (petit ' +
    'écran de 4,7 pouces) et un iPhone 14 Pro Max (grand écran de 6,7 pouces). ' +
    'Aucun défaut d’affichage n’a été relevé, ce qui témoigne d’une ' +
    'mise en page pleinement responsive.'
  ),

  h2('4.9 Publication et déploiement'),
  h3('Le service EAS Build'),
  p(
    'Le déploiement d’une application Expo repose sur le service EAS Build ' +
    '(Expo Application Services), qui compile l’application dans le cloud ' +
    'et retourne un fichier binaire prêt à distribuer. Pour iOS, il s’agit ' +
    'd’un fichier .ipa signé numériquement ; pour Android, d’un fichier ' +
    '.aab (Android App Bundle) prêt à être uploadé sur le Google Play Console.'
  ),
  h3('Le circuit iOS via TestFlight'),
  p(
    'Pour iOS, le circuit standard passe par TestFlight, la plateforme de ' +
    'distribution beta d’Apple. Après compilation via EAS Build, le fichier ' +
    '.ipa est uploadé sur App Store Connect. Les testeurs invités par leur ' +
    'adresse email reçoivent un lien pour installer TestFlight puis ' +
    'l’application. Cette approche évite les frais d’un compte Apple ' +
    'Developer complet pour les phases de test.'
  ),
  h3('Le circuit Android via Google Play'),
  p(
    'Pour Android, le fichier .aab est uploadé sur Google Play Console. ' +
    'L’application peut être publiée en piste ouverte (accessible à tous) ' +
    'ou en piste fermée (accessible aux seuls testeurs invités). ' +
    'L’inscription à Google Play Console coûte 25 dollars une seule fois ' +
    '(paiement unique).'
  ),
  h3('La mise à jour OTA (Over The Air)'),
  p(
    'Un des grands avantages d’Expo est la possibilité de pousser des ' +
    'mises à jour de code JavaScript directement aux applications déjà ' +
    'installées, sans repasser par les stores. Cette fonctionnalité, ' +
    'appelée EAS Update, permet de corriger un bug ou d’ajouter un contenu ' +
    'en quelques minutes. Elle ne fonctionne toutefois que pour les ' +
    'modifications qui n’impliquent pas de nouveaux modules natifs.'
  ),
);

// ============================================================================
// CHAPITRE 5 - CONCLUSION ET PERSPECTIVES
// ============================================================================
children.push(
  h1(5, 'Conclusion et perspectives'),

  h2('5.1 Bilan du projet'),
  p(
    'Le projet Bon Plan Bizerte a atteint l’ensemble des objectifs qui lui ' +
    'avaient été assignés. L’application développée est fonctionnelle sur ' +
    'les deux plateformes majeures du marché (iOS et Android), présente une ' +
    'interface utilisateur moderne et cohérente, propose un contenu réel et ' +
    'curé pour la ville de Bizerte, et intègre des fonctionnalités avancées ' +
    'telles que le multilinguisme, le mode sombre, la cartographie interactive ' +
    'et la planification de journée.'
  ),
  p(
    'D’un point de vue technique, le projet compte environ trois mille sept ' +
    'cents lignes de code JavaScript, réparties sur seize fichiers organisés de ' +
    'manière modulaire. L’architecture retenue, fondée sur le paradigme des ' +
    'composants React et sur la gestion d’état par React Context, garantit ' +
    'la maintenabilité et l’évolutivité du code.'
  ),
  p(
    'Ce projet m’a permis de consolider mes compétences en développement ' +
    'JavaScript moderne, de découvrir en profondeur l’écosystème React ' +
    'Native / Expo, de manipuler des concepts avancés tels que les hooks, les ' +
    'contexts et la navigation, et de me familiariser avec les outils de ' +
    'conception UML (diagrammes de cas d’utilisation, de classes, MCD). ' +
    'Il a également renforcé ma capacité à gérer un projet complet, depuis la ' +
    'phase de recueil des besoins jusqu’à la livraison d’un produit ' +
    'testé et documenté.'
  ),

  h2('5.2 Difficultés rencontrées'),
  p('Le projet n’a pas été exempt de difficultés. Les principales sont :'),
  h3('Le mode sombre'),
  p(
    'L’intégration du mode sombre a nécessité une refactorisation complète ' +
    'de tous les écrans. La solution retenue consiste à définir les styles à ' +
    'l’intérieur du composant via une fonction makeStyles(colors), appelée ' +
    'à chaque changement de thème. Cette approche est plus verbeuse mais garantit ' +
    'que tout changement de palette est immédiatement visible sans redémarrage.'
  ),
  h3('Les téléchargements d’images'),
  p(
    'Le téléchargement automatisé des photos réelles des lieux depuis les ' +
    'sources ouvertes (Wikimedia Commons, sites institutionnels) s’est heurté ' +
    'à des mécanismes de limitation de débit qui retournaient une page HTML ' +
    'd’erreur au lieu de l’image attendue. La solution a consisté à ' +
    'utiliser les URL Special:FilePath de Wikimedia avec un User-Agent Firefox ' +
    'et un délai entre requêtes.'
  ),
  h3('La duplication du dossier projet'),
  p(
    'À un moment du développement, le dossier du projet a été dupliqué sur ' +
    'le disque, ce qui a conduit à des situations où le serveur de développement ' +
    'servait une version obsolète du code. La rigueur dans l’organisation ' +
    'des dossiers et l’utilisation de Git ont permis de résoudre cette ' +
    'ambiguïté.'
  ),

  h2('5.3 Perspectives d’évolution'),
  p(
    'De nombreuses évolutions sont envisageables pour enrichir l’application ' +
    'dans les versions futures. Elles peuvent être regroupées en cinq axes ' +
    'majeurs.'
  ),
  h3('Backend et base de données'),
  p(
    'Migrer les données actuelles (fichier JavaScript en dur) vers une base ' +
    'de données réelle, par exemple Supabase (PostgreSQL managé) ou Firebase ' +
    '(Firestore). Cela permettra aux administrateurs d’ajouter des lieux ' +
    'depuis une interface web sans avoir à publier une nouvelle version de ' +
    'l’application.'
  ),
  h3('Authentification utilisateur'),
  p(
    'Ajouter un système de comptes utilisateur avec inscription et connexion ' +
    'via email/mot de passe, mais également via les providers sociaux (Sign in ' +
    'with Apple, Google, Facebook). Cela permettrait aux utilisateurs de ' +
    'synchroniser leurs favoris entre plusieurs appareils.'
  ),
  h3('Système d’avis authentifiés'),
  p(
    'Permettre à chaque utilisateur connecté de laisser un avis (note et ' +
    'commentaire) sur un lieu. Modérer ces avis via un back-office. Afficher ' +
    'automatiquement la note moyenne calculée en temps réel.'
  ),
  h3('Notifications push'),
  p(
    'Envoyer des notifications aux utilisateurs pour les événements locaux, ' +
    'les nouveaux lieux ajoutés, les promotions temporaires, ou pour rappeler ' +
    'une activité planifiée à l’heure prévue.'
  ),
  h3('Extension à d’autres villes'),
  p(
    'Généraliser l’application à d’autres villes tunisiennes majeures ' +
    '(Tunis, Sousse, Djerba, Hammamet) tout en conservant la structure ' +
    'multi-cité déjà prévue dans l’écran de sélection de ville.'
  ),
  h3('Système de réservation en ligne'),
  p(
    'Proposer la réservation directe d’une table de restaurant ou d’une ' +
    'activité (bateau, excursion) depuis l’application, via un partenariat ' +
    'avec les établissements locaux. Cela transformerait Bon Plan Bizerte en ' +
    'véritable plateforme de tourisme actif.'
  ),
  h3('Mode hors ligne complet'),
  p(
    'Mettre en cache les tuiles cartographiques pour que la carte reste ' +
    'utilisable même sans connexion Internet. Un touriste étranger pourrait ' +
    'ainsi consulter l’application depuis son hôtel sans consommer de ' +
    'données mobiles.'
  ),
  h3('Programme de fidélité et gamification'),
  p(
    'Instaurer un système de badges et de points gagnés à chaque lieu visité ' +
    'ou avis laissé. Un classement mensuel des utilisateurs les plus actifs ' +
    'encouragerait l’engagement et créerait une communauté autour de ' +
    'l’application.'
  ),
  h3('Intégration de l’intelligence artificielle'),
  p(
    'Proposer un assistant conversationnel (chatbot) qui répondrait aux ' +
    'questions courantes des touristes : « Où puis-je dîner ce soir dans un ' +
    'restaurant de fruits de mer, avec un budget de trente dinars, à proximité ' +
    'du vieux port ? ». L’IA analyserait les données de l’application ' +
    'pour formuler une recommandation personnalisée.'
  ),
);

// ============================================================================
// BIBLIOGRAPHIE
// ============================================================================
children.push(
  h1Plain('Bibliographie et webographie'),
  gap(200),
  h3('Documentation officielle'),
  bullet('React Native (documentation officielle) : reactnative.dev'),
  bullet('Expo SDK (documentation officielle) : docs.expo.dev'),
  bullet('React Navigation : reactnavigation.org'),
  bullet('React (documentation officielle) : react.dev'),
  bullet('MDN Web Docs (JavaScript) : developer.mozilla.org'),
  h3('Sources des données touristiques'),
  bullet('Wikipedia : encyclopédie collaborative pour les descriptions historiques.'),
  bullet('Wikimedia Commons : photographies libres de droit des lieux réels.'),
  bullet('Tripadvisor : notes et avis pour la sélection des restaurants et cafés.'),
  bullet('Evendo : catalogue de restaurants et boutiques de Bizerte avec photos.'),
  h3('Ouvrages et articles consultés'),
  bullet('« Learning React Native » — Bonnie Eisenman, O’Reilly Media.'),
  bullet('« UML 2 par la pratique » — Pascal Roques, Eyrolles.'),
  bullet('« Merise en pratique » — Nanci et Espinasse, Vuibert.'),
);

// ============================================================================
// ANNEXES TECHNIQUES
// ============================================================================
children.push(
  h1Plain('Annexes techniques'),
  p(
    'Cette section rassemble des éléments de documentation technique et des ' +
    'captures supplémentaires susceptibles d’enrichir la compréhension du ' +
    'projet. Chaque annexe est numérotée dans la continuité des figures ' +
    'principales.'
  ),

  h2('Annexe A — Vue rapprochée du splash'),
  ...figure('mockup-splash.png', 'Détail du splash avec le dégradé bleu et le logo central', { maxWidth: 340 }),
  p(
    'Le splash est le premier contact visuel entre l’utilisateur et ' +
    'l’application. Il utilise un dégradé vertical composé de trois ' +
    'couleurs : bleu foncé (#0E1BCF) en haut, bleu principal (#1D2BEF) au ' +
    'milieu, bleu clair (#3A46FF) en bas. Le logo est placé dans une carte ' +
    'blanche arrondie de 200x200 pixels, dotée d’une légère ombre pour ' +
    'renforcer la profondeur visuelle.'
  ),

  h2('Annexe B — Vue rapprochée de l’écran d’accueil'),
  ...figure('mockup-home.png', 'Vue détaillée de l’écran d’accueil', { maxWidth: 340 }),
  p(
    'L’écran d’accueil constitue le cœur de l’expérience utilisateur. Il ' +
    'combine plusieurs types de composants React Native : ScrollView pour le ' +
    'défilement vertical, ScrollView horizontal pour la rangée de catégories ' +
    'et le carrousel « Popular », TouchableOpacity pour tous les éléments ' +
    'cliquables, et Image pour les vignettes. La hiérarchie visuelle est ' +
    'renforcée par les tailles de texte (28pt pour les titres de section, ' +
    '16pt pour le corps, 12pt pour les métadonnées) et par les couleurs ' +
    '(texte principal en presque noir #0F1226, secondaire en gris moyen).'
  ),

  h2('Annexe C — Vue rapprochée de la carte interactive'),
  ...figure('mockup-map.png', 'Vue détaillée de la carte avec ses marqueurs colorés', { maxWidth: 340 }),
  p(
    'La carte utilise la librairie react-native-maps. Chaque marqueur est un ' +
    'composant Marker positionné à des coordonnées GPS réelles. La couleur du ' +
    'marqueur reflète sa catégorie : cette convention permet à l’utilisateur ' +
    'de repérer visuellement le type de lieu sans avoir à cliquer. Le tap sur ' +
    'un marqueur déclenche une animation animateToRegion qui zoome sur le ' +
    'lieu, et affiche la carte détaillée en bas d’écran.'
  ),

  h2('Annexe D — Vue rapprochée du profil'),
  ...figure('mockup-profile.png', 'Vue détaillée de l’écran profil avec le sélecteur de thème', { maxWidth: 340 }),
  p(
    'L’écran Profile centralise tous les paramètres personnels. Le sélecteur ' +
    'de thème visuel est particulièrement réussi : au lieu d’un simple ' +
    'toggle switch, il présente deux mini-aperçus réalistes de l’application ' +
    'dans chaque mode. Ce choix améliore la compréhension : l’utilisateur ' +
    'voit exactement ce à quoi ressemblera son écran avant de basculer.'
  ),

  h2('Annexe E — Gestion et suivi de projet'),
  h3('Méthodologie'),
  p(
    'Le projet a été mené selon une approche itérative inspirée des méthodes ' +
    'agiles. Chaque semaine a fait l’objet d’un point d’étape avec ' +
    'l’encadrante pédagogique afin de valider les avancées et de réajuster ' +
    'les priorités. Cette approche a permis de rester réactif aux imprévus et ' +
    'de livrer un produit final qui répond au cahier des charges initial.'
  ),
  h3('Planning global'),
  p(
    'Le projet s’est déroulé sur environ six semaines à temps plein, ' +
    'réparties comme suit :'
  ),
  bullet('Semaine 1 : recueil des besoins, étude de l’existant, choix technologiques, maquettes Figma.'),
  bullet('Semaine 2 : mise en place de l’architecture, création de la structure des dossiers, du store et du système de navigation.'),
  bullet('Semaine 3 : développement des écrans d’accueil, catégorie, détail et carte.'),
  bullet('Semaine 4 : intégration de la carte réelle avec react-native-maps, développement de l’écran de planning.'),
  bullet('Semaine 5 : intégration du mode sombre, du multilinguisme, de l’écran profil.'),
  bullet('Semaine 6 : tests, corrections, polish visuel, rédaction du rapport et préparation de la soutenance.'),
  h3('Outils de gestion'),
  bullet('Trello : suivi des tâches en trois colonnes (À faire / En cours / Terminé).'),
  bullet('Git : versionnement du code avec commits fréquents et messages descriptifs.'),
  bullet('GitHub : hébergement du dépôt et sauvegarde continue.'),
  bullet('Notion : prise de notes et documentation informelle en cours de projet.'),

  h2('Annexe F — Analyse des risques'),
  p(
    'Toute conduite de projet exige une identification préalable des risques ' +
    'principaux et l’élaboration de stratégies d’atténuation. Voici les ' +
    'trois risques les plus significatifs qui ont été identifiés au démarrage ' +
    'du projet Bon Plan Bizerte.'
  ),
  h3('Risque 1 : maîtrise technique insuffisante de React Native'),
  p(
    'Bien que JavaScript ait été enseigné dans le cadre du BTS, la mobile ' +
    'programming avec React Native est une compétence spécifique qui n’était ' +
    'pas maîtrisée au démarrage. Stratégie d’atténuation : consacrer la ' +
    'première semaine à des tutoriels intensifs et à la construction ' +
    'd’exemples simples avant de commencer les vrais écrans du projet. Cette ' +
    'approche a été fructueuse : la courbe d’apprentissage a été rapide, ' +
    'notamment grâce à la richesse de la documentation officielle et à la ' +
    'grande communauté React Native.'
  ),
  h3('Risque 2 : gestion du temps'),
  p(
    'Six semaines à temps plein peuvent sembler beaucoup, mais la ' +
    'combinaison développement + rédaction du rapport + préparation de la ' +
    'soutenance impose une organisation rigoureuse. Stratégie d’atténuation : ' +
    'planning hebdomadaire avec objectifs clairs, revue avec l’encadrante, et ' +
    'MVP (Minimum Viable Product) livrable rapidement, à enrichir ensuite ' +
    'progressivement plutôt que de tout viser d’un coup.'
  ),
  h3('Risque 3 : dépendance aux APIs externes'),
  p(
    'Certaines fonctionnalités (carte, ouverture d’applications natives) ' +
    'dépendent d’APIs externes qui peuvent évoluer ou tomber en panne. ' +
    'Stratégie d’atténuation : implémentation systématique de mécanismes de ' +
    'secours (par exemple ouverture de Google Maps en ligne si l’application ' +
    'native n’est pas disponible), et documentation claire des dépendances ' +
    'externes.'
  ),

  h2('Annexe G — Statistiques du code source'),
  p(
    'Voici quelques statistiques quantitatives sur le code source du projet, ' +
    'établies à la fin du développement :'
  ),
  bullet('Nombre total de fichiers JavaScript : 16.'),
  bullet('Nombre total de lignes de code : environ 3 700.'),
  bullet('Nombre total de commentaires (lignes) : environ 800, soit un ratio de 22 %.'),
  bullet('Nombre d’écrans (screens) : 10.'),
  bullet('Nombre de composants réutilisables : 6.'),
  bullet('Nombre de hooks personnalisés : 3 (useTheme, useStore, useT).'),
  bullet('Nombre de dépendances npm principales : 12.'),
  bullet('Nombre de lieux catalogués dans l’application : 30 environ.'),
  bullet('Nombre de langues supportées : 3 (français, anglais, arabe).'),
  bullet('Nombre de traductions dans le dictionnaire i18n : environ 100 clés x 3 langues = 300 chaînes.'),
);

// ============================================================================
// MERCI (last page)
// ============================================================================
children.push(
  new Paragraph({
    pageBreakBefore: true,
    spacing: { before: 3200 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Merci', font: FONT_HEAD, size: 96, bold: true, color: ACCENT })],
  }),
  gap(200),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'pour votre attention', font: FONT_HEAD, size: 32, italics: true, color: MUTE })],
  }),
  gap(400),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 1 } },
    children: [new TextRun('')],
  }),
  gap(200),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Sabri CHETOUANE — Info Plus — 2025 / 2026', font: FONT, size: 22, color: MUTE, italics: true })],
  }),
);

// ============================================================================
// BUILD DOCUMENT
// ============================================================================
const doc = new Document({
  creator: 'Sabri Chetouane',
  title: 'Rapport de PFE — Bon Plan Bizerte',
  description: 'Rapport de Projet de Fin d’Etudes — BTS Informatique de Gestion',
  styles: {
    default: { document: { run: { font: FONT, size: 24, color: INK } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 52, bold: true, font: FONT_HEAD, color: INK },
        paragraph: { spacing: { before: 400, after: 400 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: FONT_HEAD, color: ACCENT },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: FONT_HEAD, color: INK },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets',
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'numbers',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1800, right: 1800, bottom: 1800, left: 1800 },
      },
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Bon Plan Bizerte  —  ', font: FONT, size: 18, color: MUTE }),
          new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: MUTE }),
          new TextRun({ text: ' / ', font: FONT, size: 18, color: MUTE }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 18, color: MUTE }),
        ],
      })] }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('Rapport-PFE-Bon-Plan-Bizerte.docx', buf);
  console.log('Generated: Rapport-PFE-Bon-Plan-Bizerte.docx (' + (buf.length / 1024).toFixed(0) + ' KB)');
  console.log('Total annexes:', annexeCount);
}).catch(err => {
  console.error('Build failed:', err);
  console.error(err.stack);
  process.exit(1);
});
