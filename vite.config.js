import { defineConfig } from "vite";
import { resolve } from "node:path";
import { languages, navItems, services } from "./src/data/site.js";

const base = "/KWNbyPratana/";

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

const studioIcon = `
  <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M5 27h22M7 27V9h18v18M7 14h18M11 9V5h10v4M11 27v-8h6v8M21 18h1"/>
  </svg>`;

const mobileIcon = `
  <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M5 27V13l11-8 11 8v14M3 27h26M11 27v-9h10v9"/>
    <path d="M2 9h7M4 5h8" class="motion-lines"/>
  </svg>`;

function renderLanguageOptions(className = "language-menu__options") {
  return `<div class="${className}" role="listbox" data-language-options>
    ${languages.map((language) => `
      <button class="language-option" type="button" role="option" data-language="${language.code}" aria-selected="${language.code === "de"}">
        <span>${language.name}</span><span>${language.short}</span>
      </button>`).join("")}
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
          <a class="header-book" href="https://wa.me/41779669928" data-whatsapp="studioGeneric">
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
        <a href="https://wa.me/41779669928" class="button button--gold" data-whatsapp="studioGeneric"><span data-i18n="nav.book">Termin via WhatsApp</span>${arrow}</a>
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
          <p data-i18n="footer.description">Traditionelle Thai Massage mit persönlicher Betreuung. Im Studio in Dübendorf und bei Ihnen in der Region Zürich.</p>
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
          <a href="https://wa.me/41779669928" data-whatsapp="studioGeneric">+41 77 966 99 28</a>
          <p><span data-i18n="footer.general">Allgemeiner Kontakt:</span><br>+41 76 728 21 22</p>
          <a href="https://www.instagram.com/kwiinspa/" target="_blank" rel="noopener noreferrer">Instagram&nbsp; @kwiinspa</a>
        </div>
      </div>
      <div class="shell site-footer__partner">
        <p data-i18n="common.partnerFooter">Studio Termine finden derzeit in einer offiziellen Partnerlocation in Dübendorf statt: Suriya Spa.</p>
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

function renderModeSwitch(context) {
  if (context === "studio") return "";
  if (context === "mobile") return `
    <div class="travel-zone is-visible" data-travel-zone>
      <label>
        <span class="travel-zone__icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 22s7-6.1 7-13a7 7 0 1 0-14 0c0 6.9 7 13 7 13Z"/><circle cx="12" cy="9" r="2.5"/></svg></span>
        <span><strong data-i18n="pricing.zoneTitle">Anfahrtszone wählen</strong><small data-i18n="pricing.zoneCopy">Die Anfahrt ist direkt im Gesamtpreis enthalten</small></span>
      </label>
      <select data-zone-select aria-label="Anfahrtszone für Mobile Spa" data-i18n-aria-label="pricing.zoneAria">
        <option value="15" data-i18n="pricing.zone15">Bis 15 km · plus CHF 45</option>
        <option value="30" data-i18n="pricing.zone30">Bis 30 km · plus CHF 100</option>
      </select>
    </div>`;

  return `
    <fieldset class="price-mode" data-price-mode-group>
      <legend class="sr-only" data-i18n="pricing.legend">Preis nach Behandlungsort auswählen</legend>
      <div class="price-mode__heading"><span data-i18n="pricing.intro">Preis anzeigen für</span><span data-i18n="pricing.tap">Antippen zum Wechseln</span></div>
      <div class="price-mode__options">
        <button class="price-mode__option is-active" type="button" data-price-mode="studio" aria-pressed="true">
          <span class="price-mode__icon">${studioIcon}</span>
          <span><strong data-i18n="pricing.studio">Im Studio</strong><small data-i18n="pricing.studioPlace">Dübendorf</small></span>
          <span class="price-mode__check"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 10 3 3 7-7"/></svg></span>
        </button>
        <button class="price-mode__option" type="button" data-price-mode="mobile" aria-pressed="false">
          <span class="price-mode__icon">${mobileIcon}</span>
          <span><strong data-i18n="pricing.mobile">Mobil</strong><small data-i18n="pricing.mobilePlace">bei Ihnen · Anfahrt inklusive</small></span>
          <span class="price-mode__check"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 10 3 3 7-7"/></svg></span>
        </button>
      </div>
    </fieldset>
    <div class="travel-zone" data-travel-zone hidden>
      <label>
        <span class="travel-zone__icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 22s7-6.1 7-13a7 7 0 1 0-14 0c0 6.9 7 13 7 13Z"/><circle cx="12" cy="9" r="2.5"/></svg></span>
        <span><strong data-i18n="pricing.zoneTitle">Anfahrtszone wählen</strong><small data-i18n="pricing.zoneCopy">Die Anfahrt ist direkt im Gesamtpreis enthalten</small></span>
      </label>
      <select data-zone-select aria-label="Anfahrtszone für Mobile Spa" data-i18n-aria-label="pricing.zoneAria">
        <option value="15" data-i18n="pricing.zone15">Bis 15 km · plus CHF 45</option>
        <option value="30" data-i18n="pricing.zone30">Bis 30 km · plus CHF 100</option>
      </select>
    </div>
    <p class="price-mode__hint" data-i18n="pricing.hint">Die Auswahl gilt für alle Behandlungen auf dieser Seite.</p>`;
}

function renderServiceCard(service, context, index) {
  const mobile = context === "mobile";
  return `
    <article class="treatment-card${service.knownFor ? " treatment-card--signature" : ""}" data-service-card data-reactive data-service-id="${service.id}" data-price-context="${context}" data-reveal>
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
          ${renderModeSwitch(context)}
          <ol class="price-list" aria-label="Preise" data-i18n-aria-label="pricing.listAria">
            ${service.durations.map(({ minutes, price }) => {
              const shown = mobile ? price + 45 : price;
              return `<li data-price-row data-minutes="${minutes}" data-base-price="${price}">
                <span class="price-list__duration" data-duration-label>${minutes} Min.</span>
                <span class="price-list__rule" aria-hidden="true"></span>
                <span class="price-list__amount"><small>CHF</small> <strong data-price-value>${shown}</strong></span>
                <span class="price-list__breakdown" data-price-breakdown>${mobile ? `(plus CHF 45 Anfahrt · bis 15 km)` : ""}</span>
              </li>`;
            }).join("")}
          </ol>
          <a class="button button--outline treatment-card__book" href="https://wa.me/41779669928" data-service-book>
            <span data-service-book-label data-i18n="${mobile ? "pricing.ctaMobile" : "pricing.ctaStudio"}"${mobile ? ` data-i18n-params='{"distance":15}'` : ""}>${mobile ? "Mobil bis 15 km anfragen" : "Im Studio via WhatsApp buchen"}</span>
            ${arrow}
          </a>
        </div>
      </div>
    </article>`;
}

function renderServices(context) {
  return `<div class="treatment-grid treatment-grid--${context}" data-treatment-grid data-global-price-mode="${context === "mobile" ? "mobile" : "studio"}" data-global-zone="15">
    ${services.map((service, index) => renderServiceCard(service, context, index)).join("")}
  </div>`;
}

const htmlPartials = {
  name: "kwiin-html-partials",
  transformIndexHtml(html) {
    return html
      .replace("<!-- KWIIN_HEADER -->", renderHeader())
      .replace("<!-- KWIIN_FOOTER -->", renderFooter())
      .replaceAll("<!-- KWIIN_LANGUAGE_SELECTOR -->", renderHeroLanguageSelector())
      .replaceAll("<!-- KWIIN_SERVICES:all -->", renderServices("all"))
      .replaceAll("<!-- KWIIN_SERVICES:studio -->", renderServices("studio"))
      .replaceAll("<!-- KWIIN_SERVICES:mobile -->", renderServices("mobile"));
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
