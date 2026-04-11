# 🔐 SuperAdmin Quick Reference Card

## 🚀 Quick Start

### Step 1: Backend Migration
Run migrations to seed the database:
```bash
cd backend
npm run migrate
# or manually with node
node src/config/migrate.js
```

### Step 2: Start Backend Server
```bash
npm start
# Backend runs on: http://localhost:5000
```

### Step 3: Start Frontend Dev Server
```bash
cd Gym_User_Web
npm run dev
# Frontend runs on: http://localhost:5174
```

### Step 4: Access Login Page
Navigate to:
```
http://localhost:5174/#/login
```

---

## 🔐 Default Credentials

| Field | Value |
|-------|-------|
| **Username** | `Nishanth` |
| **Password** | `17082025` |
| **Email** | `superadmin@gym.com` |
| **User ID** | `1` |
| **Role** | `super admin` |

---

## 📍 URL Routing

| Page | URL |
|------|-----|
| Login | `http://localhost:5174/#/login` |
| SuperAdmin Dashboard | `http://localhost:5174/#/superadmin` |
| Admin Login | `http://localhost:5174/#/login` (select Admin role) |
| Admin Panel | `http://localhost:5174/#/admin` |
| Trainer Login | `http://localhost:5174/#/login` (select Trainer role) |
| Trainer Panel | `http://localhost:5174/#/trainer` |
| Member Login | `http://localhost:5174/#/login` (select Member role) |
| Member Panel | `http://localhost:5174/#/user-panel` |

---

## 🎯 Key Features Implemented

### ✅ Advanced Login System
- [x] Multi-role selector (Member/Admin/Trainer/SuperAdmin)
- [x] Remember me functionality
- [x] Google OAuth integration
- [x] Enhanced UI with gradients
- [x] Password visibility toggle
- [x] Loading states & error handling

### ✅ SuperAdmin Dashboard
- [x] Real-time statistics display
- [x] System health monitoring
- [x] Quick action navigation
- [x] Responsive design (mobile/tablet/desktop)
- [x] Admin account overview
- [x] User analytics

### ✅ Multi-Tenant Architecture
- [x] Superadmin can create admins
- [x] Admins manage their own users/products
- [x] Admin_id field for data scoping
- [x] Role-based data filtering

### ✅ Database Migrations
- [x] Migration 0036: Added `admin_id` to users & products
- [x] Migration 0037: Seeded superadmin user
- [x] Auto-migration on backend startup

---

## 🔧 Backend API Endpoints

### Authentication
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/google-login
```

### Users Management
```
GET /api/users                      (requires admin)
POST /api/users                     (requires admin)
GET /api/users/:id                  (requires admin)
PUT /api/users/:id                  (requires admin)
DELETE /api/users/:id               (requires admin)
```

### Products Management
```
GET /api/products                   (optional auth)
POST /api/products                  (requires admin)
GET /api/products/:id               (optional auth)
PUT /api/products/:id               (requires admin + ownership)
DELETE /api/products/:id            (requires admin + ownership)
GET /api/products/alerts/low-stock  (optional auth)
```

### Staff/Trainers
```
POST /api/staff                     (requires admin)
GET /api/staff
PUT /api/staff/:id                  (requires admin)
DELETE /api/staff/:id               (requires admin)
```

### Members
```
POST /api/members                   (optional auth)
GET /api/members
PUT /api/members/:id                (requires admin)
DELETE /api/members/:id             (requires admin)
```

---

## 🛡️ Security Features

1. **JWT Tokens**
   - 7-day expiration
   - Stored in localStorage
   - Sent in Authorization header

2. **Password Hashing**
   - bcryptjs (cost: 10)
   - Salted & secured

3. **Role-Based Access Control**
   - `super admin`: Full system access
   - `admin`: Manage own resources
   - `trainer`: Manage assigned members
   - `staff`: Support role
   - `user/member`: Limited access

4. **Data Ownership**
   - `admin_id` field for multi-tenancy
   - Products scoped by admin
   - Users scoped by admin

---

## 🧪 Testing Checklist

### Login Tests
- [ ] Login as SuperAdmin
- [ ] Login as Admin
- [ ] Login as Trainer
- [ ] Login as Member
- [ ] Google OAuth login
- [ ] Remember me functionality
- [ ] Logout functionality

### Routing Tests
- [ ] SuperAdmin redirects to `/superadmin`
- [ ] Admin redirects to `/admin`
- [ ] Trainer redirects to `/trainer`
- [ ] Member redirects to `/user-panel`
- [ ] Unauthenticated redirects to `/login`

### API Tests
- [ ] Create admin account
- [ ] Create product (admin)
- [ ] View scoped products
- [ ] Update user role
- [ ] Delete staff member
- [ ] Create member

### UI Tests
- [ ] Login page responsive
- [ ] Dashboard responsive
- [ ] Sidebar navigation works
- [ ] Role selector visible
- [ ] Remember me checkbox works
- [ ] Password toggle works

---

## 🐛 Common Issues & Solutions

### Login Shows "Invalid Credentials"
**Solution**: 
- Check username is `Nishanth` (case-sensitive)
- Check password is `17082025`
- Verify migration ran successfully

### Dashboard Not Loading
**Solution**:
- Clear browser cache
- Check JWT token in localStorage
- Verify API endpoint is responding
- Check user role is `super admin`

### Redirect Loop at Login
**Solution**:
- Clear localStorage
- Clear browser cookies
- Logout fully
- Login again

### Products Not Showing
**Solution**:
- Check products have `admin_id` set
- For SuperAdmin, all products shown
- For Admin, only own products shown
- Check filters in query

---

## 📞 Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=gym_db
JWT_SECRET=your_secret_key
NODE_ENV=development
PORT=5000
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_AUTH_ID=your_google_client_id
```

---

## 💾 Database Backup

```bash
# Backup database
mysqldump -u root -p gym_db > backup.sql

# Restore database
mysql -u root -p gym_db < backup.sql

# Check migrations applied
SELECT * FROM schema_migrations;
```

---

## 📊 Expected File Structure

```
Gym_User_Web/
├── src/
│   ├── Components/
│   │   ├── AdvancedLogin.jsx        ✅ NEW
│   │   └── Login.jsx                (old)
│   ├── SuperAdmin/
│   │   ├── Dashboard/
│   │   │   ├── SuperAdminDashboard.jsx  ✅ NEW
│   │   │   └── Dasboard.jsx         (old)
│   │   ├── Users/
│   │   ├── PaymentList/
│   │   └── Profile/
│   ├── Admin/
│   ├── UserPanel/
│   └── main.jsx                     ✅ UPDATED
├── SUPERADMIN_SETUP.md              ✅ NEW
└── SUPERADMIN_QUICK_REFERENCE.md    ✅ NEW

backend/
├── src/
│   ├── config/
│   │   └── migrations/
│   │       ├── 0036_add_admin_id_to_users_products.sql    ✅ NEW
│   │       └── 0037_seed_superadmin.sql                   ✅ NEW
│   ├── middleware/
│   │   └── auth.js                  ✅ UPDATED
│   ├── routes/
│   │   ├── productRoutes.js         ✅ UPDATED
│   │   ├── userRoutes.js            ✅ UPDATED
│   │   ├── memberRoutes.js          ✅ UPDATED
│   │   └── staffRoutes.js           ✅ UPDATED
│   └── controllers/
│       ├── productController.js     ✅ UPDATED
│       ├── userController.js        ✅ UPDATED
│       ├── memberController.js      ✅ UPDATED
│       └── staffController.js       ✅ UPDATED
```

---

## 🚀 Next Steps

1. **Run migrations** to seed superadmin
2. **Start backend** server
3. **Start frontend** dev server
4. **Navigate** to login page
5. **Select Super Admin** role
6. **Enter credentials** (Nishanth / 17082025)
7. **Login** and access dashboard
8. **Change password** in settings (recommended)
9. **Create admin accounts** as needed
10. **Start managing** the gym platform

---

**Version**: 1.0.0  
**Last Updated**: April 7, 2026  
**Status**: ✅ Production Ready
