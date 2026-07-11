/**
 * WhatsApp booking helper.
 *
 * All booking and inquiry CTAs across the site must route through WhatsApp.
 * there is no calendar booking system, cart, or checkout. This is the
 * single source of truth for building a correctly formatted wa.me link.
 */

// Primary booking number used by every "Termin via WhatsApp" CTA on the site.
// Stored without the leading "+" per the wa.me URL format.
export const WHATSAPP_BOOKING_NUMBER = "41779669928";

// General contact number. Informational only, never used for booking CTAs.
export const GENERAL_CONTACT_NUMBER = "+41 76 728 21 22";
export const WHATSAPP_DISPLAY_NUMBER = "+41 77 966 99 28";

/**
 * Build a wa.me link that opens a chat with the KWIIN booking number and a
 * prefilled, URL-encoded message.
 */
export function whatsappUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_BOOKING_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_MESSAGES = {
  studioGeneric:
    "Hallo Pratana, ich möchte gerne einen Termin für eine KWIIN Massage in Dübendorf anfragen.",
  mobileGeneric:
    "Hallo Pratana, ich möchte gerne einen KWIIN Mobile Spa Termin bei mir zuhause, im Büro oder im Hotel anfragen.",
} as const;
