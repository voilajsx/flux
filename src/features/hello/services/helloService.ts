/**
 * Translation service for multi-language greeting support
 * @module @voilajsx/flux/features/hello
 * @file src/features/hello/services/HelloService.ts
 */

const translations = {
  en: "Hello",
  es: "Hola",
  fr: "Bonjour",
  de: "Hallo",
  it: "Ciao",
  pt: "Olá",
  ru: "Привет",
  ja: "こんにちは",
  zh: "你好",
  ar: "مرحبا",
  hi: "नमस्ते",
};

const helloService = {
  getGreeting: (lang: string = "en"): string => {
    return translations[lang as keyof typeof translations] || translations.en;
  },

  getTranslations: () => translations,

  getLanguages: () => Object.keys(translations)
};

export default helloService;