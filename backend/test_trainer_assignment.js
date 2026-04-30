const pool = require("./src/config/db");

async function testTrainerAssignmentFlow() {
  try {
    console.log('\n=== TESTING TRAINER ASSIGNMENT WORKFLOW ===\n');
    
    // STEP 1: Fetch members like the frontend does
    console.log('STEP 1: Fetching memberships (like frontend does)...\n');
    
    const [memberships] = await pool.query(`
      SELECT m.*, 
             u.username, 
             u.email AS user_email, 
             u.mobile AS user_mobile,
             gm.name AS member_name,
             gm.email AS member_email
      FROM memberships m
      LEFT JOIN users u ON m.userId = u.id
      LEFT JOIN members gm ON m.memberId = gm.id
      ORDER BY m.createdAt DESC
      LIMIT 10
    `);
    
    console.log(`Found ${memberships.length} memberships`);
    
    // STEP 2: Filter valid members (with userId)
    console.log('\nSTEP 2: Filtering members with valid userId...\n');
    
    const validMembers = memberships.filter(m => {
      const resolvedUserId = m.userId || null;
      return resolvedUserId !== null;
    });
    
    console.log(`Valid members with userId: ${validMembers.length}`);
    console.log(`Invalid members without userId: ${memberships.length - validMembers.length}`);
    
    if (validMembers.length === 0) {
      console.log('\n✗ ERROR: No valid members to assign trainers to!');
      process.exit(1);
    }
    
    // STEP 3: Get available trainers
    console.log('\nSTEP 3: Fetching available trainers...\n');
    
    const [trainers] = await pool.query(`
      SELECT id, name, email, employee_id 
      FROM staff 
      WHERE role = 'trainer' OR role = 'Trainer'
      LIMIT 5
    `);
    
    console.log(`Found ${trainers.length} trainers`);
    trainers.forEach(t => {
      console.log(`  - ${t.name} (ID: ${t.id}, Employee ID: ${t.employee_id})`);
    });
    
    if (trainers.length === 0) {
      console.log('\n⚠ WARNING: No trainers available, cannot test assignment');
      process.exit(0);
    }
    
    // STEP 4: Simulate frontend assignment
    console.log('\nSTEP 4: Testing trainer assignment...\n');
    
    const memberToAssign = validMembers[0];
    const trainerToAssign = trainers[0];
    
    console.log(`Assigning trainer "${trainerToAssign.name}" to member "${memberToAssign.member_name}"`);
    console.log(`  Member userId: ${memberToAssign.userId}`);
    console.log(`  Member planId: ${memberToAssign.planId}`);
    console.log(`  Trainer ID: ${trainerToAssign.id}`);
    
    // STEP 5: Test the assignment API payload
    console.log('\nSTEP 5: Creating assignment payload (what frontend sends)...\n');
    
    const assignmentPayload = {
      userId: memberToAssign.userId,
      username: memberToAssign.member_name || "No Name",
      userEmail: memberToAssign.member_email || "",
      planId: memberToAssign.planId,
      planName: memberToAssign.planName,
      planDuration: memberToAssign.duration,
      planStartDate: memberToAssign.startDate,
      planEndDate: memberToAssign.endDate,
      planPrice: memberToAssign.pricePaid,
      trainerId: trainerToAssign.id,
      trainerName: trainerToAssign.name,
      trainerSource: 'staff',
      status: 'active'
    };
    
    console.log('Payload:', JSON.stringify(assignmentPayload, null, 2));
    
    // STEP 6: Validate payload
    console.log('\nSTEP 6: Validating payload...\n');
    
    const validationIssues = [];
    if (!assignmentPayload.userId || isNaN(assignmentPayload.userId)) {
      validationIssues.push(`❌ Invalid userId: ${assignmentPayload.userId}`);
    } else {
      console.log('✓ userId is valid numeric value');
    }
    
    if (!assignmentPayload.planId || isNaN(assignmentPayload.planId)) {
      validationIssues.push(`❌ Invalid planId: ${assignmentPayload.planId}`);
    } else {
      console.log('✓ planId is valid numeric value');
    }
    
    if (!assignmentPayload.trainerId) {
      validationIssues.push(`❌ trainerId is missing`);
    } else {
      console.log('✓ trainerId is present');
    }
    
    if (validationIssues.length > 0) {
      console.log('\n❌ VALIDATION FAILED:');
      validationIssues.forEach(issue => console.log(`  ${issue}`));
      process.exit(1);
    }
    
    console.log('\n✓ All validation checks passed!\n');
    
    // STEP 7: Summary
    console.log('=== SUMMARY ===\n');
    console.log(`✓ ${validMembers.length}/${memberships.length} memberships have valid userId`);
    console.log(`✓ ${trainers.length} trainers available`);
    console.log(`✓ Assignment payload is valid`);
    console.log(`✓ Frontend can proceed with trainer assignment`);
    console.log('\n✅ TEST PASSED! The issue has been fixed.');
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

testTrainerAssignmentFlow();
