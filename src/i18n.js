// ============================================================================
// i18n.js - INTERNATIONALIZATION (EN / FR / AR)
// All UI strings live here so the Profile > Language picker can switch them.
// Screens call `t('home.popular')` instead of hardcoding "Popular".
// ============================================================================

// Languages the user can choose from. `rtl` is a flag for right-to-left
// writing (used for Arabic). We don't force RTL layout but you could add
// I18nManager.forceRTL(true) if you want the full treatment.
export const LANGUAGES = [
  { code: 'en', label: 'English',  native: 'English',  rtl: false },
  { code: 'fr', label: 'Français', native: 'Français', rtl: false },
  { code: 'ar', label: 'العربية',  native: 'العربية',  rtl: true  },
];

// The dictionary - one entry per UI string, translated into every language.
// Keys follow a dot pattern: 'screen.thing'. Pick whatever you like but
// stay consistent so translations are easy to find.
const dict = {
  // ---- Tab bar (bottom tabs) ----
  'tab.home':      { en: 'Home',      fr: 'Accueil',    ar: 'الرئيسية' },
  'tab.map':       { en: 'Map',       fr: 'Carte',      ar: 'الخريطة' },
  'tab.itinerary': { en: 'Itinerary', fr: 'Itinéraire', ar: 'الجدول' },
  'tab.profile':   { en: 'Profile',   fr: 'Profil',     ar: 'الحساب' },

  // ---- Category labels (home icons + map filters) ----
  'cat.food':     { en: 'Food',     fr: 'Restaurants', ar: 'مطاعم' },
  'cat.coffee':   { en: 'Coffee',   fr: 'Cafés',       ar: 'مقاهي' },
  'cat.beach':    { en: 'Beach',    fr: 'Plage',       ar: 'الشاطئ' },
  'cat.nature':   { en: 'Nature',   fr: 'Nature',      ar: 'الطبيعة' },
  'cat.activity': { en: 'Activity', fr: 'Activités',   ar: 'أنشطة' },
  'cat.shopping': { en: 'Shopping', fr: 'Shopping',    ar: 'تسوق' },

  // ---- Home screen ----
  'home.searchPlaceholder': {
    en: 'Search places, food, beaches...',
    fr: 'Chercher un lieu, resto, plage...',
    ar: 'ابحث عن مكان أو مطعم أو شاطئ...',
  },
  'home.popular':   { en: 'Popular',   fr: 'Populaires',  ar: 'الأكثر شهرة' },
  'home.nearby':    { en: 'Nearby',    fr: 'À proximité', ar: 'قريب منك' },
  'home.seeAll':    { en: 'See all',   fr: 'Voir tout',   ar: 'عرض الكل' },
  'home.planTitle': {
    en: 'Plan your perfect day',
    fr: 'Planifiez votre journée',
    ar: 'خطّط ليومك المثالي',
  },
  'home.planSub': {
    en: 'Let us build a custom itinerary around your favorite spots',
    fr: 'Nous créons un itinéraire personnalisé selon vos envies',
    ar: 'نبني لك جدولاً مخصصاً حول أماكنك المفضلة',
  },

  // ---- Category list screen (when you tap a category icon) ----
  'list.search':   { en: 'Search',      fr: 'Rechercher',  ar: 'بحث' },
  'list.all':      { en: 'All',         fr: 'Tous',        ar: 'الكل' },
  'list.topRated': { en: 'Top rated',   fr: 'Mieux notés', ar: 'الأعلى تقييماً' },
  'list.budget':   { en: 'Budget',      fr: 'Économique',  ar: 'اقتصادي' },
  'list.favorites':{ en: 'Favorites',   fr: 'Favoris',     ar: 'المفضلة' },
  'list.empty':    { en: 'No matches',  fr: 'Aucun résultat', ar: 'لا توجد نتائج' },
  'list.reviews':  { en: 'reviews',     fr: 'avis',        ar: 'تقييم' },

  // ---- Place detail screen ----
  'detail.about':         { en: 'About',          fr: 'À propos',    ar: 'حول' },
  'detail.gallery':       { en: 'Gallery',        fr: 'Galerie',     ar: 'المعرض' },
  'detail.reviews':       { en: 'Reviews',        fr: 'Avis',        ar: 'التقييمات' },
  'detail.directions':    { en: 'Directions',     fr: 'Itinéraire',  ar: 'الاتجاهات' },
  'detail.addItinerary':  { en: 'Add to itinerary', fr: 'Ajouter au jour', ar: 'أضف للجدول' },
  'detail.added':         { en: 'Added',          fr: 'Ajouté',      ar: 'تمت الإضافة' },
  'detail.rating':        { en: 'rating',         fr: 'note',        ar: 'تقييم' },
  'detail.open':          { en: 'Open',           fr: 'Ouvert',      ar: 'مفتوح' },
  'detail.now':           { en: 'now',            fr: 'maintenant',  ar: 'الآن' },
  'detail.addedTitle':    { en: 'Added to itinerary', fr: 'Ajouté à l\'itinéraire', ar: 'أُضيف إلى الجدول' },
  'detail.addedMsg':      { en: 'was added to your day plan.', fr: 'a été ajouté à votre journée.', ar: 'تمت إضافته إلى جدول يومك.' },
  'detail.viewItinerary': { en: 'View itinerary', fr: 'Voir l\'itinéraire', ar: 'عرض الجدول' },
  'detail.ok':            { en: 'OK',             fr: 'OK',          ar: 'حسناً' },
  'detail.alreadyTitle':  { en: 'Already added',  fr: 'Déjà ajouté', ar: 'مُضاف مسبقاً' },
  'detail.alreadyMsg':    { en: 'is already in your itinerary.', fr: 'est déjà dans votre itinéraire.', ar: 'موجود بالفعل في الجدول.' },

  // ---- Itinerary screen ----
  'itin.title':      { en: 'My Itinerary',    fr: 'Mon Itinéraire', ar: 'جدولي' },
  'itin.activities': { en: 'activities',      fr: 'activités',      ar: 'نشاط' },
  'itin.addActivity':{ en: 'Add activity',    fr: 'Ajouter une activité', ar: 'أضف نشاطاً' },
  'itin.emptyTitle': { en: 'No activities yet', fr: 'Aucune activité', ar: 'لا توجد أنشطة بعد' },
  'itin.emptySub':   {
    en: 'Explore places and tap "Add to itinerary" to build your day.',
    fr: 'Explorez et ajoutez des lieux pour construire votre journée.',
    ar: 'استكشف الأماكن وأضفها لبناء جدولك.',
  },
  'itin.optionsTitle': { en: 'Itinerary options', fr: 'Options',         ar: 'خيارات الجدول' },
  'itin.optionsMsg':   { en: 'What would you like to do?', fr: 'Que voulez-vous faire ?', ar: 'ماذا تود أن تفعل؟' },
  'itin.share':        { en: 'Share',           fr: 'Partager',      ar: 'مشاركة' },
  'itin.clearAll':     { en: 'Clear all',       fr: 'Tout effacer',  ar: 'مسح الكل' },
  'itin.cancel':       { en: 'Cancel',          fr: 'Annuler',       ar: 'إلغاء' },
  'itin.removeTitle':  { en: 'Remove activity', fr: 'Retirer l\'activité', ar: 'حذف النشاط' },
  'itin.removeMsg':    {
    en: 'Remove "%s" from itinerary?',
    fr: 'Retirer "%s" de l\'itinéraire ?',
    ar: 'حذف "%s" من الجدول؟',
  },
  'itin.remove':       { en: 'Remove',          fr: 'Retirer',       ar: 'حذف' },
  'itin.newActivity':  { en: 'New activity',    fr: 'Nouvelle activité', ar: 'نشاط جديد' },
  'itin.tapEdit':      { en: 'Tap to edit',     fr: 'Appuyer pour modifier', ar: 'اضغط للتعديل' },

  // ---- Profile screen ----
  'profile.title':              { en: 'Profile',             fr: 'Profil',                 ar: 'الحساب' },
  'profile.name':               { en: 'Bon Plan Explorer',   fr: 'Explorateur Bon Plan',   ar: 'مستكشف بون بلان' },
  'profile.edit':               { en: 'Edit profile',        fr: 'Modifier le profil',     ar: 'تعديل الحساب' },
  'profile.favoritesCount':     { en: 'Favorites',           fr: 'Favoris',                ar: 'المفضلة' },
  'profile.activitiesCount':    { en: 'Activities',          fr: 'Activités',              ar: 'الأنشطة' },
  'profile.cityCount':          { en: 'City',                fr: 'Ville',                  ar: 'مدينة' },
  'profile.appearance':         { en: 'APPEARANCE',          fr: 'APPARENCE',              ar: 'المظهر' },
  'profile.appColor':           { en: 'App color',           fr: 'Couleur de l\'app',      ar: 'لون التطبيق' },
  'profile.light':              { en: 'Light',               fr: 'Clair',                  ar: 'فاتح' },
  'profile.dark':               { en: 'Dark',                fr: 'Sombre',                 ar: 'داكن' },
  'profile.settings':           { en: 'SETTINGS',            fr: 'RÉGLAGES',               ar: 'الإعدادات' },
  'profile.notifications':      { en: 'Notifications',       fr: 'Notifications',          ar: 'الإشعارات' },
  'profile.language':           { en: 'Language',            fr: 'Langue',                 ar: 'اللغة' },
  'profile.city':               { en: 'City',                fr: 'Ville',                  ar: 'المدينة' },
  'profile.about':              { en: 'ABOUT',               fr: 'À PROPOS',               ar: 'حول' },
  'profile.help':               { en: 'Help & support',      fr: 'Aide & support',         ar: 'المساعدة والدعم' },
  'profile.terms':              { en: 'Terms of service',    fr: 'Conditions d\'utilisation', ar: 'الشروط' },
  'profile.version':            { en: 'Version',             fr: 'Version',                ar: 'الإصدار' },
  'profile.logout':             { en: 'Log out',             fr: 'Se déconnecter',         ar: 'تسجيل الخروج' },
  'profile.logoutConfirmTitle': { en: 'Log out',             fr: 'Se déconnecter',         ar: 'تسجيل الخروج' },
  'profile.logoutConfirmMsg':   { en: 'Are you sure you want to log out?', fr: 'Voulez-vous vraiment vous déconnecter ?', ar: 'هل أنت متأكد أنك تريد تسجيل الخروج؟' },
  'profile.chooseLanguage':     { en: 'Choose a language',   fr: 'Choisir une langue',     ar: 'اختر اللغة' },
  'profile.notifMsg':           { en: 'Push notifications are on.', fr: 'Les notifications sont activées.', ar: 'الإشعارات مفعّلة.' },
  'profile.helpMsg':            { en: 'Contact: support@bonplan.tn', fr: 'Contact : support@bonplan.tn', ar: 'للتواصل: support@bonplan.tn' },
  'profile.termsMsg':           { en: 'v1.0.0 — demo version.', fr: 'v1.0.0 — version démo.', ar: 'الإصدار 1.0.0 - نسخة تجريبية.' },
};

// Public translator - called inside every screen via useT().
// If a key is missing, returns the key itself so you notice during dev.
export function translate(key, lang) {
  const entry = dict[key];                  // look up the key
  if (!entry) return key;                   // fallback - missing key
  return entry[lang] || entry.en || key;    // fallback chain: requested lang -> english -> key
}
