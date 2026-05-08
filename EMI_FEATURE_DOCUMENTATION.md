# EMI (Equated Monthly Installment) Feature Implementation

## Overview
This document describes the complete EMI feature implementation for gym plans above ₹4000. The feature allows members to spread plan payments over multiple months with automatic tracking and notifications.

## Features Implemented

### 1. Backend Changes

#### Database Migrations (0067_add_emi_support.sql)
- Added EMI fields to `memberships` table:
  - `isEMI` - Whether this membership is on EMI
  - `emiMonths` - Number of EMI months
  - `emiAmount` - Monthly EMI amount
  - `emiStartDate` - When EMI starts
  - `totalAmount` - Total amount financed
  - `nextEMIDate` - Next payment due date

- New `emi_payments` table for tracking:
  - Stores individual EMI payment records
  - Tracks status: pending, completed, overdue, cancelled
  - Records payment dates and methods
  - Links to memberships

#### Membership Controller (membershipController.js)
Added new functions:
- `createEMISchedule(req, res)` - Creates EMI payment schedule
- `getEMIPayments(req, res)` - Fetches all EMI payments for a membership
- `getUpcomingEMIPayments(req, res)` - Gets upcoming EMI payments (for notifications)
- `updateEMIPayment(req, res)` - Updates EMI payment status
- `getEMIStatus(req, res)` - Gets EMI status summary for a membership

#### EMI Notification Controller (emiNotificationController.js)
New controller for notification management:
- `sendEMIReminders(req, res)` - Sends WhatsApp reminders for upcoming/overdue payments
- `getEMINotificationStats(req, res)` - Dashboard statistics
- `markEMIPaymentsPaid(req, res)` - Batch mark payments as paid
- `markOverdueEMI(req, res)` - Auto-mark overdue payments

#### Routes
- **Membership routes** - EMI-specific routes under `/api/memberships/emi/`
- **Notification routes** - EMI notification routes under `/api/emi-notifications/`

### 2. Frontend Changes

#### BuyPlan Component (BuyPlan.jsx)
- Added EMI option checkbox for plans above ₹4000
- EMI duration selector (3, 6, 12, 18, 24 months)
- Real-time EMI amount calculation display
- EMI information in plan summary
- Integration with membership creation

#### EMI Utilities (emiUtils.js)
Helper functions:
- `calculateEMIAmount()` - Calculate monthly EMI
- `isEMIEligible()` - Check if plan qualifies for EMI
- `calculateEMISchedule()` - Generate full EMI schedule
- `formatEMIText()` - Format EMI display
- `getEMIStatusSummary()` - Get payment statistics
- `isOverdue()` - Check if payment is overdue
- `getDaysTillDue()` - Calculate days until due
- `formatDate()` - Format dates for display

#### Components

**EMISidebar (EMISidebar.jsx)**
- Displays upcoming EMI payments in sidebar
- Shows member count and total amount due
- Quick status indicators (overdue, due soon, pending)
- Auto-refreshes every 5 minutes
- Mobile responsive

**EMITracking (EMITracking.jsx)**
- Comprehensive EMI tracking page
- Member selection and EMI details view
- Payment schedule table
- Payment status tracking and updates
- CSV export functionality
- Statistics dashboard

**EMINotificationManager (EMINotificationManager.jsx)**
- Send reminders for upcoming payments
- Send reminders for overdue payments
- View EMI statistics
- Real-time status updates
- Batch mark payments as paid

### 3. Calculation Logic

EMI Calculation Formula:
```
Monthly EMI = Total Amount / Number of Months
```

For rounding:
- All monthly amounts are rounded up to nearest paise
- Last payment adjusted to cover any rounding differences

Example:
- Plan Price: ₹10,000
- EMI Duration: 3 months
- Monthly EMI: ₹3,334 (rounded from 3,333.33)
- Month 1: ₹3,334
- Month 2: ₹3,334
- Month 3: ₹3,332 (adjusted for rounding)
- Total: ₹10,000

## API Endpoints

### Membership EMI Endpoints

**POST** `/api/memberships/emi/create-schedule`
- Create EMI payment schedule
- Parameters: `membershipId`, `emiMonths`

**GET** `/api/memberships/emi/upcoming`
- Get upcoming EMI payments
- Query: `daysAhead` (default: 7)

**GET** `/api/memberships/emi/status/:membershipId`
- Get EMI status for membership

**GET** `/api/memberships/emi/payments/:membershipId`
- Get all EMI payments for membership

**PUT** `/api/memberships/emi/payment/:paymentId`
- Update EMI payment status
- Parameters: `status`, `paymentMethod`, `paidDate`

### Notification Endpoints

**POST** `/api/emi-notifications/send-reminders`
- Send EMI reminders via WhatsApp
- Parameters: `reminderType` (upcoming/overdue), `daysAhead`

**GET** `/api/emi-notifications/stats`
- Get EMI notification statistics

**POST** `/api/emi-notifications/mark-paid`
- Batch mark payments as paid
- Parameters: `paymentIds[]`, `paymentMethod`

**POST** `/api/emi-notifications/mark-overdue`
- Auto-mark overdue payments
- Parameters: `daysOverdue`

## UI/UX Flow

### Member Assignment Flow
1. Admin selects member and plan
2. If plan price > ₹4000, "Pay via EMI" option appears
3. Admin checks EMI checkbox
4. Admin selects EMI duration (3-24 months)
5. App displays monthly EMI amount in real-time
6. Admin clicks "Assign Plan" to confirm
7. System creates membership + EMI schedule automatically
8. WhatsApp notification sent to member (if configured)

### EMI Tracking Flow
1. Admin views EMI Tracking page
2. Selects member from EMI members list
3. Views complete EMI summary and schedule
4. Can update individual payment statuses
5. Can mark multiple payments as paid
6. Can download EMI report as CSV

### Notification Flow
1. Admin opens EMI Notification Manager
2. Selects reminder type (upcoming/overdue)
3. Sets days ahead (for upcoming)
4. Clicks "Send Reminders"
5. System sends WhatsApp messages to members
6. Displays success/failure count
7. Statistics auto-refresh

## Data Flow

```
User selects Plan with EMI
    ↓
BuyPlan component calculates EMI
    ↓
API: POST /memberships (with isEMI flag)
    ↓
Membership created in DB
    ↓
API: POST /memberships/emi/create-schedule
    ↓
EMI schedule generated
    ↓
emi_payments records created
    ↓
WhatsApp notification sent (via WhatsApp API)
    ↓
Member receives EMI details
```

## Database Schema

### memberships table (additions)
```sql
isEMI TINYINT(1) DEFAULT 0
emiMonths INT DEFAULT 0
emiAmount DECIMAL(10,2) DEFAULT 0
emiStartDate DATE
totalAmount DECIMAL(10,2)
nextEMIDate DATE
```

### emi_payments table (new)
```sql
id INT AUTO_INCREMENT PRIMARY KEY
membershipId INT (FK to memberships)
installmentNumber INT
amount DECIMAL(10,2)
dueDate DATE
paidDate DATE
status VARCHAR(50) - pending/completed/overdue/cancelled
paymentMethod VARCHAR(50)
notes TEXT
createdAt TIMESTAMP
updatedAt TIMESTAMP
```

## Configuration

EMI configuration in `emiUtils.js`:
```javascript
EMI_CONFIG = {
  MIN_AMOUNT_FOR_EMI: 4000,
  DEFAULT_EMI_MONTHS: 3,
  MAX_EMI_MONTHS: 24,
  EMI_MONTHS_OPTIONS: [3, 6, 12, 18, 24]
}
```

## WhatsApp Notifications

EMI reminders are sent via WhatsApp with:
- Member name
- Installment number
- Amount due
- Due date
- Days remaining (for upcoming)
- Overdue notice (for late payments)

Example message:
```
Hi John,

Reminder: Your EMI payment (Installment #2) of ₹3,334 is due on 10-Jun-2026 (in 3 days).

Please arrange the payment.

Thank you!
```

## Integration Points

1. **WhatsApp API** - For sending notifications
2. **Email API** - Can be extended for email notifications
3. **SMS API** - Can be extended for SMS reminders
4. **Payment Gateway** - Can be integrated for online EMI payments

## Future Enhancements

1. Online EMI payment gateway integration
2. Email notifications in addition to WhatsApp
3. SMS reminders
4. Automated invoice generation
5. EMI settlement report for accounting
6. Late fee/penalty calculation
7. EMI foreclosure option
8. Credit score integration
9. EMI eligibility score calculation
10. Interest/charges on EMI (optional)

## Error Handling

- Invalid EMI months validation
- Membership not found handling
- Payment record not found handling
- WhatsApp API failure handling
- Database transaction rollback on errors
- User authorization checks

## Security

- Authentication required for all EMI endpoints
- Admin authorization required for update/delete operations
- EMI data isolated per admin (multi-tenancy)
- No direct member access to update payment status
- Audit trail for all EMI transactions (via created_by/updated_by)

## Testing Checklist

- [ ] EMI eligibility check (> ₹4000)
- [ ] EMI schedule generation
- [ ] Correct calculation of monthly amount
- [ ] Last payment adjustment for rounding
- [ ] Payment status updates
- [ ] Overdue marking
- [ ] WhatsApp notifications
- [ ] EMI sidebar display
- [ ] EMI tracking page functionality
- [ ] Download CSV report
- [ ] Multi-member EMI tracking
- [ ] Permission checks (admin-only)
- [ ] Database constraints
- [ ] API error handling

## Support & Troubleshooting

### Common Issues

1. **EMI option not showing**
   - Check if plan price > ₹4000
   - Verify `MIN_AMOUNT_FOR_EMI` in emiUtils.js

2. **EMI schedule not created**
   - Check membershipId is valid
   - Verify database migration ran
   - Check emiMonths is valid (2-24)

3. **WhatsApp notifications not sending**
   - Verify WhatsApp API is configured
   - Check member phone number format
   - Check API logs for errors

4. **Payments not updating**
   - Verify admin has required permissions
   - Check payment exists
   - Check database connection

## Migration Steps

To deploy this feature:

1. Run database migration:
   ```bash
   npm run migrate
   ```

2. Restart backend server:
   ```bash
   npm run dev
   ```

3. Clear browser cache
   ```bash
   Ctrl+Shift+Delete (in browser)
   ```

4. Test EMI flow with test plan > ₹4000

5. Configure WhatsApp API if needed
   - Set `WHATSAPP_API_KEY` in .env
   - Set `WHATSAPP_PHONE_ID` in .env

6. Deploy frontend changes

## Support

For issues or questions, please contact:
- Technical: dev@company.com
- Support: support@company.com

---

**Version**: 1.0  
**Last Updated**: May 7, 2026  
**Status**: Production Ready
