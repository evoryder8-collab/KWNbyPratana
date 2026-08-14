import { defineConfig } from "vite";
import { resolve } from "node:path";
import { languages, navItems, services } from "./src/data/site.js";

const base = "/";

const lotus = (className = "lotus-mark") => `
  <svg class="${className}" viewBox="0 0 72 52" fill="none" aria-hidden="true">
    <path d="M36 43C24 37 18 27 18 15c8 3 14 9 18 18 4-9 10-15 18-18 0 12-6 22-18 28Z"/>
    <path d="M36 41C30 28 30 16 36 5c6 11 6 23 0 36Z"/>
    <path d="M35 43C21 44 11 39 5 29c10-1 19 2 27 11M37 43c14 1 24-4 30-14-10-1-19 2-27 11M19 47c10 3 24 3 34 0"/>
  </svg>`;

const arrow = `
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 12h15M14 6l6 6-6 6"/>
  </svg>`;

function renderLanguageOptions(className = "language-menu__options") {
  return `<div class="${className}" role="listbox" data-language-options>
    ${languages.map((language) => `
      <a class="language-option" href="/" role="option" data-language="${language.code}" aria-selected="${language.code === "de"}">
        <span>${language.name}</span><span>${language.short}</span>
      </a>`).join("")}
  </div>`;
}

function renderHeader() {
  return `
    <a class="skip-link" href="#main" data-i18n="common.skip">Zum Inhalt springen</a>
    <header class="site-header" data-site-header>
      <div class="site-header__inner">
        <a class="brand" href="${base}">
          ${lotus("brand__lotus")}
          <span class="brand__word">KWIIN</span>
          <span class="brand__byline">by Pratana</span>
        </a>
        <nav class="desktop-nav" aria-label="Hauptnavigation" data-i18n-aria-label="nav.aria">
          ${navItems.map((item) => `<a href="${base}${item.href}" data-nav-link data-i18n="${item.key}">${item.label}</a>`).join("")}
        </nav>
        <div class="site-header__actions">
          <details class="language-menu language-menu--compact" data-language-menu>
            <summary>
              <span class="sr-only" data-i18n="language.selectAria">Sprache auswählen</span>
              <span data-current-language>DE</span>
              <svg viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="m1 1 5 5 5-5"/></svg>
            </summary>
            <div class="language-menu__popover">
              <p data-i18n="language.available">Verfügbare Sprachen</p>
              ${renderLanguageOptions()}
            </div>
          </details>
          <a class="header-book" href="https://wa.me/41779669928" data-whatsapp="mobileGeneric">
            <span data-i18n="nav.book">Termin via WhatsApp</span>${arrow}
          </a>
          <button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobile-navigation" aria-label="Menü öffnen" data-i18n-aria-label="nav.menuOpen">
            <span></span><span></span>
          </button>
        </div>
      </div>
    </header>
    <div class="mobile-navigation" id="mobile-navigation" data-mobile-navigation aria-hidden="true" inert role="dialog" aria-modal="true" aria-label="Mobile Navigation" data-i18n-aria-label="nav.menuDialog">
      <div class="mobile-navigation__wash" aria-hidden="true"></div>
      <nav aria-label="Hauptnavigation" data-i18n-aria-label="nav.aria">
        ${navItems.map((item, index) => `<a href="${base}${item.href}" data-nav-link><span>0${index + 1}</span><strong data-i18n="${item.key}">${item.label}</strong>${arrow}</a>`).join("")}
      </nav>
      <div class="mobile-navigation__footer">
        <a href="https://wa.me/41779669928" class="button button--gold" data-whatsapp="mobileGeneric"><span data-i18n="nav.book">Termin via WhatsApp</span>${arrow}</a>
        <p data-i18n="common.tagline">Zurück zu sich.</p>
      </div>
    </div>`;
}

function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="site-footer__halo" aria-hidden="true"></div>
      <div class="shell site-footer__grid">
        <div class="site-footer__brand">
          <a class="brand brand--footer" href="${base}">${lotus("brand__lotus")}<span class="brand__word">KWIIN</span></a>
          <p data-i18n="footer.description">Preisgekrönte Thai Massage als persönlicher Mobile Spa Service bei Ihnen zuhause, im Hotel oder im Büro in der Region Zürich.</p>
          <span class="site-footer__signature" data-i18n="common.tagline">Zurück zu sich.</span>
        </div>
        <div>
          <h2 data-i18n="footer.explore">Entdecken</h2>
          <nav>
            ${navItems.map((item) => `<a href="${base}${item.href}" data-i18n="${item.key}">${item.label}</a>`).join("")}
          </nav>
        </div>
        <div>
          <h2 data-i18n="footer.contact">Kontakt</h2>
          <a href="https://wa.me/41779669928" data-whatsapp="mobileGeneric">+41 77 966 99 28</a>
          <p><span data-i18n="footer.general">Allgemeiner Kontakt:</span><br>+41 76 728 21 22</p>
          <a href="mailto:health@kwiin.ch">health@kwiin.ch</a>
          <a href="https://www.instagram.com/kwiinspa/" target="_blank" rel="noopener noreferrer">Instagram&nbsp; @kwiinspa</a>
        </div>
      </div>
      <div class="shell site-footer__legal">
        <p>© <span data-year>2026</span> Barbu Media Switzerland. <span data-i18n="common.rights">Alle Rechte vorbehalten.</span></p>
        <p data-i18n="common.brandLine">Danke, dass Sie sich Zeit für Ihre Gesundheit nehmen.</p>
      </div>
    </footer>`;
}

function renderHeroLanguageSelector() {
  return `
    <div class="hero-language" data-language-prompt-wrap>
      <span class="hero-language__prompt" data-language-prompt>Wählen Sie Ihre Sprache</span>
      <details class="language-menu language-menu--hero" data-language-menu>
        <summary>
          <span class="sr-only" data-i18n="language.selectAria">Sprache auswählen</span>
          <svg class="language-menu__globe" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.5 3.7 5.5 3.7 9S14.4 18.5 12 21c-2.4-2.5-3.7-5.5-3.7-9S9.6 5.5 12 3Z"/></svg>
          <span data-current-language-name>Deutsch</span>
          <span data-current-language>DE</span>
          <svg class="language-menu__chevron" viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="m1 1 5 5 5-5"/></svg>
        </summary>
        <div class="language-menu__popover">
          <p data-i18n="language.available">Verfügbare Sprachen</p>
          ${renderLanguageOptions()}
        </div>
      </details>
    </div>`;
}

function renderTravelZone() {
  return `
    <div class="travel-zone travel-zone--global is-visible" data-travel-zone>
      <label>
        <span class="travel-zone__icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 22s7-6.1 7-13a7 7 0 1 0-14 0c0 6.9 7 13 7 13Z"/><circle cx="12" cy="9" r="2.5"/></svg></span>
        <span><strong data-i18n="pricing.zoneTitle">Anfahrtszone wählen</strong><small data-i18n="pricing.zoneCopy">Die Anfahrt ist direkt im Gesamtpreis enthalten</small></span>
      </label>
      <select data-zone-select aria-label="Anfahrtszone für Mobile Spa" data-i18n-aria-label="pricing.zoneAria">
        <option value="15" data-i18n="pricing.zone15">Bis 15 km · plus CHF 45</option>
        <option value="30" data-i18n="pricing.zone30">Bis 30 km · plus CHF 100</option>
      </select>
      <p class="travel-zone__hint" data-i18n="pricing.hint">Die Auswahl gilt für alle Behandlungen auf dieser Seite.</p>
    </div>`;
}

function renderServiceCard(service, index) {
  return `
    <article class="treatment-card${service.knownFor ? " treatment-card--signature" : ""}" data-service-card data-reactive data-service-id="${service.id}" data-price-context="mobile" data-reveal>
      <div class="treatment-card__atmosphere" aria-hidden="true"><span></span><span></span></div>
      ${service.knownFor ? `<span class="treatment-card__ribbon" data-i18n="pricing.signature">Signature</span>` : ""}
      <header class="treatment-card__header">
        <span class="treatment-card__number">${String(index + 1).padStart(2, "0")}</span>
        <div>
          <p class="eyebrow eyebrow--bare" data-i18n="${service.categoryKey}">${service.category}</p>
          <h2>${service.title}${service.subtitle ? ` <em>${service.subtitle}</em>` : ""}</h2>
        </div>
        ${lotus("treatment-card__lotus")}
      </header>
      <div class="treatment-card__body">
        <div class="treatment-card__story">
          <p class="treatment-card__tagline" data-i18n="${service.taglineKey}">${service.tagline}</p>
          <p class="treatment-card__copy" data-i18n="${service.descriptionKey}">${service.description}</p>
          <span class="treatment-card__edition">KWIIN · LOTUS FLOW · ${String(index + 1).padStart(2, "0")}</span>
        </div>
        <div class="treatment-card__commerce">
          <ol class="price-list" aria-label="Preise" data-i18n-aria-label="pricing.listAria">
            ${service.durations.map(({ minutes, price }) => {
              const shown = price + 45;
              return `<li data-price-row data-minutes="${minutes}" data-base-price="${price}">
                <span class="price-list__duration" data-duration-label>${minutes} Min.</span>
                <span class="price-list__rule" aria-hidden="true"></span>
                <span class="price-list__amount"><small>CHF</small> <strong data-price-value>${shown}</strong></span>
                <span class="price-list__breakdown" data-price-breakdown>(plus CHF 45 Anfahrt · bis 15 km)</span>
              </li>`;
            }).join("")}
          </ol>
          <a class="button button--outline treatment-card__book" href="https://wa.me/41779669928" data-service-book>
            <span data-service-book-label data-i18n="pricing.ctaMobile" data-i18n-params='{"distance":15}'>Mobil bis 15 km anfragen</span>
            ${arrow}
          </a>
        </div>
      </div>
    </article>`;
}

function renderServices() {
  return `<div class="treatment-grid treatment-grid--mobile" data-treatment-grid data-global-price-mode="mobile" data-global-zone="15">
    ${renderTravelZone()}
    ${services.map((service, index) => renderServiceCard(service, index)).join("")}
  </div>`;
}

const htmlPartials = {
  name: "kwiin-html-partials",
  transformIndexHtml(html) {
    return html
      .replace("<!-- KWIIN_HEADER -->", renderHeader())
      .replace("<!-- KWIIN_FOOTER -->", renderFooter())
      .replaceAll("<!-- KWIIN_LANGUAGE_SELECTOR -->", renderHeroLanguageSelector())
      .replaceAll("<!-- KWIIN_SERVICES:all -->", renderServices())
      .replaceAll("<!-- KWIIN_SERVICES:mobile -->", renderServices());
  },
};

export default defineConfig({
  base,
  plugins: [htmlPartials],
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        studio: resolve(import.meta.dirname, "studio/index.html"),
        mobile: resolve(import.meta.dirname, "mobile-spa/index.html"),
        services: resolve(import.meta.dirname, "services/index.html"),
        about: resolve(import.meta.dirname, "about/index.html"),
        contact: resolve(import.meta.dirname, "contact/index.html"),
      },
    },
  },
});
