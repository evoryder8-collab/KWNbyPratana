/**
 * Prefixes an internal, root-relative path (e.g. "/studio" or
 * "/assets/kwiin-logo.png") with Astro's configured `base`, so links and
 * static assets resolve correctly whether the site is deployed at the
 * domain root (e.g. the future kwiin-by-pratana.ch) or under a subpath
 * (e.g. a GitHub Pages project site at /KWNbyPratana/).
 *
 * Astro's own routing already accounts for `base` automatically — this
 * helper is only needed for paths we write by hand in href/src attributes.
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}` || "/";
}
