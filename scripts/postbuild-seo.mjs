import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { languages, services, travelZones } from "../src/data/site.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const siteUrl = "https://kwiin.ch";
const buildDate = "2026-08-14";

const pages = [
  { key: "home", file: "index.html", route: "/", nameKey: "common.tagline" },
  { key: "mobile", file: "mobile-spa/index.html", route: "/mobile-spa/", nameKey: "nav.mobile" },
  { key: "services", file: "services/index.html", route: "/services/", nameKey: "nav.services" },
  { key: "about", file: "about/index.html", route: "/about/", nameKey: "nav.about" },
  { key: "contact", file: "contact/index.html", route: "/contact/", nameKey: "nav.contact" },
];

const hreflang = {
  de: "de-CH",
  en: "en",
  th: "th",
  fr: "fr",
  es: "es",
  it: "it",
  ru: "ru",
  pt: "pt",
};

const ogLocale = {
  de: "de_CH",
  en: "en_GB",
  th: "th_TH",
  fr: "fr_CH",
  es: "es_ES",
  it: "it_CH",
  ru: "ru_RU",
  pt: "pt_PT",
};

const packs = Object.fromEntries(await Promise.all(languages.map(async ({ code }) => {
  const raw = await readFile(resolve(root, `src/data/locales/${code}.json`), "utf8");
  return [code, JSON.parse(raw)];
})));

const originals = Object.fromEntries(await Promise.all(pages.map(async (page) => [
  page.key,
  await readFile(resolve(dist, page.file), "utf8"),
])));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

function escapeXml(value) {
  return escapeAttribute(value).replaceAll("'", "&apos;");
}

function interpolate(value, params = {}) {
  return Object.entries(params).reduce(
    (result, [name, replacement]) => result.replaceAll(`{${name}}`, String(replacement)),
    String(value),
  );
}

function paramsFromTag(tag) {
  const match = tag.match(/data-i18n-params=(['"])(.*?)\1/i);
  if (!match) return {};
  try {
    return JSON.parse(match[2].replaceAll("&quot;", '"'));
  } catch {
    return {};
  }
}

function translate(pack, key, params = {}) {
  return interpolate(pack[key] ?? packs.de[key] ?? key, params);
}

function setAttribute(tag, name, value) {
  const pattern = new RegExp(`\\s${name}=(['"])[\\s\\S]*?\\1`, "i");
  const replacement = ` ${name}="${escapeAttribute(value)}"`;
  if (pattern.test(tag)) return tag.replace(pattern, replacement);
  return tag.replace(/\s*(\/?)>$/, `${replacement}$1>`);
}

function replaceMarkerText(html, marker, value, language) {
  const pattern = new RegExp(`(<([a-z][a-z0-9-]*)\\b[^>]*\\b${marker}(?=\\s|=|>)(?:=(?:['"][^'"]*['"]|[^\\s>]+))?[^>]*>)([^<]*)(<\\/\\2>)`, "gi");
  return html.replace(pattern, (full, open, tagName, inner, close) => {
    const localizedOpen = marker === "data-current-language-name" ? setAttribute(open, "lang", language) : open;
    return `${localizedOpen}${escapeHtml(value)}${close}`;
  });
}

function localizeText(html, pack) {
  const textPattern = /(<([a-z][a-z0-9-]*)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/gi;
  let localized = html.replace(textPattern, (full, open, tagName, key, inner, close) => (
    `${open}${escapeHtml(translate(pack, key, paramsFromTag(open)))}${close}`
  ));

  const attributeMappings = [
    ["data-i18n-aria-label", "aria-label"],
    ["data-i18n-alt", "alt"],
    ["data-i18n-title", "title"],
  ];

  localized = localized.replace(/<[^!][^>]*>/g, (tag) => {
    let result = tag;
    attributeMappings.forEach(([marker, attribute]) => {
      const match = result.match(new RegExp(`${marker}="([^"]+)"`, "i"));
      if (match) result = setAttribute(result, attribute, translate(pack, match[1], paramsFromTag(result)));
    });
    return result;
  });

  return localized;
}

function languageRoute(code, route) {
  return code === "de" ? route : `/${code}${route}`;
}

function absoluteUrl(code, route) {
  return `${siteUrl}${languageRoute(code, route)}`;
}

function pathWithSuffix(path, suffix) {
  return `${path}${suffix ?? ""}`;
}

function localizeInternalHref(href, code) {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const suffixIndex = href.search(/[?#]/);
  const path = suffixIndex === -1 ? href : href.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : href.slice(suffixIndex);
  const page = pages.find((candidate) => candidate.route === path);
  return page ? pathWithSuffix(languageRoute(code, page.route), suffix) : href;
}

function localizeLinks(html, code, currentPage) {
  return html.replace(/<a\b[^>]*>/gi, (tag) => {
    const hrefMatch = tag.match(/\shref=(['"])(.*?)\1/i);
    if (!hrefMatch) return tag;
    const targetLanguage = tag.match(/\bdata-language="([^"]+)"/i)?.[1];
    const href = targetLanguage
      ? languageRoute(targetLanguage, currentPage.route)
      : localizeInternalHref(hrefMatch[2], code);
    let result = setAttribute(tag, "href", href);
    if (targetLanguage) result = setAttribute(result, "aria-selected", String(targetLanguage === code));
    return result;
  });
}

function setMeta(html, selectorAttribute, selectorValue, content) {
  const selector = new RegExp(`<meta\\b[^>]*\\b${selectorAttribute}="${selectorValue.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}"[^>]*>`, "i");
  if (selector.test(html)) return html.replace(selector, (tag) => setAttribute(tag, "content", content));
  return html.replace("</head>", `    <meta ${selectorAttribute}="${escapeAttribute(selectorValue)}" content="${escapeAttribute(content)}">\n  </head>`);
}

function pageLabel(page, pack) {
  return page.key === "home" ? "KWIIN Mobile Spa" : translate(pack, page.nameKey);
}

function serviceArea(pack) {
  return {
    "@type": "AdministrativeArea",
    name: translate(pack, "mobile.rangeShort"),
  };
}

function allOffers(service) {
  return service.durations.flatMap(({ minutes, price }) => travelZones.map(({ distance, fee }) => ({
    "@type": "Offer",
    name: `${service.title}${service.subtitle ? ` ${service.subtitle}` : ""}, ${minutes} min, up to ${distance} km`,
    price: String(price + fee),
    priceCurrency: "CHF",
    availability: "https://schema.org/InStock",
    url: `${siteUrl}/services/`,
  })));
}

function structuredData(page, code, pack) {
  const canonical = absoluteUrl(code, page.route);
  const home = absoluteUrl(code, "/");
  const organizationId = `${siteUrl}/#organization`;
  const personId = `${siteUrl}/about/#pratana-halstrick`;
  const websiteId = `${siteUrl}/#website`;
  const pageId = `${canonical}#webpage`;
  const graph = [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "KWIIN Mobile Spa by Pratana Halstrick",
      alternateName: "KWIIN",
      url: siteUrl,
      logo: `${siteUrl}/favicon.svg`,
      image: `${siteUrl}/assets/og-kwiin.jpg`,
      description: translate(pack, "footer.description"),
      email: "health@kwiin.ch",
      telephone: "+41779669928",
      priceRange: "CHF 130 to CHF 395",
      areaServed: serviceArea(pack),
      founder: { "@id": personId },
      sameAs: ["https://www.instagram.com/kwiinspa/"],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+41779669928",
        contactType: "reservations",
        availableLanguage: languages.map(({ name }) => name),
      },
    },
    {
      "@type": "Person",
      "@id": personId,
      name: "Pratana Halstrick",
      url: absoluteUrl(code, "/about/"),
      image: `${siteUrl}/assets/pratana-portrait-1200.webp`,
      jobTitle: "Mobile Thai massage therapist",
      description: translate(pack, "about.founderCopyTwo"),
      award: translate(pack, "about.awardsTitle"),
      worksFor: { "@id": organizationId },
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: home,
      name: "KWIIN Mobile Spa",
      description: translate(pack, "meta.home.description"),
      inLanguage: code,
      publisher: { "@id": organizationId },
    },
    {
      "@type": "WebPage",
      "@id": pageId,
      url: canonical,
      name: translate(pack, `meta.${page.key}.title`),
      description: translate(pack, `meta.${page.key}.description`),
      inLanguage: code,
      isPartOf: { "@id": websiteId },
      about: { "@id": organizationId },
      dateModified: buildDate,
    },
  ];

  if (page.key !== "home") {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "KWIIN", item: home },
        { "@type": "ListItem", position: 2, name: pageLabel(page, pack), item: canonical },
      ],
    });
  }

  if (page.key === "home" || page.key === "mobile") {
    graph.push({
      "@type": "Service",
      "@id": `${absoluteUrl(code, "/mobile-spa/")}#mobile-massage`,
      name: "KWIIN Mobile Spa",
      serviceType: pageLabel(pages.find(({ key }) => key === "mobile"), pack),
      description: translate(pack, "mobile.heroCopy"),
      provider: { "@id": organizationId },
      areaServed: serviceArea(pack),
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "130",
        highPrice: "395",
        priceCurrency: "CHF",
        offerCount: "36",
        url: absoluteUrl(code, "/services/"),
      },
    });
  }

  if (page.key === "mobile") {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonical}#faq`,
      mainEntity: [1, 2, 3, 4, 5].map((number) => ({
        "@type": "Question",
        name: translate(pack, `mobile.faqQ${number}`),
        acceptedAnswer: {
          "@type": "Answer",
          text: translate(pack, `mobile.faqA${number}`),
        },
      })),
    });
  }

  if (page.key === "services") {
    graph.push({
      "@type": "ItemList",
      "@id": `${canonical}#treatments`,
      name: translate(pack, "meta.services.title"),
      numberOfItems: services.length,
      itemListElement: services.map((service, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Service",
          name: `${service.title}${service.subtitle ? ` ${service.subtitle}` : ""}`,
          description: translate(pack, service.descriptionKey),
          provider: { "@id": organizationId },
          areaServed: serviceArea(pack),
          offers: allOffers(service),
        },
      })),
    });
  }

  if (page.key === "about") {
    graph[3]["@type"] = "ProfilePage";
    graph[3].mainEntity = { "@id": personId };
  }

  if (page.key === "contact") {
    graph[3]["@type"] = "ContactPage";
    graph[3].mainEntity = { "@id": organizationId };
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

function alternateMarkup(page) {
  const links = languages.map(({ code }) => (
    `<link rel="alternate" hreflang="${hreflang[code]}" href="${absoluteUrl(code, page.route)}">`
  ));
  links.push(`<link rel="alternate" hreflang="x-default" href="${absoluteUrl("de", page.route)}">`);
  return links.map((link) => `    ${link}`).join("\n");
}

function localizeDocument(source, page, code) {
  const pack = packs[code];
  const language = languages.find((item) => item.code === code);
  const canonical = absoluteUrl(code, page.route);
  const title = translate(pack, `meta.${page.key}.title`);
  const description = translate(pack, `meta.${page.key}.description`);
  let html = source;

  html = html.replace(/<html\b[^>]*>/i, (tag) => setAttribute(setAttribute(tag, "lang", code), "data-static-language", code));
  html = localizeText(html, pack);
  html = replaceMarkerText(html, "data-language-prompt", translate(pack, "language.prompt"), code);
  html = replaceMarkerText(html, "data-current-language-name", language.name, code);
  html = replaceMarkerText(html, "data-current-language", language.short, code);
  html = localizeLinks(html, code, page);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = setMeta(html, "name", "description", description);
  html = setMeta(html, "property", "og:title", title);
  html = setMeta(html, "property", "og:description", description);
  html = setMeta(html, "property", "og:url", canonical);
  html = setMeta(html, "property", "og:locale", ogLocale[code]);
  html = setMeta(html, "name", "twitter:title", title);
  html = setMeta(html, "name", "twitter:description", description);
  html = setMeta(html, "name", "geo.region", "CH-ZH");
  html = setMeta(html, "name", "geo.placename", "Zürich");
  html = html.replace(/<link\b[^>]*\brel="canonical"[^>]*>/i, (tag) => setAttribute(tag, "href", canonical));
  html = html.replace(/\s*<link\b[^>]*\brel="alternate"[^>]*>\s*/gi, "\n");
  html = html.replace("</head>", `${alternateMarkup(page)}\n  </head>`);

  const schema = JSON.stringify(structuredData(page, code, pack)).replaceAll("<", "\\u003c");
  html = html.replace(
    /<script\s+id="kwiin-structured-data"[^>]*>[\s\S]*?<\/script>/i,
    `<script id="kwiin-structured-data" type="application/ld+json">${schema}</script>`,
  );

  return html;
}

for (const page of pages) {
  for (const { code } of languages) {
    const output = code === "de" ? page.file : `${code}/${page.file}`;
    const target = resolve(dist, output);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, localizeDocument(originals[page.key], page, code), "utf8");
  }
}

const sitemapEntries = pages.flatMap((page) => languages.map(({ code }) => {
  const alternates = languages.map(({ code: alternate }) => (
    `    <xhtml:link rel="alternate" hreflang="${hreflang[alternate]}" href="${escapeXml(absoluteUrl(alternate, page.route))}" />`
  ));
  alternates.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(absoluteUrl("de", page.route))}" />`);
  return [
    "  <url>",
    `    <loc>${escapeXml(absoluteUrl(code, page.route))}</loc>`,
    `    <lastmod>${buildDate}</lastmod>`,
    ...alternates,
    "  </url>",
  ].join("\n");
}));

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...sitemapEntries,
  "</urlset>",
  "",
].join("\n");

await writeFile(resolve(dist, "sitemap.xml"), sitemap, "utf8");
