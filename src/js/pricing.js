import { bookingTemplates, services, travelZones, WHATSAPP_NUMBER } from "../data/site.js";
import { getLanguage, t } from "./i18n.js";
import { animateNumber } from "./numerals.js";

const state = {
  mode: "studio",
  distance: travelZones[0].distance,
};

function template(value, params) {
  return Object.entries(params).reduce(
    (result, [key, replacement]) => result.replaceAll(`{${key}}`, String(replacement)),
    value,
  );
}

function zoneFor(distance = state.distance) {
  return travelZones.find((zone) => zone.distance === Number(distance)) ?? travelZones[0];
}

/**
 * Adopt whatever the browser has actually put in the zone <select>.
 *
 * Browsers restore form control values on history navigation, and they do it
 * *after* our module has initialised. Without this, a visitor returning via the
 * back button sees "30 km" selected while the price, the breakdown and the
 * prefilled WhatsApp message all still say 15 km, so they book, and are quoted,
 * the wrong travel zone. The DOM is the source of truth for restored state.
 */
function adoptRestoredZone() {
  const select = document.querySelector("[data-zone-select]");
  if (!select) return false;
  const restored = Number(select.value);
  if (!Number.isFinite(restored) || restored === state.distance) return false;
  if (!travelZones.some((zone) => zone.distance === restored)) return false;
  state.distance = restored;
  return true;
}

function whatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function bookingMessage(kind, serviceName, zone = zoneFor()) {
  const language = getLanguage();
  const localized = bookingTemplates[language] ?? bookingTemplates.de;
  return template(localized[kind], {
    service: serviceName,
    distance: zone.distance,
    fee: zone.fee,
  });
}

/**
 * The amount lifts very slightly as it rolls, so the change registers
 * peripherally even if the visitor is looking at the radius control rather
 * than at the number itself.
 */
function liftAmount(element) {
  if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  element.animate(
    [
      { transform: "translateY(-3px)", filter: "brightness(1.14)" },
      { transform: "translateY(0)", filter: "brightness(1)" },
    ],
    { duration: 620, easing: "cubic-bezier(.16,1,.3,1)" },
  );
}

function updateCard(card, mode, zone) {
  const context = card.dataset.priceContext;
  const effectiveMode = context === "studio" ? "studio" : context === "mobile" ? "mobile" : mode;
  const service = services.find(({ id }) => id === card.dataset.serviceId);
  if (!service) return;

  card.querySelectorAll("[data-price-mode]").forEach((button) => {
    const active = button.dataset.priceMode === effectiveMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  const travelPanel = card.querySelector("[data-travel-zone]");
  if (travelPanel) {
    const visible = effectiveMode === "mobile";
    travelPanel.hidden = !visible;
    travelPanel.classList.toggle("is-visible", visible);
  }

  card.querySelectorAll("[data-zone-select]").forEach((select) => {
    select.value = String(zone.distance);
  });

  card.querySelectorAll("[data-price-row]").forEach((row) => {
    const minutes = Number(row.dataset.minutes);
    const basePrice = Number(row.dataset.basePrice);
    const price = effectiveMode === "mobile" ? basePrice + zone.fee : basePrice;
    const priceElement = row.querySelector("[data-price-value]");
    const durationElement = row.querySelector("[data-duration-label]");
    const breakdown = row.querySelector("[data-price-breakdown]");
    if (durationElement) durationElement.textContent = t("pricing.duration", { minutes });
    if (priceElement && priceElement.textContent !== String(price)) {
      // Roll from the old amount to the new one so the visitor sees what
      // their radius choice actually costs.
      animateNumber(priceElement, price, { duration: 780 });
      liftAmount(priceElement.closest(".price-list__amount"));
    }
    if (breakdown) {
      breakdown.textContent = effectiveMode === "mobile"
        ? t("pricing.breakdown", { fee: zone.fee, distance: zone.distance })
        : "";
    }
    row.setAttribute(
      "aria-label",
      effectiveMode === "mobile"
        ? t("pricing.rowMobile", { minutes, price, fee: zone.fee, distance: zone.distance })
        : t("pricing.rowStudio", { minutes, price }),
    );
  });

  const bookLink = card.querySelector("[data-service-book]");
  const bookLabel = card.querySelector("[data-service-book-label]");
  if (bookLink && bookLabel) {
    // Include the subtitle so the message names the treatment exactly as the
    // card does. "Booster Muscles" and "Booster Muscles Sport" are the same
    // product, but only the second one is unambiguous in an inbox.
    const serviceName = [service.title, service.subtitle].filter(Boolean).join(" ");
    if (effectiveMode === "mobile") {
      bookLabel.textContent = t("pricing.ctaMobile", { distance: zone.distance });
      bookLink.href = whatsappUrl(bookingMessage("mobile", serviceName, zone));
    } else {
      bookLabel.textContent = t("pricing.ctaStudio");
      bookLink.href = whatsappUrl(bookingMessage("studio", serviceName, zone));
    }
  }
}

function updateAll() {
  const zone = zoneFor();
  document.querySelectorAll("[data-service-card]").forEach((card) => updateCard(card, state.mode, zone));
}

function updateGenericLinks() {
  const language = getLanguage();
  const localized = bookingTemplates[language] ?? bookingTemplates.de;
  document.querySelectorAll("[data-whatsapp]").forEach((link) => {
    const kind = link.dataset.whatsapp;
    if (localized[kind]) link.href = whatsappUrl(localized[kind]);
  });
}

export function initPricing() {
  const mobileOnly = document.querySelector('[data-price-context="mobile"]');
  state.mode = mobileOnly ? "mobile" : "studio";

  document.addEventListener("click", (event) => {
    const modeButton = event.target.closest("[data-price-mode]");
    if (!modeButton) return;
    state.mode = modeButton.dataset.priceMode;
    updateAll();
  });

  document.addEventListener("change", (event) => {
    const select = event.target.closest("[data-zone-select]");
    if (!select) return;
    state.distance = Number(select.value);
    document.querySelectorAll("[data-zone-select]").forEach((other) => { other.value = select.value; });
    updateAll();
  });

  window.addEventListener("kwiin:language-change", () => {
    updateAll();
    updateGenericLinks();
  });

  // History restores <select> values after this module initialises, so adopt
  // the restored value on the next frame and again on every bfcache restore.
  requestAnimationFrame(() => {
    if (adoptRestoredZone()) updateAll();
  });

  window.addEventListener("pageshow", () => {
    if (adoptRestoredZone()) updateAll();
  });

  updateAll();
  updateGenericLinks();
}
