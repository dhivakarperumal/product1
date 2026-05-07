const { sendSimpleWhatsAppMessage } = require('../services/whatsappService');

/**
 * Send WhatsApp message after plan assignment
 * FROM: Gym's WhatsApp number (9659133504)
 * TO: Client's phone number
 */
async function sendPlanAssignmentMessage(req, res) {
  try {
    const {
      clientPhone,
      clientName,
      planName,
      duration,
      price,
      startDate,
      endDate,
    } = req.body;

    // Validate required fields
    if (!clientPhone || !clientName || !planName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: clientPhone, clientName, planName',
      });
    }

    // Create message
    const messageText = `🎉 Plan Assignment Confirmed!\n\nHi ${clientName},\n\nYour gym plan has been successfully assigned!\n\n📋 Plan Details:\nPlan: ${planName}\nDuration: ${duration} months\nAmount: ₹${price}\nStart Date: ${startDate}\nEnd Date: ${endDate}\n\n💪 Let's get started!\n\nIf you have any questions, please contact us.`;

    // Send WhatsApp message
    const result = await sendSimpleWhatsAppMessage(clientPhone, messageText);

    if (result.success) {
      return res.json({
        success: true,
        message: 'WhatsApp message sent successfully',
        messageId: result.messageId,
      });
    } else {
      // If WhatsApp API not configured, still return success (plan was assigned)
      // but log that message couldn't be sent
      if (!result.isConfigured) {
        console.log('WhatsApp not configured, but plan assignment succeeded');
        return res.json({
          success: true,
          message: 'Plan assigned (WhatsApp API not configured)',
          whatsappNotConfigured: true,
        });
      }

      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('Error sending plan assignment message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
}

module.exports = {
  sendPlanAssignmentMessage,
};
