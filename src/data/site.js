export const BASE_PATH = "/";
export const WHATSAPP_NUMBER = "41779669928";

export const contact = {
  whatsappDisplayNumber: "+41 77 966 99 28",
  generalContactNumber: "+41 76 728 21 22",
  instagramUrl: "https://www.instagram.com/kwiinspa/",
  instagramHandle: "@kwiinspa",
};

export const languages = [
  { code: "de", short: "DE", name: "Deutsch" },
  { code: "en", short: "EN", name: "English" },
  { code: "th", short: "TH", name: "ไทย" },
  { code: "fr", short: "FR", name: "Français" },
  { code: "es", short: "ES", name: "Español" },
  { code: "it", short: "IT", name: "Italiano" },
  { code: "ru", short: "RU", name: "Русский" },
  { code: "pt", short: "PT", name: "Português" },
];

export const navItems = [
  { key: "nav.mobile", label: "Mobile Spa", href: "mobile-spa/" },
  { key: "nav.services", label: "Behandlungen", href: "services/" },
  { key: "nav.about", label: "Über KWIIN", href: "about/" },
  { key: "nav.contact", label: "Kontakt", href: "contact/" },
];

export const travelZones = [
  { distance: 15, fee: 45 },
  { distance: 30, fee: 100 },
];

export const services = [
  {
    id: "kwiin-massage",
    title: "KWIIN Massage",
    subtitle: "",
    categoryKey: "service.kwiin.category",
    category: "Signature",
    taglineKey: "service.kwiin.tagline",
    tagline: "Kräftig, gezielt und auf Sie abgestimmt.",
    descriptionKey: "service.kwiin.description",
    description: "Pratanas persönliche Signature Massage verbindet Thai Massage, Dehnung und Druckpunktarbeit. Sie hilft bei tiefen Verspannungen und unterstützt die Beweglichkeit.",
    knownFor: true,
    durations: [
      { minutes: 60, price: 165 },
      { minutes: 90, price: 240 },
      { minutes: 120, price: 295 },
    ],
  },
  {
    id: "booster-muscles-sport",
    title: "Booster Muscles",
    subtitle: "Sport",
    categoryKey: "service.booster.category",
    category: "Regeneration",
    taglineKey: "service.booster.tagline",
    tagline: "Für aktive und beanspruchte Muskeln.",
    descriptionKey: "service.booster.description",
    description: "Gezielte Tiefengewebsarbeit für Sport, Training und körperliche Belastung. Sie lockert feste Muskeln und unterstützt die Erholung.",
    knownFor: false,
    durations: [
      { minutes: 60, price: 155 },
      { minutes: 90, price: 225 },
      { minutes: 120, price: 275 },
    ],
  },
  {
    id: "flow-essence-lymph",
    title: "Flow Essence",
    subtitle: "Lymph",
    categoryKey: "service.flow.category",
    category: "Sanfte Entlastung",
    taglineKey: "service.flow.tagline",
    tagline: "Ruhige, leichte Bewegungen für den Körper.",
    descriptionKey: "service.flow.description",
    description: "Eine sanfte, rhythmische Massage mit Techniken für den Lymphfluss. Gut für alle, die eine langsame und sehr entspannende Behandlung möchten.",
    knownFor: false,
    durations: [
      { minutes: 60, price: 150 },
      { minutes: 90, price: 210 },
      { minutes: 120, price: 265 },
    ],
  },
  {
    id: "back-serenity",
    title: "Back Serenity",
    subtitle: "",
    categoryKey: "service.back.category",
    category: "Rücken und Schultern",
    taglineKey: "service.back.tagline",
    tagline: "Gezielte Hilfe für Rücken, Nacken und Schultern.",
    descriptionKey: "service.back.description",
    description: "Eine fokussierte Behandlung für Verspannungen durch Stress, Arbeit am Schreibtisch oder körperliche Belastung.",
    knownFor: false,
    durations: [
      { minutes: 30, price: 85 },
      { minutes: 60, price: 140 },
      { minutes: 90, price: 195 },
    ],
  },
  {
    id: "crown-serenity-head",
    title: "Crown Serenity",
    subtitle: "Head",
    categoryKey: "service.crown.category",
    category: "Kopf und Ruhe",
    taglineKey: "service.crown.tagline",
    tagline: "Ein klarer Kopf und tiefe Ruhe.",
    descriptionKey: "service.crown.description",
    description: "Eine angenehme Kopfmassage für Entspannung, ruhigeren Schlaf und ein leichteres Gefühl.",
    knownFor: false,
    durations: [
      { minutes: 30, price: 85 },
      { minutes: 60, price: 140 },
      { minutes: 90, price: 195 },
    ],
  },
  {
    id: "bata-flow-foot",
    title: "Bata Flow",
    subtitle: "Foot",
    categoryKey: "service.bata.category",
    category: "Füsse und Erdung",
    taglineKey: "service.bata.tagline",
    tagline: "Entspannung von den Füssen bis zum Kopf.",
    descriptionKey: "service.bata.description",
    description: "Eine entspannende Fussmassage mit Druckpunkttechniken. Sie hilft beim Abschalten und gibt ein ruhiges Körpergefühl.",
    knownFor: false,
    durations: [
      { minutes: 30, price: 85 },
      { minutes: 60, price: 140 },
      { minutes: 90, price: 195 },
    ],
  },
];

export const testimonials = [
  { name: "Rudi", quoteKey: "home.testimonialOne" },
  { name: "Eliza", quoteKey: "home.testimonialTwo" },
  { name: "Michael", quoteKey: "home.testimonialThree" },
];

export const awards = [
  { medalKey: "about.medalGold", categoryKey: "about.categoryThai", tone: "gold" },
  { medalKey: "about.medalGold", categoryKey: "about.categorySport", tone: "gold" },
  { medalKey: "about.medalSilver", categoryKey: "about.categoryFreestyle", tone: "silver" },
  { medalKey: "about.medalBronze", categoryKey: "about.categoryWellness", tone: "bronze" },
];

export const bookingTemplates = {
  de: {
    mobile: "Hallo Pratana, ich möchte {service} als Mobile Spa für bis zu {distance} km anfragen. Die Anfahrt von CHF {fee} ist mir bekannt.",
    mobileGeneric: "Hallo Pratana, ich möchte einen Mobile Spa Termin bei mir zuhause anfragen.",
  },
  en: {
    mobile: "Hello Pratana, I would like to ask about {service} as a Mobile Spa visit within {distance} km. I understand that travel costs CHF {fee}.",
    mobileGeneric: "Hello Pratana, I would like to ask about a Mobile Spa appointment at my home.",
  },
  th: {
    mobile: "สวัสดีค่ะ Pratana ฉันสนใจ {service} แบบ Mobile Spa ในระยะ {distance} กม. และทราบว่าค่าเดินทางคือ CHF {fee}",
    mobileGeneric: "สวัสดีค่ะ Pratana ฉันต้องการสอบถามคิวนวด Mobile Spa ที่บ้าน",
  },
  fr: {
    mobile: "Bonjour Pratana, je souhaite réserver {service} en Mobile Spa dans un rayon de {distance} km. Je sais que le déplacement coûte CHF {fee}.",
    mobileGeneric: "Bonjour Pratana, je souhaite demander un rendez-vous Mobile Spa chez moi.",
  },
  es: {
    mobile: "Hola Pratana, me gustaría reservar {service} como Mobile Spa en un radio de {distance} km. Sé que el desplazamiento cuesta CHF {fee}.",
    mobileGeneric: "Hola Pratana, me gustaría pedir una cita de Mobile Spa en mi casa.",
  },
  it: {
    mobile: "Ciao Pratana, vorrei prenotare {service} come Mobile Spa entro {distance} km. So che la trasferta costa CHF {fee}.",
    mobileGeneric: "Ciao Pratana, vorrei chiedere un appuntamento Mobile Spa a casa mia.",
  },
  ru: {
    mobile: "Здравствуйте, Пратана. Я хочу заказать {service} с выездом в пределах {distance} км. Я знаю, что выезд стоит CHF {fee}.",
    mobileGeneric: "Здравствуйте, Пратана. Я хочу записаться на Mobile Spa у себя дома.",
  },
  pt: {
    mobile: "Olá Pratana, gostaria de marcar {service} como Mobile Spa num raio de {distance} km. Sei que a deslocação custa CHF {fee}.",
    mobileGeneric: "Olá Pratana, gostaria de pedir uma marcação de Mobile Spa em minha casa.",
  },
};
