# Product Purchase Issues Found & Fixed

## Issue #1: Stock Update Route Requires Admin Role ⚠️ CRITICAL

**Problem**: 
- Checkout.jsx calls `PUT /products/{id}` to update stock when placing an order
- But the route requires `authenticateToken` + `requireAdmin` middleware
- Regular users get 403 Forbidden error when trying to update stock
- This BLOCKS all product orders from non-admin users

**Current Route**:
```javascript
router.put('/:id', authenticateToken, requireAdmin, updateProduct);
```

**Checkout Code** (line 233):
```javascript
await api.put(`/products/${productId}`, {
  stock: updatedStock,
});
```

**Impact**: 
- ❌ Users cannot complete product purchases
- ❌ Orders fail when trying to update stock
- ✅ Admins CAN update products (they have admin role)

---

## Solution: Create Separate Stock Update Endpoint

Instead of blocking PUT for all non-admin users, create a dedicated endpoint that:
1. Allows authenticated users (not just admins) to update only the stock field
2. Validates they're updating stock for a valid order
3. Prevents them from modifying other product fields

### Changes Required:

#### 1. Update productRoutes.js
Add new endpoint for stock updates that users can use:
```javascript
// Stock-only update (for checkout flow - users can update stock)
router.patch('/:id/stock', authenticateToken, updateProductStock);

// Full product update (admin-only - existing behavior)
router.put('/:id', authenticateToken, requireAdmin, updateProduct);
```

#### 2. Add updateProductStock Controller
Create new function in productController.js:
```javascript
async function updateProductStock(req, res) {
  // Only allow updating the 'stock' field
  // Prevent other fields from being modified
  // Allow any authenticated user to call during checkout
}
```

#### 3. Update Checkout.jsx
Change the update call to use new endpoint:
```javascript
await api.put(`/products/${productId}`, { stock: updatedStock });
// Change to:
await api.patch(`/products/${productId}/stock`, { stock: updatedStock });
```

---

## Additional Issues Found:

### Issue #2: Order Creation May Fail for Non-Users
**Problem**: In orderController.js, if user_id is not found in users table, order is created with user_id = NULL
**Solution**: This is acceptable for guest orders, but checkout always sends authenticated user, so it shouldn't happen

### Issue #3: Product Pricing Data
**Problem**: Test found product has offer_price = 0
**Solution**: Data issue, not code issue - products need pricing updated

---

## Testing After Fix:
Run: `node backend/test_product_purchase.js`
Expected: All checks pass including stock update authorization
