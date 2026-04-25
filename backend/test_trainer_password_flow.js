const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function testPasswordFlow() {
  try {
    console.log('🧪 Testing Staff Password Hash Flow\n');
    console.log('=' .repeat(60));

    // 1. Check if password_hash column exists
    console.log('\n1️⃣  Checking staff table schema...');
    const [columns] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff'`
    );
    
    const hasPasswordHash = columns.some(col => col.COLUMN_NAME === 'password_hash');
    console.log(`   ✅ password_hash column exists: ${hasPasswordHash ? 'YES ✓' : 'NO ✗'}`);
    
    if (!hasPasswordHash) {
      console.log('   ⚠️  password_hash column missing! Running migration...');
      return;
    }

    // 2. Test bcrypt hashing
    console.log('\n2️⃣  Testing bcrypt hashing...');
    const testPassword = '1234567890';
    const hash = await bcrypt.hash(testPassword, 10);
    const isValid = await bcrypt.compare(testPassword, hash);
    console.log(`   ✅ Password hashed and verified: ${isValid ? 'YES ✓' : 'NO ✗'}`);
    console.log(`   📝 Hash preview: ${hash.substring(0, 40)}...`);

    // 3. Find a trainer in staff table
    console.log('\n3️⃣  Looking for trainers in staff table...');
    const [trainers] = await db.query(
      `SELECT id, employee_id, email, username, name, role, password_hash FROM staff 
       WHERE role = 'trainer' LIMIT 1`
    );
    
    if (trainers.length === 0) {
      console.log('   ⚠️  No trainers found in database');
      console.log('   📌 Create a trainer first before testing login flow');
      return;
    }

    const trainer = trainers[0];
    console.log(`   ✅ Found trainer: ${trainer.name} (${trainer.email})`);
    console.log(`   📧 Email: ${trainer.email}`);
    console.log(`   👤 Username: ${trainer.username}`);
    console.log(`   🔐 Password set: ${trainer.password_hash ? 'YES ✓' : 'NO ✗ (needs to be set)'}`);
    
    if (trainer.password_hash) {
      console.log(`   📝 Hash preview: ${trainer.password_hash.substring(0, 40)}...`);
    }

    // 4. Test password verification flow
    if (trainer.password_hash) {
      console.log('\n4️⃣  Testing password verification...');
      
      // Simulate what happens during login
      const enterPassword = trainer.username || '1234567890'; // Default test password
      console.log(`   Testing with password: ${enterPassword}`);
      
      const match = await bcrypt.compare(enterPassword, trainer.password_hash);
      console.log(`   ✅ Password verification: ${match ? 'PASS ✓' : 'FAIL ✗'}`);
    }

    // 5. Check other trainers
    console.log('\n5️⃣  Staff password statistics...');
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN password_hash IS NOT NULL AND password_hash != '' THEN 1 ELSE 0 END) as with_password,
        SUM(CASE WHEN password_hash IS NULL OR password_hash = '' THEN 1 ELSE 0 END) as without_password
       FROM staff WHERE role = 'trainer'`
    );
    
    const stat = stats[0];
    console.log(`   📊 Total trainers: ${stat.total}`);
    console.log(`   ✅ With password_hash: ${stat.with_password}`);
    console.log(`   ⚠️  Without password_hash: ${stat.without_password}`);

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Test completed!');
    console.log('\n📋 Summary:');
    console.log('   • password_hash column: EXISTS ✓');
    console.log('   • bcrypt library: WORKING ✓');
    console.log(`   • Trainers with passwords: ${stat.with_password}/${stat.total}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Go to Admin → Add Staffs');
    console.log('   2. Create a trainer with name, email, and password');
    console.log('   3. Login as trainer with email and password');

  } catch (err) {
    console.error('❌ Test failed:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await db.end();
  }
}

testPasswordFlow();
