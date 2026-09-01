// Build a comprehensive Word document that explains the Bon Plan Bizerte
// codebase for someone WITH NO REACT BACKGROUND, in French.
// Designed as a defense crib sheet for the PFF presentation.
//
// Run:  node build-docx.js
// Out:  Bon-Plan-Bizerte-Explication-Code.docx

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageBreak, LevelFormat, BorderStyle, ShadingType,
  Table, TableRow, TableCell, WidthType, Header, Footer, PageNumber,
} = require(path.join('..', 'node_modules', 'docx'));

// ---------------------------------------------------------------------------
// Helpers — these build small reusable blocks of content
// ---------------------------------------------------------------------------

const FONT = 'Calibri';
const FONT_MONO = 'Consolas';
const BLUE = '1D2BEF';
const DARK = '0F1226';
const GRAY = '6B7080';
const SOFT = 'EEF0FE';

// One paragraph of plain body text
const p = (text, opts = {}) => new Paragraph({
  spacing: { before: 80, after: 80 },
  ...opts,
  children: [new TextRun({ text, font: FONT, size: 22, color: DARK, ...(opts.runOpts || {}) })],
});

// Title (level 1)
const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  pageBreakBefore: true,
  spacing: { before: 240, after: 200 },
  children: [new TextRun({ text, font: FONT, size: 40, bold: true, color: BLUE })],
});

// Subsection (level 2)
const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, font: FONT, size: 30, bold: true, color: DARK })],
});

// Sub-subsection
const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 180, after: 80 },
  children: [new TextRun({ text, font: FONT, size: 26, bold: true, color: BLUE })],
});

// Highlighted yellow callout box (uses table with light gray bg)
const callout = (label, body) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  rows: [new TableRow({
    children: [new TableCell({
      width: { size: 9360, type: WidthType.DXA },
      shading: { fill: SOFT, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: BLUE },
        left: { style: BorderStyle.SINGLE, size: 24, color: BLUE },
        right: { style: BorderStyle.SINGLE, size: 4, color: BLUE },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE },
      },
      children: [
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: label, font: FONT, size: 22, bold: true, color: BLUE })],
        }),
        ...(Array.isArray(body) ? body : [body]).map(txt =>
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text: txt, font: FONT, size: 21, color: DARK })],
          })
        ),
      ],
    })],
  })],
});

// Bulleted item using docx-js numbering reference 'bullets'
const bullet = (text, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level },
  spacing: { before: 40, after: 40 },
  children: [new TextRun({ text, font: FONT, size: 22, color: DARK })],
});

// Numbered item
const num = (text) => new Paragraph({
  numbering: { reference: 'numbers', level: 0 },
  spacing: { before: 40, after: 40 },
  children: [new TextRun({ text, font: FONT, size: 22, color: DARK })],
});

// Inline code phrase  (text with mixed body + code style)
const inlineCode = (parts) => new Paragraph({
  spacing: { before: 60, after: 60 },
  children: parts.map(part =>
    typeof part === 'string'
      ? new TextRun({ text: part, font: FONT, size: 22, color: DARK })
      : new TextRun({
          text: part.code, font: FONT_MONO, size: 20, color: 'A8330A',
          shading: { type: ShadingType.CLEAR, fill: 'F4F4F4' },
        })
  ),
});

// Code block - monospaced gray background
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
          spacing: { before: 0, after: 0, line: 260 },
          children: [new TextRun({ text: line || ' ', font: FONT_MONO, size: 19, color: '203040' })],
        })
      ),
    })],
  })],
});

// "Questions de défense" pink/orange callout
const defense = (questions) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  rows: [new TableRow({
    children: [new TableCell({
      width: { size: 9360, type: WidthType.DXA },
      shading: { fill: 'FFF7E6', type: ShadingType.CLEAR },
      margins: { top: 140, bottom: 140, left: 180, right: 160 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'F59E0B' },
        left: { style: BorderStyle.SINGLE, size: 24, color: 'F59E0B' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'F59E0B' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'F59E0B' },
      },
      children: [
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: 'Questions possibles en défense', font: FONT, size: 22, bold: true, color: 'B45309' })],
        }),
        ...questions.map(q =>
          new Paragraph({
            spacing: { before: 30, after: 30 },
            children: [new TextRun({ text: '• ' + q, font: FONT, size: 21, color: DARK })],
          })
        ),
      ],
    })],
  })],
});

// =============================================================================
// CONTENT
// =============================================================================
const children = [];

// ---------- COVER ----------
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 2400, after: 200 },
    children: [new TextRun({ text: 'Bon Plan Bizerte', font: FONT, size: 72, bold: true, color: BLUE })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'Explication ligne par ligne du code', font: FONT, size: 36, color: DARK })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 800 },
    children: [new TextRun({ text: 'Préparation à la soutenance PFF', font: FONT, size: 28, color: GRAY, italics: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'Document destiné à un lecteur sans expérience React', font: FONT, size: 24, color: GRAY })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: '— Année 2025 / 2026 —', font: FONT, size: 22, color: GRAY })],
  }),
);

// ============================================================================
// 0 — Sommaire (manuel, car TOC nécessite un build dans Word)
// ============================================================================
children.push(h1('Sommaire'));
[
  '1. Concepts de base à connaître (React, composant, prop, état, hook, JSX)',
  '2. Structure globale du projet',
  '3. App.js — le composant racine',
  '4. src/navigation/AppNavigator.js — la navigation entre écrans',
  '5. src/theme/colors.js — palette et tokens de design',
  '6. src/i18n.js — traductions EN / FR / AR',
  '7. src/store.js — mémoire globale de l’application',
  '8. src/data/mockData.js — données des lieux',
  '9. src/screens/SplashScreen.js — écran de démarrage',
  '10. src/screens/Onboarding1.js & Onboarding2.js — écrans d’accueil',
  '11. src/screens/ChooseCity.js — sélection de la ville',
  '12. src/screens/HomeScreen.js — page d’accueil',
  '13. src/screens/CategoryListScreen.js — liste filtrée d’une catégorie',
  '14. src/screens/PlaceDetailScreen.js — fiche détaillée d’un lieu',
  '15. src/screens/ItineraryScreen.js — planning journalier',
  '16. src/screens/MapScreen.js — carte interactive',
  '17. src/screens/ProfileScreen.js — profil et préférences',
  '18. Schéma des connexions entre fichiers',
  '19. Réponses aux questions classiques de jury',
].forEach(line => children.push(p(line)));

// ============================================================================
// 1 — Concepts de base
// ============================================================================
children.push(
  h1('1. Concepts de base à connaître'),
  p(
    'Avant de lire le code, il faut comprendre cinq mots-clés. Une fois ces ' +
    'cinq mots maîtrisés, tout le code de l’application devient prévisible : ' +
    'chaque écran suit toujours le même schéma.'
  ),

  h2('1.1 React Native'),
  p(
    'React Native est un framework créé par Facebook qui permet d’écrire une ' +
    'seule fois une application mobile et de la faire fonctionner à la fois ' +
    'sur iPhone (iOS) et sur Android. Au lieu d’apprendre Swift pour iOS ' +
    'et Java/Kotlin pour Android, on écrit du JavaScript. C’est ce qu’on ' +
    'appelle le développement multiplateforme.'
  ),
  callout('À retenir pour la défense', [
    'React Native = JavaScript pour applications mobiles natives.',
    'Une seule base de code → deux plateformes (iOS + Android).',
    'On utilise Expo pour simplifier la compilation et le test sur téléphone.',
  ]),

  h2('1.2 Composant'),
  p(
    'Un composant est une fonction JavaScript qui retourne un morceau ' +
    'd’interface graphique. Tout est composant : un bouton, une carte, un ' +
    'écran entier. Le nom commence toujours par une majuscule (par convention).'
  ),
  code(
`function MonBouton() {
  return <Text>Clique ici</Text>;
}`
  ),
  p('Un écran est juste un gros composant qui contient plein de petits composants.'),

  h2('1.3 JSX'),
  p(
    'JSX est la syntaxe qui ressemble à du HTML mais qui se trouve à ' +
    'l’intérieur de JavaScript. Le navigateur ne comprend pas JSX nativement : ' +
    'Babel (un outil) le transforme en appels JavaScript classiques avant ' +
    'que l’application ne tourne.'
  ),
  inlineCode([
    'En React Native, on écrit ', { code: '<View>' }, ', ', { code: '<Text>' },
    ', ', { code: '<Image>' }, ' au lieu de div, span, img.',
  ]),

  h2('1.4 Prop (propriété)'),
  p(
    'Une prop est une donnée transmise d’un composant parent à un composant enfant. ' +
    'C’est comme un argument de fonction. Exemple : la prop ' +
    'navigation est envoyée automatiquement à chaque écran par React Navigation.'
  ),
  code(
`<MonBouton couleur="bleu" texte="Clique" />
// À l’intérieur : function MonBouton({ couleur, texte }) { ... }`
  ),

  h2('1.5 State (état)'),
  p(
    'Le state est une donnée qui peut changer au cours du temps. Quand le ' +
    'state change, le composant se redessine automatiquement. On le crée avec ' +
    'le hook useState.'
  ),
  code(
`const [compteur, setCompteur] = useState(0);
// compteur = valeur actuelle, setCompteur = fonction pour la changer
<Button onPress={() => setCompteur(compteur + 1)}>+1</Button>`
  ),

  h2('1.6 Hook'),
  p(
    'Un hook est une fonction spéciale React qui commence toujours par "use". ' +
    'Les principaux qu’on utilise dans le projet :'
  ),
  bullet('useState — créer un state local au composant.'),
  bullet('useEffect — exécuter du code après le rendu (timer, requête, etc.).'),
  bullet('useMemo — mémoriser un calcul coûteux pour ne pas le refaire à chaque rendu.'),
  bullet('useContext — lire une donnée partagée par tous les composants (notre store).'),
  bullet('useRef — garder une référence vers un élément (utilisé pour la carte).'),

  h2('1.7 Context'),
  p(
    'React Context est un mécanisme pour partager une donnée entre tous les ' +
    'écrans sans avoir à la passer manuellement de parent à enfant. Dans Bon ' +
    'Plan Bizerte, on l’utilise pour les favoris, la langue, le thème et ' +
    'l’itinéraire (voir le fichier store.js).'
  ),
);

// ============================================================================
// 2 — Structure du projet
// ============================================================================
children.push(
  h1('2. Structure globale du projet'),
  p('Voici l’arborescence simplifiée :'),
  code(
`bon plan/
├── App.js                          ← point d’entrée
├── app.json                        ← config Expo (nom, icône, splash)
├── package.json                    ← dépendances NPM
│
├── assets/                         ← images et icônes
│   ├── icon.png
│   ├── splash-icon.png
│   └── home/                       ← photos téléchargées des lieux
│
└── src/
    ├── store.js                    ← état global (favoris, thème, langue)
    ├── i18n.js                     ← dictionnaire de traductions
    │
    ├── theme/
    │   └── colors.js               ← palettes claire / sombre + spacing
    │
    ├── data/
    │   └── mockData.js             ← liste des lieux (restos, cafés, etc.)
    │
    ├── navigation/
    │   └── AppNavigator.js         ← orchestre les écrans et les onglets
    │
    └── screens/
        ├── SplashScreen.js         ← logo animé 2s au lancement
        ├── Onboarding1.js
        ├── Onboarding2.js
        ├── ChooseCity.js
        ├── HomeScreen.js
        ├── CategoryListScreen.js
        ├── PlaceDetailScreen.js
        ├── ItineraryScreen.js
        ├── MapScreen.js
        └── ProfileScreen.js`
  ),
  callout('Idée maîtresse', [
    'Le projet sépare clairement : les données (data + i18n), la présentation ' +
    '(theme + screens) et la logique (store + navigation).',
    'Cette séparation s’appelle "séparation des préoccupations" — c’est une ' +
    'bonne pratique de génie logiciel.',
  ]),
);

// ============================================================================
// 3 — App.js
// ============================================================================
children.push(
  h1('3. App.js — le composant racine'),
  h2('Rôle'),
  p(
    'App.js est le tout premier fichier qu’Expo charge quand on lance ' +
    'l’application. Son rôle est d’"emballer" toute l’application dans des ' +
    'fournisseurs (providers) qui mettent à disposition certaines données ' +
    'partout : le thème, les favoris, la langue, etc.'
  ),
  h2('Code commenté'),
  code(
`import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { StoreProvider } from './src/store';

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </StoreProvider>
    </SafeAreaProvider>
  );
}`
  ),
  h2('Explication ligne par ligne'),
  bullet('import React — nécessaire pour utiliser la syntaxe JSX (<…/>).'),
  bullet('import StatusBar — composant qui contrôle la barre du haut du téléphone (heure, batterie).'),
  bullet('import SafeAreaProvider — gère la "zone sûre" (le notch de l’iPhone, la barre de gestes du bas).'),
  bullet('import AppNavigator — notre routeur d’écrans (voir chapitre 4).'),
  bullet('import StoreProvider — notre boîte d’état global (voir chapitre 7).'),
  bullet('export default function App() — c’est LE composant racine que Expo affiche.'),
  bullet('Les balises imbriquées suivent l’ordre des fournisseurs : SafeAreaProvider doit être le plus à l’extérieur.'),

  h2('Connexions avec les autres fichiers'),
  bullet('Importe StoreProvider depuis src/store.js → met à disposition les favoris, l’itinéraire, le thème, la langue.'),
  bullet('Importe AppNavigator depuis src/navigation/AppNavigator.js → décide quel écran s’affiche.'),

  defense([
    'Pourquoi y a-t-il deux providers imbriqués ? Pour que tout composant fils ait accès à la fois à la zone sûre et au store global.',
    'Que se passe-t-il si on supprime SafeAreaProvider ? Le contenu peut s’afficher derrière le notch de l’iPhone.',
    'Pourquoi <StatusBar style="auto" /> ? "auto" inverse les icônes (claires sur fond sombre, sombres sur fond clair) selon le thème actif.',
  ]),
);

// ============================================================================
// 4 — AppNavigator.js
// ============================================================================
children.push(
  h1('4. AppNavigator.js — la navigation'),
  h2('Rôle'),
  p(
    'AppNavigator est le "GPS" de l’application. Il décide quel écran ' +
    's’affiche selon où l’utilisateur est passé. On utilise la bibliothèque ' +
    'React Navigation, qui est le standard de fait pour les apps React Native.'
  ),
  h2('Deux types de navigateurs combinés'),
  bullet('Stack Navigator : empile les écrans comme dans une appli classique. Le bouton retour dépile.'),
  bullet('Bottom Tabs Navigator : la barre de navigation en bas avec 4 onglets (Home / Map / Itinerary / Profile).'),
  h2('Schéma de navigation'),
  code(
`SplashScreen (2 secondes)
   ↓
Onboarding1 → Onboarding2
   ↓
ChooseCity (sélection Bizerte)
   ↓
Main (= MainTabs)
   ├── Home      ← onglet par défaut
   ├── Map
   ├── Itinerary
   └── Profile
   ↓ (au tap sur un lieu)
PlaceDetail
   ↑ (au tap sur une catégorie)
CategoryList`
  ),
  h2('Lignes importantes'),
  inlineCode([
    { code: 'const Stack = createNativeStackNavigator();' },
    ' crée la pile principale.',
  ]),
  inlineCode([
    { code: 'const Tab = createBottomTabNavigator();' },
    ' crée la barre du bas.',
  ]),
  inlineCode([
    { code: 'initialRouteName="Splash"' },
    ' indique que l’app démarre toujours sur le splash.',
  ]),
  p(
    'Chaque <Tab.Screen> reçoit un nom (utilisé en code) et un composant. ' +
    'Le label affiché est traduit dynamiquement via t(\'tab.home\') etc.'
  ),
  h2('Comment naviguer dans le code'),
  code(
`// Dans un écran, React Navigation injecte automatiquement "navigation".
navigation.navigate('PlaceDetail', { place }); // empile un nouvel écran
navigation.goBack();                            // revient en arrière
navigation.replace('Main');                      // remplace l’écran courant`
  ),
  defense([
    'Pourquoi React Navigation et pas une autre librairie ? C’est la solution officiellement recommandée par Expo, très bien documentée.',
    'Quelle est la différence entre navigate et replace ? navigate ajoute un écran à la pile ; replace remplace l’écran courant (impossible de revenir en arrière).',
    'Comment passer des données d’un écran à l’autre ? Via le 2e argument de navigate, ici { place }.',
  ]),
);

// ============================================================================
// 5 — colors.js
// ============================================================================
children.push(
  h1('5. theme/colors.js — palette et tokens'),
  h2('Rôle'),
  p(
    'Ce fichier centralise toutes les couleurs, les espacements et les ' +
    'rayons d’arrondi. Si on veut changer le bleu de l’app, on le change ' +
    'ici une seule fois — toutes les pages se mettent à jour automatiquement.'
  ),
  h2('Deux palettes : lightColors et darkColors'),
  p(
    'Le fichier exporte deux objets qui ont exactement les mêmes clés mais ' +
    'des valeurs différentes. Quand l’utilisateur active le mode sombre dans ' +
    'le profil, on bascule de l’une à l’autre.'
  ),
  code(
`export const lightColors = {
  primary:    '#1D2BEF',
  background: '#FFFFFF',
  text:       '#0F1226',
  // ...
};

export const darkColors = {
  primary:    '#6D78FF',
  background: '#0B0C14',
  text:       '#F3F4F8',
  // ...
};`
  ),
  h2('Le hook useTheme()'),
  p(
    'C’est la "porte d’entrée" pour qu’un écran récupère la palette du moment. ' +
    'On l’appelle dans CHAQUE écran :'
  ),
  code(
`const { colors, mode, setMode } = useTheme();
// colors  = lightColors OU darkColors selon l’état
// mode    = 'light' ou 'dark'
// setMode = pour changer le mode`
  ),
  h2('Pourquoi un ThemeContext ?'),
  p(
    'C’est le mécanisme React qui permet à toutes les pages d’accéder au ' +
    'thème sans avoir à le transmettre manuellement. Le ThemeContext est ' +
    'créé ici (colors.js) puis rempli avec la vraie valeur dans store.js — ' +
    'cette séparation évite une dépendance circulaire entre les deux fichiers.'
  ),
  defense([
    'Pourquoi deux objets distincts au lieu d’un seul avec des conditions ? Plus rapide, plus lisible et plus facile à maintenir.',
    'Que sont spacing et radius ? Des constantes pour les marges (4, 8, 12, 16, 24…) et les rayons d’arrondi (8, 12, 18…), qui garantissent un design uniforme.',
    'Comment fonctionnent les useColors() vs useTheme() ? useColors retourne seulement la palette ; useTheme retourne aussi le mode et la fonction toggle.',
  ]),
);

// ============================================================================
// 6 — i18n.js
// ============================================================================
children.push(
  h1('6. i18n.js — les traductions'),
  h2('Rôle'),
  p(
    'Ce fichier rassemble TOUS les textes affichés à l’écran, traduits ' +
    'dans les trois langues : anglais (en), français (fr), arabe (ar). ' +
    'L’abréviation i18n vient de "internationalization" (i + 18 lettres + n).'
  ),
  h2('Structure du dictionnaire'),
  code(
`const dict = {
  'home.popular': { en: 'Popular',   fr: 'Populaires', ar: 'الأكثر شهرة' },
  'tab.home':     { en: 'Home',      fr: 'Accueil',    ar: 'الرئيسية'  },
  // ...
};`
  ),
  p(
    'La clé suit le format "écran.élément". On les regroupe par catégorie ' +
    '(home.*, tab.*, profile.*, cat.*) pour s’y retrouver facilement.'
  ),
  h2('Comment l’utiliser dans un écran'),
  code(
`import { useT } from '../store';

function MonEcran() {
  const t = useT();
  return <Text>{t('home.popular')}</Text>;
}`
  ),
  p('La fonction translate() applique trois niveaux de secours :'),
  num('Cherche la traduction dans la langue demandée.'),
  num('Si elle manque, retourne la version anglaise.'),
  num('Si l’anglais manque aussi, retourne la clé brute (pour repérer les oublis pendant le développement).'),

  defense([
    'Pourquoi pas une vraie librairie comme i18next ? Pour rester simple : on a seulement 3 langues et ~100 clés. Une dépendance externe serait excessive.',
    'Comment ajouter une 4e langue ? On ajoute une entrée dans LANGUAGES et un champ pour chaque clé du dictionnaire.',
    'Pourquoi des clés en notation "point" ? Pour bien grouper par écran et éviter les doublons.',
  ]),
);

// ============================================================================
// 7 — store.js
// ============================================================================
children.push(
  h1('7. store.js — la mémoire globale'),
  h2('Rôle'),
  p(
    'C’est LE fichier le plus important du projet. Il garde en mémoire ' +
    'TOUT ce qui doit survivre entre les écrans : favoris, itinéraire, mode ' +
    'sombre, langue. Sans ce fichier, chaque écran aurait sa propre ' +
    'mémoire et l’app serait incohérente.'
  ),
  h2('Le modèle utilisé : React Context'),
  p(
    'On crée une "boîte" (StoreContext) au sommet de l’app. Chaque ' +
    'écran à l’intérieur peut alors lire et modifier son contenu. C’est ' +
    'l’équivalent simplifié de Redux ou Zustand pour une app de cette taille.'
  ),
  h2('Quatre états gérés'),
  bullet('favorites : un Set d’ids de lieux ajoutés en favori.'),
  bullet('userItinerary : la liste des activités du planning journalier.'),
  bullet('themeMode : ‘light’ ou ‘dark’.'),
  bullet('language : ‘en’, ‘fr’ ou ‘ar’.'),
  h2('Les fonctions exposées'),
  code(
`isFavorite(id)        → true / false
toggleFavorite(id)    → ajoute ou retire
addToItinerary(place) → ajoute un lieu au planning avec heure auto
removeFromItinerary   → retire une activité par id
addBlankActivity()    → ajoute une activité vide à éditer
setLanguage(code)     → change la langue
setMode(mode)         → change le thème
toggle()              → bascule light ↔ dark
t(key)                → traduit une clé`
  ),
  h2('useMemo : pourquoi ?'),
  p(
    'On enveloppe l’objet exposé dans useMemo pour éviter de le recréer à ' +
    'chaque rendu. Sans cela, tous les écrans se redessineraient en boucle ' +
    'car React verrait un "nouvel" objet à chaque fois.'
  ),

  callout('Connexion clé', [
    'StoreProvider est utilisé dans App.js et enveloppe TOUS les écrans.',
    'Chaque écran appelle useStore() ou useT() pour accéder à la mémoire.',
    'Sans StoreProvider, ces hooks lancent une erreur claire (voir ligne ' +
    '"if (!ctx) throw new Error").',
  ]),
  defense([
    'Pourquoi pas Redux ? Trop lourd pour une app à 4 onglets. React Context suffit largement.',
    'Le state est-il sauvegardé entre deux ouvertures de l’app ? Non, il est en mémoire. Pour le persister, on ajouterait AsyncStorage.',
    'Comment fonctionne addToItinerary ? Il calcule l’heure de la nouvelle activité = heure de la précédente + 2h.',
  ]),
);

// ============================================================================
// 8 — mockData.js
// ============================================================================
children.push(
  h1('8. mockData.js — les données'),
  h2('Rôle'),
  p(
    'Ce fichier joue le rôle qu’une base de données ou une API jouerait dans ' +
    'une vraie application : il fournit la liste des lieux. Tant qu’on n’a pas ' +
    'de backend, on garde les données ici en dur ("mock" = simulé).'
  ),
  h2('Structure d’un lieu'),
  code(
`{
  id:          'f1',                     // identifiant unique
  name:        "Crock'in",                // nom affiché
  category:    'Tunisien · Salon de thé',
  rating:      3.5,                       // note 0-5
  reviews:     263,                       // nombre d’avis
  latitude:    37.2835,                   // coordonnées GPS réelles
  longitude:   9.8615,
  priceRange:  '18–40 TND par personne',
  price:       '$$',                      // symbole de prix
  phone:       '+216 23 903 375',
  website:     'crockin.tn',
  image:       require('.../crockin-1.jpg'),  // photo principale
  gallery:     [ /* 3 photos */ ],
  description: 'Charmant restaurant…',
  location:    'Route de la Corniche',
}`
  ),
  h2('Six listes thématiques'),
  bullet('featuredPlaces — les lieux mis en avant sur l’accueil.'),
  bullet('foodPlaces — 7 restaurants réels de Bizerte (EL Ksiba, Crock’in, Le Phenicien…).'),
  bullet('coffeePlaces — 5 cafés / lounges.'),
  bullet('naturePlaces — 4 sites naturels (Rimel, La Grotte, Ichkeul, Cap Blanc).'),
  bullet('activityPlaces — 4 activités historiques (Kasbah, Mosquée, etc.).'),
  bullet('shoppingPlaces — 6 boutiques (LC Waikiki, VOG, MARQUALUXE…).'),

  h2('allMapPlaces et findPlaceById'),
  p(
    'Pour la carte, on a besoin d’une seule liste fusionnée. allMapPlaces ' +
    'la construit avec l’opérateur spread (...) et ajoute un champ kind et color ' +
    'pour pouvoir filtrer et colorer les marqueurs sur la carte.'
  ),
  defense([
    'Comment passer à une vraie base de données ? Remplacer mockData.js par des appels fetch() vers Supabase ou Firebase ; le reste du code n’a pas besoin de changer.',
    'Pourquoi require() pour les images locales ? Parce que Metro (le bundler) doit savoir à l’avance quels fichiers inclure dans l’app.',
    'Quelle est la différence entre image et gallery ? image = photo principale (hero) ; gallery = 3 photos supplémentaires affichées en bas du détail.',
  ]),
);

// ============================================================================
// 9 — SplashScreen.js
// ============================================================================
children.push(
  h1('9. SplashScreen.js — écran de démarrage'),
  h2('Rôle'),
  p(
    'C’est l’écran qui apparaît pendant 2,2 secondes au lancement, avec le ' +
    'logo "Bp" sur fond bleu dégradé. Il sert à la fois d’identité visuelle ' +
    'et de temps de chargement.'
  ),
  h2('Mécanisme du timer'),
  code(
`useEffect(() => {
  const t = setTimeout(() => navigation.replace('Onboarding1'), 2200);
  return () => clearTimeout(t); // nettoyage si l’écran disparaît avant
}, [navigation]);`
  ),
  p(
    'useEffect exécute le code APRÈS le premier rendu. setTimeout déclenche ' +
    'la navigation vers Onboarding1 au bout de 2,2 secondes. Le return ' +
    'permet à React d’annuler le timer si l’utilisateur quitte l’écran ' +
    '(évite les fuites mémoire).'
  ),
  h2('Le dégradé bleu'),
  p(
    'On utilise expo-linear-gradient qui prend une liste de couleurs et ' +
    'crée un fondu fluide entre elles. Les deux gros ronds clairs (blobs) ' +
    'sont juste des <View> arrondis avec position: absolute et bordure infinie.'
  ),
  defense([
    'Pourquoi navigation.replace et pas navigate ? Pour empêcher l’utilisateur de revenir au splash en appuyant sur "retour".',
    'Pourquoi useEffect et pas un appel direct ? Un setTimeout dans le corps du composant serait recréé à chaque rendu. useEffect garantit qu’il ne s’exécute qu’une fois.',
  ]),
);

// ============================================================================
// 10 — Onboarding1 & 2
// ============================================================================
children.push(
  h1('10. Onboarding1.js & Onboarding2.js'),
  h2('Rôle'),
  p(
    'Deux écrans d’accueil qui présentent l’application au premier lancement. ' +
    'Chacun a une illustration, un titre, un sous-titre et un bouton "Suivant". ' +
    'Un bouton "Skip" en haut à droite saute directement à la sélection de ville.'
  ),
  h2('Illustration dessinée en code'),
  p(
    'Les illustrations ne sont pas des images PNG : elles sont composées de ' +
    'plusieurs <View> stylisés (rectangles, cercles, formes arrondies). C’est ' +
    'pourquoi elles s’adaptent automatiquement à la taille de l’écran. Avantage : ' +
    'zéro téléchargement, vectoriel, multiplateforme.'
  ),
  h2('Les "dots" de progression'),
  p(
    'Deux petits ronds en bas. Le rond actif est plus large et bleu — c’est ' +
    'juste un style conditionnel : <View style={[styles.dot, styles.dotActive]} />.'
  ),
  defense([
    'Pourquoi des Views et pas une image ? Léger, vectoriel, accessibilité meilleure.',
    'Comment savoir si l’utilisateur a déjà vu l’onboarding ? Pour le moment il le revoit à chaque démarrage. Pour le mémoriser, on stockerait un booléen dans AsyncStorage.',
  ]),
);

// ============================================================================
// 11 — ChooseCity
// ============================================================================
children.push(
  h1('11. ChooseCity.js — sélection de la ville'),
  h2('Rôle'),
  p(
    'Écran qui propose une liste de villes tunisiennes. Bizerte est ' +
    'présélectionnée. Un champ de recherche filtre la liste en temps réel. ' +
    'Le bouton "Follow up" en bas mène à l’application principale.'
  ),
  h2('Le filtrage en direct'),
  code(
`const [query, setQuery] = useState('');
const filtered = cities.filter((c) =>
  c.toLowerCase().includes(query.toLowerCase())
);`
  ),
  p(
    'À chaque frappe, query change → React recalcule filtered → le composant ' +
    'se redessine avec la nouvelle liste. C’est ça la "réactivité" de React.'
  ),
  defense([
    'Le filtre est-il sensible à la casse ? Non, on convertit tout en minuscules avant la comparaison.',
    'Comment ajouter une 7e ville ? Ajouter une chaîne dans le tableau cities ; aucune autre modification nécessaire.',
  ]),
);

// ============================================================================
// 12 — HomeScreen
// ============================================================================
children.push(
  h1('12. HomeScreen.js — page d’accueil'),
  h2('Rôle'),
  p(
    'C’est le centre névralgique de l’app. Affiche : la ville sélectionnée, ' +
    'une barre de recherche, 6 icônes de catégories, une bannière "Plan ton ' +
    'jour", un carrousel "Popular" et une liste "Nearby".'
  ),
  h2('Le tableau de bord du composant'),
  code(
`const { colors } = useTheme();          // thème actuel
const t = useT();                        // traducteur
const styles = useMemo(() => makeStyles(colors), [colors]); // styles dynamiques
const [activeCategory, setActiveCategory] = useState('food');`
  ),
  p(
    'C’est LE schéma de tous les écrans : 1 ligne pour le thème, 1 pour la ' +
    'traduction, 1 pour les styles dynamiques. Une fois ce schéma compris, ' +
    'tous les autres écrans suivent le même.'
  ),
  h2('Pourquoi useMemo pour les styles ?'),
  p(
    'Les styles dépendent des couleurs (qui changent quand on passe en mode ' +
    'sombre). useMemo dit : "ne recalcule les styles que si colors change". ' +
    'C’est une optimisation pour éviter des recalculs inutiles.'
  ),
  h2('La navigation vers la liste'),
  code(
`onPress={() => navigation.navigate('CategoryList', { category: cat })}`
  ),
  p(
    'Au tap sur "Food", on passe à l’écran CategoryList avec l’objet ' +
    'category en paramètre. C’est cet écran qui décide quelle liste afficher.'
  ),
  defense([
    'Pourquoi un ScrollView horizontal pour les catégories ? Parce qu’elles peuvent ne pas tenir sur la largeur de l’écran.',
    'Comment serait le code pour ajouter une 7e catégorie ? Ajouter un objet dans le tableau categories de mockData. Le rendu s’adapterait automatiquement.',
  ]),
);

// ============================================================================
// 13 — CategoryListScreen
// ============================================================================
children.push(
  h1('13. CategoryListScreen.js — liste filtrée'),
  h2('Rôle'),
  p(
    'Affiche tous les lieux d’une catégorie sous forme de grille à 2 colonnes. ' +
    'Inclut une recherche en direct, des chips de filtre (Tous / Mieux notés / ' +
    'Économique / Favoris) et un bouton cœur sur chaque carte.'
  ),
  h2('Sélection de la bonne liste'),
  code(
`const categoryData = {
  food:     foodPlaces,
  coffee:   coffeePlaces,
  nature:   naturePlaces,
  activity: activityPlaces,
  shopping: shoppingPlaces,
};
const data = categoryData[category.id] || featuredPlaces;`
  ),
  p(
    'On reçoit la catégorie en paramètre, on lit son id, on prend la bonne ' +
    'liste dans le dictionnaire. Si l’id est inconnu, on retombe sur les ' +
    'featuredPlaces — défaut "raisonnable".'
  ),
  h2('Filtre + tri en deux étapes'),
  code(
`const data = useMemo(() => {
  let list = all;
  // 1) recherche par nom, catégorie, lieu
  if (query.trim()) list = list.filter(/* ... */);
  // 2) chips
  if (filter === 'Top rated') list = [...list].sort((a, b) => b.rating - a.rating);
  if (filter === 'Budget')    list = [...list].sort((a, b) => a.price.length - b.price.length);
  if (filter === 'Favorites') list = list.filter((p) => isFavorite(p.id));
  return list;
}, [all, query, filter, isFavorite]);`
  ),
  defense([
    'Pourquoi useMemo ? Pour ne recalculer la liste filtrée que si une des 4 dépendances change.',
    'Comment fonctionne le tri par budget ? On utilise la longueur de la chaîne de prix ($, $$, $$$) — moins de $ = moins cher.',
    'FlatList ou ScrollView ? FlatList — elle ne dessine que les éléments visibles à l’écran (optimisation).',
  ]),
);

// ============================================================================
// 14 — PlaceDetailScreen
// ============================================================================
children.push(
  h1('14. PlaceDetailScreen.js — fiche détaillée'),
  h2('Rôle'),
  p(
    'Affiche tout sur un lieu : hero image, nom, adresse, prix, note, contact, ' +
    'description, galerie photos, avis. Pied de page collant avec "Itinéraire" ' +
    'et "Ajouter au planning".'
  ),
  h2('Quatre fonctions natives bien intégrées'),
  bullet('openDirections() — Ouvre Apple Maps ou Google Maps sur le lieu.'),
  bullet('share() — Affiche la feuille de partage native (WhatsApp, Messages, Mail…).'),
  bullet('callPhone() — Appuie sur le numéro pour lancer le composeur.'),
  bullet('openWebsite() — Ouvre le site web dans le navigateur par défaut.'),
  h2('Code de openDirections (le plus intéressant)'),
  code(
`const url = Platform.select({
  ios:     \`maps:0,0?q=\${label}@\${latitude},\${longitude}\`,
  android: \`geo:0,0?q=\${latitude},\${longitude}(\${label})\`,
});
Linking.openURL(url).catch(() =>
  Linking.openURL(\`https://www.google.com/maps/search/?api=1&query=\${latitude},\${longitude}\`)
);`
  ),
  p(
    'Platform.select retourne l’URL adaptée à l’OS. Si le téléphone n’a pas ' +
    'l’app native Maps, on retombe sur Google Maps en ligne (fallback).'
  ),
  defense([
    'Quelle est la différence entre maps: et geo: ? maps: est le schéma Apple Maps (iOS), geo: est universel (Android, lit l’appli préférée de l’utilisateur).',
    'Comment éviter de plomber l’app si Linking.openURL échoue ? Avec .catch() qui ouvre l’URL web en secours.',
    'Comment ajouter "in itinerary" dans le store ? On appelle addToItinerary(place) du store.',
  ]),
);

// ============================================================================
// 15 — ItineraryScreen
// ============================================================================
children.push(
  h1('15. ItineraryScreen.js — planning journalier'),
  h2('Rôle'),
  p(
    'Affiche les activités du jour sous forme de timeline verticale. Chaque ' +
    'ligne = une activité avec son heure, son titre et sa durée. Boutons ' +
    'pour ajouter, supprimer ou vider le planning.'
  ),
  h2('Calcul de la durée totale'),
  code(
`const totalMins = userItinerary.reduce((acc, it) => {
  const m = (it.duration || '1h').match(/(\\d+)\\s*h\\s*(\\d+)?/);
  if (!m) return acc;
  return acc + Number(m[1]) * 60 + (Number(m[2]) || 0);
}, 0);
const totalLabel = \`\${Math.floor(totalMins / 60)}h \${totalMins % 60}m\`;`
  ),
  p(
    'reduce parcourt toutes les activités et accumule les minutes. La regex ' +
    'extrait les heures et les minutes de "1h 30m". Math.floor + % donne le ' +
    'format final "Xh Ym".'
  ),
  h2('La timeline visuelle'),
  p(
    'Chaque ligne a une colonne "heure + rond coloré + barre verticale" puis ' +
    'une carte d’activité. La barre verticale est conditionnelle : seulement ' +
    'si ce n’est pas la dernière ligne.'
  ),
  defense([
    'Comment fonctionne reduce ? C’est la fonction qui parcourt un tableau en accumulant un résultat (ici, le total des minutes).',
    'À quoi sert la regex ? À analyser une chaîne de format "1h 30m" et en extraire les nombres.',
    'Pourquoi le store gère-t-il l’itinéraire et pas l’écran ? Pour que les ajouts depuis PlaceDetail se reflètent immédiatement ici.',
  ]),
);

// ============================================================================
// 16 — MapScreen
// ============================================================================
children.push(
  h1('16. MapScreen.js — carte interactive'),
  h2('Rôle'),
  p(
    'Affiche tous les lieux sur une vraie carte (Apple Maps sur iOS, Google ' +
    'Maps sur Android) avec des marqueurs colorés. On peut filtrer par ' +
    'catégorie via des chips et taper un marqueur pour voir la fiche.'
  ),
  h2('La librairie react-native-maps'),
  p(
    'C’est le wrapper officiel qui expose un composant <MapView> et des ' +
    '<Marker> qu’on peut placer où l’on veut. Chaque Marker reçoit une ' +
    'latitude et une longitude.'
  ),
  h2('Le useRef pour piloter la caméra'),
  code(
`const mapRef = useRef(null);
mapRef.current?.animateToRegion({
  latitude, longitude,
  latitudeDelta: 0.04, longitudeDelta: 0.04,
}, 500);`
  ),
  p(
    'useRef donne accès à la "vraie" instance du composant (équivalent à ' +
    'document.querySelector). On l’utilise pour appeler animateToRegion ' +
    'qui zoome doucement sur un point précis.'
  ),
  h2('latitudeDelta / longitudeDelta'),
  p(
    'Ces deux nombres contrôlent le niveau de zoom. Plus c’est petit, plus ' +
    'on est zoomé. 0.04 ≈ vue de quartier ; 0.15 ≈ vue de ville.'
  ),
  defense([
    'Pourquoi PROVIDER_DEFAULT ? Pour laisser la plateforme choisir : Apple Maps sur iOS (gratuit, pas de clé), Google Maps sur Android.',
    'Comment ajoute-t-on un marqueur ? On ajoute un objet avec latitude / longitude dans mockData.js — il apparaît automatiquement.',
    'Pourquoi tracksViewChanges={false} ? Pour économiser la batterie en évitant de redessiner les marqueurs à chaque rafraîchissement.',
  ]),
);

// ============================================================================
// 17 — ProfileScreen
// ============================================================================
children.push(
  h1('17. ProfileScreen.js — profil et préférences'),
  h2('Rôle'),
  p(
    'C’est l’écran de paramètres. Il affiche : l’avatar, les statistiques ' +
    '(favoris / activités / ville), le sélecteur de thème (clair/sombre), ' +
    'la langue, et plusieurs options (notifications, aide, version…).'
  ),
  h2('Sélecteur de thème'),
  code(
`<TouchableOpacity onPress={() => setMode('light')}>
  {/* Mini aperçu blanc */}
</TouchableOpacity>
<TouchableOpacity onPress={() => setMode('dark')}>
  {/* Mini aperçu noir */}
</TouchableOpacity>`
  ),
  p(
    'Deux gros cartes avec un aperçu miniature. Le tap appelle setMode du ' +
    'store, ce qui change la valeur dans le ThemeContext, et tous les ' +
    'écrans se redessinent immédiatement avec la nouvelle palette.'
  ),
  h2('Sélecteur de langue'),
  p(
    'Un simple Alert.alert avec une option par langue. Au tap, setLanguage ' +
    'change la langue dans le store, et tous les useT() rechargent les ' +
    'traductions.'
  ),
  defense([
    'Comment le changement de thème est-il instantané ? Parce que tous les écrans appellent useTheme() — quand l’état change, React les force à redessiner.',
    'Pourquoi un sous-composant Row ? Pour éviter de répéter 6 fois la même structure (icône + label + flèche).',
    'Que stocke-t-on dans Profile ? Rien de spécifique — tout est dans le store. Le profil n’est qu’une vue dessus.',
  ]),
);

// ============================================================================
// 18 — Connexions
// ============================================================================
children.push(
  h1('18. Schéma des connexions entre fichiers'),
  code(
`App.js
  └─ SafeAreaProvider
     └─ StoreProvider  (store.js + ThemeContext de colors.js)
        └─ AppNavigator
           ├─ SplashScreen
           ├─ Onboarding1 / Onboarding2
           ├─ ChooseCity
           └─ MainTabs
              ├─ HomeScreen ←──────────────╮
              ├─ MapScreen                  │
              ├─ ItineraryScreen ←──────────┤  toutes ces vues
              └─ ProfileScreen              │  lisent mockData,
                                            │  appellent useStore(),
              CategoryListScreen ←──────────┤  useTheme(), useT()
              PlaceDetailScreen ←───────────╯`
  ),
  callout('Trois axes de dépendance', [
    'DONNÉES → mockData.js → consommé par Home, CategoryList, Detail, Map.',
    'MÉMOIRE → store.js → consommé par tous les écrans pour favoris / itinéraire / langue / thème.',
    'STYLE → theme/colors.js → consommé par tous les écrans pour les couleurs et les espacements.',
  ]),
  p(
    'Cette architecture est volontairement plate : un seul niveau de ' +
    'context, pas de gestionnaire d’état complexe, pas de cycle entre les ' +
    'fichiers. Elle reste lisible pour un développeur seul et facile à ' +
    'présenter en soutenance.'
  ),
);

// ============================================================================
// 19 — Réponses types
// ============================================================================
children.push(
  h1('19. Réponses aux questions classiques de jury'),

  h2('19.1 Pourquoi React Native et pas Flutter ?'),
  p(
    'React Native utilise JavaScript, langage que j’ai déjà rencontré en ' +
    'cours, contrairement à Dart qui est spécifique à Flutter. Expo simplifie ' +
    'aussi énormément la mise en place et le test sur appareil physique : ' +
    'pas besoin de Mac pour iOS, pas de signature manuelle.'
  ),

  h2('19.2 Pourquoi Expo et pas React Native CLI ?'),
  p(
    'Expo gère pour moi : la compilation, le splash, l’icône, le partage en ' +
    'Wi-Fi avec un téléphone, la mise à jour OTA. Le seul inconvénient est ' +
    'la dépendance à Expo Go — mais on peut sortir d’Expo plus tard (eject) ' +
    'si besoin de modules natifs avancés.'
  ),

  h2('19.3 Où sont stockées les données ? Y a-t-il une base ?'),
  p(
    'Aujourd’hui les données sont en local dans mockData.js. C’est ' +
    'volontaire : l’objectif du PFF était de livrer une interface complète ' +
    'et un design solide. Brancher une base Supabase ou Firebase est ' +
    'l’étape suivante (voir Perspectives) — je n’aurais pas à toucher les ' +
    'écrans, seulement à remplacer les imports de mockData par des appels ' +
    'asynchrones.'
  ),

  h2('19.4 L’app fonctionne-t-elle hors-ligne ?'),
  p(
    'En partie : les photos des lieux sont bundlées (require), donc visibles ' +
    'sans réseau. La carte demande Internet pour télécharger les tuiles. Une ' +
    'évolution serait de mettre la carte en cache avec OpenStreetMap.'
  ),

  h2('19.5 Comment l’internationalisation est-elle gérée ?'),
  p(
    'Toutes les chaînes passent par une fonction t(\'clé\') qui lit la ' +
    'langue active dans le store et renvoie la bonne traduction. Le ' +
    'dictionnaire est dans i18n.js. Pour ajouter une 4e langue, il suffit ' +
    'd’ajouter une colonne dans le dictionnaire.'
  ),

  h2('19.6 Comment marche le mode sombre ?'),
  p(
    'Deux palettes dans colors.js. Quand l’utilisateur tape la carte "Dark" ' +
    'du profil, le store change themeMode, ce qui change la valeur du ' +
    'ThemeContext. Toutes les pages utilisent useTheme(), donc elles se ' +
    'redessinent automatiquement avec la nouvelle palette.'
  ),

  h2('19.7 Avez-vous testé sur de vrais appareils ?'),
  p(
    'Oui, sur un iPhone via Expo Go : flashage du QR code, l’app se charge ' +
    'en 5 secondes. Les performances sont fluides, la navigation est ' +
    'instantanée. Les appels téléphoniques, le partage et l’ouverture de ' +
    'cartes natives ont été validés.'
  ),

  h2('19.8 Quelles ont été les difficultés ?'),
  bullet('Wikimedia bloquait les téléchargements directs → résolu via Special:FilePath.'),
  bullet('Le mode sombre demandait de refactoriser TOUS les écrans pour utiliser makeStyles(colors).'),
  bullet('Le chemin du projet avait été dupliqué dans pfeee/ → Metro chargeait la mauvaise version.'),
  bullet('Une image téléchargée corrompue (HTML au lieu de JPEG) faisait planter le bundler.'),

  h2('19.9 Combien de lignes de code ?'),
  p(
    'Environ 3 500 lignes de JavaScript (sans compter les commentaires), ' +
    'répartis sur ~15 fichiers. C’est un projet de taille moyenne pour un PFF.'
  ),

  h2('19.10 Et si on me demande de modifier quelque chose en direct ?'),
  bullet('Ajouter une catégorie : modifier categories dans mockData.js.'),
  bullet('Changer la couleur primaire : modifier primary dans lightColors / darkColors.'),
  bullet('Ajouter une traduction : ajouter une clé dans dict de i18n.js.'),
  bullet('Modifier le splash : changer le temps dans setTimeout (SplashScreen.js).'),
);

// =============================================================================
// Build the document
// =============================================================================
const doc = new Document({
  creator: 'Houssem Daas',
  title: 'Bon Plan Bizerte — Explication du code',
  description: 'Document de préparation à la soutenance PFF',
  styles: {
    default: { document: { run: { font: FONT, size: 22, color: DARK } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 40, bold: true, font: FONT, color: BLUE },
        paragraph: { spacing: { before: 320, after: 220 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 30, bold: true, font: FONT, color: DARK },
        paragraph: { spacing: { before: 220, after: 140 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: FONT, color: BLUE },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ],
      },
      {
        reference: 'numbers',
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        ],
      },
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
        children: [new TextRun({ text: 'Bon Plan Bizerte — Explication du code', font: FONT, size: 18, color: GRAY, italics: true })],
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
  fs.writeFileSync('Bon-Plan-Bizerte-Explication-Code.docx', buf);
  console.log('Generated: Bon-Plan-Bizerte-Explication-Code.docx (' + (buf.length / 1024).toFixed(0) + ' KB)');
}).catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
