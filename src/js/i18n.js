/**
 * All eight languages stay available in the menu. What changed is that a
 * visitor now downloads only the one they are reading: German ships with the
 * page (it is the default and must render without a round trip), and the
 * other seven are fetched the moment they are chosen. Previously every
 * visitor downloaded all eight, ~160 KB of JSON, to use one of them.
 */
import de from "../data/locales/de.json";
import { languages } from "../data/site.js";

// Vite turns this into one lazily-fetched chunk per language.
const localeLoaders = import.meta.glob("../data/locales/*.json");

/**
 * The hero prompt cycles through every language as an invitation, and it is
 * the first thing a visitor reads. Inlining these eight short strings (214
 * bytes) keeps that gesture instant without pulling eight full packs.
 */
const PROMPTS = {
  de: "Wählen Sie Ihre Sprache",
  en: "Choose your language",
  th: "เลือกภาษาของคุณ",
  fr: "Choisissez votre langue",
  es: "Elija su idioma",
  it: "Scelga la sua lingua",
  ru: "Выберите язык",
  pt: "Escolha o seu idioma",
};

const STORAGE_KEY = "kwiin-language";
const LEGACY_STORAGE_KEY = "kwiin-hero-language";
const codes = languages.map(({ code }) => code);
const translations = { de };
let currentLanguage = "de";

/** Fetch a language pack once; resolves immediately if already in memory. */
const inFlight = new Map();
export function loadLanguage(code) {
  if (translations[code]) return Promise.resolve(translations[code]);
  if (inFlight.has(code)) return inFlight.get(code);
  const loader = localeLoaders[`../data/locales/${code}.json`];
  if (!loader) return Promise.resolve(null);
  const task = loader()
    .then((module) => {
      translations[code] = module.default ?? module;
      return translations[code];
    })
    .catch(() => null)
    .finally(() => inFlight.delete(code));
  inFlight.set(code, task);
  return task;
}

function isLanguage(value) {
  return codes.includes(value);
}

function interpolate(value, params = {}) {
  return Object.entries(params).reduce(
    (result, [name, replacement]) => result.replaceAll(`{${name}}`, String(replacement)),
    value,
  );
}

export function t(key, params = {}, language = currentLanguage) {
  const value = translations[language]?.[key] ?? translations.de?.[key] ?? key;
  return interpolate(value, params);
}

export function getLanguage() {
  return currentLanguage;
}

function getPathLanguage() {
  const firstSegment = window.location.pathname.split("/").filter(Boolean)[0];
  return isLanguage(firstSegment) && firstSegment !== "de" ? firstSegment : "de";
}

function routeWithoutLanguage() {
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments.length && isLanguage(segments[0])) segments.shift();
  return segments.length ? `/${segments.join("/")}/` : "/";
}

function localizedPath(language) {
  const route = routeWithoutLanguage();
  return language === "de" ? route : `/${language}${route}`;
}

function readParams(element) {
  try {
    return element.dataset.i18nParams ? JSON.parse(element.dataset.i18nParams) : {};
  } catch {
    return {};
  }
}

function applyText(language) {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (!key) return;
    element.textContent = t(key, readParams(element), language);
  });

  const attributes = [
    ["data-i18n-aria-label", "aria-label"],
    ["data-i18n-alt", "alt"],
    ["data-i18n-title", "title"],
  ];

  attributes.forEach(([dataAttribute, attribute]) => {
    document.querySelectorAll(`[${dataAttribute}]`).forEach((element) => {
      const key = element.getAttribute(dataAttribute);
      if (key) element.setAttribute(attribute, t(key, readParams(element), language));
    });
  });
}

function applyMetadata(language) {
  const page = document.body.dataset.page ?? "home";
  const title = t(`meta.${page}.title`, {}, language);
  const description = t(`meta.${page}.description`, {}, language);
  document.title = title;

  const descriptionMeta = document.querySelector('meta[name="description"]');
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (descriptionMeta) descriptionMeta.content = description;
  if (ogTitle) ogTitle.content = title;
  if (ogDescription) ogDescription.content = description;
}

function syncControls(language) {
  const meta = languages.find((item) => item.code === language) ?? languages[0];
  document.querySelectorAll("[data-current-language]").forEach((element) => {
    element.textContent = meta.short;
  });
  document.querySelectorAll("[data-current-language-name]").forEach((element) => {
    element.textContent = meta.name;
    element.lang = meta.code;
  });
  document.querySelectorAll("[data-language]").forEach((option) => {
    const selected = option.dataset.language === language;
    option.setAttribute("aria-selected", String(selected));
    if (option instanceof HTMLAnchorElement) option.href = localizedPath(option.dataset.language);
  });
}

export function setLanguage(language, { persist = true, announce = true } = {}) {
  if (!isLanguage(language)) return;

  // If the pack is not in memory yet, fetch it and re-enter once it lands.
  // Localized routes already contain translated HTML, so only the controls
  // need to sync while the small language chunk arrives.
  if (!translations[language]) {
    currentLanguage = language;
    window.__kwiinLanguage = language;
    document.documentElement.lang = language;
    document.body.dataset.language = language;
    syncControls(language);
    loadLanguage(language).then((pack) => {
      if (pack) setLanguage(language, { persist, announce });
    });
    return;
  }

  currentLanguage = language;
  window.__kwiinLanguage = language;
  document.documentElement.lang = language;
  document.body.dataset.language = language;
  applyText(language);
  applyMetadata(language);
  syncControls(language);

  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, language);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Local storage is optional. The selected language still works for this visit.
    }
  }

  if (announce) {
    window.dispatchEvent(new CustomEvent("kwiin:language-change", { detail: { language } }));
  }
}

function initMenus() {
  const menus = [...document.querySelectorAll("[data-language-menu]")];

  document.querySelectorAll("[data-language]").forEach((option) => {
    option.addEventListener("click", () => {
      const language = option.dataset.language;
      if (!isLanguage(language)) return;
      document.body.classList.add("is-language-switching");
      try {
        localStorage.setItem(STORAGE_KEY, language);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        // The explicit language URL still works when storage is unavailable.
      }
      menus.forEach((menu) => { menu.open = false; });
    });
  });

  document.addEventListener("pointerdown", (event) => {
    menus.forEach((menu) => {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") menus.forEach((menu) => { menu.open = false; });
  });
}

function initCyclingPrompt() {
  const prompt = document.querySelector("[data-language-prompt]");
  const wrapper = document.querySelector("[data-language-prompt-wrap]");
  if (!prompt || !wrapper) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let visible = true;
  let promptIndex = Math.max(0, codes.indexOf(currentLanguage));
  let timer;

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }, { threshold: 0.1 });
  observer.observe(wrapper);

  const nextPrompt = () => {
    const menuOpen = wrapper.querySelector("[data-language-menu]")?.open;
    if (document.hidden || !visible || menuOpen) return;
    promptIndex = (promptIndex + 1) % codes.length;
    const language = codes[promptIndex];
    prompt.classList.add("is-changing");
    window.setTimeout(() => {
      prompt.textContent = PROMPTS[language] ?? t("language.prompt", {}, language);
      prompt.lang = language;
      prompt.classList.remove("is-changing");
    }, 185);
  };

  prompt.textContent = PROMPTS[currentLanguage] ?? t("language.prompt", {}, currentLanguage);
  prompt.lang = currentLanguage;
  if (!reducedMotion) timer = window.setInterval(nextPrompt, 1225);

  window.addEventListener("pagehide", () => {
    if (timer) clearInterval(timer);
    observer.disconnect();
  }, { once: true });
}

export function initI18n() {
  const initial = getPathLanguage();
  // Every language has its own crawlable URL. German is the default root and
  // the other seven routes are statically translated during the build.
  setLanguage(initial, { persist: false, announce: false });
  initMenus();
  initCyclingPrompt();
  window.__kwiinSetLanguage = (language) => setLanguage(language);
  window.__kwiinLanguage = currentLanguage;
}
