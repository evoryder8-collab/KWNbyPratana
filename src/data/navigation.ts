export interface NavItem {
  label: string;
  href: string;
}

export const navItems: NavItem[] = [
  { label: "Signature", href: "/studio" },
  { label: "Mobile Spa", href: "/mobile-spa" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const navCtaLabel = "Book via WhatsApp";
