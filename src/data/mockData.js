// ============================================================================
// mockData.js - ALL CONTENT OF THE APP
// This file plays the role that a real backend (Supabase / Firebase / API)
// would play: it hands out lists of places for each category.
//
// Each place has roughly this shape:
//   {
//     id:          unique string ('f1', 'c2'...)
//     name:        what the user reads ("Crock'in")
//     category:    subtitle ("Italian · Pizza")
//     rating:      0-5 number
//     reviews:     integer count
//     latitude/longitude:  real GPS coords (used on the Map tab and Directions)
//     image:       main photo - either a URL string OR require('../../assets/...')
//     gallery:     array of 3 photos (shown horizontally on the detail screen)
//     description: plain-English paragraph for the "About" section
//     location:    human address shown under the name
//     price:       '$', '$$', '$$$' badge
//     priceRange:  'X-Y TND per person' (food + coffee only)
//     phone:       optional - tapping calls it
//     website:     optional - tapping opens browser
//   }
// ============================================================================

// The 6 categories shown as icons on the Home screen and filters on the Map.
// - id    : used in code (never shown to the user)
// - label : fallback label (real label is translated via t('cat.'+id))
// - icon  : Ionicons name (see ionic.io/ionicons)
export const categories = [
  { id: 'food',     label: 'Food',     icon: 'restaurant' },
  { id: 'coffee',   label: 'Coffee',   icon: 'cafe' },
  { id: 'beach',    label: 'Beach',    icon: 'umbrella' },
  { id: 'nature',   label: 'Nature',   icon: 'leaf' },
  { id: 'activity', label: 'Activity', icon: 'compass' },
  { id: 'shopping', label: 'Shopping', icon: 'bag' },
];

// Bizerte city center
export const CITY_CENTER = { latitude: 37.2744, longitude: 9.8739 };

// ========== HOME: POPULAR / NEARBY ==========
export const featuredPlaces = [
  {
    id: '1',
    name: 'Old Port of Bizerte',
    category: 'Culture',
    rating: 4.8,
    reviews: 324,
    latitude: 37.2755,
    longitude: 9.8756,
    image: require('../../assets/home/WhatsApp-Image-2024-01-18-at-17.41.12-e1706260942824.jpeg'),
    gallery: [
      require('../../assets/home/real/oldport-1.jpg'),
      require('../../assets/home/real/oldport-2.jpg'),
      require('../../assets/home/real/oldport-3.jpg'),
    ],
    description:
      'The historic old port is the soul of Bizerte. Colorful boats, stone walls from the 17th century, and cafes framing the harbor.',
    location: 'Bizerte Medina',
    price: 'Free',
  },
  {
    id: '2',
    name: 'Cap Blanc Viewpoint',
    category: 'Nature',
    rating: 4.9,
    reviews: 210,
    latitude: 37.3447,
    longitude: 9.7586,
    image: require('../../assets/home/65571089_1060525264337234_5069005838228652032_n.jpg'),
    gallery: [
      require('../../assets/home/real/capblanc-1.jpg'),
      require('../../assets/home/real/capblanc-2.jpg'),
      require('../../assets/home/real/capblanc-3.jpg'),
    ],
    description:
      'The northernmost point of Africa. Breathtaking cliffside views over the Mediterranean Sea.',
    location: 'Cap Blanc',
    price: 'Free',
  },
  {
    id: '3',
    name: 'Ichkeul National Park',
    category: 'Nature',
    rating: 4.7,
    reviews: 158,
    latitude: 37.1350,
    longitude: 9.6833,
    image: require('../../assets/home/real/ichkeul-1.jpg'),
    gallery: [
      require('../../assets/home/real/ichkeul-1.jpg'),
      require('../../assets/home/real/ichkeul-2.jpg'),
      require('../../assets/home/real/ichkeul-3.jpg'),
    ],
    description:
      'UNESCO World Heritage wetland, home to hundreds of thousands of migrating birds each winter.',
    location: 'Menzel Bourguiba',
    price: '5 TND',
  },
  {
    id: '4',
    name: 'Corniche Beach',
    category: 'Beach',
    rating: 4.6,
    reviews: 412,
    latitude: 37.2888,
    longitude: 9.8567,
    image: require('../../assets/home/481700274_1195819481906947_8557298988534810114_n.jpg'),
    gallery: [
      require('../../assets/home/real/corniche-1.jpg'),
      require('../../assets/home/real/corniche-2.jpg'),
      require('../../assets/home/real/corniche-3.jpg'),
    ],
    description:
      'Golden sand and clear water stretch along the main boardwalk of the city.',
    location: 'Corniche',
    price: 'Free',
  },
];

// ========== FOOD — real Bizerte restaurants (real photos from evendo.com) ==========
export const foodPlaces = [
  {
    id: 'f1',
    name: "Crock'in",
    category: 'Tunisian · Tea house',
    rating: 3.5,
    reviews: 263,
    latitude: 37.2835,
    longitude: 9.8615,
    priceRange: '18–40 TND per person',
    price: '$$',
    phone: '+216 23 903 375',
    website: 'crockin.tn',
    image: require('../../assets/home/real/crockin-1.jpg'),
    gallery: [
      require('../../assets/home/real/crockin-1.jpg'),
      require('../../assets/home/real/lequai-1.jpg'),
      require('../../assets/home/real/laplaya-1.jpg'),
    ],
    description:
      "Charming three-level restaurant and tea house on Bizerte's Corniche - fast food on the ground floor, restaurant in the middle, café on top. Authentic Tunisian cuisine with outdoor sea-facing seating.",
    location: "Route de la Corniche (pied dans l'eau), Bizerte",
  },
  {
    id: 'f2',
    name: 'EL Ksiba',
    category: 'Seafood',
    rating: 4.3,
    reviews: 124,
    latitude: 37.2762,
    longitude: 9.8748,
    priceRange: '30–60 TND per person',
    price: '$$$',
    image: require('../../assets/home/real/elksiba-1.jpg'),
    gallery: [
      require('../../assets/home/real/elksiba-1.jpg'),
      require('../../assets/home/real/marineclub-1.jpg'),
      require('../../assets/home/real/phenicien-1.jpg'),
    ],
    description:
      'Seafood and Mediterranean restaurant on the old harbour of Bizerte. Fresh, well-seasoned dishes with a direct view over the port.',
    location: 'Old Port, Bizerte',
  },
  {
    id: 'f3',
    name: 'Le Grand Bleu Da Ciccio',
    category: 'Italian · Seafood',
    rating: 3.8,
    reviews: 46,
    latitude: 37.2735,
    longitude: 9.8695,
    priceRange: '25–50 TND per person',
    price: '$$',
    image: require('../../assets/home/real/grandbleu-1.jpg'),
    gallery: [
      require('../../assets/home/real/grandbleu-1.jpg'),
      require('../../assets/home/real/piccolino-1.jpg'),
      require('../../assets/home/real/dinapoli-1.jpg'),
    ],
    description:
      'Italian and seafood restaurant known for fresh fish, generous pasta plates and a warm Sicilian atmosphere.',
    location: 'Avenue Taieb Mhiri',
  },
  {
    id: 'f4',
    name: 'Restaurant Le Phenicien',
    category: 'Seafood · Mediterranean',
    rating: 3.4,
    reviews: 118,
    latitude: 37.2779,
    longitude: 9.8711,
    priceRange: '25–50 TND per person',
    price: '$$',
    image: require('../../assets/home/real/phenicien-1.jpg'),
    gallery: [
      require('../../assets/home/real/phenicien-1.jpg'),
      require('../../assets/home/real/elksiba-1.jpg'),
      require('../../assets/home/real/marineclub-1.jpg'),
    ],
    description:
      'Seafood and Mediterranean kitchen with prompt, professional service and a nice harbor-side location.',
    location: 'Port de Plaisance',
  },
  {
    id: 'f5',
    name: 'Piccolino',
    category: 'Italian · Pizza',
    rating: 4.1,
    reviews: 96,
    latitude: 37.2802,
    longitude: 9.8640,
    priceRange: '20–40 TND per person',
    price: '$$',
    image: require('../../assets/home/real/piccolino-1.jpg'),
    gallery: [
      require('../../assets/home/real/piccolino-1.jpg'),
      require('../../assets/home/real/grandbleu-1.jpg'),
      require('../../assets/home/real/dinapoli-1.jpg'),
    ],
    description:
      'Popular pizza and pasta spot with a relaxed family atmosphere. Generous portions and wood-fired oven classics.',
    location: 'Corniche, Bizerte',
  },
  {
    id: 'f6',
    name: 'Marine Club Restaurant',
    category: 'Seafood · Club',
    rating: 4.0,
    reviews: 88,
    latitude: 37.2745,
    longitude: 9.8792,
    priceRange: '30–55 TND per person',
    price: '$$$',
    image: require('../../assets/home/real/marineclub-1.jpg'),
    gallery: [
      require('../../assets/home/real/marineclub-1.jpg'),
      require('../../assets/home/real/laplaya-1.jpg'),
      require('../../assets/home/real/elksiba-1.jpg'),
    ],
    description:
      'Members-style seafood restaurant at the marina. Elegant dining room, sea-view terrace and a refined Mediterranean menu.',
    location: 'Marina, Bizerte',
  },
  {
    id: 'f7',
    name: 'Bedouin',
    category: 'Tunisian · Grill',
    rating: 4.2,
    reviews: 71,
    latitude: 37.2690,
    longitude: 9.8712,
    priceRange: '20–40 TND per person',
    price: '$$',
    image: require('../../assets/home/real/bedouin-1.jpg'),
    gallery: [
      require('../../assets/home/real/bedouin-1.jpg'),
      require('../../assets/home/real/lesgrottes-1.jpg'),
      require('../../assets/home/real/foretbleue-1.jpg'),
    ],
    description:
      'Warm bedouin-themed grill house. Charcoal lamb, kebabs and fresh salads served in a cozy, lantern-lit setting.',
    location: 'Bizerte Centre',
  },
];

// ========== COFFEE — real Bizerte cafés / lounges / juice bars (real photos) ==========
export const coffeePlaces = [
  {
    id: 'c1',
    name: 'Best Voice Café',
    category: 'Café · Brunch',
    rating: 4.3,
    reviews: 142,
    latitude: 37.2773,
    longitude: 9.8720,
    priceRange: '6–15 TND per person',
    price: '$$',
    image: require('../../assets/home/real/bestvoicecafe-1.jpg'),
    gallery: [
      require('../../assets/home/real/bestvoicecafe-1.jpg'),
      require('../../assets/home/real/goldenlounge-1.jpg'),
      require('../../assets/home/real/lequailounge-1.jpg'),
    ],
    description:
      'Known for delightful breakfasts and brunches. A bright, lively café at the heart of Bizerte, great for morning coffee with friends.',
    location: 'Bizerte Centre',
  },
  {
    id: 'c2',
    name: 'Le Quai Lounge',
    category: 'Lounge · Marina view',
    rating: 4.2,
    reviews: 98,
    latitude: 37.2756,
    longitude: 9.8797,
    priceRange: '8–20 TND per person',
    price: '$$',
    image: require('../../assets/home/real/lequailounge-1.jpg'),
    gallery: [
      require('../../assets/home/real/lequailounge-1.jpg'),
      require('../../assets/home/real/goldenlounge-1.jpg'),
      require('../../assets/home/real/bestvoicecafe-1.jpg'),
    ],
    description:
      'Stunning marina-view lounge serving coffee, cocktails and light bites. One of the most scenic sunset spots in Bizerte.',
    location: 'Marina, Bizerte',
  },
  {
    id: 'c3',
    name: 'Espace Golden Lounge',
    category: 'Lounge · Café',
    rating: 4.1,
    reviews: 76,
    latitude: 37.2720,
    longitude: 9.8684,
    priceRange: '7–18 TND per person',
    price: '$$',
    image: require('../../assets/home/real/goldenlounge-1.jpg'),
    gallery: [
      require('../../assets/home/real/goldenlounge-1.jpg'),
      require('../../assets/home/real/bestvoicecafe-1.jpg'),
      require('../../assets/home/real/juicebox-1.jpg'),
    ],
    description:
      'Modern café and dining lounge with a warm interior, strong espresso and a full all-day menu. Good for remote work or a quiet meeting.',
    location: 'Bizerte Centre',
  },
  {
    id: 'c4',
    name: 'Jumanji Juice Bar',
    category: 'Juice bar · Café',
    rating: 4.0,
    reviews: 54,
    latitude: 37.2730,
    longitude: 9.8701,
    priceRange: '4–10 TND per person',
    price: '$',
    image: require('../../assets/home/real/jumanji-1.jpg'),
    gallery: [
      require('../../assets/home/real/jumanji-1.jpg'),
      require('../../assets/home/real/juicebox-1.jpg'),
      require('../../assets/home/real/bestvoicecafe-1.jpg'),
    ],
    description:
      'Tropical-themed juice bar with fresh smoothies, coffee and sweet snacks. Colorful and popular with the younger crowd.',
    location: 'Avenue Habib Bourguiba',
  },
  {
    id: 'c5',
    name: 'Juice Box',
    category: 'Juice bar · Fast casual',
    rating: 3.9,
    reviews: 62,
    latitude: 37.2744,
    longitude: 9.8705,
    priceRange: '4–9 TND per person',
    price: '$',
    image: require('../../assets/home/real/juicebox-1.jpg'),
    gallery: [
      require('../../assets/home/real/juicebox-1.jpg'),
      require('../../assets/home/real/jumanji-1.jpg'),
      require('../../assets/home/real/goldenlounge-1.jpg'),
    ],
    description:
      'Refreshing cocktails, juices and sandwiches - a quick, friendly stop for an afternoon break.',
    location: 'Bizerte Centre',
  },
];

// ========== NATURE — Rimel + La Grotte + Ichkeul + Cap Blanc ==========
export const naturePlaces = [
  {
    id: 'n1',
    name: 'Plage Rimel',
    category: 'Beach · Forest',
    rating: 4.7,
    reviews: 276,
    latitude: 37.2069,
    longitude: 9.9634,
    image: require('../../assets/home/real/rimel-1.jpg'),
    gallery: [
      require('../../assets/home/real/rimel-1.jpg'),
      require('../../assets/home/real/rimel-2.jpg'),
      require('../../assets/home/real/rimel-3.jpg'),
    ],
    description:
      'About 8 km south of Bizerte, Rimel Forest opens onto a long sandy beach famous for two shipwrecks - the Hamada S and the Ydra - stranded just off the coast.',
    location: 'Rimel, 8 km south of Bizerte',
    price: 'Free',
  },
  {
    id: 'n2',
    name: 'La Grotte Beach',
    category: 'Beach · Cliffs',
    rating: 4.6,
    reviews: 198,
    latitude: 37.3396,
    longitude: 9.7522,
    image: require('../../assets/home/real/grotte-1.jpg'),
    gallery: [
      require('../../assets/home/real/grotte-1.jpg'),
      require('../../assets/home/real/grotte-2.jpg'),
      require('../../assets/home/real/grotte-3.jpg'),
    ],
    description:
      'A 600 m stretch of fine sand where mountain cliffs meet turquoise water. Near Cap Blanc, with beach bars, sun beds and fantastic bay views.',
    location: 'Near Cap Blanc, Bizerte',
    price: 'Free',
  },
  {
    id: 'n3',
    name: 'Ichkeul National Park',
    category: 'Wetland · UNESCO',
    rating: 4.7,
    reviews: 158,
    latitude: 37.1350,
    longitude: 9.6833,
    image: require('../../assets/home/real/ichkeul-1.jpg'),
    gallery: [
      require('../../assets/home/real/ichkeul-1.jpg'),
      require('../../assets/home/real/ichkeul-2.jpg'),
      require('../../assets/home/real/ichkeul-3.jpg'),
    ],
    description:
      'UNESCO World Heritage wetland, home to hundreds of thousands of migrating birds - ducks, geese, storks and pink flamingoes - each winter.',
    location: 'Menzel Bourguiba',
    price: '5 TND',
  },
  {
    id: 'n4',
    name: 'Cap Blanc',
    category: 'Cliffs · Viewpoint',
    rating: 4.9,
    reviews: 210,
    latitude: 37.3447,
    longitude: 9.7586,
    image: require('../../assets/home/real/capblanc-1.jpg'),
    gallery: [
      require('../../assets/home/real/capblanc-1.jpg'),
      require('../../assets/home/real/capblanc-2.jpg'),
      require('../../assets/home/real/capblanc-3.jpg'),
    ],
    description:
      'The northernmost point of Africa - breathtaking cliffside views over the Mediterranean Sea and the closest point between Africa and Europe.',
    location: 'Cap Blanc, Bizerte',
    price: 'Free',
  },
];

// ========== ACTIVITY — real Bizerte attractions (real Wikimedia photos) ==========
export const activityPlaces = [
  {
    id: 'a1',
    name: 'Kasbah of Bizerte',
    category: 'Historic · Fortress',
    rating: 4.7,
    reviews: 342,
    latitude: 37.2763,
    longitude: 9.8763,
    image: require('../../assets/home/real/kasbah-1.jpg'),
    gallery: [
      require('../../assets/home/real/kasbah-1.jpg'),
      require('../../assets/home/real/kasbah-2.jpg'),
      require('../../assets/home/real/oldportnight-1.jpg'),
    ],
    description:
      '17th-century fortress overlooking the old port. Car-free warren of stone streets that feels almost medieval - perfect for a slow walk and photos.',
    location: 'Medina, Bizerte',
    price: 'Free',
  },
  {
    id: 'a2',
    name: 'Great Mosque of Bizerte',
    category: 'Historic · Religious',
    rating: 4.5,
    reviews: 214,
    latitude: 37.2749,
    longitude: 9.8740,
    image: require('../../assets/home/real/mosque-1.jpg'),
    gallery: [
      require('../../assets/home/real/mosque-1.jpg'),
      require('../../assets/home/real/mosque-2.jpg'),
      require('../../assets/home/real/kasbah-1.jpg'),
    ],
    description:
      '17th-century mosque at the heart of the medina. Whitewashed walls, octagonal minaret and a tranquil inner courtyard.',
    location: 'Medina, Bizerte',
    price: 'Free',
  },
  {
    id: 'a3',
    name: 'Andalusian Quarter',
    category: 'Historic · Walk',
    rating: 4.4,
    reviews: 187,
    latitude: 37.2758,
    longitude: 9.8731,
    image: require('../../assets/home/real/kasbah-2.jpg'),
    gallery: [
      require('../../assets/home/real/kasbah-2.jpg'),
      require('../../assets/home/real/kasbah-1.jpg'),
      require('../../assets/home/real/oldportnight-1.jpg'),
    ],
    description:
      '15th-century neighborhood settled by Moors expelled from Spain. Studded doors, moucharabieh windows and hidden courtyards along Rue de l\'Abattoir.',
    location: 'Medina, Bizerte',
    price: 'Free',
  },
  {
    id: 'a4',
    name: 'Old Port Boat Tour',
    category: 'Boat · Sunset',
    rating: 4.6,
    reviews: 156,
    latitude: 37.2755,
    longitude: 9.8756,
    priceRange: '30–60 TND per person',
    image: require('../../assets/home/real/oldportnight-1.jpg'),
    gallery: [
      require('../../assets/home/real/oldportnight-1.jpg'),
      require('../../assets/home/real/oldport-2.jpg'),
      require('../../assets/home/real/oldport-3.jpg'),
    ],
    description:
      'Hour-long boat tour of the old port at sunset. Local fishermen take you around the harbour with mint tea and stories of the town.',
    location: 'Old Port quay, Bizerte',
    price: '$$',
  },
];

// ========== SHOPPING — real Bizerte stores (real photos from evendo.com) ==========
export const shoppingPlaces = [
  {
    id: 's1',
    name: 'LC Waikiki Bizerte',
    category: 'Fashion · Ready-to-wear',
    rating: 4.2,
    reviews: 412,
    latitude: 37.2733,
    longitude: 9.8735,
    price: '$$',
    image: require('../../assets/home/real/lcwaikiki-1.jpg'),
    gallery: [
      require('../../assets/home/real/lcwaikiki-1.jpg'),
      require('../../assets/home/real/vog-1.jpg'),
      require('../../assets/home/real/sistore-1.jpg'),
    ],
    description:
      'Turkish fast-fashion brand with casual and classic collections for the whole family. Open 10 a.m. - 8 p.m.',
    location: 'Avenue Habib Bourguiba, Bizerte',
  },
  {
    id: 's2',
    name: 'VOG',
    category: 'Fashion',
    rating: 4.1,
    reviews: 187,
    latitude: 37.2740,
    longitude: 9.8720,
    price: '$$',
    image: require('../../assets/home/real/vog-1.jpg'),
    gallery: [
      require('../../assets/home/real/vog-1.jpg'),
      require('../../assets/home/real/marqualuxe-1.jpg'),
      require('../../assets/home/real/lcwaikiki-1.jpg'),
    ],
    description:
      'Trendy Tunisian clothing chain offering modern, affordable outfits for men and women.',
    location: 'Avenue Habib Bourguiba',
  },
  {
    id: 's3',
    name: 'HA Bizerte',
    category: 'Fashion · Accessories',
    rating: 4.0,
    reviews: 96,
    latitude: 37.2747,
    longitude: 9.8726,
    price: '$$',
    image: require('../../assets/home/real/habizerte-1.jpg'),
    gallery: [
      require('../../assets/home/real/habizerte-1.jpg'),
      require('../../assets/home/real/sistore-1.jpg'),
      require('../../assets/home/real/gloricia-1.jpg'),
    ],
    description:
      'Well-stocked boutique for on-trend outfits and accessories. Popular with the local young crowd.',
    location: 'Avenue de la Liberté',
  },
  {
    id: 's4',
    name: 'MARQUALUXE',
    category: 'Luxury · Accessories',
    rating: 4.5,
    reviews: 64,
    latitude: 37.2751,
    longitude: 9.8716,
    price: '$$$',
    image: require('../../assets/home/real/marqualuxe-1.jpg'),
    gallery: [
      require('../../assets/home/real/marqualuxe-1.jpg'),
      require('../../assets/home/real/vog-1.jpg'),
      require('../../assets/home/real/gloricia-1.jpg'),
    ],
    description:
      'Upscale boutique carrying branded bags, watches and accessories. Curated collections with seasonal drops.',
    location: 'Bizerte Centre',
  },
  {
    id: 's5',
    name: 'Gloricia',
    category: 'Fashion · Women',
    rating: 4.2,
    reviews: 88,
    latitude: 37.2738,
    longitude: 9.8738,
    price: '$$',
    image: require('../../assets/home/real/gloricia-1.jpg'),
    gallery: [
      require('../../assets/home/real/gloricia-1.jpg'),
      require('../../assets/home/real/habizerte-1.jpg'),
      require('../../assets/home/real/marqualuxe-1.jpg'),
    ],
    description:
      'Women\'s fashion boutique with elegant daywear, dresses and stylish bridal options.',
    location: 'Avenue Habib Bourguiba',
  },
  {
    id: 's6',
    name: 'Centre Bizerte',
    category: 'Shopping mall',
    rating: 4.0,
    reviews: 328,
    latitude: 37.2725,
    longitude: 9.8695,
    price: '$$',
    image: require('../../assets/home/real/bizertestore-1.jpg'),
    gallery: [
      require('../../assets/home/real/bizertestore-1.jpg'),
      require('../../assets/home/real/lcwaikiki-1.jpg'),
      require('../../assets/home/real/habizerte-1.jpg'),
    ],
    description:
      'Central Bizerte shopping arcade with clothing stores, cafés and a small food court. Convenient for a rainy-day stroll.',
    location: 'Bizerte Centre',
  },
];

// ========== ITINERARY ==========
export const itinerary = [
  {
    id: 'i1',
    time: '09:00',
    title: 'Breakfast at Best Voice Café',
    subtitle: 'Coffee and pastries in the centre',
    duration: '1h',
    color: '#1D2BEF',
  },
  {
    id: 'i2',
    time: '10:30',
    title: 'Walk the Kasbah',
    subtitle: '17th-century fortress and old port',
    duration: '2h',
    color: '#22C55E',
  },
  {
    id: 'i3',
    time: '13:00',
    title: "Lunch at Crock'in",
    subtitle: "Corniche tea house (pied dans l'eau)",
    duration: '1h 30m',
    color: '#F59E0B',
  },
  {
    id: 'i4',
    time: '15:30',
    title: 'Cap Blanc viewpoint',
    subtitle: 'Northernmost point of Africa',
    duration: '2h',
    color: '#EF4444',
  },
  {
    id: 'i5',
    time: '19:00',
    title: 'Sunset at Plage Rimel',
    subtitle: 'Shipwrecks and pine forest',
    duration: '1h',
    color: '#8B5CF6',
  },
];

// Combined list consumed by the Map tab. Each entry inherits its color
// from its source category. Spread operator (...) flattens the sub-lists,
// .map() adds `kind` + `color` so the map chip filter can filter by type.
export const allMapPlaces = [
  ...featuredPlaces.map((p) => ({ ...p, kind: 'featured', color: '#1D2BEF' })),
  ...foodPlaces.map((p) => ({ ...p, kind: 'food', color: '#F59E0B' })),
  ...coffeePlaces.map((p) => ({ ...p, kind: 'coffee', color: '#8B5CF6' })),
  ...naturePlaces.map((p) => ({ ...p, kind: 'nature', color: '#22C55E' })),
  ...activityPlaces.map((p) => ({ ...p, kind: 'activity', color: '#06B6D4' })),
  ...shoppingPlaces.map((p) => ({ ...p, kind: 'shopping', color: '#EF4444' })),
];

// Utility: look up any place by id without knowing which category list it's in.
export function findPlaceById(id) {
  return allMapPlaces.find((p) => p.id === id);
}
