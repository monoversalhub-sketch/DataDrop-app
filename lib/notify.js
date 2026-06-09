export const MESSAGES = {
  failed: (amount) =>
    `Hi! Your DataDrop order for ₦${amount} couldn't be delivered. You'll receive a full refund within 24 hours. Sorry for the inconvenience! 🙏`,
  expired: () =>
    `Hi! Your DataDrop payment window expired before we received your transfer. If you did transfer, it will be returned within 24 hours.`,
};

export async function sendWhatsApp(phone, message) {
  if (!phone || phone.trim() === '') {
    return;
  }

  try {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
      console.warn('[WhatsApp] Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_ID');
      return;
    }

    // Strip leading 0 and add country code 234
    const recipientPhone = phone.startsWith('0') ? '234' + phone.slice(1) : '234' + phone;

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipientPhone,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      console.error('[WhatsApp] Send failed:', data);
    }
  } catch (err) {
    console.error('[WhatsApp] Error:', err.message);
    // Never throw — notification failure must not break webhook flow
  }
}
