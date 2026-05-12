const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('./src/config/db');

async function testFullAssignmentFlow() {
  try {
    console.log('\n=== TESTING FULL TRAINER ASSIGNMENT FLOW WITH FIXES ===\n');

    // Get the admin who created the memberships
    const [membershipsCheck] = await db.query('SELECT DISTINCT created_by FROM memberships WHERE created_by IS NOT NULL LIMIT 1');
    let adminUuid = null;
    
    if (membershipsCheck.length > 0) {
      // Use the admin who actually created the memberships
      adminUuid = membershipsCheck[0].created_by;
      console.log(`Found memberships created by admin UUID: ${adminUuid}`);
      
      // Get admin details
      const [adminDetails] = await db.query('SELECT id, email FROM users WHERE admin_uuid = ? LIMIT 1', [adminUuid]);
      if (adminDetails.length > 0) {
        const adminUser = adminDetails[0];
        console.log(`Using admin: ${adminUser.email}`);
        
        // Create token with this admin's UUID
        const JWT_SECRET = process.env.JWT_SECRET || 'secret';
        const mockToken = jwt.sign(
          {
            userId: adminUser.id,
            adminUuid: adminUuid,
            userUuid: adminUser.id.toString(),
            role: 'admin'
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
    } else {
      console.log('❌ No memberships found with admin UUID');
      process.exit(1);
    }

    // Step 1: Get memberships via the API (like the frontend does)
    console.log('STEP 1: Fetching memberships via /api/memberships...');
    let memberships = [];
    try {
      const membershipsRes = await axios.get('http://localhost:5000/api/memberships', {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      });
      memberships = membershipsRes.data.slice(0, 3);
      console.log(`✓ Fetched ${memberships.length} memberships`);
      memberships.forEach((m, i) => {
        console.log(`  [${i+1}] ${m.member_name || m.username} (${m.member_email || m.user_email}), userId: ${m.userId}`);
      });
    } catch (err) {
      console.log('✗ Error fetching memberships:', err.response?.status, err.response?.data);
      process.exit(1);
    }

    // Step 2: Get trainers
    console.log('\nSTEP 2: Fetching trainers...');
    let trainers = [];
    try {
      const trainersRes = await axios.get('http://localhost:5000/api/staff?role=trainer', {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      });
      trainers = Array.isArray(trainersRes.data) ? trainersRes.data : [];
      if (trainers.length > 0) {
        console.log(`✓ Found ${trainers.length} trainers`);
        console.log(`  Using trainer: ${trainers[0].name}`);
      } else {
        console.log('⚠ No trainers available');
      }
    } catch (err) {
      console.log('✗ Error fetching trainers:', err.message);
    }

    if (memberships.length === 0 || trainers.length === 0) {
      console.log('\n⚠ Not enough data to test assignment');
      process.exit(0);
    }

    // Step 3: Test trainer assignment for member without userId
    console.log('\nSTEP 3: Testing trainer assignment...');
    const memberToAssign = memberships[0];
    const trainer = trainers[0];

    // Prepare assignment payload (like the frontend does)
    const assignmentPayload = {
      assignments: [{
        userId: memberToAssign.userId || undefined,  // May be null/undefined
        username: memberToAssign.member_name || memberToAssign.username || 'Member',
        userEmail: memberToAssign.member_email || memberToAssign.user_email || '',
        planId: memberToAssign.planId || memberToAssign.plan_id || 1,
        planName: memberToAssign.planName || memberToAssign.plan_name || 'Plan',
        planDuration: memberToAssign.duration || null,
        planStartDate: memberToAssign.startDate || null,
        planEndDate: memberToAssign.endDate || null,
        planPrice: memberToAssign.pricePaid || 0,
        trainerId: trainer.id,
        trainerName: trainer.name || trainer.username || 'Trainer',
        trainerSource: 'staff',
        status: 'active'
      }]
    };

    console.log('Sending assignment payload:');
    console.log('  Member:', assignmentPayload.assignments[0].username);
    console.log('  Email:', assignmentPayload.assignments[0].userEmail);
    console.log('  UserID:', assignmentPayload.assignments[0].userId || '(will be resolved)');
    console.log('  Trainer:', assignmentPayload.assignments[0].trainerName);

    try {
      const assignRes = await axios.post('http://localhost:5000/api/assignments', assignmentPayload, {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('\n✅ ASSIGNMENT SUCCESSFUL!');
      console.log('Response:', assignRes.data);
      
      // Step 4: Verify the assignment was stored
      console.log('\nSTEP 4: Verifying assignment was stored...');
      const assignmentsRes = await axios.get('http://localhost:5000/api/assignments', {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const assignments = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : [];
      const lastAssignment = assignments[assignments.length - 1];
      if (lastAssignment) {
        console.log('✓ Latest assignment found:');
        console.log(`  User: ${lastAssignment.username}`);
        console.log(`  Trainer: ${lastAssignment.current_trainer_name}`);
        console.log(`  Status: ${lastAssignment.status}`);
      }
      
    } catch (err) {
      console.log('\n❌ ASSIGNMENT FAILED');
      if (err.response) {
        console.log(`Status: ${err.response.status}`);
        console.log('Error:', err.response.data);
      } else {
        console.log('Error:', err.message);
      }
    }

    console.log('\n=== TEST COMPLETE ===');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err.message);
    process.exit(1);
  }
}

testFullAssignmentFlow();
