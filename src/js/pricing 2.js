import { bookingTemplates, services, travelZones, WHATSAPP_NUMBER } from "../data/site.js";
import { getLanguage, t } from "./i18n.js";

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

function animatePrice(element) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  element.animate(
    [
      { opacity: 0.25, transform: "translateY(-5px) scale(0.98)" },
      { opacity: 1, transform: "translateY(0) scale(1)" },
    ],
    { duration: 380, easing: "cubic-bezier(.22,1,.36,1)" },
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
      priceElement.textContent = String(price);
      animatePrice(priceElement.closest(".price-list__amount"));
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
    if (effectiveMode === "mobile") {
      bookLabel.textContent = t("pricing.ctaMobile", { distance: zone.distance });
      bookLink.href = whatsappUrl(bookingMessage("mobile", service.title, zone));
    } else {
      bookLabel.textContent = t("pricing.ctaStudio");
      bookLink.href = whatsappUrl(bookingMessage("studio", service.title, zone));
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

  updateAll();
  updateGenericLinks();
}
