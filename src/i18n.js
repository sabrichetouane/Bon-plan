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

  // =========================================================================
  // EVERYTHING BELOW WAS ADDED WITH THE DATABASE + ACCOUNTS FEATURE
  // =========================================================================

  // ---- Words reused all over the app ----
  'common.save':        { en: 'Save',        fr: 'Enregistrer',  ar: 'حفظ' },
  'common.cancel':      { en: 'Cancel',      fr: 'Annuler',      ar: 'إلغاء' },
  'common.delete':      { en: 'Delete',      fr: 'Supprimer',    ar: 'حذف' },
  'common.edit':        { en: 'Edit',        fr: 'Modifier',     ar: 'تعديل' },
  'common.done':        { en: 'Done',        fr: 'Terminé',      ar: 'تم' },
  'common.back':        { en: 'Back',        fr: 'Retour',       ar: 'رجوع' },
  'common.next':        { en: 'Next',        fr: 'Suivant',      ar: 'التالي' },
  'common.skip':        { en: 'Skip',        fr: 'Passer',       ar: 'تخطي' },
  'common.retry':       { en: 'Try again',   fr: 'Réessayer',    ar: 'أعد المحاولة' },
  'common.loading':     { en: 'Loading…',    fr: 'Chargement…',  ar: 'جارٍ التحميل…' },
  'common.search':      { en: 'Search',      fr: 'Rechercher',   ar: 'بحث' },
  'common.optional':    { en: 'Optional',    fr: 'Facultatif',   ar: 'اختياري' },
  'common.required':    { en: 'Required',    fr: 'Obligatoire',  ar: 'مطلوب' },
  'common.confirm':     { en: 'Confirm',     fr: 'Confirmer',    ar: 'تأكيد' },
  'common.yes':         { en: 'Yes',         fr: 'Oui',          ar: 'نعم' },
  'common.no':          { en: 'No',          fr: 'Non',          ar: 'لا' },
  'common.error':       { en: 'Something went wrong', fr: 'Une erreur est survenue', ar: 'حدث خطأ ما' },

  // ---- Moderation status words ----
  'status.approved':    { en: 'Approved',    fr: 'Approuvé',     ar: 'مقبول' },
  'status.pending':     { en: 'Pending',     fr: 'En attente',   ar: 'قيد المراجعة' },
  'status.hidden':      { en: 'Hidden',      fr: 'Masqué',       ar: 'مخفي' },

  // ---- Splash / onboarding (these used to be hardcoded English) ----
  'onboarding.title1':  { en: "Find what's nearby",  fr: 'Trouvez ce qui est proche', ar: 'اكتشف ما حولك' },
  'onboarding.body1':   {
    en: 'Discover the best spots around you in Bizerte. Restaurants, beaches, hidden gems and more, all in one place.',
    fr: 'Découvrez les meilleurs endroits autour de vous à Bizerte : restaurants, plages, trésors cachés et plus encore.',
    ar: 'اكتشف أفضل الأماكن حولك في بنزرت: مطاعم وشواطئ وكنوز خفية، كلها في مكان واحد.',
  },
  'onboarding.title2':  { en: 'Customize your travel', fr: 'Personnalisez votre voyage', ar: 'خصّص رحلتك' },
  'onboarding.body2':   {
    en: 'Plan your day, save your favorite spots and let Bon Plan build the perfect itinerary through Bizerte for you.',
    fr: 'Planifiez votre journée, enregistrez vos lieux favoris et laissez Bon Plan construire votre itinéraire idéal.',
    ar: 'خطّط ليومك، احفظ أماكنك المفضلة، ودع بون بلان يبني لك أفضل جدول في بنزرت.',
  },

  // ---- Choose city ----
  'city.title':         { en: 'Select city to explore', fr: 'Choisissez une ville à explorer', ar: 'اختر مدينة لاستكشافها' },
  'city.searchPlaceholder': { en: 'Search a city', fr: 'Chercher une ville', ar: 'ابحث عن مدينة' },
  'city.popular':       { en: 'POPULAR CITIES', fr: 'VILLES POPULAIRES', ar: 'المدن الشائعة' },
  'city.continue':      { en: 'Continue',     fr: 'Continuer',    ar: 'متابعة' },

  // ---- Authentication ----
  'auth.welcomeBack':   { en: 'Welcome back',  fr: 'Bon retour',   ar: 'مرحباً بعودتك' },
  'auth.loginSubtitle': {
    en: 'Log in to find your favorites and your plans.',
    fr: 'Connectez-vous pour retrouver vos favoris et vos plans.',
    ar: 'سجّل الدخول لتجد مفضلاتك وخططك.',
  },
  'auth.createAccount': { en: 'Create account', fr: 'Créer un compte', ar: 'إنشاء حساب' },
  'auth.signupSubtitle': {
    en: 'Join Bon Plan and start planning your days in Bizerte.',
    fr: 'Rejoignez Bon Plan et planifiez vos journées à Bizerte.',
    ar: 'انضم إلى بون بلان وابدأ بتخطيط أيامك في بنزرت.',
  },
  'auth.name':          { en: 'Full name',    fr: 'Nom complet',  ar: 'الاسم الكامل' },
  'auth.namePlaceholder': { en: 'Your name',  fr: 'Votre nom',    ar: 'اسمك' },
  'auth.email':         { en: 'Email',        fr: 'E-mail',       ar: 'البريد الإلكتروني' },
  'auth.emailPlaceholder': { en: 'you@example.com', fr: 'vous@exemple.com', ar: 'you@example.com' },
  'auth.password':      { en: 'Password',     fr: 'Mot de passe', ar: 'كلمة المرور' },
  'auth.passwordPlaceholder': { en: 'At least 6 characters', fr: 'Au moins 6 caractères', ar: '6 أحرف على الأقل' },
  'auth.confirmPassword': { en: 'Confirm password', fr: 'Confirmer le mot de passe', ar: 'تأكيد كلمة المرور' },
  'auth.currentPassword': { en: 'Current password', fr: 'Mot de passe actuel', ar: 'كلمة المرور الحالية' },
  'auth.newPassword':   { en: 'New password', fr: 'Nouveau mot de passe', ar: 'كلمة مرور جديدة' },
  'auth.logIn':         { en: 'Log in',       fr: 'Se connecter', ar: 'تسجيل الدخول' },
  'auth.signUp':        { en: 'Sign up',      fr: "S'inscrire",   ar: 'إنشاء حساب' },
  'auth.forgotPassword': { en: 'Forgot password?', fr: 'Mot de passe oublié ?', ar: 'نسيت كلمة المرور؟' },
  'auth.noAccount':     { en: "Don't have an account?", fr: 'Pas encore de compte ?', ar: 'ليس لديك حساب؟' },
  'auth.haveAccount':   { en: 'Already have an account?', fr: 'Vous avez déjà un compte ?', ar: 'لديك حساب بالفعل؟' },
  'auth.continueAsGuest': { en: 'Browse without an account', fr: 'Explorer sans compte', ar: 'تصفّح بدون حساب' },
  'auth.resetTitle':    { en: 'Reset password', fr: 'Réinitialiser le mot de passe', ar: 'إعادة تعيين كلمة المرور' },
  'auth.forgotSubtitle': {
    en: 'Enter the email you signed up with and we will let you choose a new password.',
    fr: 'Saisissez l’e-mail de votre compte pour choisir un nouveau mot de passe.',
    ar: 'أدخل البريد الإلكتروني لحسابك لاختيار كلمة مرور جديدة.',
  },
  'auth.resetSubtitle': {
    en: 'Choose a new password for %s.',
    fr: 'Choisissez un nouveau mot de passe pour %s.',
    ar: 'اختر كلمة مرور جديدة لـ %s.',
  },
  'auth.continue':      { en: 'Continue',     fr: 'Continuer',    ar: 'متابعة' },
  'auth.passwordChanged': { en: 'Password changed', fr: 'Mot de passe modifié', ar: 'تم تغيير كلمة المرور' },
  'auth.passwordChangedMsg': {
    en: 'You can now log in with your new password.',
    fr: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
    ar: 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
  },
  'auth.loginRequired': { en: 'Log in required', fr: 'Connexion requise', ar: 'تسجيل الدخول مطلوب' },
  'auth.loginRequiredMsg': {
    en: 'Log in to use this feature.',
    fr: 'Connectez-vous pour utiliser cette fonction.',
    ar: 'سجّل الدخول لاستخدام هذه الميزة.',
  },
  'auth.demoHint':      {
    en: 'Demo admin: admin@bonplan.tn / admin123',
    fr: 'Admin démo : admin@bonplan.tn / admin123',
    ar: 'حساب المشرف التجريبي: admin@bonplan.tn / admin123',
  },

  // ---- Form error messages (matched to the error codes the db returns) ----
  'error.nameTooShort':     { en: 'Please enter your name.', fr: 'Veuillez saisir votre nom.', ar: 'يرجى إدخال اسمك.' },
  'error.emailInvalid':     { en: 'That email does not look right.', fr: 'Cet e-mail semble invalide.', ar: 'البريد الإلكتروني غير صالح.' },
  'error.emailTaken':       { en: 'An account already uses this email.', fr: 'Un compte utilise déjà cet e-mail.', ar: 'هذا البريد مستخدم بالفعل.' },
  'error.emailNotFound':    { en: 'No account found with this email.', fr: 'Aucun compte avec cet e-mail.', ar: 'لا يوجد حساب بهذا البريد.' },
  'error.passwordTooShort': { en: 'Password must be at least 6 characters.', fr: 'Le mot de passe doit faire au moins 6 caractères.', ar: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' },
  'error.passwordMismatch': { en: 'The two passwords do not match.', fr: 'Les deux mots de passe ne correspondent pas.', ar: 'كلمتا المرور غير متطابقتين.' },
  'error.badCredentials':   { en: 'Wrong email or password.', fr: 'E-mail ou mot de passe incorrect.', ar: 'البريد أو كلمة المرور غير صحيحة.' },
  'error.wrongPassword':    { en: 'Current password is incorrect.', fr: 'Mot de passe actuel incorrect.', ar: 'كلمة المرور الحالية غير صحيحة.' },
  'error.notLoggedIn':      { en: 'You need to log in first.', fr: 'Vous devez d’abord vous connecter.', ar: 'يجب تسجيل الدخول أولاً.' },
  'error.categoryRequired': { en: 'Please choose a category.', fr: 'Veuillez choisir une catégorie.', ar: 'يرجى اختيار فئة.' },
  'error.titleRequired':    { en: 'Please enter a title.', fr: 'Veuillez saisir un titre.', ar: 'يرجى إدخال عنوان.' },
  'error.textTooShort':     { en: 'Please write a little more.', fr: 'Veuillez écrire un peu plus.', ar: 'يرجى كتابة المزيد.' },
  'error.ratingInvalid':    { en: 'Please choose a rating.', fr: 'Veuillez choisir une note.', ar: 'يرجى اختيار تقييم.' },
  'error.lastAdmin':        { en: 'You cannot remove the last admin.', fr: 'Impossible de retirer le dernier administrateur.', ar: 'لا يمكن إزالة آخر مشرف.' },
  'error.userNotFound':     { en: 'That account no longer exists.', fr: 'Ce compte n’existe plus.', ar: 'هذا الحساب لم يعد موجوداً.' },
  'error.badRole':          { en: 'Unknown role.', fr: 'Rôle inconnu.', ar: 'دور غير معروف.' },
  'error.saveFailed':       { en: 'Could not save. Please try again.', fr: 'Enregistrement impossible. Réessayez.', ar: 'تعذّر الحفظ. حاول مرة أخرى.' },
  'error.alreadyAdded':     { en: 'Already in your plan.', fr: 'Déjà dans votre plan.', ar: 'موجود بالفعل في خطتك.' },
  'error.notAllowed':       { en: 'You are not allowed to do that.', fr: 'Vous n’êtes pas autorisé à faire cela.', ar: 'غير مسموح لك بذلك.' },

  // ---- Favorites screen ----
  'fav.title':          { en: 'My favorites', fr: 'Mes favoris',  ar: 'مفضلاتي' },
  'fav.emptyTitle':     { en: 'No favorites yet', fr: 'Aucun favori', ar: 'لا توجد مفضلات بعد' },
  'fav.emptySub':       {
    en: 'Tap the heart on any place to save it here.',
    fr: 'Touchez le cœur sur un lieu pour l’enregistrer ici.',
    ar: 'اضغط على القلب في أي مكان لحفظه هنا.',
  },
  'fav.explore':        { en: 'Explore places', fr: 'Explorer les lieux', ar: 'استكشف الأماكن' },

  // ---- Reviews / comments ----
  'comment.title':      { en: 'Reviews',      fr: 'Avis',         ar: 'التقييمات' },
  'comment.write':      { en: 'Write a review', fr: 'Écrire un avis', ar: 'اكتب تقييماً' },
  'comment.edit':       { en: 'Edit your review', fr: 'Modifier votre avis', ar: 'عدّل تقييمك' },
  'comment.yourRating': { en: 'Your rating',  fr: 'Votre note',   ar: 'تقييمك' },
  'comment.placeholder': {
    en: 'What did you think of this place?',
    fr: 'Qu’avez-vous pensé de ce lieu ?',
    ar: 'ما رأيك في هذا المكان؟',
  },
  'comment.publish':    { en: 'Publish review', fr: 'Publier l’avis', ar: 'نشر التقييم' },
  'comment.empty':      { en: 'No reviews yet', fr: 'Aucun avis',  ar: 'لا توجد تقييمات بعد' },
  'comment.emptySub':   {
    en: 'Be the first to share your experience.',
    fr: 'Soyez le premier à partager votre expérience.',
    ar: 'كن أول من يشارك تجربته.',
  },
  'comment.you':        { en: 'You',          fr: 'Vous',         ar: 'أنت' },
  'comment.deleteTitle': { en: 'Delete review', fr: 'Supprimer l’avis', ar: 'حذف التقييم' },
  'comment.deleteMsg':  { en: 'Delete this review permanently?', fr: 'Supprimer définitivement cet avis ?', ar: 'حذف هذا التقييم نهائياً؟' },

  // ---- Add / edit a place ----
  'place.addTitle':     { en: 'Add a place',  fr: 'Ajouter un lieu', ar: 'إضافة مكان' },
  'place.editTitle':    { en: 'Edit place',   fr: 'Modifier le lieu', ar: 'تعديل المكان' },
  'place.name':         { en: 'Name',         fr: 'Nom',          ar: 'الاسم' },
  'place.namePlaceholder': { en: 'e.g. Café de la Corniche', fr: 'ex. Café de la Corniche', ar: 'مثال: مقهى الكورنيش' },
  'place.category':     { en: 'Category',     fr: 'Catégorie',    ar: 'الفئة' },
  'place.subtitle':     { en: 'Short description', fr: 'Description courte', ar: 'وصف مختصر' },
  'place.subtitlePlaceholder': { en: 'e.g. Italian · Pizza', fr: 'ex. Italien · Pizza', ar: 'مثال: إيطالي · بيتزا' },
  'place.about':        { en: 'About this place', fr: 'À propos de ce lieu', ar: 'عن هذا المكان' },
  'place.aboutPlaceholder': { en: 'What makes it worth visiting?', fr: 'Pourquoi vaut-il le détour ?', ar: 'ما الذي يجعله يستحق الزيارة؟' },
  'place.address':      { en: 'Address',      fr: 'Adresse',      ar: 'العنوان' },
  'place.addressPlaceholder': { en: 'e.g. Bizerte Medina', fr: 'ex. Médina de Bizerte', ar: 'مثال: مدينة بنزرت العتيقة' },
  'place.phone':        { en: 'Phone',        fr: 'Téléphone',    ar: 'الهاتف' },
  'place.website':      { en: 'Website',      fr: 'Site web',     ar: 'الموقع الإلكتروني' },
  'place.price':        { en: 'Price level',  fr: 'Niveau de prix', ar: 'مستوى السعر' },
  'place.priceFree':    { en: 'Free',         fr: 'Gratuit',      ar: 'مجاني' },
  'place.photo':        { en: 'Photo',        fr: 'Photo',        ar: 'صورة' },
  'place.choosePhoto':  { en: 'Choose a photo', fr: 'Choisir une photo', ar: 'اختر صورة' },
  'place.photos':       { en: 'Photos',       fr: 'Photos',       ar: 'الصور' },
  'place.photosHint':   {
    en: 'Add up to 4 of your own photos. The first one is the main picture.',
    fr: 'Ajoutez jusqu’à 4 de vos propres photos. La première est la photo principale.',
    ar: 'أضف حتى 4 صور من عندك. الأولى هي الصورة الرئيسية.',
  },
  'place.fromGallery':  { en: 'Gallery',      fr: 'Galerie',      ar: 'المعرض' },
  'place.takePhoto':    { en: 'Camera',       fr: 'Appareil photo', ar: 'الكاميرا' },
  'place.noPhotos':     { en: 'No photos yet — tap to add one', fr: 'Aucune photo — appuyez pour en ajouter', ar: 'لا توجد صور — اضغط للإضافة' },
  'place.mainPhoto':    { en: 'Main',         fr: 'Principale',   ar: 'رئيسية' },
  'place.makeMain':     { en: 'Make main',    fr: 'Définir principale', ar: 'اجعلها رئيسية' },
  'place.photoPermissionTitle': { en: 'Permission needed', fr: 'Autorisation requise', ar: 'إذن مطلوب' },
  'place.photoPermissionMsg': {
    en: 'Allow Bon Plan to use your photos or camera to add a picture. You can change this in your phone settings.',
    fr: 'Autorisez Bon Plan à utiliser vos photos ou votre appareil photo. Modifiable dans les réglages du téléphone.',
    ar: 'اسمح لتطبيق بون بلان باستخدام صورك أو الكاميرا. يمكنك تغيير ذلك من إعدادات الهاتف.',
  },
  'place.submit':       { en: 'Submit place', fr: 'Proposer le lieu', ar: 'إرسال المكان' },
  'place.submittedTitle': { en: 'Thanks!',    fr: 'Merci !',      ar: 'شكراً!' },
  'place.submittedMsg': {
    en: 'Your place was sent to our team. It will appear once an admin approves it.',
    fr: 'Votre lieu a été envoyé à notre équipe. Il apparaîtra après validation par un administrateur.',
    ar: 'تم إرسال المكان إلى فريقنا. سيظهر بعد موافقة المشرف.',
  },
  'place.publishedMsg': { en: 'Your place is now live.', fr: 'Votre lieu est maintenant publié.', ar: 'تم نشر المكان.' },
  'place.myPlaces':     { en: 'My places',    fr: 'Mes lieux',    ar: 'أماكني' },
  'place.myPlacesEmpty': { en: 'You have not added any place yet', fr: 'Vous n’avez ajouté aucun lieu', ar: 'لم تضف أي مكان بعد' },
  'place.addOne':       { en: 'Add a place',  fr: 'Ajouter un lieu', ar: 'أضف مكاناً' },

  // ---- Plans ----
  'plan.myPlans':       { en: 'My plans',     fr: 'Mes plans',    ar: 'خططي' },
  'plan.newPlan':       { en: 'New plan',     fr: 'Nouveau plan', ar: 'خطة جديدة' },
  'plan.title':         { en: 'Plan name',    fr: 'Nom du plan',  ar: 'اسم الخطة' },
  'plan.titlePlaceholder': { en: 'e.g. Saturday in Bizerte', fr: 'ex. Samedi à Bizerte', ar: 'مثال: السبت في بنزرت' },
  'plan.date':          { en: 'Date',         fr: 'Date',         ar: 'التاريخ' },
  'plan.activities':    { en: 'activities',   fr: 'activités',    ar: 'نشاط' },
  'plan.share':         { en: 'Share publicly', fr: 'Partager publiquement', ar: 'مشاركة علنية' },
  'plan.shareHint':     {
    en: 'Public plans are reviewed by an admin before others can see them.',
    fr: 'Les plans publics sont vérifiés par un administrateur avant publication.',
    ar: 'تتم مراجعة الخطط العامة من قبل مشرف قبل نشرها.',
  },
  'plan.private':       { en: 'Private',      fr: 'Privé',        ar: 'خاص' },
  'plan.public':        { en: 'Public',       fr: 'Public',       ar: 'عام' },
  'plan.emptyPlans':    { en: 'No plans yet', fr: 'Aucun plan',   ar: 'لا توجد خطط بعد' },
  'plan.emptyPlansSub': {
    en: 'Create a plan to organise your day around your favorite places.',
    fr: 'Créez un plan pour organiser votre journée autour de vos lieux favoris.',
    ar: 'أنشئ خطة لتنظيم يومك حول أماكنك المفضلة.',
  },
  'plan.deleteTitle':   { en: 'Delete plan',  fr: 'Supprimer le plan', ar: 'حذف الخطة' },
  'plan.deleteMsg':     { en: 'Delete "%s" and all its activities?', fr: 'Supprimer « %s » et toutes ses activités ?', ar: 'حذف "%s" وكل أنشطتها؟' },
  'plan.editActivity':  { en: 'Edit activity', fr: 'Modifier l’activité', ar: 'تعديل النشاط' },
  'plan.activityTitle': { en: 'Activity',     fr: 'Activité',     ar: 'النشاط' },
  'plan.activityTime':  { en: 'Time',         fr: 'Heure',        ar: 'الوقت' },
  'plan.activityDuration': { en: 'Duration',  fr: 'Durée',        ar: 'المدة' },
  'plan.durationHint':  { en: 'e.g. 1h, 1h 30m, 45m', fr: 'ex. 1h, 1h 30m, 45m', ar: 'مثال: 1h، 1h 30m، 45m' },
  'plan.moveUp':        { en: 'Move up',      fr: 'Monter',       ar: 'أعلى' },
  'plan.moveDown':      { en: 'Move down',    fr: 'Descendre',    ar: 'أسفل' },
  'plan.total':         { en: 'Total',        fr: 'Total',        ar: 'المجموع' },
  'plan.addPlace':      { en: 'Add a place',  fr: 'Ajouter un lieu', ar: 'أضف مكاناً' },
  'plan.customActivity': { en: 'Custom activity', fr: 'Activité personnalisée', ar: 'نشاط مخصص' },

  // ---- Admin ----
  'admin.title':        { en: 'Administration', fr: 'Administration', ar: 'الإدارة' },
  'admin.dashboard':    { en: 'Dashboard',    fr: 'Tableau de bord', ar: 'لوحة التحكم' },
  'admin.places':       { en: 'Places',       fr: 'Lieux',        ar: 'الأماكن' },
  'admin.plans':        { en: 'Shared plans', fr: 'Plans partagés', ar: 'الخطط المشتركة' },
  'admin.comments':     { en: 'Reviews',      fr: 'Avis',         ar: 'التقييمات' },
  'admin.users':        { en: 'Users',        fr: 'Utilisateurs', ar: 'المستخدمون' },
  'admin.pendingPlaces': { en: 'Places awaiting approval', fr: 'Lieux en attente', ar: 'أماكن بانتظار الموافقة' },
  'admin.pendingPlans': { en: 'Plans awaiting approval', fr: 'Plans en attente', ar: 'خطط بانتظار الموافقة' },
  'admin.approve':      { en: 'Approve',      fr: 'Approuver',    ar: 'موافقة' },
  'admin.hide':         { en: 'Hide',         fr: 'Masquer',      ar: 'إخفاء' },
  'admin.unhide':       { en: 'Show again',   fr: 'Réafficher',   ar: 'إظهار' },
  'admin.reject':       { en: 'Reject',       fr: 'Rejeter',      ar: 'رفض' },
  'admin.nothingPending': { en: 'Nothing waiting', fr: 'Rien en attente', ar: 'لا شيء بالانتظار' },
  'admin.nothingPendingSub': {
    en: 'New submissions from users will appear here.',
    fr: 'Les nouvelles propositions des utilisateurs apparaîtront ici.',
    ar: 'ستظهر هنا المشاركات الجديدة من المستخدمين.',
  },
  'admin.deleteTitle':  { en: 'Delete permanently', fr: 'Supprimer définitivement', ar: 'حذف نهائي' },
  'admin.deletePlaceMsg': { en: 'Delete "%s"? This cannot be undone.', fr: 'Supprimer « %s » ? Action irréversible.', ar: 'حذف "%s"؟ لا يمكن التراجع.' },
  'admin.deleteUserMsg': {
    en: 'Delete the account of "%s"? Their favorites, reviews and plans go with it.',
    fr: 'Supprimer le compte de « %s » ? Ses favoris, avis et plans seront supprimés aussi.',
    ar: 'حذف حساب "%s"؟ ستُحذف معه مفضلاته وتقييماته وخططه.',
  },
  'admin.hiddenPlaces': { en: 'Hidden places', fr: 'Lieux masqués', ar: 'أماكن مخفية' },
  'admin.makeAdmin':    { en: 'Make admin',   fr: 'Nommer administrateur', ar: 'تعيين مشرفاً' },
  'admin.removeAdmin':  { en: 'Remove admin', fr: 'Retirer l’administrateur', ar: 'إزالة الإشراف' },
  'admin.roleUser':     { en: 'User',         fr: 'Utilisateur',  ar: 'مستخدم' },
  'admin.roleAdmin':    { en: 'Admin',        fr: 'Administrateur', ar: 'مشرف' },
  'admin.role':         { en: 'Role',         fr: 'Rôle',         ar: 'الدور' },
  'admin.newUser':      { en: 'New account',  fr: 'Nouveau compte', ar: 'حساب جديد' },
  'admin.createUser':   { en: 'Create account', fr: 'Créer le compte', ar: 'إنشاء الحساب' },
  'admin.demoteSelfMsg': {
    en: 'You will stop being an admin and lose access to this panel. Continue?',
    fr: 'Vous ne serez plus administrateur et perdrez l’accès à ce panneau. Continuer ?',
    ar: 'لن تعود مشرفاً وستفقد الوصول إلى هذه اللوحة. هل تريد المتابعة؟',
  },
  'admin.selfHint': {
    en: 'This is your account. You cannot delete it, but you can remove your own admin role.',
    fr: 'Ceci est votre compte. Vous ne pouvez pas le supprimer, mais vous pouvez retirer votre rôle d’administrateur.',
    ar: 'هذا حسابك. لا يمكنك حذفه، لكن يمكنك إزالة دور المشرف عن نفسك.',
  },
  'admin.selfLastAdminHint': {
    en: 'This is your account, and you are the only admin — create another admin first.',
    fr: 'Ceci est votre compte et vous êtes le seul administrateur — créez d’abord un autre administrateur.',
    ar: 'هذا حسابك وأنت المشرف الوحيد — أنشئ مشرفاً آخر أولاً.',
  },
  'admin.by':           { en: 'by',           fr: 'par',          ar: 'بواسطة' },
  'admin.openPanel':    { en: 'Admin panel',  fr: 'Panneau admin', ar: 'لوحة المشرف' },

  // ---- Profile additions ----
  'profile.guest':      { en: 'Guest',        fr: 'Invité',       ar: 'زائر' },
  'profile.guestSub':   {
    en: 'Log in to save favorites and plans.',
    fr: 'Connectez-vous pour enregistrer favoris et plans.',
    ar: 'سجّل الدخول لحفظ المفضلات والخطط.',
  },
  'profile.account':    { en: 'ACCOUNT',      fr: 'COMPTE',       ar: 'الحساب' },
  'profile.changePassword': { en: 'Change password', fr: 'Changer le mot de passe', ar: 'تغيير كلمة المرور' },
  'profile.myReviews':  { en: 'My reviews',   fr: 'Mes avis',     ar: 'تقييماتي' },
  'profile.reviewsCount': { en: 'Reviews',    fr: 'Avis',         ar: 'تقييمات' },
  'profile.saved':      { en: 'Saved',        fr: 'Enregistré',   ar: 'تم الحفظ' },
};

// Public translator - called inside every screen via useT().
// If a key is missing, returns the key itself so you notice during dev.
export function translate(key, lang) {
  const entry = dict[key];                  // look up the key
  if (!entry) return key;                   // fallback - missing key
  return entry[lang] || entry.en || key;    // fallback chain: requested lang -> english -> key
}
