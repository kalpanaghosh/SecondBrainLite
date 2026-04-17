const twilio = require('twilio');

const sendWhatsAppMessage = async (toPhone, message) => {
    // Note: Twilio credentials must be configured in .env for this to function
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER; // e.g. 'whatsapp:+14155238886'

    if (!accountSid || !authToken || !twilioWhatsAppNumber) {
        console.warn('⚠️ Twilio config missing in .env. Showing dummy WhatsApp notification logic:');
        console.warn(`[WhatsApp Stub] To: ${toPhone} | Message: ${message}`);
        return false;
    }

    try {
        const client = twilio(accountSid, authToken);
        const response = await client.messages.create({
            body: message,
            from: twilioWhatsAppNumber,
            to: `whatsapp:${toPhone}`
        });
        console.log(`WhatsApp message sent to ${toPhone}. SID: ${response.sid}`);
        return true;
    } catch (error) {
        console.error('Error sending WhatsApp message via Twilio:', error.message);
        return false;
    }
};

module.exports = { sendWhatsAppMessage };
