const axios = require('axios');

async function testOrderCreation() {
  try {
    console.log('Testing order creation...');

    // Test data similar to what frontend sends
    const orderData = {
      order_id: 'ORD999',
      user_id: 30, // Demo user
      status: 'orderPlaced',
      payment_status: 'pending',
      total: 100,
      payment_method: 'CASH',
      order_type: 'DELIVERY',
      shipping: {
        name: 'Test User',
        phone: '1234567890',
        address: 'Test Address',
        state: 'Test State'
      },
      items: [
        {
          product_id: 3,
          product_name: 'Almond',
          price: 50,
          qty: 1,
          size: '250g'
        }
      ]
    };

    console.log('Sending order data:', JSON.stringify(orderData, null, 2));

    const response = await axios.post('http://localhost:5000/api/orders', orderData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order created successfully:', response.data);

  } catch (error) {
    console.error('❌ Network error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
  }
}

testOrderCreation();