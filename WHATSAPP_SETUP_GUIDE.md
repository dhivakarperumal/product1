# WhatsApp API Integration Setup Guide

## Overview
This application now sends WhatsApp messages automatically to gym members when plans are assigned. The message includes plan details and is sent to the **client's phone number** (not the gym number).

## Current Implementation

### Frontend (BuyPlan.jsx)
- When a plan is assigned, the frontend calls the backend API
- Phone number used: **Client's phone number** from the member record
- Message format: Simplified plan assignment notification

### Backend API
- **Endpoint**: `POST /api/whatsapp/send-plan-message`
- **Authentication**: Required (JWT token)
- **Location**: `backend/src/controllers/whatsappController.js`

### WhatsApp Service
- **File**: `backend/src/services/whatsappService.js`
- Handles actual WhatsApp API communication
- Supports Meta WhatsApp Business API

## Setup Instructions

### Step 1: Get WhatsApp Business API Credentials
1. Visit: https://www.whatsapp.com/business/
2. Create a WhatsApp Business Account
3. Get your:
   - **Phone Number ID** - The ID of your verified business phone number
   - **Access Token** - API token for authentication

### Step 2: Configure Environment Variables
Update `backend/env`:
```env
WHATSAPP_PHONE_ID=your_phone_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
```

### Step 3: Create WhatsApp Message Template (Optional)
If using template messages, create a template named `plan_assignment` in your WhatsApp Business Account with parameters:
1. {1} - Member name
2. {2} - Plan name
3. {3} - Duration
4. {4} - Price

### Step 4: Test the Integration
When assigning a plan to a member:
1. The system will send a WhatsApp message to the member's phone number
2. Check backend logs for success/failure messages
3. If API is not configured, plan assignment still succeeds (with warning)

## Message Format

The WhatsApp message sent to clients looks like:
```
🎉 Plan Assignment Confirmed!

Hi [Client Name],

Your gym plan has been successfully assigned!

📋 Plan Details:
Plan: [Plan Name]
Duration: [Duration] months
Amount: ₹[Price]
Start Date: [Start Date]
End Date: [End Date]

💪 Let's get started!

If you have any questions, please contact us.
```

## Important Notes

### Client Phone Number
- The message is sent to the **client's phone number** (member's phone)
- Not the gym's phone number
- Phone numbers are cleaned (only digits) before sending

### Fallback Behavior
- If WhatsApp API is not configured, the plan assignment still succeeds
- A warning is logged but no error is shown to user
- This allows the system to work even without WhatsApp setup

### API Endpoint Details
```
POST /api/whatsapp/send-plan-message
Authorization: Bearer [JWT_TOKEN]

Request Body:
{
  "clientPhone": "91XXXXXXXXXX",
  "clientName": "Member Name",
  "planName": "Premium Plan",
  "duration": "3",
  "price": "4000.00",
  "startDate": "2026-05-04",
  "endDate": "2026-08-04"
}

Response:
{
  "success": true,
  "message": "WhatsApp message sent successfully",
  "messageId": "wamid.xxxxx"
}
```

## Troubleshooting

### Issue: Message not sending
- Check `WHATSAPP_PHONE_ID` and `WHATSAPP_ACCESS_TOKEN` in env file
- Verify phone number is in international format (with country code)
- Check backend logs for specific error message

### Issue: "WhatsApp API not configured"
- Add credentials to `backend/env`
- Restart backend server
- Try sending message again

### Issue: Phone number format error
- Phone numbers should start with country code (e.g., 91 for India)
- System automatically adds country code, but ensure base number is valid

## Future Enhancements
1. Support for multiple message templates
2. Message delivery tracking
3. Retry logic for failed messages
4. Bulk message sending for promotions
5. Integration with other messaging services (SMS, Email)

## Files Modified/Created
- `backend/src/services/whatsappService.js` - WhatsApp API integration
- `backend/src/controllers/whatsappController.js` - Controller for WhatsApp endpoints
- `backend/src/routes/whatsappRoutes.js` - API routes
- `backend/src/server.js` - Added WhatsApp routes
- `backend/env` - Added WhatsApp API credentials
- `Gym_User_Web/src/Admin/Plans/BuyPlan.jsx` - Updated to use backend API

## Support
For issues or questions, check:
1. Backend logs for error messages
2. WhatsApp Business Account dashboard
3. API token expiration status
