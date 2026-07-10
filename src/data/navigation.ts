export interface NavItem {
  label: string;
  href: string;
}

export const navItems: NavItem[] = [
  { label: "Signature", href: "/studio" },
  { label: "Mobile Spa", href: "/mobile-spa" },
  { label: "Behandlungen", href: "/services" },
  { label: "Über KWIIN", href: "/about" },
  { label: "Kontakt", href: "/contact" },
];

export const navCtaLabel = "Termin via WhatsApp";
