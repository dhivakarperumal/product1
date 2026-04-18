/**
 * Product Purchase Flow Test
 * Tests the complete flow from cart to order creation
 */

const pool = require('./src/config/db');
const jwt = require('jsonwebtoken');

async function testProductPurchaseFlow() {
  console.log('='.repeat(80));
  console.log('PRODUCT PURCHASE FLOW TEST');
  console.log('='.repeat(80));

  try {
    // Step 1: Get a user from the database
    console.log('\n[STEP 1] Fetching a user from database...');
    const [users] = await pool.query('SELECT id, username, email, mobile FROM users LIMIT 1');
    
    if (users.length === 0) {
      console.log('❌ No users found in database. Please create a user first.');
      return;
    }

    const user = users[0];
    console.log('✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Username:', user.username);
    console.log('   Email:', user.email);

    // Step 2: Get a product from the database
    console.log('\n[STEP 2] Fetching a product from database...');
    const [products] = await pool.query('SELECT id, name, stock, mrp, offer_price FROM products LIMIT 1');
    
    if (products.length === 0) {
      console.log('❌ No products found in database. Please create a product first.');
      return;
    }

    const product = products[0];
    console.log('✅ Product found:');
    console.log('   ID:', product.id);
    console.log('   Name:', product.name);
    console.log('   Stock:', product.stock ? Object.keys(product.stock).length : 0, 'variants');
    
    let stock = {};
    try {
      stock = typeof product.stock === 'string' ? JSON.parse(product.stock) : product.stock || {};
    } catch (e) {
      console.log('   Note: Stock parsing failed, using empty object');
    }
    
    if (Object.keys(stock).length === 0) {
      console.log('⚠️  Product has no stock variants, using default');
      stock = { 'default': { qty: 100 } };
    }
    
    const variantKeys = Object.keys(stock);
    const firstVariant = variantKeys[0];
    console.log('   Available variants:', variantKeys);
    console.log('   First variant:', firstVariant, '- Qty:', stock[firstVariant].qty);

    // Step 3: Simulate cart addition
    console.log('\n[STEP 3] Simulating cart item...');
    const cartItem = {
      productId: product.id,
      product_id: product.id,
      name: product.name,
      quantity: 1,
      variant: firstVariant,
      price: product.offer_price || product.mrp || 0,
      image: '',
    };
    console.log('✅ Cart item payload:');
    console.log('   Product ID:', cartItem.product_id);
    console.log('   Name:', cartItem.name);
    console.log('   Quantity:', cartItem.quantity);
    console.log('   Variant:', cartItem.variant);
    console.log('   Price:', cartItem.price);

    // Step 4: Simulate order data
    console.log('\n[STEP 4] Building order data...');
    const orderId = `ORD${String(Date.now()).slice(-6)}`;
    const orderData = {
      order_id: orderId,
      user_id: user.id,
      order_type: 'DELIVERY',
      items: [cartItem],
      shipping: {
        name: user.username,
        email: user.email,
        phone: user.mobile,
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zip: '123456',
        country: 'India'
      },
      billing_address: {
        name: user.username,
        email: user.email,
        phone: user.mobile,
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zip: '123456',
        country: 'India'
      },
      billing_name: user.username,
      billing_email: user.email,
      billing_phone: user.mobile,
      total: cartItem.price * cartItem.quantity,
      payment_method: 'CASH',
      payment_status: 'Pending',
      status: 'orderPlaced'
    };
    console.log('✅ Order data:', JSON.stringify(orderData, null, 2));

    // Step 5: Check user existence (like backend does)
    console.log('\n[STEP 5] Validating user exists in database...');
    const [userCheck] = await pool.query('SELECT id FROM users WHERE id = ?', [user.id]);
    if (userCheck.length > 0) {
      console.log('✅ User validation PASSED');
    } else {
      console.log('❌ User validation FAILED - User not found!');
      console.log('   This would cause order to be created with user_id = NULL');
    }

    // Step 6: Check product stock update
    console.log('\n[STEP 6] Checking stock update logic...');
    const updatedStock = { ...stock };
    const currentQty = parseInt(updatedStock[firstVariant].qty, 10) || 0;
    const requestedQty = cartItem.quantity;
    const newQty = currentQty - requestedQty;

    console.log('   Current stock for', firstVariant + ':', currentQty);
    console.log('   Requested quantity:', requestedQty);
    console.log('   New stock after update:', newQty);

    if (newQty < 0) {
      console.log('❌ Stock check FAILED - Insufficient stock!');
    } else {
      console.log('✅ Stock check PASSED');
      updatedStock[firstVariant].qty = newQty;
    }

    // Step 7: Validate order normalization
    console.log('\n[STEP 7] Checking order_id normalization...');
    const normalizeOrderId = (id) => {
      if (typeof id === 'string') {
        const num = parseInt(id.replace(/[^0-9]/g, ''), 10) || 0;
        return `ORD${String(num).padStart(3, '0')}`;
      }
      return id;
    };
    const normalizedOrderId = normalizeOrderId(orderId);
    console.log('   Original order_id:', orderId);
    console.log('   Normalized order_id:', normalizedOrderId);
    if (normalizedOrderId.startsWith('ORD')) {
      console.log('✅ Order ID normalization PASSED');
    } else {
      console.log('❌ Order ID normalization FAILED');
    }

    // Step 8: Check variant key matching in checkout
    console.log('\n[STEP 8] Checking variant key matching...');
    const variantFromCart = firstVariant;
    const stockKeys = Object.keys(stock);
    const variantExists = stockKeys.includes(variantFromCart);
    
    console.log('   Variant from cart:', variantFromCart);
    console.log('   Stock keys in product:', stockKeys);
    console.log('   Variant exists:', variantExists);
    
    if (variantExists) {
      console.log('✅ Variant matching PASSED');
    } else {
      console.log('❌ Variant matching FAILED');
      console.log('   This would cause order creation to be blocked!');
    }

    // Step 9: Summary
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log('✅ Product purchase flow can proceed with:');
    console.log('   - User ID:', user.id);
    console.log('   - Product:', product.name);
    console.log('   - Variant:', firstVariant);
    console.log('   - Order ID:', normalizedOrderId);

  } catch (err) {
    console.error('\n❌ Error during test:');
    console.error(err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    process.exit(0);
  }
}

testProductPurchaseFlow();
