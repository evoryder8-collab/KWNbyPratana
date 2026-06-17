/**
 * KWIIN service menu — final CHF pricing.
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
    tagline: "Royal. Powerful. Deeply effective.",
    description:
      "The KWIIN Massage is Pratana's signature treatment — an artful combination of traditional Thai massage, flowing stretches, and focused pressure-point work. Designed for clients who want something exceptional, it helps release deep tension, restore movement, and bring body and mind into a more balanced state.",
    durations: [
      { minutes: 60, priceChf: 165 },
      { minutes: 90, priceChf: 240 },
      { minutes: 120, priceChf: 295 },
    ],
    studioAvailable: true,
    mobileAvailable: true,
    knownFor: true,
    whatsappText: "Hello Pratana, I would like to inquire about the KWIIN Massage.",
  },
  {
    id: "booster-muscles-sport",
    title: "Booster Muscles",
    subtitle: "Sport",
    category: "Recovery",
    tagline: "Power for active bodies.",
    description:
      "Targeted deep tissue work for active clients, athletes, and anyone carrying muscular tension. This treatment is designed to support recovery, loosen tight muscles, and improve the feeling of mobility after stress, training, or physical load.",
    durations: [
      { minutes: 60, priceChf: 155 },
      { minutes: 90, priceChf: 225 },
      { minutes: 120, priceChf: 275 },
    ],
    studioAvailable: true,
    mobileAvailable: true,
    knownFor: false,
    whatsappText: "Hello Pratana, I would like to inquire about Booster Muscles Sport Massage.",
  },
  {
    id: "flow-essence-lymph",
    title: "Flow Essence",
    subtitle: "Lymph",
    category: "Flow",
    tagline: "Lightness for your system.",
    description:
      "A gentle, rhythmic massage inspired by lymphatic flow techniques. Designed to encourage lightness, calm, and a softer feeling in the body, this treatment is ideal for clients seeking a slow, soothing, and deeply relaxing experience.",
    durations: [
      { minutes: 60, priceChf: 150 },
      { minutes: 90, priceChf: 210 },
      { minutes: 120, priceChf: 265 },
    ],
    studioAvailable: true,
    mobileAvailable: true,
    knownFor: false,
    whatsappText: "Hello Pratana, I would like to inquire about Flow Essence Lymph Massage.",
  },
  {
    id: "back-serenity",
    title: "Back Serenity",
    category: "Targeted Relief",
    tagline: "Deep relaxation for back and shoulders.",
    description:
      "A focused massage for tension in the back, neck, and shoulder area. Ideal for clients affected by stress, office posture, or physical strain, this treatment is designed to release tightness and restore a calmer, lighter feeling.",
    durations: [
      { minutes: 30, priceChf: 85 },
      { minutes: 60, priceChf: 140 },
      { minutes: 90, priceChf: 195 },
    ],
    studioAvailable: true,
    mobileAvailable: true,
    knownFor: false,
    whatsappText: "Hello Pratana, I would like to inquire about Back Serenity.",
  },
  {
    id: "crown-serenity-head",
    title: "Crown Serenity",
    subtitle: "Head",
    category: "Calm",
    tagline: "Clear mind. Deep calm.",
    description:
      "A soothing head massage using gentle techniques to encourage mental relaxation, better rest, and a feeling of lightness. Ideal as a calming standalone treatment or as an elegant addition to another massage.",
    durations: [
      { minutes: 30, priceChf: 85 },
      { minutes: 60, priceChf: 140 },
      { minutes: 90, priceChf: 195 },
    ],
    studioAvailable: true,
    mobileAvailable: true,
    knownFor: false,
    whatsappText: "Hello Pratana, I would like to inquire about Crown Serenity Head Massage.",
  },
  {
    id: "bata-flow-foot",
    title: "Bata Flow",
    subtitle: "Foot",
    category: "Grounding",
    tagline: "Comfort from head to toe.",
    description:
      "A relaxing foot massage inspired by pressure-point techniques, designed to support grounding, inner balance, and a deep sense of ease from head to toe.",
    durations: [
      { minutes: 30, priceChf: 85 },
      { minutes: 60, priceChf: 140 },
      { minutes: 90, priceChf: 195 },
    ],
    studioAvailable: true,
    mobileAvailable: true,
    knownFor: false,
    whatsappText: "Hello Pratana, I would like to inquire about Bata Flow Foot Massage.",
  },
];

export const featuredService = services.find((s) => s.knownFor) ?? services[0];

export const MOBILE_SPA_TRAVEL_FEE_NOTE =
  "Mobile Spa travel fee: +45 CHF within a 15 km radius. Longer distances by request.";
