const https = require('https');

/**
 * Send WhatsApp message using Meta WhatsApp Business API
 * Requires: WHATSAPP_PHONE_ID, WHATSAPP_ACCESS_TOKEN in environment
 */
async function sendWhatsAppMessage(clientPhone, messageData) {
  try {
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneId || !accessToken) {
      console.warn('WhatsApp API credentials not configured. Skipping message send.');
      return {
        success: false,
        message: 'WhatsApp API not configured',
        isConfigured: false,
      };
    }

    // Clean phone number
    const cleanPhone = clientPhone?.replace(/\D/g, '');
    if (!cleanPhone) {
      return { success: false, message: 'Invalid phone number' };
    }

    // Prepare message
    const message = {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'template',
      template: {
        name: 'plan_assignment',
        language: {
          code: 'en_US',
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: messageData.name },
              { type: 'text', text: messageData.planName },
              { type: 'text', text: messageData.duration },
              { type: 'text', text: messageData.price },
            ],
          },
        ],
      },
    };

    // Send via WhatsApp API
    const response = await sendWhatsAppAPI(phoneId, accessToken, message);
    return response;
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * Send simple text message via WhatsApp Business API
 * FROM: Gym number (WHATSAPP_PHONE_ID - 9659133504)
 * TO: clientPhone (client's number)
 */
async function sendSimpleWhatsAppMessage(clientPhone, messageText) {
  try {
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneId || !accessToken) {
      console.warn('WhatsApp API credentials not configured');
      return { success: false, message: 'WhatsApp API not configured' };
    }

    const cleanPhone = clientPhone?.replace(/\D/g, '');
    if (!cleanPhone) {
      return { success: false, message: 'Invalid phone number' };
    }

    const message = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: {
        body: messageText,
      },
    };

    const response = await sendWhatsAppAPI(phoneId, accessToken, message);
    return response;
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Make HTTPS request to WhatsApp API
 */
function sendWhatsAppAPI(phoneId, accessToken, messagePayload) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.instagram.com',
      path: `/${phoneId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve({
              success: true,
              messageId: parsed.messages?.[0]?.id,
              message: 'WhatsApp message sent successfully',
            });
          } else {
            reject(new Error(parsed.error?.message || 'WhatsApp API error'));
          }
        } catch (e) {
          reject(new Error('Failed to parse WhatsApp response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify(messagePayload));
    req.end();
  });
}

module.exports = {
  sendWhatsAppMessage,
  sendSimpleWhatsAppMessage,
};
