const axios = require('axios');

// Simulate the exact frontend flow
async function testFrontendOrderFlow() {
  try {
    console.log('🧪 Testing complete frontend order flow...\n');

    // Step 1: Generate order ID
    console.log('1️⃣ Generating order ID...');
    const orderIdRes = await axios.post('http://localhost:5000/api/orders/generate-order-id');
    const orderId = orderIdRes.data.order_id;
    console.log('✅ Order ID generated:', orderId);

    // Step 2: Get product details (simulate cart item)
    console.log('\n2️⃣ Getting product details...');
    const productRes = await axios.get('http://localhost:5000/api/products/3');
    const product = productRes.data;
    console.log('✅ Product found:', product.name);

    // Step 3: Simulate stock update (PATCH endpoint)
    console.log('\n3️⃣ Updating product stock...');
    const updatedStock = { ...product.stock };
    updatedStock['250g'].qty = updatedStock['250g'].qty - 1;

    const stockUpdateRes = await axios.patch('http://localhost:5000/api/products/3/stock', {
      stock: updatedStock
    });
    console.log('✅ Stock updated successfully');

    // Step 4: Create order
    console.log('\n4️⃣ Creating order...');
    const orderData = {
      order_id: orderId,
      user_id: 30,
      order_type: 'DELIVERY',
      items: [{
        product_id: 3,
        product_name: product.name,
        price: product.mrp || product.offer_price || 100,
        qty: 1,
        size: '250g',
        variant: '250g'
      }],
      shipping: {
        name: 'Test User',
        phone: '1234567890',
        address: 'Test Address',
        state: 'Test State'
      },
      billing_address: {
        name: 'Test User',
        phone: '1234567890',
        address: 'Test Address',
        state: 'Test State'
      },
      billing_name: 'Test User',
      billing_email: 'test@example.com',
      billing_phone: '1234567890',
      subtotal: 100,
      total: 100,
      payment_method: 'CASH',
      payment_status: 'Pending',
      status: 'orderPlaced'
    };

    console.log('📦 Order data:', JSON.stringify(orderData, null, 2));

    const orderRes = await axios.post('http://localhost:5000/api/orders', orderData);
    console.log('✅ Order created:', orderRes.data);

    console.log('\n🎉 COMPLETE ORDER FLOW SUCCESSFUL!');

  } catch (error) {
    console.error('\n❌ ERROR in order flow:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Request setup error');
    }
  }
}

testFrontendOrderFlow();