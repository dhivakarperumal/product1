const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('./src/config/db');

async function testAssignmentAPI() {
  try {
    console.log('\n=== TESTING ASSIGNMENT API WITH FIXES ===\n');

    // Create a mock admin token
    const mockToken = jwt.sign(
      {
        userId: 1,
        adminUuid: '11111111-1111-1111-1111-111111111111',
        userUuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        role: 'admin'
      },
      'test-secret',
      { expiresIn: '24h' }
    );

    // Get a membership and trainer
    const [memberships] = await db.query(`
      SELECT m.id, m.userId, m.member_email, m.planId, m.planName
      FROM memberships m
      WHERE m.member_email IS NOT NULL
      LIMIT 1
    `);

    const [trainers] = await db.query('SELECT id FROM staff WHERE role = "trainer" LIMIT 1');

    if (memberships.length === 0 || trainers.length === 0) {
      console.log('Not enough data to test');
      process.exit(0);
    }

    const membership = memberships[0];
    const trainerId = trainers[0].id;

    console.log('Test Scenario: Assigning trainer to member without user account');
    console.log(`  Membership ID: ${membership.id}`);
    console.log(`  Member Email: ${membership.member_email}`);
    console.log(`  Member UserID in DB: ${membership.userId}`);
    console.log(`  Plan ID: ${membership.planId}`);
    console.log(`  Trainer ID: ${trainerId}\n`);

    // Test 1: Try assignment without userId (should use email fallback)
    console.log('TEST 1: Assignment payload without userId (email-based fallback)');
    const payload1 = {
      assignments: [{
        userId: undefined,  // No userId provided
        username: 'Member Name',
        userEmail: membership.member_email,  // Only email
        planId: membership.planId,
        planName: membership.planName || 'Plan',
        trainerId: trainerId,
        trainerName: 'Test Trainer',
        status: 'active'
      }]
    };

    console.log('Sending payload:', JSON.stringify(payload1, null, 2));
    
    try {
      const response = await axios.post('http://localhost:5000/api/assignments', payload1, {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✓ Response:', response.status, response.data);
    } catch (err) {
      if (err.response) {
        console.log(`✗ Error: ${err.response.status}`);
        console.log('  Message:', err.response.data);
      } else {
        console.log('✗ Request failed:', err.message);
      }
    }

    console.log('\n=== TEST COMPLETE ===');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testAssignmentAPI();
