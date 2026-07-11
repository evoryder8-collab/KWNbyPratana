import translationData from "../data/translations.json";
import { languages } from "../data/site.js";

const STORAGE_KEY = "kwiin-language";
const LEGACY_STORAGE_KEY = "kwiin-hero-language";
const codes = languages.map(({ code }) => code);
const translations = translationData.translations;
let currentLanguage = "de";

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

function getStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    return isLanguage(stored) ? stored : "de";
  } catch {
    return "de";
  }
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
  document.querySelectorAll("button[data-language]").forEach((option) => {
    const selected = option.dataset.language === language;
    option.setAttribute("aria-selected", String(selected));
  });
}

export function setLanguage(language, { persist = true, announce = true } = {}) {
  if (!isLanguage(language)) return;
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

  document.querySelectorAll("button[data-language]").forEach((option) => {
    option.addEventListener("click", () => {
      const language = option.dataset.language;
      if (!isLanguage(language)) return;
      document.body.classList.add("is-language-switching");
      setLanguage(language);
      menus.forEach((menu) => { menu.open = false; });
      requestAnimationFrame(() => document.body.classList.remove("is-language-switching"));
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
      prompt.textContent = t("language.prompt", {}, language);
      prompt.lang = language;
      prompt.classList.remove("is-changing");
    }, 185);
  };

  prompt.textContent = t("language.prompt", {}, currentLanguage);
  prompt.lang = currentLanguage;
  if (!reducedMotion) timer = window.setInterval(nextPrompt, 1225);

  window.addEventListener("pagehide", () => {
    if (timer) clearInterval(timer);
    observer.disconnect();
  }, { once: true });
}

export function initI18n() {
  currentLanguage = getStoredLanguage();
  setLanguage(currentLanguage, { persist: false, announce: false });
  initMenus();
  initCyclingPrompt();
  window.__kwiinSetLanguage = (language) => setLanguage(language);
  window.__kwiinLanguage = currentLanguage;
}
