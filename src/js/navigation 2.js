const pageToPath = {
  studio: "/studio/",
  mobile: "/mobile-spa/",
  services: "/services/",
  about: "/about/",
  contact: "/contact/",
};

export function initNavigation() {
  const header = document.querySelector("[data-site-header]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const navigation = document.querySelector("[data-mobile-navigation]");
  let ticking = false;

  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 18);
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });
  updateHeader();

  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    toggle?.setAttribute("aria-expanded", String(open));
    navigation?.setAttribute("aria-hidden", String(!open));
    if (navigation) navigation.inert = !open;
    if (open) {
      window.setTimeout(() => navigation?.querySelector("a")?.focus(), 220);
    } else if (navigation?.contains(document.activeElement)) {
      toggle?.focus();
    }
  };

  toggle?.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  navigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  const activePath = pageToPath[document.body.dataset.page];
  if (activePath) {
    document.querySelectorAll("[data-nav-link]").forEach((link) => {
      if (new URL(link.href).pathname.endsWith(activePath)) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
}
