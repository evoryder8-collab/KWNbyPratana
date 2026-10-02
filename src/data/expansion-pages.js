import de from "./locales/de.json" with { type: "json" };
const text = (key, tag = "p", className = "") => `<${tag}${className ? ` class="${className}"` : ""} data-i18n="${key}">${de[key]}</${tag}>`;
const arrow = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15M14 6l6 6-6 6"/></svg>`;
const cta = (page) => `<a class="button button--gold" href="https://wa.me/41779669928?text=${encodeURIComponent(de[`${page}.message`])}" data-enquiry="${page}.message">${text(`${page}.cta`, "span")}${arrow}</a>`;

export function renderOfficeOffer() {
  return `<details class="office-offer" id="office-offer">
    <summary>${text("office.open", "span")}${arrow}</summary>
    <div class="office-offer__body">${text("office.title", "h3")}${text("office.copy")}${text("office.prepare")}${cta("office")}</div>
  </details>`;
}

export function renderExpansionCards() {
  return `<section class="expansion section" aria-labelledby="expansion-title"><div class="shell">
    <header class="section-heading section-heading--center" data-reveal>${text("expansion.eyebrow", "p", "eyebrow")}<h2 id="expansion-title" data-i18n="expansion.title">${de["expansion.title"]}</h2></header>
    <div class="expansion-grid">${["international", "courses", "shop"].map((page, index) => `<a class="expansion-card" href="/${page}/" data-reveal>
      <span class="expansion-card__number">0${index + 4}</span>${text(`nav.${page}`, "h3")}
      ${page !== "international" ? text("expansion.planned", "span", "status-label") : ""}
      ${text(`${page}.intro`)}<span class="expansion-card__link">${text("expansion.details", "span")}${arrow}</span>
    </a>`).join("")}</div>
  </div></section>`;
}

function article(title, description, index) {
  return `<article class="offering-panel" data-reveal><span class="offering-panel__number">0${index}</span>${text(title, "h2")}${text(description)}</article>`;
}

export function renderExpansionPage(page) {
  const planned = ["courses", "shop"].includes(page);
  let body = "";
  if (page === "international") {
    body = `<div class="offering-grid">${article("international.travelTitle", "international.travelCopy", 1)}
      <article class="offering-panel" data-reveal><span class="offering-panel__number">02</span>${text("international.coachingTitle", "h2")}${text("international.coachingCopy")}
      <ul class="offering-list">${[1,2,3,4,5].map(n => text(`international.topic${n}`, "li")).join("")}</ul></article></div>`;
  } else if (page === "courses") {
    body = `<section class="offering-panel offering-panel--wide" data-reveal>${text("courses.topicsTitle", "h2")}<ol class="course-list">${[1,2,3,4].map(n => `<li><span>0${n}</span>${text(`courses.topic${n}`, "p")}</li>`).join("")}</ol></section>`;
  } else if (page === "shop") {
    body = `<div class="shop-preview">${[1,2,3,4,5,6,7].map(n => `<article class="shop-category" data-reveal><span>0${n}</span>${text(`shop.topic${n}`, "h2")}${text("expansion.planned", "p", "status-label")}</article>`).join("")}</div>`;
  } else {
    body = `<div class="offering-grid">${article("terms.bookingTitle", "terms.bookingCopy", 1)}${article("terms.contractTitle", "terms.contractCopy", 2)}</div>`;
  }
  return `<section class="offering-hero section" aria-labelledby="offering-title"><div class="shell shell--narrow">
    ${text(`nav.${page}`, "p", "eyebrow")}
    <h1 id="offering-title" data-i18n="${page}.title">${de[`${page}.title`]}</h1>
    ${planned ? text("expansion.planned", "span", "status-label") : ""}
    ${text(`${page}.intro`, "p", "offering-hero__intro")}
    <div class="offering-hero__line" aria-hidden="true"><span></span><i></i><span></span></div>
  </div></section>
  <section class="offering-content section"><div class="shell">${body}
    <aside class="offering-enquiry" data-reveal>${text(`${page}.note`)}${cta(page)}</aside>
  </div></section>`;
}
