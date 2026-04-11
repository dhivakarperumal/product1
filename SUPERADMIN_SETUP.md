# 🔐 SuperAdmin Setup Guide - Power Gym

## ✅ Database Setup

### Default SuperAdmin Credentials
A migration has been created to automatically seed a default superadmin user on database initialization:

- **Username**: `Nishanth`
- **Password**: `17082025`
- **Email**: `superadmin@gym.com`
- **Role**: `super admin`
- **User ID**: `1` (System-assigned)

### Database Migration
File: `backend/src/config/migrations/0037_seed_superadmin.sql`

The password is hashed using bcryptjs with a cost of 10:
```
Hash: $2a$10$X5O.R6S0Yme8JWJi7mH0FO7VhKNOWo9fMnPQkLLrzW9r5LK0uD.Ba
Plaintext: 17082025
```

---

## 🚀 Frontend Setup

### New Components Added

#### 1. **Advanced Login Page** (`src/Components/AdvancedLogin.jsx`)
- **Features**:
  - Multi-role login selector (Member, Admin, Trainer, Super Admin)
  - Remember me functionality
  - Password visibility toggle
  - Google OAuth integration
  - Enhanced UI with gradient effects
  - Loading states and error handling
  - Responsive design for mobile/desktop

- **Role-Based Routing**:
  - Super Admin → `/superadmin`
  - Admin → `/admin`
  - Trainer → `/trainer`
  - Member → `/user-panel`

#### 2. **SuperAdmin Dashboard** (`src/SuperAdmin/Dashboard/SuperAdminDashboard.jsx`)
- **Features**:
  - Statistics & metrics display
  - System health monitoring
  - Quick access navigation sidebar
  - Admin account management
  - Product catalog overview
  - User analytics
  - Responsive mobile/tablet/desktop layout

---

## 📱 How to Access SuperAdmin

### 1. **Navigate to Login**
```
URL: http://localhost:5174/#/login
```

### 2. **Select "Super Admin" Role**
Click the 👑 **Super Admin** button in the role selector

### 3. **Enter Credentials**
- **Username**: `Nishanth`
- **Password**: `17082025`

### 4. **Login**
Click "Login Now" button

### 5. **Dashboard Access**
After successful authentication, you'll be automatically redirected to:
```
URL: http://localhost:5174/#/superadmin
```

---

## 🔧 Backend Changes

### Routes with Admin Protection

#### Product Management
- `GET /api/products` - List products (optional auth for filtering)
- `POST /api/products` - Create product (requires admin auth)
- `PUT /api/products/:id` - Update product (requires admin auth + ownership)
- `DELETE /api/products/:id` - Delete product (requires admin auth + ownership)

#### User Management
- `GET /api/users` - Get all users (admin-scoped)
- `POST /api/users` - Create user (requires admin auth)
- `PUT /api/users/:id` - Update user role (requires admin auth)
- `DELETE /api/users/:id` - Delete user (requires admin auth)

#### Staff/Trainer Management
- `POST /api/staff` - Create staff/trainer (requires admin auth)
- `PUT /api/staff/:id` - Update staff (requires admin auth)
- `DELETE /api/staff/:id` - Delete staff (requires admin auth)

#### Member Management
- `POST /api/members` - Create member (optional auth for admin_id assignment)
- `PUT /api/members/:id` - Update member (requires admin auth)
- `DELETE /api/members/:id` - Delete member (requires admin auth)

---

## 🗄️ Database Schema Updates

### Users Table
New fields added:
```sql
ALTER TABLE users
ADD COLUMN admin_id INT NULL;
```

- `admin_id`: Links regular users to their managing admin
- Super admins have `admin_id = their_user_id` (self-owned)
- Regular admins have `admin_id = their_user_id` (self-owned)
- Members/Trainers have `admin_id = their_admin_user_id`

### Products Table
```sql
ALTER TABLE products
ADD COLUMN admin_id INT NULL;
```

- Products created by an admin are tagged with `admin_id`
- Super admin can see all products
- Regular admin sees only their own products

---

## 🛡️ Authentication & Authorization

### Three-Layer Security

1. **Authentication (JWT)**
   - User provides credentials
   - Backend issues JWT token
   - Token stored in localStorage
   - Token sent in Authorization header: `Bearer <token>`

2. **Role-Based Access Control (RBAC)**
   - Middleware checks user role
   - Routes protected by `requireAdmin` middleware
   - Different permissions based on role

3. **Data Ownership**
   - Admins can only manage their own resources
   - Super admin has unrestricted access
   - Products filtered by `admin_id`
   - Users filtered by `admin_id`

---

## 🔄 Login Flow Diagram

```
User Login Page
    ↓
Select Role (Super Admin)
    ↓
Enter (username: Nishanth, password: 17082025)
    ↓
API: POST /auth/login
    ↓
Validate Credentials (bcrypt comparison)
    ↓
Generate JWT Token
    ↓
Return Token + User Data
    ↓
Store in localStorage
    ↓
Redirect to /superadmin
    ↓
SuperAdminDashboard loads
```

---

## 🚀 API Response Example

### Login Success Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "superadmin@gym.com",
    "username": "Nishanth",
    "mobile": null,
    "role": "super admin",
    "admin_id": 1,
    "created_at": "2026-04-07T10:00:00Z"
  }
}
```

### JWT Token Payload
```json
{
  "userId": 1,
  "role": "super admin",
  "email": "superadmin@gym.com",
  "admin_id": 1,
  "iat": 1712500800,
  "exp": 1713105600
}
```

---

## 📊 Dashboard Features

### Statistics Cards
- **Total Admins**: Count of admin accounts
- **Total Users**: Count of all users
- **Total Products**: Count of products
- **System Status**: Real-time health check

### System Health Monitor
- Database Connection Status ✓
- API Gateway Status ✓
- Authentication Service Status ✓
- Admin Panel Access Status ✓

### Quick Links
- Manage Admins
- View All Products
- View Reports
- System Settings

---

## 🔐 Security Best Practices

1. **Change Default Password Immediately**
   - After first login, navigate to Settings
   - Change password from `17082025` to a strong password
   - Store securely

2. **Session Management**
   - JWT tokens expire after 7 days
   - Logout clears localStorage
   - Automatic redirect on session expiry

3. **API Endpoint Protection**
   - All admin operations require valid JWT
   - Role verification on backend
   - Ownership checks for resource access

4. **Data Validation**
   - Input sanitization
   - SQL injection prevention (prepared statements)
   - XSS protection in frontend

---

## 📝 Testing Superadmin Features

### Test Admin Creation
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin1",
    "email": "admin1@gym.com",
    "password": "SecurePass123!",
    "mobile": "9876543210",
    "role": "admin"
  }'
```

### Test Product Creation
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Protein Powder",
    "category": "Food",
    "subcategory": "Supplements",
    "description": "High-quality whey protein",
    "mrp": 1500,
    "offer": 10,
    "offerPrice": 1350
  }'
```

---

## 🐛 Troubleshooting

### Login Not Working
- Check database migrations ran: `npm run migrate` (backend)
- Verify superadmin user exists in `users` table
- Check password hash matches

### Redirect Not Working
- Clear browser cache & localStorage
- Check role is set correctly in response
- Verify routes configured in main.jsx

### Products Not Showing
- Ensure products have admin_id set
- Check user's admin_id matches product
- For SuperAdmin, all products should show

### Permission Denied
- Verify JWT token is being sent
- Check role in token payload
- Verify user is authenticated before API calls

---

## 🚀 Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] Admin role granularity (read-only, full access, etc.)
- [ ] Audit logging for all admin actions
- [ ] Role-based dashboard customization
- [ ] Advanced analytics & reporting
- [ ] Bulk user/product operations
- [ ] API key management for integrations
- [ ] Custom permission sets
- [ ] Admin activity timeline
- [ ] System backup & restore

---

## 📞 Support

For issues or questions:
1. Check error messages in browser console
2. Review backend logs
3. Verify database connectivity
4. Check API response status codes

---

**Last Updated**: April 7, 2026  
**Version**: 1.0.0  
**Environment**: Development & Production Ready
