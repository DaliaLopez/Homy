/** Número de soporte de Homy por WhatsApp (todos los roles). */
export const SUPPORT_WHATSAPP_URL = "https://wa.me/573184044556";

export function supportWhatsAppUrl(message?: string) {
  return message ? `${SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent(message)}` : SUPPORT_WHATSAPP_URL;
}
