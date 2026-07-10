/**
 * KWIIN service menu, final CHF pricing.
 * Edit this file to update services, prices, or WhatsApp inquiry text.
 * No EUR. No strikethrough/discount pricing unless explicitly requested.
 */

export interface ServiceDuration {
  minutes: number;
  priceChf: number;
}

export interface Service {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  tagline: string;
  description: string;
  durations: ServiceDuration[];
  studioAvailable: boolean;
  mobileAvailable: boolean;
  knownFor: boolean;
  whatsappText: string;
}

export const services: Service[] = [
  {
    id: "kwiin-massage",
    title: "KWIIN Massage",
    category: "Signature",
    tagline: "Königlich. Kraftvoll. Tiefgehend wirksam.",
    description:
      "Die KWIIN Massage ist Pratanas Signature-Behandlung. Eine kunstvolle Verbindung aus traditioneller Thai-Massage, fliessenden Dehnungen und gezielter Druckpunktarbeit. Für alle, die etwas Aussergewöhnliches suchen: Sie löst tiefe Verspannungen, schenkt neue Beweglichkeit und bringt Körper und Geist in Balance.",
    durations: [
      { minutes: 60, priceChf: 165 },
      { minutes: 90, priceChf: 240 },
      { minutes: 120, priceChf: 295 },
    ],
    studioAvailable: true,
    mobileAvailable: true,
    knownFor: true,
    whatsappText: "Hallo Pratana, ich interessiere mich für die KWIIN Massage.",
  },
  {
    id: "booster-muscles-sport",
    title: "Booster Muscles",
    subtitle: "Sport",
    category: "Regeneration",
    tagline: "Kraft für aktive Körper.",
    description:
      "Gezielte Tiefengewebsarbeit für aktive Menschen, Sportlerinnen und Sportler und alle, die muskuläre Anspannung mit sich tragen. Diese Behandlung unterstützt die Regeneration, lockert verhärtete Muskulatur und schenkt neue Beweglichkeit nach Training, Belastung oder Stress.",
    durations: [
      { minutes: 60, priceChf: 155 },
      { minutes: 90, priceChf: 225 },
      { minutes: 120, priceChf: 275 },
    ],
    studioAvailable: true,
    mobileAvailable: true,
    knownFor: false,
    whatsappText: "Hallo Pratana, ich interessiere mich für die Booster Muscles Sportmassage.",
  },
  {
    id: "flow-essence-lymph",
    title: "Flow Essence",
    subtitle: "Lymph",
    category: "Flow",
    tagline: "Leichtigkeit für Ihr System.",
    description:
      "Eine sanfte, rhythmische Massage, inspiriert von Techniken des Lymphflusses. Sie schenkt Leichtigkeit, Ruhe und ein weiches Körpergefühl. Ideal für alle, die eine langsame, umhüllende und tief entspannende Erfahrung suchen.",
    durations: [
      { minutes: 60, priceChf: 150 },
      { minutes: 90, priceChf: 210 },
      { minutes: 120, priceChf: 265 },
    ],
    studioAvailable: true,
    mobileAvailable: true,
    knownFor: false,
    whatsappText: "Hallo Pratana, ich interessiere mich für die Flow Essence Lymphmassage.",
  },
  {
    id: "back-serenity",
    title: "Back Serenity",
    category: "Gezielte Entlastung",
    tagline: "Tiefe Entspannung für Rücken und Schultern.",
    description:
      "Eine fokussierte Behandlung für Verspannungen in Rücken, Nacken und Schultern. Ideal bei Stress, Bürohaltung oder körperlicher Belastung. Sie löst Verhärtungen und schenkt ein ruhigeres, leichteres Körpergefühl.",
    durations: [
      { minutes: 30, priceChf: 85 },
      { minutes: 60, priceChf: 140 },
      { minutes: 90, priceChf: 195 },
    ],
    studioAvailable: true,
    mobileAvailable: true,
    knownFor: false,
    whatsappText: "Hallo Pratana, ich interessiere mich für Back Serenity.",
  },
  {
    id: "crown-serenity-head",
    title: "Crown Serenity",
    subtitle: "Head",
    category: "Ruhe",
    tagline: "Klarer Kopf. Tiefe Ruhe.",
    description:
      "Eine wohltuende Kopfmassage mit sanften Techniken für mentale Entspannung, erholsameren Schlaf und ein Gefühl von Leichtigkeit. Wunderbar als eigenständige Auszeit oder als elegante Ergänzung zu jeder anderen Behandlung.",
    durations: [
      { minutes: 30, priceChf: 85 },
      { minutes: 60, priceChf: 140 },
      { minutes: 90, priceChf: 195 },
    ],
    studioAvailable: true,
    mobileAvailable: true,
    knownFor: false,
    whatsappText: "Hallo Pratana, ich interessiere mich für die Crown Serenity Kopfmassage.",
  },
  {
    id: "bata-flow-foot",
    title: "Bata Flow",
    subtitle: "Foot",
    category: "Erdung",
    tagline: "Wohlgefühl von Kopf bis Fuss.",
    description:
      "Eine entspannende Fussmassage, inspiriert von Druckpunkttechniken. Sie unterstützt Erdung, inneres Gleichgewicht und ein tiefes Gefühl von Ruhe, von Kopf bis Fuss.",
    durations: [
      { minutes: 30, priceChf: 85 },
      { minutes: 60, priceChf: 140 },
      { minutes: 90, priceChf: 195 },
    ],
    studioAvailable: true,
    mobileAvailable: true,
    knownFor: false,
    whatsappText: "Hallo Pratana, ich interessiere mich für die Bata Flow Fussmassage.",
  },
];

export const featuredService = services.find((s) => s.knownFor) ?? services[0];

export const MOBILE_SPA_TRAVEL_FEE_NOTE =
  "Mobile Spa Anfahrt: +45 CHF im Umkreis von 15 km. Weitere Distanzen auf Anfrage.";
