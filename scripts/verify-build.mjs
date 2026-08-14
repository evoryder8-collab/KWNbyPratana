import { access, readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { languages } from "../src/data/site.js";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const routeFiles = ["index.html", "mobile-spa/index.html", "services/index.html", "about/index.html", "contact/index.html"];
const pageRoutes = ["/", "/mobile-spa/", "/services/", "/about/", "/contact/"];
const packs = Object.fromEntries(await Promise.all(languages.map(async ({ code }) => [
  code,
  JSON.parse(await readFile(resolve(root, `src/data/locales/${code}.json`), "utf8")),
])));

function fail(message) {
  throw new Error(message);
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function interpolate(value, params = {}) {
  return Object.entries(params).reduce(
    (result, [name, replacement]) => result.replaceAll(`{${name}}`, String(replacement)),
    String(value),
  );
}

function paramsFromAttributes(attributes) {
  const raw = attributes.match(/data-i18n-params=(?:'([^']*)'|"([^"]*)")/)?.slice(1).find(Boolean);
  if (!raw) return {};
  try {
    return JSON.parse(decodeHtml(raw));
  } catch {
    return {};
  }
}

function localizedFile(code, file) {
  return resolve(dist, code === "de" ? file : `${code}/${file}`);
}

function outputPathForHref(href) {
  const clean = href.split(/[?#]/)[0];
  if (clean === "/") return resolve(dist, "index.html");
  if (!clean.endsWith("/")) return null;
  return resolve(dist, clean.slice(1), "index.html");
}

let translatedPages = 0;
let schemaBlocks = 0;
let internalLinks = 0;

for (const { code, name, short } of languages) {
  const pack = packs[code];
  for (const file of routeFiles) {
    const output = localizedFile(code, file);
    const html = await readFile(output, "utf8");
    translatedPages += 1;

    if (!html.includes(`<html lang="${code}"`)) fail(`${output}: incorrect html language`);
    if (!html.includes(`data-static-language="${code}"`)) fail(`${output}: missing static language marker`);
    if (html.includes("data-current-language-name") && !html.includes(`data-current-language-name lang="${code}">${name}<`)) {
      fail(`${output}: incorrect visible language name`);
    }
    if (!html.includes(`data-current-language>${short}<`)) fail(`${output}: incorrect visible language code`);
    if ([...html.matchAll(/hreflang="([^"]+)"/g)].length !== 9) fail(`${output}: incomplete hreflang set`);
    if (!/<link\b[^>]*rel="canonical" href="https:\/\/kwiin\.ch\//.test(html)) fail(`${output}: missing canonical URL`);
    if (html.includes("—")) fail(`${output}: em dash found in visible HTML`);
    if (/d(?:ü|u)bendorf|suriya spa|partnerlocation/i.test(html)) fail(`${output}: retired location reference found`);
    if (/data-price-mode|price-mode__options|data-portal-card/.test(html)) fail(`${output}: retired studio or dual-choice control found`);

    const textMatches = [...html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*\bdata-i18n="([^"]+)"[^>]*)>([^<]*)<\/\1>/gi)];
    const textMarkers = [...html.matchAll(/\bdata-i18n="([^"]+)"/g)];
    if (textMatches.length !== textMarkers.length) {
      fail(`${output}: ${textMarkers.length - textMatches.length} translation markers are not plain crawlable text`);
    }

    for (const match of textMatches) {
      const [, , attributes, key, rawText] = match;
      if (pack[key] == null) fail(`${output}: missing translation key ${key}`);
      const expected = interpolate(pack[key], paramsFromAttributes(attributes));
      const actual = decodeHtml(rawText);
      if (actual !== expected) fail(`${output}: static translation mismatch for ${key}`);
    }

    for (const schemaMatch of html.matchAll(/<script id="kwiin-structured-data"[^>]*>([\s\S]*?)<\/script>/g)) {
      JSON.parse(schemaMatch[1]);
      schemaBlocks += 1;
    }

    for (const linkMatch of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
      const href = decodeHtml(linkMatch[1]);
      if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/assets/")) continue;
      const target = outputPathForHref(href);
      if (!target) continue;
      await access(target);
      internalLinks += 1;
    }
  }
}

if (translatedPages !== 40) fail(`Expected 40 localized pages, found ${translatedPages}`);
if (schemaBlocks !== 40) fail(`Expected 40 JSON-LD blocks, found ${schemaBlocks}`);

const home = await readFile(resolve(dist, "index.html"), "utf8");
if (!home.includes("class=\"mobile-arrival")) fail("Home page is missing the mobile-only arrival section");
if ([...home.matchAll(/class="lotus-frame"/g)].length !== 1) fail("Home portrait must contain exactly one lotus frame");
if (/lotus-frame__(?:mid|front)/.test(home)) fail("Home portrait contains a secondary nested lotus");

const servicesPage = await readFile(resolve(dist, "services/index.html"), "utf8");
if ([...servicesPage.matchAll(/data-zone-select/g)].length !== 1) fail("Treatments page must contain one global travel selector");
if (!servicesPage.includes("data-global-price-mode=\"mobile\"")) fail("Treatments page is not locked to mobile pricing");

const sitemap = await readFile(resolve(dist, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (sitemapUrls.length !== 40 || new Set(sitemapUrls).size !== 40) fail("Sitemap must contain 40 unique canonical URLs");
if (sitemapUrls.some((url) => url.includes("/studio/"))) fail("Retired studio route found in sitemap");

const robots = await readFile(resolve(dist, "robots.txt"), "utf8");
for (const crawler of ["Googlebot", "Bingbot", "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User"]) {
  if (!robots.includes(crawler)) fail(`robots.txt is missing ${crawler}`);
}
if (!robots.includes("Sitemap: https://kwiin.ch/sitemap.xml")) fail("robots.txt is missing the canonical sitemap");

for (const route of pageRoutes) {
  if (!sitemapUrls.includes(`https://kwiin.ch${route}`)) fail(`Sitemap is missing German route ${route}`);
}

console.log(`Verified ${translatedPages} localized pages, ${schemaBlocks} JSON-LD blocks, and ${internalLinks} internal links.`);
