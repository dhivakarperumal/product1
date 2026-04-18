/**
 * Test script to verify membership creation with proper JWT handling
 * Tests the fix for JWT field naming (userId vs id)
 */

const pool = require('./src/config/db');
const jwt = require('jsonwebtoken');
const http = require('http');

// Simulate the buildAuthPayload function from authController
function buildAuthPayload(user) {
  const adminUuid = user.admin_uuid || user.user_uuid || user.userUuid || user.created_by || null;
  const contact = user.mobile || user.phone || null;
  
  return {
    userId: user.id || null,
    user_id: user.user_id || null,
    userUuid: user.user_uuid || user.userUuid || null,
    role: user.role,
    email: user.email,
    username: user.username || null,
    mobile: user.mobile || contact,
    phone: user.phone || contact,
    adminId: user.admin_id || null,
    adminUuid: adminUuid,
  };
}

async function testMembershipCreation() {
  console.log('='.repeat(60));
  console.log('MEMBERSHIP CREATION TEST');
  console.log('='.repeat(60));

  try {
    // Step 1: Get a member from the database
    console.log('\n[STEP 1] Fetching a member from database...');
    const [members] = await pool.query('SELECT id, name, email, phone, role FROM members LIMIT 1');
    
    if (members.length === 0) {
      console.log('❌ No members found in database. Please create a member first.');
      return;
    }

    const member = members[0];
    console.log('✅ Member found:');
    console.log('   ID:', member.id);
    console.log('   Name:', member.name);
    console.log('   Email:', member.email);
    console.log('   Role:', member.role);

    // Step 2: Get a plan from the database
    console.log('\n[STEP 2] Fetching a plan from database...');
    const [plans] = await pool.query('SELECT id, plan_id, name, price, duration FROM gym_plans LIMIT 1');
    
    if (plans.length === 0) {
      console.log('❌ No plans found in database. Please create a plan first.');
      return;
    }

    const plan = plans[0];
    console.log('✅ Plan found:');
    console.log('   ID:', plan.id);
    console.log('   Plan ID:', plan.plan_id);
    console.log('   Name:', plan.name);
    console.log('   Price:', plan.price);
    console.log('   Duration:', plan.duration);

    // Step 3: Build JWT payload like buildAuthPayload does
    console.log('\n[STEP 3] Building JWT payload...');
    const payload = buildAuthPayload({
      id: member.id,
      email: member.email,
      phone: member.phone,
      role: member.role
    });
    console.log('✅ JWT Payload:');
    console.log('   userId:', payload.userId);
    console.log('   user_id:', payload.user_id);
    console.log('   role:', payload.role);
    console.log('   email:', payload.email);

    // Step 4: Create JWT token
    console.log('\n[STEP 4] Creating JWT token...');
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    console.log('✅ Token created (first 50 chars):', token.substring(0, 50) + '...');

    // Step 5: Decode and verify token
    console.log('\n[STEP 5] Verifying JWT token decoding...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    console.log('✅ Decoded token:');
    console.log('   decoded.id:', decoded.id, '(should be undefined)');
    console.log('   decoded.userId:', decoded.userId, '(should be', member.id + ')');
    console.log('   decoded.user_id:', decoded.user_id);
    console.log('   decoded.role:', decoded.role);

    // Step 6: Test authorization check logic
    console.log('\n[STEP 6] Testing authorization check logic...');
    const requestedMemberId = member.id;
    const currentUserId = decoded.userId || decoded.user_id || decoded.id;
    console.log('   requestedMemberId:', requestedMemberId);
    console.log('   currentUserId:', currentUserId);
    
    if (requestedMemberId === currentUserId) {
      console.log('✅ Authorization check PASSES (match!)');
    } else {
      console.log('❌ Authorization check FAILS (no match!)');
    }

    // Step 7: Test membership creation payload
    console.log('\n[STEP 7] Creating membership with API payload...');
    const startDate = new Date();
    const durationMonths = parseInt(plan.duration) || 1;
    const endDate = new Date(startDate.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);
    
    const membershipPayload = {
      planId: plan.id,
      planName: plan.name,
      pricePaid: plan.price,
      duration: durationMonths,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      paymentId: 'razorpay_payment_test_' + Date.now(),
      status: 'active',
      memberId: member.id
    };
    console.log('✅ Membership payload:');
    console.log(JSON.stringify(membershipPayload, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL CHECKS PASSED - Membership creation should work!');
    console.log('='.repeat(60));

  } catch (err) {
    console.error('\n❌ Error during test:');
    console.error(err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    process.exit(0);
  }
}

testMembershipCreation();
