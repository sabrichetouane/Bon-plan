// Extended version of the study document.
// Longer, includes full source code of every file, plus all available images.
//
// Run:  node build-docx-full.js
// Out:  Bon-Plan-Bizerte-Guide-Complet.docx

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageBreak, LevelFormat, BorderStyle, ShadingType, ImageRun,
  Table, TableRow, TableCell, WidthType, Header, Footer, PageNumber,
} = require(path.join('..', 'node_modules', 'docx'));

// ---------- Constants ----------
const FONT = 'Calibri';
const FONT_MONO = 'Consolas';
const BLUE = '1D2BEF';
const DARK = '0F1226';
const GRAY = '6B7080';
const SOFT = 'EEF0FE';
const ORANGE = 'F59E0B';
const GREEN = '22C55E';
const DANGER = 'EF4444';

// ---------- Small helpers ----------
const readSrc = (relative) => fs.readFileSync(path.join('..', relative), 'utf8');

const p = (text, opts = {}) => new Paragraph({
  spacing: { before: 80, after: 80 },
  ...opts,
  children: [new TextRun({ text, font: FONT, size: 22, color: DARK, ...(opts.runOpts || {}) })],
});

const pBold = (text) => new Paragraph({
  spacing: { before: 80, after: 40 },
  children: [new TextRun({ text, font: FONT, size: 22, color: DARK, bold: true })],
});

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  pageBreakBefore: true,
  spacing: { before: 240, after: 200 },
  children: [new TextRun({ text, font: FONT, size: 44, bold: true, color: BLUE })],
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, font: FONT, size: 32, bold: true, color: DARK })],
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 180, after: 80 },
  children: [new TextRun({ text, font: FONT, size: 26, bold: true, color: BLUE })],
});

const h4 = (text) => new Paragraph({
  spacing: { before: 140, after: 60 },
  children: [new TextRun({ text, font: FONT, size: 24, bold: true, color: DARK })],
});

const bullet = (text, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level },
  spacing: { before: 40, after: 40 },
  children: [new TextRun({ text, font: FONT, size: 22, color: DARK })],
});

const num = (text) => new Paragraph({
  numbering: { reference: 'numbers', level: 0 },
  spacing: { before: 40, after: 40 },
  children: [new TextRun({ text, font: FONT, size: 22, color: DARK })],
});

const spacer = (before = 200) => new Paragraph({ spacing: { before }, children: [new TextRun({ text: '' })] });

// Colored callout box
const box = (label, body, color = BLUE, fill = SOFT) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  rows: [new TableRow({
    children: [new TableCell({
      width: { size: 9360, type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 140, bottom: 140, left: 180, right: 160 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color },
        left: { style: BorderStyle.SINGLE, size: 24, color },
        right: { style: BorderStyle.SINGLE, size: 4, color },
        bottom: { style: BorderStyle.SINGLE, size: 4, color },
      },
      children: [
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: label, font: FONT, size: 22, bold: true, color })],
        }),
        ...(Array.isArray(body) ? body : [body]).map(txt =>
          new Paragraph({
            spacing: { before: 30, after: 30 },
            children: [new TextRun({ text: txt, font: FONT, size: 21, color: DARK })],
          })
        ),
      ],
    })],
  })],
});

// Code block
const code = (text) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  rows: [new TableRow({
    children: [new TableCell({
      width: { size: 9360, type: WidthType.DXA },
      shading: { fill: 'F4F6F8', type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 200, right: 160 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'D5D9E0' },
        left: { style: BorderStyle.SINGLE, size: 4, color: 'D5D9E0' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'D5D9E0' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D5D9E0' },
      },
      children: text.split('\n').map(line =>
        new Paragraph({
          spacing: { before: 0, after: 0, line: 240 },
          children: [new TextRun({ text: line || ' ', font: FONT_MONO, size: 17, color: '203040' })],
        })
      ),
    })],
  })],
});

// Numbered code block (full source with line numbers)
const codeLines = (text, startLine = 1) => {
  const lines = text.split('\n');
  const width = Math.max(3, String(lines.length + startLine).length);
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: 9360, type: WidthType.DXA },
        shading: { fill: 'F4F6F8', type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 160, right: 120 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: 'D5D9E0' },
          left: { style: BorderStyle.SINGLE, size: 4, color: 'D5D9E0' },
          right: { style: BorderStyle.SINGLE, size: 4, color: 'D5D9E0' },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D5D9E0' },
        },
        children: lines.map((line, i) => {
          const n = String(startLine + i).padStart(width, ' ');
          return new Paragraph({
            spacing: { before: 0, after: 0, line: 220 },
            children: [
              new TextRun({ text: n + '  ', font: FONT_MONO, size: 14, color: '9AA0B4' }),
              new TextRun({ text: line || ' ', font: FONT_MONO, size: 16, color: '203040' }),
            ],
          });
        }),
      })],
    })],
  });
};

// Simple two-column table for comparisons
const table2col = (headers, rows) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [3120, 6240],
  rows: [
    new TableRow({
      tableHeader: true,
      children: headers.map((h, i) => new TableCell({
        width: { size: i === 0 ? 3120 : 6240, type: WidthType.DXA },
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 140, right: 120 },
        children: [new Paragraph({
          children: [new TextRun({ text: h, font: FONT, size: 20, bold: true, color: 'FFFFFF' })],
        })],
      })),
    }),
    ...rows.map(row => new TableRow({
      children: row.map((cell, i) => new TableCell({
        width: { size: i === 0 ? 3120 : 6240, type: WidthType.DXA },
        shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 140, right: 120 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
          left: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
          right: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
        },
        children: [new Paragraph({
          spacing: { before: 20, after: 20 },
          children: [new TextRun({
            text: cell,
            font: i === 0 ? FONT_MONO : FONT,
            size: i === 0 ? 18 : 21,
            color: i === 0 ? BLUE : DARK,
            bold: i === 0,
          })],
        })],
      })),
    })),
  ],
});

// Image helper (auto-scaled to page width)
const img = (relPath, widthPx = 640, caption = null) => {
  const data = fs.readFileSync(relPath);
  const ext = path.extname(relPath).toLowerCase().replace('.', '');
  const arr = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 100 },
      children: [new ImageRun({
        type: ext === 'jpg' ? 'jpeg' : ext,
        data,
        transformation: { width: widthPx, height: Math.round(widthPx * 0.62) },
        altText: { title: caption || path.basename(relPath), description: caption || 'Image', name: path.basename(relPath) },
      })],
    }),
  ];
  if (caption) {
    arr.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: caption, font: FONT, size: 20, italics: true, color: GRAY })],
    }));
  }
  return arr;
};

// Same as img but preserves aspect ratio by loading the image once
const imgSmart = (relPath, maxWidthPx = 640, caption = null) => {
  const data = fs.readFileSync(relPath);
  const ext = path.extname(relPath).toLowerCase().replace('.', '');
  // Get dimensions via PNG/JPG header
  let w = maxWidthPx, h = Math.round(maxWidthPx * 0.62);
  try {
    if (ext === 'png') {
      const width = data.readUInt32BE(16);
      const height = data.readUInt32BE(20);
      const ratio = height / width;
      w = maxWidthPx;
      h = Math.round(maxWidthPx * ratio);
    } else if (ext === 'jpg' || ext === 'jpeg') {
      // Naïve JPEG size scan
      let i = 2;
      while (i < data.length) {
        if (data[i] !== 0xFF) break;
        const marker = data[i + 1];
        i += 2;
        if (marker >= 0xC0 && marker <= 0xC3) {
          const height = data.readUInt16BE(i + 3);
          const width = data.readUInt16BE(i + 5);
          const ratio = height / width;
          w = maxWidthPx;
          h = Math.round(maxWidthPx * ratio);
          break;
        }
        const seg = data.readUInt16BE(i);
        i += seg;
      }
    }
  } catch (e) { /* keep defaults */ }

  const arr = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 100 },
      children: [new ImageRun({
        type: ext === 'jpg' ? 'jpeg' : ext,
        data,
        transformation: { width: w, height: h },
        altText: { title: caption || path.basename(relPath), description: caption || 'Image', name: path.basename(relPath) },
      })],
    }),
  ];
  if (caption) {
    arr.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: caption, font: FONT, size: 20, italics: true, color: GRAY })],
    }));
  }
  return arr;
};

// =============================================================================
// BUILD CONTENT
// =============================================================================
const children = [];

// ---------- COVER ----------
children.push(
  new Paragraph({ spacing: { before: 1200 }, children: [new TextRun({ text: '' })] }),
  ...imgSmart('app-icon.png', 200, null),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text: 'Bon Plan Bizerte', font: FONT, size: 72, bold: true, color: BLUE })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'Guide complet du code — édition détaillée', font: FONT, size: 32, color: DARK })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 800 },
    children: [new TextRun({ text: 'Préparation à la soutenance PFF', font: FONT, size: 28, italics: true, color: GRAY })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '~3 700 lignes de code · 16 fichiers · 6 catégories · 3 langues', font: FONT, size: 22, color: DARK })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200 },
    children: [new TextRun({ text: 'Document pédagogique — aucune connaissance React requise', font: FONT, size: 22, color: GRAY })],
  }),
);

// =============================================================================
// PART A — FUNDAMENTALS
// =============================================================================

children.push(h1('Partie A — Fondamentaux à connaître'));
children.push(p(
  'Cette première partie explique les concepts que tu dois maîtriser AVANT de lire ' +
  'le code. Chaque terme apparaîtra ensuite des dizaines de fois dans les fichiers. ' +
  'Prends le temps de la lire calmement.'
));

// -- A.1 What is React Native
children.push(
  h2('A.1 Qu’est-ce que React Native ?'),
  p(
    'React Native est un framework open-source créé par Facebook (Meta) en 2015. ' +
    'Il permet d’écrire une application mobile en JavaScript et de la faire tourner ' +
    'à la fois sur iOS et sur Android à partir d’une seule base de code.'
  ),
  p(
    'Au moment de l’exécution, React Native transforme les composants JavaScript ' +
    'en véritables composants natifs (UIView sur iOS, View sur Android). Le rendu ' +
    'graphique est donc identique à celui d’une application développée en Swift ' +
    'ou en Kotlin — ce n’est pas une simple page web enrobée.'
  ),
  box('Trois avantages majeurs', [
    '1. Un seul code source pour deux plateformes → délai de développement divisé par deux.',
    '2. Rechargement à chaud (hot reload) → tu vois tes modifications à l’écran en <1 s.',
    '3. Écosystème JavaScript énorme → NPM propose ~2 M de bibliothèques réutilisables.',
  ]),
);

// -- A.2 What is Expo
children.push(
  h2('A.2 Qu’est-ce qu’Expo ?'),
  p(
    'Expo est une surcouche officielle qui simplifie React Native. Sans Expo, il ' +
    'faudrait installer Xcode (Mac uniquement), Android Studio, configurer les ' +
    'certificats de signature… Expo fait tout ça pour toi et te fournit une app ' +
    'compagnon "Expo Go" que tu télécharges sur ton téléphone.'
  ),
  p(
    'Flux de développement avec Expo :'
  ),
  num('Tu écris ton code dans VS Code.'),
  num('Tu lances "npx expo start" → un QR code s’affiche.'),
  num('Tu scannes le QR code avec Expo Go sur ton iPhone.'),
  num('L’application se charge en 5 s et se met à jour automatiquement quand tu enregistres un fichier.'),
);

// -- A.3 JavaScript vs JSX
children.push(
  h2('A.3 JavaScript et JSX'),
  p(
    'Le langage utilisé est JavaScript, la version moderne appelée ES6+. La ' +
    'syntaxe JSX permet d’écrire du "HTML dans du JavaScript" — mais en fait ' +
    'ce sont juste des appels de fonctions déguisés.'
  ),
  code(
`// Ces deux lignes sont ÉQUIVALENTES :
const btn = <Text>Bonjour</Text>;
const btn = React.createElement(Text, null, 'Bonjour');`
  ),
  p(
    'Babel (un outil qu’Expo utilise en coulisses) transforme la première ligne ' +
    'en la seconde avant que le code ne s’exécute.'
  ),
);

// -- A.4 Composant
children.push(
  h2('A.4 Le concept de composant'),
  p(
    'Un composant React est une fonction JavaScript qui retourne un morceau ' +
    'd’interface. C’est la brique de base — tout est composant : un bouton, une ' +
    'ligne de texte, une carte, un écran entier.'
  ),
  code(
`function MonBouton() {
  return <Text>Clique-moi</Text>;
}`
  ),
  p(
    'Convention : le nom du composant commence toujours par une MAJUSCULE. Si tu ' +
    'utilises "monBouton" (minuscule), JSX pensera que c’est un élément HTML ' +
    'standard et ne le trouvera pas.'
  ),
);

// -- A.5 Props
children.push(
  h2('A.5 Les props (propriétés)'),
  p(
    'Les props sont des données que tu passes à un composant depuis son parent. ' +
    'Concrètement, ce sont les attributs entre les balises.'
  ),
  code(
`// PARENT
<MonBouton texte="Sauvegarder" couleur="bleu" />

// ENFANT — la fonction reçoit un objet { texte, couleur }
function MonBouton({ texte, couleur }) {
  return <Text style={{ color: couleur }}>{texte}</Text>;
}`
  ),
  box('Règle d’or', [
    'Les props sont en lecture seule. L’enfant ne peut PAS modifier ce que le ' +
    'parent lui a envoyé. C’est ce qui rend React prévisible.',
  ]),
);

// -- A.6 State
children.push(
  h2('A.6 Le state (état interne)'),
  p(
    'Le state est une donnée qui appartient à un composant et qui peut changer ' +
    'au fil du temps. Quand elle change, React redessine automatiquement le ' +
    'composant à l’écran.'
  ),
  code(
`import { useState } from 'react';

function Compteur() {
  const [n, setN] = useState(0); // n commence à 0
  return (
    <View>
      <Text>{n}</Text>
      <Button title="+1" onPress={() => setN(n + 1)} />
    </View>
  );
}`
  ),
  p(
    'useState retourne 2 choses : la valeur actuelle (n) et une fonction pour la ' +
    'changer (setN). N’essaie JAMAIS de faire "n = n + 1" — ça ne déclenchera ' +
    'aucun rendu.'
  ),
);

// -- A.7 Hooks table
children.push(
  h2('A.7 Les hooks utilisés dans ce projet'),
  p('Un hook est une fonction spéciale React qui commence toujours par "use".'),
  table2col(
    ['Hook', 'Rôle'],
    [
      ['useState', 'Créer un état local qui déclenche un rendu quand il change.'],
      ['useEffect', 'Exécuter du code APRÈS le rendu (timer, requête HTTP, cleanup).'],
      ['useMemo', 'Mémoriser un calcul coûteux, ne le refaire que si les dépendances changent.'],
      ['useContext', 'Lire une donnée partagée sans la passer manuellement de parent en enfant.'],
      ['useRef', 'Garder une référence stable vers un élément (ex : caméra de la carte).'],
    ]
  ),
);

// -- A.8 Context
children.push(
  h2('A.8 React Context — la "boîte partagée"'),
  p(
    'Passer des données de parent en enfant sur 5 niveaux devient vite pénible ' +
    '(on appelle ça le "prop drilling"). React Context crée une boîte accessible ' +
    'à N’IMPORTE quel composant enfant, à n’importe quel niveau.'
  ),
  code(
`// 1) Créer la boîte
const ThemeContext = createContext(null);

// 2) Poser la valeur dans la boîte
<ThemeContext.Provider value={{ colors, mode: 'light' }}>
  <App />
</ThemeContext.Provider>

// 3) Lire la valeur depuis n’importe quel composant fils
const { colors } = useContext(ThemeContext);`
  ),
  p(
    'Dans Bon Plan Bizerte, on utilise 2 contexts : ThemeContext (pour ' +
    'clair/sombre) et StoreContext (pour favoris, itinéraire, langue).'
  ),
);

// -- A.9 Comparaison React web vs React Native
children.push(
  h2('A.9 Différences React web / React Native'),
  table2col(
    ['React web', 'React Native'],
    [
      ['<div>', '<View>'],
      ['<span>, <p>', '<Text> (obligatoire pour tout texte)'],
      ['<img>', '<Image>'],
      ['<button>', '<TouchableOpacity> ou <Pressable>'],
      ['onClick', 'onPress'],
      ['style CSS externe', 'style JavaScript inline'],
      ['navigation URL', 'navigation par navigateur (Stack/Tabs)'],
    ]
  ),
  p(
    'Attention : en React Native, il est INTERDIT de mettre du texte hors d’un ' +
    'composant <Text>. "<View>Bonjour</View>" plantera l’application.'
  ),
);

// =============================================================================
// PART B — VISUALS OF THE APP
// =============================================================================

children.push(h1('Partie B — Vue d’ensemble et diagrammes'));

children.push(
  h2('B.1 L’icône et le splash'),
  p(
    'L’identité visuelle du projet est un cercle bleu contenant les lettres "Bp" ' +
    '(pour Bon Plan). Cet icône est ré-utilisée pour l’écran de démarrage (splash), ' +
    'l’icône de l’application sur le téléphone, et le favicon en version web.'
  ),
  ...imgSmart('app-icon.png', 240, 'Icône de l’application (assets/icon.png)'),

  h2('B.2 Diagramme de cas d’utilisation'),
  p(
    'Ce diagramme UML montre TOUT ce que l’utilisateur (le touriste) peut faire ' +
    'dans l’application. Chaque ovale est une action possible. Les liens en ' +
    'pointillés étiquetés <<include>> indiquent qu’une action en déclenche une ' +
    'autre automatiquement.'
  ),
  ...imgSmart('diagram-usecase.png', 640, 'Diagramme de cas d’utilisation — Bon Plan Bizerte'),

  h2('B.3 Diagramme de classes'),
  p(
    'Le diagramme de classes montre la structure orientée objet du domaine : ' +
    'un Utilisateur, une classe abstraite Lieu qui a 6 sous-classes (Restaurant, ' +
    'Café, Plage, LieuNature, Activité, Magasin), les Avis, les Photos, l’Itinéraire.'
  ),
  ...imgSmart('diagram-class.png', 640, 'Diagramme de classes — Bon Plan Bizerte'),

  h2('B.4 Modèle Conceptuel de Données (MCD)'),
  p(
    'Le MCD (notation Merise) est la vue "base de données" du même domaine. ' +
    'Chaque rectangle est une entité qui deviendra une table SQL. Les losanges ' +
    'et les ellipses représentent les associations avec leur cardinalité (0,n ou 1,1).'
  ),
  ...imgSmart('diagram-mcd.png', 640, 'MCD — Bon Plan Bizerte'),
);

// =============================================================================
// PART C — CODE FILES ONE BY ONE
// =============================================================================

// Helper : builds one full chapter for a file
function fileChapter(opts) {
  const { title, path: srcPath, role, connections, keyPoints, defense, extras = [] } = opts;
  const source = readSrc(srcPath);
  const items = [
    h1(title),
    h2('Chemin dans le projet'),
    code(srcPath),
    h2('Rôle du fichier'),
    p(role),
  ];

  if (connections && connections.length) {
    items.push(h2('Connexions avec les autres fichiers'));
    connections.forEach(c => items.push(bullet(c)));
  }
  if (keyPoints && keyPoints.length) {
    items.push(h2('Points clés à comprendre'));
    keyPoints.forEach(k => items.push(bullet(k)));
  }

  extras.forEach(item => items.push(item));

  items.push(h2('Code source intégral (avec numéros de ligne)'));
  items.push(p('Voici le code complet du fichier. Chaque commentaire "//" a été écrit pour t’aider à comprendre.'));
  items.push(codeLines(source));

  if (defense && defense.length) {
    items.push(h2('Questions de défense pour ce fichier'));
    items.push(box('Questions possibles en défense', defense, ORANGE, 'FFF7E6'));
  }
  return items;
}

// -- App.js
children.push(...fileChapter({
  title: 'C.1 App.js — le composant racine',
  path: 'App.js',
  role:
    'App.js est le tout premier composant chargé par Expo. Son unique but est ' +
    'de mettre en place l’environnement global : les fournisseurs (providers) ' +
    'qui rendent le thème et l’état accessibles partout, la barre de statut, ' +
    'et enfin le navigateur qui gère les écrans.',
  connections: [
    'Importe SafeAreaProvider depuis react-native-safe-area-context (librairie externe).',
    'Importe StoreProvider depuis src/store.js — c’est notre "boîte" d’état global.',
    'Importe AppNavigator depuis src/navigation/AppNavigator.js — le routeur.',
    'Est utilisé automatiquement par Expo : la clé "main" dans package.json pointe vers ce fichier.',
  ],
  keyPoints: [
    'L’ordre d’imbrication est important : SafeAreaProvider doit envelopper StoreProvider.',
    'Un composant qui n’utilise pas de state s’écrit en fonction "flèche" ou fonction classique — ici on utilise "function App()".',
    '"export default" signifie que ce fichier expose UN seul objet, importable sans accolades.',
  ],
  defense: [
    'Pourquoi enveloppe-t-on toute l’app dans SafeAreaProvider ? Pour que les composants enfants puissent connaître la hauteur du notch et de la barre du bas, et éviter de dessiner par-dessus.',
    'Que ferait "npx expo start" si on supprimait ce fichier ? Expo cherche src/App.js par défaut → erreur "component not found".',
    'À quoi sert <StatusBar style="auto" /> ? Il gère la couleur des icônes système en haut de l’écran (batterie, réseau).',
  ],
}));

// -- theme/colors.js
children.push(...fileChapter({
  title: 'C.2 src/theme/colors.js — palette et tokens',
  path: 'src/theme/colors.js',
  role:
    'Ce fichier centralise toutes les constantes visuelles de l’application : ' +
    'couleurs, espacements, rayons d’arrondi. Il définit deux palettes complètes ' +
    '(claire et sombre) et fournit les hooks useTheme() / useColors() que ' +
    'chaque écran consomme pour rendre l’UI adaptée au mode actif.',
  connections: [
    'Le ThemeContext créé ici est utilisé par store.js (qui met la vraie valeur dedans).',
    'Toutes les autres pages font "import { useTheme, radius, spacing } from ../theme/colors".',
    'lightColors et darkColors ont exactement les mêmes clés → aucune surprise à la bascule.',
  ],
  keyPoints: [
    'La séparation Context ici / Provider ailleurs évite un cycle d’imports.',
    'useTheme() retourne { colors, mode, setMode, toggle } — tout ce qu’il faut pour piloter le thème.',
    'spacing et radius sont des systèmes de design tokens — même principe que Tailwind ou Material Design.',
  ],
  defense: [
    'Pourquoi ne pas simplement mettre les couleurs dans les styles de chaque écran ? Parce qu’avec 10 écrans, changer le bleu principal deviendrait un cauchemar : ici c’est UNE ligne.',
    'Comment fais-tu pour que TOUS les écrans changent de couleur en même temps ? Chaque écran appelle useTheme() → dès que le mode change dans le Provider, React redessine tous les composants qui utilisent ce Context.',
  ],
}));

// -- i18n.js
children.push(...fileChapter({
  title: 'C.3 src/i18n.js — traductions EN / FR / AR',
  path: 'src/i18n.js',
  role:
    'Ce fichier est le dictionnaire de traductions. Il expose la liste des langues ' +
    'disponibles et la fonction translate(clé, langue) qui va chercher la bonne ' +
    'chaîne. On l’utilise indirectement via le hook useT() défini dans store.js.',
  connections: [
    'store.js importe translate() et l’enveloppe dans un "t" attaché à l’état global.',
    'Aucun écran n’importe directement translate — tous passent par useT() du store.',
    'La liste LANGUAGES est utilisée dans ProfileScreen pour afficher les options de langue.',
  ],
  keyPoints: [
    'Les clés suivent la notation "écran.élément" (ex : home.popular, profile.language).',
    'Le fallback est en trois niveaux : langue demandée → anglais → clé brute (pour repérer les oublis).',
    'Le drapeau "rtl" (right-to-left) de LANGUAGES sert à préparer un futur support Arabic RTL.',
  ],
  defense: [
    'Pourquoi ne pas utiliser i18next (la librairie standard) ? Pour rester simple : on a 100 clés et 3 langues, une librairie externe serait exagérée.',
    'Comment ajouter une 4e langue (ex : espagnol) ? Ajouter { code: "es", … } dans LANGUAGES, puis ajouter un champ "es" à chaque entrée du dictionnaire.',
  ],
}));

// -- store.js
children.push(...fileChapter({
  title: 'C.4 src/store.js — la mémoire globale',
  path: 'src/store.js',
  role:
    'C’est LE fichier central. Il maintient TOUT l’état partagé de l’application ' +
    ': favoris, itinéraire, thème actif, langue active. Il fournit les hooks ' +
    'useStore() et useT() que tous les écrans utilisent.',
  connections: [
    'App.js importe StoreProvider et enveloppe l’application avec.',
    'colors.js exporte ThemeContext (créé là-bas) et store.js le remplit avec la palette actuelle.',
    'i18n.js fournit la fonction translate() qui est injectée dans le store sous la clé "t".',
    'Tous les écrans lisent l’état via useStore() (favoris, itinéraire) et useT() (traductions).',
  ],
  keyPoints: [
    'useMemo enveloppe l’objet exposé pour éviter des re-renders infinis.',
    'Set (structure de données JS) est utilisé pour favorites — supprime les doublons naturellement.',
    'addToItinerary calcule automatiquement l’heure suivante (+2h par rapport à la dernière).',
    'Cette architecture Context+useState est adéquate pour <100 utilisateurs ; au-delà on migrerait vers Redux ou Zustand.',
  ],
  defense: [
    'Que se passe-t-il si un écran appelle useStore() sans être enveloppé par StoreProvider ? Le hook lève une erreur claire : "must be used inside <StoreProvider>".',
    'Pourquoi Set pour favorites et Array pour userItinerary ? Set évite les doublons et permet .has() en O(1) ; Array garde l’ordre chronologique du planning.',
    'Comment garantir que l’état n’est pas perdu à la fermeture de l’app ? On l’enverrait vers AsyncStorage (persistant) dans un useEffect à chaque changement. Non implémenté pour le PFF pour rester simple.',
  ],
}));

// -- mockData.js
children.push(...fileChapter({
  title: 'C.5 src/data/mockData.js — les données de l’application',
  path: 'src/data/mockData.js',
  role:
    'Ce fichier joue le rôle d’une base de données locale. Il définit les 6 ' +
    'catégories et environ 30 lieux (7 restaurants, 5 cafés, 4 spots nature, ' +
    '4 activités historiques, 6 boutiques, 4 mises en avant). Chaque lieu a un ' +
    'nom, une catégorie, des coordonnées GPS réelles, une note, des photos, une ' +
    'description, et éventuellement un téléphone et un site web.',
  connections: [
    'HomeScreen importe featuredPlaces + categories pour l’accueil.',
    'CategoryListScreen importe foodPlaces, coffeePlaces, naturePlaces, etc. selon le tap.',
    'MapScreen utilise allMapPlaces (fusion de toutes les listes) pour poser les marqueurs.',
    'store.js utilise "itinerary" comme planning initial (seed) au premier lancement.',
  ],
  keyPoints: [
    'La forme d’un lieu est documentée en tête de fichier — c’est le "schéma" à respecter.',
    'Les images peuvent être des URL (chaînes) OU des require() locaux — c’est pourquoi les écrans font "typeof image === string ? { uri: image } : image".',
    'allMapPlaces est construit avec l’opérateur spread (...) et enrichit chaque lieu avec "kind" et "color".',
    'findPlaceById est un utilitaire qui retrouve un lieu par son id à travers toutes les catégories.',
  ],
  defense: [
    'Comment passe-t-on d’ici à une vraie base de données ? On remplace chaque export const par un appel await supabase.from(...).select() ; le reste du code n’a pas besoin de changer.',
    'Pourquoi certains lieux ont un priceRange et d’autres pas ? Seuls Food et Coffee affichent une fourchette de prix précise ; pour les plages ou les visites, c’est gratuit ou variable.',
    'Comment sont choisies les coordonnées GPS ? Je les ai relevées manuellement depuis Google Maps sur les vrais lieux à Bizerte.',
  ],
}));

// -- navigation
children.push(...fileChapter({
  title: 'C.6 src/navigation/AppNavigator.js — le routeur',
  path: 'src/navigation/AppNavigator.js',
  role:
    'AppNavigator est le "GPS" de l’application. Il utilise React Navigation, la ' +
    'librairie standard, pour combiner deux navigateurs : un Stack (pile) pour la ' +
    'séquence splash → onboarding → main, et des Tabs (onglets) pour l’intérieur ' +
    'de l’app (Home / Map / Itinerary / Profile).',
  connections: [
    'Importe les 10 écrans depuis src/screens/.',
    'Utilise useTheme() pour teinter la barre d’onglets.',
    'Utilise useT() pour traduire les labels des onglets.',
    'Est rendu par App.js, à l’intérieur de StoreProvider.',
  ],
  keyPoints: [
    'initialRouteName="Splash" définit l’écran de démarrage.',
    'headerShown: false désactive l’en-tête par défaut de React Navigation — on dessine le nôtre.',
    'Le Stack peut pousser (navigate) ou remplacer (replace) un écran ; le Tab garde en mémoire l’état de chaque onglet.',
    'PlaceDetail est dans le Stack et NON dans les Tabs → il apparaît au-dessus des tabs avec animation de droite à gauche.',
  ],
  defense: [
    'Pourquoi Stack + Tab ? Le Stack gère les transitions "vers l’avant / vers l’arrière", les Tabs gèrent les vues indépendantes.',
    'Comment navigate("PlaceDetail", { place }) transmet-il l’objet place ? Via route.params dans l’écran de destination.',
    'Peut-on avoir un Tab dans un Tab ? Techniquement oui, mais l’expérience utilisateur devient confuse.',
  ],
}));

// -- SplashScreen
children.push(...fileChapter({
  title: 'C.7 src/screens/SplashScreen.js — écran de démarrage',
  path: 'src/screens/SplashScreen.js',
  role:
    'C’est le premier écran affiché : un dégradé bleu avec le logo au centre, ' +
    'pendant 2,2 secondes. Il donne une identité visuelle à l’app et masque le ' +
    'temps de chargement initial de la bibliothèque JavaScript.',
  connections: [
    'Utilise expo-linear-gradient pour le dégradé.',
    'Utilise l’image assets/icon.png (require).',
    'À la fin du timer, appelle navigation.replace("Onboarding1").',
  ],
  keyPoints: [
    'useEffect s’exécute UNE SEULE FOIS après le premier rendu — on y met le timer.',
    'Le return de useEffect est une fonction de nettoyage : clearTimeout annule le timer si l’écran disparaît avant.',
    'Les deux ronds décoratifs (blobs) sont juste des <View> arrondis positionnés en absolu.',
  ],
  defense: [
    'Pourquoi replace et pas navigate ? Pour empêcher l’utilisateur de revenir au splash avec le geste "swipe back".',
    'Pourquoi Dimensions.get("window") en dehors du composant ? Parce qu’on n’en a besoin qu’une fois — pas la peine de le recalculer à chaque rendu.',
  ],
}));

// -- Onboarding1
children.push(...fileChapter({
  title: 'C.8 src/screens/Onboarding1.js — "Find what’s nearby"',
  path: 'src/screens/Onboarding1.js',
  role:
    'Premier des deux écrans d’accueil qui présentent l’application. Il montre ' +
    'une illustration de carte avec des épingles colorées, un titre, une ' +
    'description, deux "dots" de progression et un bouton "Next".',
  connections: [
    'Est appelé après SplashScreen.',
    'Peut naviguer vers Onboarding2 (Next) ou ChooseCity (Skip).',
    'N’utilise ni store ni i18n — c’est un écran statique en anglais.',
  ],
  keyPoints: [
    'L’illustration est composée de <View> stylisés — aucun asset PNG requis.',
    'La rotation "transform: [{ rotate: `-6deg` }]" est utilisable en React Native comme en CSS.',
    'Le premier dot est plus large et bleu (dotActive) — indication visuelle de progression.',
  ],
  defense: [
    'Que se passe-t-il si l’utilisateur relance l’app ? Il revoit tout l’onboarding. Pour le mémoriser, on stockerait un booléen dans AsyncStorage au tap sur "Next".',
  ],
}));

// -- Onboarding2
children.push(...fileChapter({
  title: 'C.9 src/screens/Onboarding2.js — "Customize your travel"',
  path: 'src/screens/Onboarding2.js',
  role:
    'Second écran d’accueil. Même structure qu’Onboarding1 mais avec une ' +
    'illustration de personne à valise et un texte différent.',
  connections: [
    'Est appelé depuis Onboarding1.',
    'Navigue vers ChooseCity (Next ou Skip).',
  ],
  keyPoints: [
    'La personne à valise est entièrement dessinée en <View> stylisés (tête, corps, valise).',
    'Le second dot est actif ici — le premier est éteint.',
  ],
}));

// -- ChooseCity
children.push(...fileChapter({
  title: 'C.10 src/screens/ChooseCity.js — sélection de la ville',
  path: 'src/screens/ChooseCity.js',
  role:
    'Écran de sélection de la ville de destination. Bizerte est présélectionnée. ' +
    'Un champ de recherche filtre les villes en temps réel. Le bouton "Follow up" ' +
    'en bas mène à l’application principale (MainTabs).',
  connections: [
    'Utilise useTheme() pour les couleurs.',
    'Ne dépend d’aucune donnée externe — la liste des villes est en dur.',
    'À la validation, appelle navigation.replace("Main") → ouvre MainTabs.',
  ],
  keyPoints: [
    'L’Illustration (personne à casquette) est un composant local dessiné en <View>.',
    'Le filtre est une simple .filter() sur un tableau — pas besoin de moteur de recherche.',
    'setSelected(city) déclenche un re-rendu qui met à jour la coche à droite.',
  ],
  defense: [
    'Pourquoi Bizerte est présélectionnée ? Parce que c’est le seul lieu vraiment couvert par les données. Sélectionner une autre ville n’a pas d’effet pour l’instant.',
    'Comment ajouter Tunis avec vraiment des lieux Tunis ? On créerait un objet cities[cityId] avec sa propre liste de restaurants, cafés, etc.',
  ],
}));

// -- HomeScreen
children.push(...fileChapter({
  title: 'C.11 src/screens/HomeScreen.js — accueil',
  path: 'src/screens/HomeScreen.js',
  role:
    'L’écran principal après connexion. Il affiche : la ville sélectionnée en ' +
    'haut, un champ de recherche décoratif, 6 catégories horizontales, une ' +
    'bannière bleue "Plan your perfect day", un carrousel "Popular" et une liste ' +
    'verticale "Nearby". Chaque carte est cliquable et ouvre PlaceDetail.',
  connections: [
    'Consomme featuredPlaces et categories depuis mockData.js.',
    'Utilise useTheme() et useT().',
    'Navigue vers CategoryList (au tap sur une catégorie), PlaceDetail (au tap sur une carte), ou Itinerary (bannière).',
  ],
  keyPoints: [
    'C’est LE schéma type de tous les écrans : hook thème → hook trad → makeStyles → useState local → JSX.',
    'ScrollView est utilisé horizontalement pour les catégories et le carrousel Popular.',
    'FlatList aurait été plus économe si la liste "Nearby" était longue — ici on a 4 éléments donc .map() suffit.',
    'Chaque image peut être une URL OU un require local — d’où le "typeof p.image === string" dans chaque <Image>.',
  ],
  defense: [
    'Pourquoi useMemo pour makeStyles ? Pour ne recréer les styles que si colors change (mode sombre bascule).',
    'Comment ajouter une 3e section (par exemple "Trending") ? Créer un nouveau tableau trending dans mockData.js et le rendre après le carrousel Popular.',
    'Pourquoi le "See all" ne fait rien ? Volontairement laissé simple pour le PFF ; brancher vers CategoryList serait trivial.',
  ],
}));

// -- CategoryListScreen
children.push(...fileChapter({
  title: 'C.12 src/screens/CategoryListScreen.js — grille filtrée',
  path: 'src/screens/CategoryListScreen.js',
  role:
    'Après avoir tapé une catégorie sur l’accueil, cet écran affiche tous les ' +
    'lieux de la catégorie sous forme de grille 2 colonnes. Il propose un champ ' +
    'de recherche en direct et 4 chips de filtre (All / Top rated / Budget / Favorites).',
  connections: [
    'Reçoit la catégorie via route.params.category.',
    'Choisit la bonne liste dans un objet categoryData qui mappe id → tableau.',
    'Utilise useStore() pour isFavorite et toggleFavorite (bouton cœur sur chaque carte).',
    'Navigue vers PlaceDetail au tap sur une carte.',
  ],
  keyPoints: [
    'FlatList numColumns={2} construit la grille automatiquement.',
    'useMemo enveloppe le calcul de la liste filtrée pour éviter des re-tris à chaque frappe.',
    'Le tri Budget compare la longueur de la chaîne price ($ vs $$ vs $$$).',
    'Le tri "Favorites" filtre la liste sans changer l’état — c’est une vue en lecture seule.',
  ],
  defense: [
    'Pourquoi FlatList et pas ScrollView ? FlatList ne dessine que les éléments visibles → économie mémoire quand la liste devient longue.',
    'Comment fonctionne isFavorite ? C’est un Set.has(id) — opération O(1), très rapide.',
    'Que se passe-t-il si aucun élément ne correspond à la recherche ? On affiche le composant "No matches" avec une icône loupe.',
  ],
}));

// -- PlaceDetailScreen
children.push(...fileChapter({
  title: 'C.13 src/screens/PlaceDetailScreen.js — fiche détaillée',
  path: 'src/screens/PlaceDetailScreen.js',
  role:
    'L’écran le plus riche. Il affiche : une hero image plein écran, boutons ' +
    'flottants (retour, partager, favori), le nom, l’adresse, le prix, la note, ' +
    'les statistiques, la description, une galerie de 3 photos, la liste des ' +
    'avis, et un pied de page collant avec "Directions" et "Add to itinerary".',
  connections: [
    'Reçoit le lieu via route.params.place.',
    'Utilise useStore pour isFavorite, toggleFavorite, addToItinerary, userItinerary.',
    'Utilise Linking (natif) pour ouvrir Maps, tel:, ou l’URL du site.',
    'Utilise Share (natif) pour la feuille de partage.',
  ],
  keyPoints: [
    'Platform.select renvoie une URL différente selon iOS (maps:) ou Android (geo:).',
    'Le .catch() en secours ouvre Google Maps en ligne si l’URL native échoue.',
    'Le bouton "Add" devient "Added" et change de couleur si le lieu est déjà dans l’itinéraire — feedback visuel important.',
    'La galerie utilise place.gallery si présent, sinon dérive vers [place.image, place.image, place.image].',
  ],
  defense: [
    'Comment fonctionne le partage ? La méthode native Share.share() ouvre la feuille système avec le message ; l’utilisateur choisit ensuite WhatsApp, Mail, etc.',
    'Que se passe-t-il si l’utilisateur tape "Directions" sans avoir Google Maps installé ? On tente l’URL native, si elle échoue on retombe sur la version web.',
    'Comment ajouter un vrai formulaire d’avis ? On créerait un composant AddReview qui utilise TextInput et pousse dans un tableau du store.',
  ],
}));

// -- ItineraryScreen
children.push(...fileChapter({
  title: 'C.14 src/screens/ItineraryScreen.js — planning journalier',
  path: 'src/screens/ItineraryScreen.js',
  role:
    'Affiche le planning d’une journée sous forme de timeline verticale. Chaque ' +
    'entrée = heure + titre + durée + bouton poubelle. Le sélecteur de jour en ' +
    'haut est décoratif pour l’instant. Une carte "récap" affiche la date et le ' +
    'total des activités.',
  connections: [
    'Lit userItinerary via useStore().',
    'Utilise addBlankActivity et removeFromItinerary pour modifier.',
    'Utilise Alert.alert pour confirmer les suppressions.',
  ],
  keyPoints: [
    'reduce() parcourt le tableau et accumule les minutes.',
    'Une regex extrait heures et minutes d’une chaîne "1h 30m".',
    'La barre verticale entre les points n’apparaît que si ce n’est PAS le dernier élément (i < list.length - 1).',
    'L’état vide affiche un message d’aide avec icône — bon exemple d’expérience utilisateur.',
  ],
  defense: [
    'Comment persister l’itinéraire entre deux ouvertures ? Ajouter AsyncStorage : useEffect(() => saveToStorage(userItinerary), [userItinerary]).',
    'Comment permettre le glisser-déposer pour réordonner ? Utiliser react-native-draggable-flatlist.',
  ],
}));

// -- MapScreen
children.push(...fileChapter({
  title: 'C.15 src/screens/MapScreen.js — carte interactive',
  path: 'src/screens/MapScreen.js',
  role:
    'Affiche tous les lieux sur une vraie carte. Sur iOS, c’est Apple Maps ; sur ' +
    'Android, Google Maps. Chaque lieu est un marqueur coloré selon sa catégorie. ' +
    'Une rangée de chips filtre par catégorie. Taper un marqueur zoome dessus et ' +
    'affiche une carte détail en bas.',
  connections: [
    'Utilise react-native-maps (librairie externe, installée via expo install).',
    'Consomme allMapPlaces et CITY_CENTER de mockData.js.',
    'useRef garde une référence à la MapView pour piloter la caméra.',
  ],
  keyPoints: [
    'PROVIDER_DEFAULT laisse la plateforme choisir le fournisseur de tuiles.',
    'animateToRegion prend une région (latitude, longitude, deltas de zoom) et une durée en ms.',
    'tracksViewChanges={false} sur chaque marqueur = optimisation batterie majeure.',
    'Le sélecteur de catégorie n’est PAS un state supplémentaire dans le store — il est local à cet écran.',
  ],
  defense: [
    'Pourquoi useRef et pas useState pour la référence à la carte ? Parce qu’une modification de useRef ne déclenche PAS de re-rendu — c’est exactement ce qu’on veut pour un pilotage impératif.',
    'Comment fonctionne PROVIDER_DEFAULT sur Android ? Il essaie d’utiliser Google Maps ; s’il n’a pas de clé API configurée, il affiche une carte "de secours" (fond gris avec marqueurs).',
    'Comment ajouter le tracé d’un itinéraire ? Avec Polyline de react-native-maps + l’API Google Directions.',
  ],
}));

// -- ProfileScreen
children.push(...fileChapter({
  title: 'C.16 src/screens/ProfileScreen.js — profil et préférences',
  path: 'src/screens/ProfileScreen.js',
  role:
    'L’onglet Profil : avatar, statistiques (favoris / activités / ville), ' +
    'sélecteur de thème (clair/sombre), sélecteur de langue (EN/FR/AR), ' +
    'options de compte (notifications, ville, aide, version), bouton déconnexion.',
  connections: [
    'Utilise useTheme() et useStore() (le plus lourd consommateur du store).',
    'Alert.alert est utilisé comme UI de picker pour la langue.',
    'Navigue vers ChooseCity pour changer de ville.',
  ],
  keyPoints: [
    'Le sélecteur de thème n’est pas un vrai toggle mais 2 grosses cartes avec aperçu miniature — plus explicite.',
    'La couche visuelle des cartes de thème simule un vrai écran (deux lignes de texte + un cercle).',
    'Le composant "Row" est extrait pour éviter la duplication (6 lignes très similaires).',
    'Chaque action a un effet réel (Alert, navigation, setLanguage, setMode) — aucun bouton mort.',
  ],
  defense: [
    'Pourquoi une Alert pour la langue et pas un vrai modal custom ? Simple, natif, cohérent iOS/Android.',
    'Comment fonctionne setMode ? Il appelle setThemeMode dans le store, ce qui change themeMode → ThemeContext se met à jour → tous les useTheme() re-render.',
    'Comment sauvegarder les préférences ? Encoder l’objet { mode, language } dans AsyncStorage à chaque changement.',
  ],
}));

// =============================================================================
// PART D — CONNECTIONS OVERVIEW
// =============================================================================

children.push(
  h1('D. Vue d’ensemble des connexions'),

  h2('D.1 Diagramme des dépendances'),
  code(
`App.js
  │
  ├── SafeAreaProvider (librairie)
  │      │
  │      └── StoreProvider  ← src/store.js
  │             │              (utilise ThemeContext de src/theme/colors.js)
  │             │              (utilise translate() de src/i18n.js)
  │             │              (utilise itinerary de src/data/mockData.js)
  │             │
  │             └── AppNavigator  ← src/navigation/AppNavigator.js
  │                    │
  │                    ├── Stack.Screen "Splash"       → SplashScreen
  │                    ├── Stack.Screen "Onboarding1"  → Onboarding1
  │                    ├── Stack.Screen "Onboarding2"  → Onboarding2
  │                    ├── Stack.Screen "ChooseCity"   → ChooseCity
  │                    ├── Stack.Screen "Main"         → MainTabs
  │                    │       │
  │                    │       ├── Tab.Screen "Home"      → HomeScreen
  │                    │       ├── Tab.Screen "Map"       → MapScreen
  │                    │       ├── Tab.Screen "Itinerary" → ItineraryScreen
  │                    │       └── Tab.Screen "Profile"   → ProfileScreen
  │                    │
  │                    ├── Stack.Screen "CategoryList" → CategoryListScreen
  │                    └── Stack.Screen "PlaceDetail"  → PlaceDetailScreen`
  ),

  h2('D.2 Où va chaque type de donnée ?'),
  table2col(
    ['Type de donnée', 'Fichier source → où c’est utilisé'],
    [
      ['Favoris', 'store.js (Set) → CategoryList, PlaceDetail, Profile (stat)'],
      ['Itinéraire', 'store.js (Array) → Itinerary (affichage), PlaceDetail (add)'],
      ['Thème', 'colors.js (palettes) + store.js (mode) → tous les écrans'],
      ['Langue', 'i18n.js (dict) + store.js (langue) → tous les écrans via useT()'],
      ['Lieux', 'mockData.js → HomeScreen, CategoryList, PlaceDetail, Map'],
      ['Routes', 'AppNavigator.js → navigation.navigate(...) partout'],
    ]
  ),

  h2('D.3 Séquence de démarrage'),
  num('Expo charge App.js.'),
  num('React monte SafeAreaProvider (mesure la zone sûre).'),
  num('React monte StoreProvider (initialise favoris=Set(), itinéraire=seed, mode=light, langue=en).'),
  num('React monte AppNavigator → NavigationContainer.'),
  num('Le Stack démarre sur initialRouteName="Splash" → SplashScreen s’affiche.'),
  num('setTimeout se lance dans useEffect → 2,2 s.'),
  num('navigation.replace("Onboarding1") → Onboarding1 remplace le Splash.'),
  num('Utilisateur tape "Skip" ou parcourt les 2 pages d’onboarding.'),
  num('Arrivée à ChooseCity → sélection Bizerte → tap "Follow up".'),
  num('navigation.replace("Main") → MainTabs s’ouvre sur Home.'),
);

// =============================================================================
// PART E — DEFENSE Q&A DEEP DIVE
// =============================================================================

children.push(
  h1('E. Réponses détaillées aux questions de jury'),

  h2('E.1 Questions techniques'),
  pBold('1. "Pourquoi avoir choisi React Native ?"'),
  p(
    'Trois raisons : (1) JavaScript est un langage que j’ai déjà pratiqué dans ' +
    'd’autres projets web, la courbe d’apprentissage a été rapide ; (2) une ' +
    'seule base de code produit une app iOS et Android — divisé le temps de ' +
    'développement par deux ; (3) l’écosystème NPM est immense — pour la carte, ' +
    'les gradients, les icônes, tout existe en 5 minutes.'
  ),

  pBold('2. "Pourquoi Expo et pas React Native CLI ?"'),
  p(
    'Sans Expo, il faut installer Xcode (uniquement sur Mac) pour compiler iOS, ' +
    'Android Studio (10 Go) pour Android, gérer les certificats, écrire des ' +
    'scripts de build. Expo fait tout ça pour moi et me donne "Expo Go" qui ' +
    'permet de tester sur mon iPhone en scannant un QR code. Si j’ai besoin ' +
    'd’un module natif spécifique plus tard, je peux "ejecter" du système Expo.'
  ),

  pBold('3. "Pourquoi TypeScript n’a-t-il pas été utilisé ?"'),
  p(
    'Volontaire : je voulais rester concentré sur la logique métier et la qualité ' +
    'de l’UI. TypeScript aurait ajouté ~1 semaine d’apprentissage sans valeur ' +
    'immédiate pour un projet de cette taille. À rebrancher en évolution.'
  ),

  pBold('4. "Comment gères-tu l’état global ?"'),
  p(
    'Via React Context (fichier store.js). Deux contexts distincts : ThemeContext ' +
    'pour le thème (créé dans colors.js) et StoreContext pour tout le reste ' +
    '(créé dans store.js). Chaque écran accède à l’état via des hooks : ' +
    'useTheme() pour les couleurs, useStore() pour les favoris et l’itinéraire, ' +
    'useT() pour les traductions.'
  ),

  pBold('5. "Pourquoi pas Redux ?"'),
  p(
    'Redux est puissant mais introduit du code cérémoniel (actions, reducers, ' +
    'thunks). Pour une app à 4 onglets et 10 écrans, React Context suffit ' +
    'largement. Si le projet croît (>20 écrans, plusieurs équipes), la ' +
    'migration vers Zustand ou Redux Toolkit se fait fichier par fichier.'
  ),

  h2('E.2 Questions design et UX'),

  pBold('6. "Comment fonctionne le mode sombre ?"'),
  p(
    'Deux palettes complètes sont définies dans colors.js (lightColors, ' +
    'darkColors) avec exactement les mêmes clés. Le store maintient un état ' +
    '"themeMode" (light ou dark). ThemeContext expose { colors, mode, setMode, ' +
    'toggle }. Quand l’utilisateur tape "Dark" dans Profile → setMode change ' +
    'l’état → tous les composants qui utilisent useTheme() se re-rendent avec ' +
    'la nouvelle palette. Instantané, sans clignotement.'
  ),

  pBold('7. "Et le support multilingue ?"'),
  p(
    'Dictionnaire dans i18n.js : { clé: { en, fr, ar } }. Le store expose une ' +
    'fonction t(clé) qui lit la langue active. Chaque écran remplace ses ' +
    'chaînes en dur par t("home.popular"). Changer de langue depuis Profile ' +
    'déclenche un re-rendu instantané.'
  ),

  pBold('8. "Y a-t-il une charte graphique ?"'),
  p(
    'Oui, implicite mais cohérente : bleu #1D2BEF comme couleur primaire ' +
    '(rappel de l’identité "Bp"), gris très clair pour les surfaces, textes en ' +
    'gris anthracite. Espacement en système octal (4, 8, 12, 16, 24, 32). ' +
    'Rayons d’arrondi de 8, 12, 18, 24 pour la douceur du design.'
  ),

  h2('E.3 Questions données et backend'),

  pBold('9. "Où sont stockées les données ?"'),
  p(
    'Actuellement dans le fichier mockData.js (local, en mémoire). Ce choix ' +
    'était volontaire pour livrer une interface complète pendant le PFF. La ' +
    'prochaine étape est de brancher Supabase (Postgres + auth + storage). ' +
    'Le refactor est simple : remplacer chaque export const par un hook async ' +
    'useSupabaseQuery(). Aucun écran ne devrait bouger.'
  ),

  pBold('10. "Comment ajouter des avis modifiables par l’utilisateur ?"'),
  p(
    'Ajouter un formulaire (TextInput + rating stars) sur PlaceDetail. Au submit, ' +
    'ajouter une entrée dans un nouveau tableau reviews[] du store. Persister ' +
    'ensuite via AsyncStorage (local) ou Supabase (cloud).'
  ),

  h2('E.4 Questions carte et localisation'),

  pBold('11. "Comment fonctionne la carte ?"'),
  p(
    'Elle utilise react-native-maps. Sur iOS, ce composant utilise Apple Maps ' +
    'automatiquement (gratuit, pas de clé). Sur Android, il utilise Google Maps ' +
    'et demande une clé API. Chaque lieu de mockData a des coordonnées lat/lng ' +
    'réelles → un Marker est posé pour chacun. Taper un marqueur zoome avec ' +
    'animateToRegion et affiche la carte détail en bas.'
  ),

  pBold('12. "Comment sont obtenues les vraies coordonnées ?"'),
  p(
    'Relevées manuellement sur Google Maps pour chaque lieu réel : le Vieux Port, ' +
    'Cap Blanc, Ichkeul, Corniche, les restaurants (Crock’in, EL Ksiba, etc.). ' +
    'Pour scaler, on brancherait l’API de géocodage.'
  ),

  h2('E.5 Questions performance et déploiement'),

  pBold('13. "L’app est-elle rapide sur téléphone ?"'),
  p(
    'Oui, testée sur iPhone via Expo Go : temps de démarrage <5 s, transitions ' +
    'd’écran instantanées, scroll fluide à 60 fps. Optimisations utilisées : ' +
    'useMemo pour les styles dynamiques et les filtres, FlatList pour les grilles, ' +
    'tracksViewChanges={false} sur les marqueurs de la carte.'
  ),

  pBold('14. "Comment déploierais-tu l’app en production ?"'),
  p(
    'Via EAS Build (Expo Application Services). Une commande "eas build ' +
    '--platform ios" construit un .ipa signé dans le cloud d’Expo. Upload sur ' +
    'App Store Connect → TestFlight pour les beta-testeurs → App Store pour ' +
    'production. Pour Android, "eas build --platform android" génère un .aab.'
  ),

  pBold('15. "Combien coûte ce déploiement ?"'),
  p(
    'iOS : 99 $/an pour le Apple Developer Program (obligatoire). Android : ' +
    '25 $ une seule fois pour Google Play Developer. EAS Build : gratuit ' +
    'jusqu’à 30 builds/mois. Total ~130 $ la première année.'
  ),

  h2('E.6 Questions générales'),

  pBold('16. "Quelle a été la partie la plus difficile ?"'),
  p(
    'Le mode sombre. Il a fallu refactoriser TOUS les écrans pour que leurs ' +
    'styles soient calculés depuis les couleurs plutôt que codés en dur. ' +
    'J’ai créé un pattern "makeStyles(colors)" que chaque écran utilise avec ' +
    'useMemo. Une fois ce pattern posé, ajouter un nouvel écran est simple.'
  ),

  pBold('17. "Combien de temps a pris le projet ?"'),
  p(
    'Environ 6 semaines à temps plein : 1 semaine de conception (maquettes ' +
    'Figma, MCD, UML), 3 semaines de développement (écrans), 1 semaine ' +
    'd’intégration (carte, thème sombre, i18n), 1 semaine de polish et ' +
    'documentation.'
  ),

  pBold('18. "Que ferais-tu différemment ?"'),
  p(
    'Je commencerais par TypeScript dès le départ, pour éviter des bugs de ' +
    'typage. J’intégrerais Supabase plus tôt pour valider le flux de bout en ' +
    'bout. Et j’écrirais des tests unitaires avec Jest pour les fonctions du ' +
    'store — c’est le cœur de la logique métier.'
  ),

  pBold('19. "Quelles évolutions possibles ?"'),
  bullet('Authentification (Sign in with Apple, Google).'),
  bullet('Backend Supabase pour les avis, favoris cloud, itinéraires partagés.'),
  bullet('Notifications push pour événements et promotions locales.'),
  bullet('Mode hors ligne complet (cache des tuiles carto).'),
  bullet('Extension aux autres villes tunisiennes (Tunis, Sousse, Djerba).'),
  bullet('Système de réservation (Crock’in, restaurants) via un partenariat local.'),

  pBold('20. "Pourquoi ce projet ?"'),
  p(
    'Bizerte est ma ville et je constate que les touristes ont peu d’outils ' +
    'pour la découvrir en dehors de Google Maps. Une app locale, avec les ' +
    'vraies adresses, les vraies photos, la vraie fourchette de prix en TND, ' +
    'crée une expérience plus authentique. C’est aussi un cadeau à ma ville.'
  ),
);

// -- Closing
children.push(
  h1('Conclusion'),
  p(
    'Ce document contient tout ce dont tu as besoin pour défendre le projet : ' +
    'les concepts fondamentaux, la structure, le code intégral de chaque fichier ' +
    'avec ses commentaires, les connexions entre modules, et 20 réponses ' +
    'préparées.'
  ),
  p(
    'Conseil pratique : lis-le une première fois entièrement pour comprendre, ' +
    'puis relis-le 2 fois en te concentrant sur les chapitres qui semblent les ' +
    'plus probables en défense (store.js, HomeScreen, PlaceDetail, MapScreen).'
  ),
  p(
    'Le jour J, garde ton calme, réfère-toi aux concepts fondamentaux si une ' +
    'question te déroute, et n’aie pas peur de dire "excellente question, ' +
    'laissez-moi expliquer" pour te donner 2 secondes de réflexion.'
  ),
  spacer(400),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    children: [new TextRun({ text: 'Bonne soutenance !', font: FONT, size: 36, bold: true, color: BLUE })],
  }),
);

// =============================================================================
// BUILD DOCUMENT
// =============================================================================
const doc = new Document({
  creator: 'Bon Plan Bizerte',
  title: 'Bon Plan Bizerte — Guide complet',
  description: 'Document de préparation à la soutenance PFF (version étendue)',
  styles: {
    default: { document: { run: { font: FONT, size: 22, color: DARK } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 44, bold: true, font: FONT, color: BLUE },
        paragraph: { spacing: { before: 320, after: 220 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: FONT, color: DARK },
        paragraph: { spacing: { before: 220, after: 140 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: FONT, color: BLUE },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ] },
      { reference: 'numbers',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: 'Bon Plan Bizerte — Guide complet du code', font: FONT, size: 18, color: GRAY, italics: true })],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Page ', font: FONT, size: 18, color: GRAY }),
          new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: GRAY }),
          new TextRun({ text: ' / ', font: FONT, size: 18, color: GRAY }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 18, color: GRAY }),
        ],
      })] }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('Bon-Plan-Bizerte-Guide-Complet.docx', buf);
  console.log('Generated: Bon-Plan-Bizerte-Guide-Complet.docx (' + (buf.length / 1024).toFixed(0) + ' KB)');
}).catch(err => {
  console.error('Build failed:', err);
  console.error(err.stack);
  process.exit(1);
});
