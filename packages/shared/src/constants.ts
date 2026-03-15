export const MADHABS = ["hanafi", "maliki", "shafii", "hanbali"] as const;
export type Madhab = (typeof MADHABS)[number];

export const MADHAB_LABELS: Record<Madhab, { en: string; ar: string }> = {
  hanafi: { en: "Hanafi", ar: "الحنفي" },
  maliki: { en: "Maliki", ar: "المالكي" },
  shafii: { en: "Shafi'i", ar: "الشافعي" },
  hanbali: { en: "Hanbali", ar: "الحنبلي" },
};

export const SOURCE_TYPES = [
  "quran",
  "hadith",
  "fatwa",
  "scholarly_opinion",
  "ijma",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  quran: "Quran",
  hadith: "Hadith",
  fatwa: "Fatwa",
  scholarly_opinion: "Scholarly Opinion",
  ijma: "Ijma (Consensus)",
};

export const MESSAGE_ROLES = ["user", "assistant"] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

export const COUNTRIES = [
  { code: "SA", name: "Saudi Arabia", nameAr: "المملكة العربية السعودية" },
  { code: "EG", name: "Egypt", nameAr: "مصر" },
  { code: "AE", name: "United Arab Emirates", nameAr: "الإمارات العربية المتحدة" },
  { code: "JO", name: "Jordan", nameAr: "الأردن" },
  { code: "KW", name: "Kuwait", nameAr: "الكويت" },
  { code: "QA", name: "Qatar", nameAr: "قطر" },
  { code: "BH", name: "Bahrain", nameAr: "البحرين" },
  { code: "OM", name: "Oman", nameAr: "عُمان" },
  { code: "IQ", name: "Iraq", nameAr: "العراق" },
  { code: "SY", name: "Syria", nameAr: "سوريا" },
  { code: "LB", name: "Lebanon", nameAr: "لبنان" },
  { code: "PS", name: "Palestine", nameAr: "فلسطين" },
  { code: "YE", name: "Yemen", nameAr: "اليمن" },
  { code: "LY", name: "Libya", nameAr: "ليبيا" },
  { code: "TN", name: "Tunisia", nameAr: "تونس" },
  { code: "DZ", name: "Algeria", nameAr: "الجزائر" },
  { code: "MA", name: "Morocco", nameAr: "المغرب" },
  { code: "SD", name: "Sudan", nameAr: "السودان" },
  { code: "SO", name: "Somalia", nameAr: "الصومال" },
  { code: "TR", name: "Turkey", nameAr: "تركيا" },
  { code: "PK", name: "Pakistan", nameAr: "باكستان" },
  { code: "AF", name: "Afghanistan", nameAr: "أفغانستان" },
  { code: "BD", name: "Bangladesh", nameAr: "بنغلاديش" },
  { code: "MY", name: "Malaysia", nameAr: "ماليزيا" },
  { code: "ID", name: "Indonesia", nameAr: "إندونيسيا" },
  { code: "NG", name: "Nigeria", nameAr: "نيجيريا" },
  { code: "GB", name: "United Kingdom", nameAr: "المملكة المتحدة" },
  { code: "US", name: "United States", nameAr: "الولايات المتحدة" },
  { code: "CA", name: "Canada", nameAr: "كندا" },
  { code: "DE", name: "Germany", nameAr: "ألمانيا" },
  { code: "FR", name: "France", nameAr: "فرنسا" },
  { code: "AU", name: "Australia", nameAr: "أستراليا" },
] as const;
