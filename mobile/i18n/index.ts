export type Language = "en" | "ar";

const en = {
  // App
  appName: "Ask Deeny",
  tagline: "Your Islamic Knowledge Companion",

  // Common
  save: "Save",
  cancel: "Cancel",
  next: "Next",
  error: "Error",
  notSet: "Not set",
  delete: "Delete",

  // Auth
  email: "Email",
  password: "Password",
  signIn: "Sign In",
  signingIn: "Signing in...",
  noAccount: "Don't have an account?",
  register: "Register",
  createAccount: "Create Account",
  creatingAccount: "Creating account...",
  firstName: "First Name",
  lastName: "Last Name",
  confirmPassword: "Confirm Password",
  alreadyHaveAccount: "Already have an account?",
  loginFailed: "Login Failed",
  registrationFailed: "Registration Failed",
  emailRequired: "Email and password are required",
  passwordsNotMatch: "Passwords do not match",
  passwordTooShort: "Password must be at least 6 characters",

  // Onboarding — language
  selectLanguage: "Select Language",
  languageSubtitle: "Choose your preferred language",
  english: "English",
  arabic: "العربية",

  // Onboarding — country
  whereDoYouLive: "Where do you live?",
  countrySubtitle: "This helps us provide rulings relevant to your location",
  searchCountries: "Search countries...",

  // Onboarding — madhab
  selectMadhab: "Which school of thought do you follow?",
  madhabSubtitle: "Ask Deeny will tailor answers according to your madhab",
  getStarted: "Get Started",
  settingUp: "Setting up...",
  saving: "Saving...",

  // Chat list
  chats: "Chats",
  noConversations: "No conversations yet",
  startNewChat: "Start a new chat to ask your Islamic questions",
  deleteChat: "Delete Chat",
  deleteConfirm: "Are you sure you want to delete this chat?",
  today: "Today",
  yesterday: "Yesterday",
  daysAgo: (n: number) => `${n} days ago`,

  // Chat screen
  bismillah: "Bismillah",
  welcomeText:
    "Ask any Islamic question and I'll provide answers with authentic references based on your madhab.",
  askQuestion: "Ask a question...",
  thinking: "Thinking...",

  // Settings
  settings: "Settings",
  profile: "Profile",
  preferences: "Preferences",
  madhabLabel: "Madhab",
  countryLabel: "Country",
  language: "Language",
  account: "Account",
  logout: "Logout",
  logoutConfirm: "Are you sure you want to log out?",
  version: "Ask Deeny v1.0.0",

  // Madhab names
  hanafi: "Hanafi",
  maliki: "Maliki",
  shafii: "Shafi'i",
  hanbali: "Hanbali",
};

const ar: typeof en = {
  // App
  appName: "اسأل ديني",
  tagline: "رفيقك في المعرفة الإسلامية",

  // Common
  save: "حفظ",
  cancel: "إلغاء",
  next: "التالي",
  error: "خطأ",
  notSet: "غير محدد",
  delete: "حذف",

  // Auth
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  signIn: "تسجيل الدخول",
  signingIn: "جارٍ تسجيل الدخول...",
  noAccount: "ليس لديك حساب؟",
  register: "سجّل",
  createAccount: "إنشاء حساب",
  creatingAccount: "جارٍ إنشاء الحساب...",
  firstName: "الاسم الأول",
  lastName: "اسم العائلة",
  confirmPassword: "تأكيد كلمة المرور",
  alreadyHaveAccount: "لديك حساب بالفعل؟",
  loginFailed: "فشل تسجيل الدخول",
  registrationFailed: "فشل التسجيل",
  emailRequired: "البريد الإلكتروني وكلمة المرور مطلوبان",
  passwordsNotMatch: "كلمتا المرور غير متطابقتين",
  passwordTooShort: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",

  // Onboarding — language
  selectLanguage: "اختر اللغة",
  languageSubtitle: "اختر لغتك المفضلة",
  english: "English",
  arabic: "العربية",

  // Onboarding — country
  whereDoYouLive: "أين تسكن؟",
  countrySubtitle: "يساعدنا ذلك في تقديم الأحكام المناسبة لموقعك",
  searchCountries: "ابحث عن الدول...",

  // Onboarding — madhab
  selectMadhab: "ما المذهب الذي تتبعه؟",
  madhabSubtitle: "سيُخصَّص اسأل ديني إجاباته وفق مذهبك",
  getStarted: "ابدأ الآن",
  settingUp: "جارٍ الإعداد...",
  saving: "جارٍ الحفظ...",

  // Chat list
  chats: "المحادثات",
  noConversations: "لا توجد محادثات بعد",
  startNewChat: "ابدأ محادثة جديدة لطرح أسئلتك الإسلامية",
  deleteChat: "حذف المحادثة",
  deleteConfirm: "هل أنت متأكد أنك تريد حذف هذه المحادثة؟",
  today: "اليوم",
  yesterday: "أمس",
  daysAgo: (n: number) => `منذ ${n} أيام`,

  // Chat screen
  bismillah: "بسم الله",
  welcomeText: "اطرح أي سؤال إسلامي وسأجيبك بمراجع موثوقة وفق مذهبك.",
  askQuestion: "اطرح سؤالاً...",
  thinking: "جارٍ التفكير...",

  // Settings
  settings: "الإعدادات",
  profile: "الملف الشخصي",
  preferences: "التفضيلات",
  madhabLabel: "المذهب",
  countryLabel: "الدولة",
  language: "اللغة",
  account: "الحساب",
  logout: "تسجيل الخروج",
  logoutConfirm: "هل أنت متأكد أنك تريد تسجيل الخروج؟",
  version: "اسأل ديني v1.0.0",

  // Madhab names
  hanafi: "حنفي",
  maliki: "مالكي",
  shafii: "شافعي",
  hanbali: "حنبلي",
};

export const translations = { en, ar };

export function getT(lang: Language) {
  return translations[lang] ?? translations.en;
}
