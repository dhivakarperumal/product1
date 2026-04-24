#!/usr/bin/env node
/**
 * Test script to verify the billing fix
 * This script tests the order creation endpoint with member_uuid
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000';

// Test member UUID - using actual member "kiwi" from database
const TEST_MEMBER_UUID = '705bcbf7-39f1-4e77-bda6-34d969585500';

async function testBillingFix() {
  try {
    console.log('🧪 Testing Billing Fix...\n');

    // Test 1: Create an order WITH member_uuid (should succeed)
    console.log('Test 1: Creating order WITH member_uuid...');
    const orderWithMember = {
      order_id: `ORD${String(Math.random() * 1000).split('.')[0]}`,
      member_uuid: TEST_MEMBER_UUID,
      user_id: null,
      status: 'orderPlaced',
      payment_status: 'paid',
      total: 1620,
      order_type: 'OFFLINE',
      shipping: {
        name: 'Test User',
        phone: '9876543210',
        email: 'test@example.com',
        address: 'Test Address, City'
      },
      billing_address: {
        name: 'Test User',
        phone: '9876543210',
        email: 'test@example.com',
        address: 'Test Address, City'
      },
      billing_name: 'Test User',
      billing_email: 'test@example.com',
      billing_phone: '9876543210',
      order_track: [
        {
          status: 'orderPlaced',
          time: new Date().toISOString()
        }
      ],
      items: [
        {
          product_id: 1,
          product_name: 'Dates',
          price: 900,
          qty: 1,
          size: '500g',
          color: null
        },
        {
          product_id: 2,
          product_name: 'Almond',
          price: 720,
          qty: 1,
          size: '500g',
          color: null
        }
      ]
    };

    try {
      const response = await axios.post(`${API_BASE}/orders`, orderWithMember);
      if (response.status === 201) {
        console.log('✅ Order created successfully with member_uuid!');
        console.log('Response:', response.data);
        console.log();
        return true;
      }
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('Member UUID required')) {
        console.log('❌ FAILED: Backend rejected order without member_uuid');
        console.log('Error:', err.response.data);
      } else {
        console.log('❌ Request failed:', err.response?.data || err.message);
      }
      console.log();
      return false;
    }

    // Test 2: Attempt to create order WITHOUT member_uuid (should fail with 400)
    console.log('Test 2: Attempting to create order WITHOUT member_uuid (should fail)...');
    const orderWithoutMember = {
      order_id: `ORD${String(Math.random() * 1000).split('.')[0]}`,
      user_id: null,
      status: 'orderPlaced',
      payment_status: 'paid',
      total: 1620,
      items: []
    };

    try {
      const response = await axios.post(`${API_BASE}/orders`, orderWithoutMember);
      console.log('❌ FAILED: Backend accepted order without member_uuid (should have rejected it)');
      console.log();
      return false;
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('Member UUID required')) {
        console.log('✅ Correctly rejected: Backend properly requires member_uuid');
        console.log('Error message:', err.response.data.message);
        console.log();
        return true;
      } else {
        console.log('❌ Unexpected error:', err.response?.data || err.message);
        console.log();
        return false;
      }
    }

  } catch (err) {
    console.error('Test execution error:', err.message);
    return false;
  }
}

// Run tests
testBillingFix().then(success => {
  console.log(success ? '\n✅ All tests passed!' : '\n❌ Some tests failed');
  process.exit(success ? 0 : 1);
});
