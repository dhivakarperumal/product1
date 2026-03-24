#!/usr/bin/env node

require('dotenv').config();
const pool = require('./src/config/db');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

async function runTests() {
  console.log(`${colors.blue}🧪 Database Connection Tests${colors.reset}\n`);

  try {
    // Test 1: Basic connection
    console.log('Test 1: Testing database connection...');
    const [result] = await pool.query('SELECT 1 AS ok');
    if (result && result[0].ok === 1) {
      console.log(`${colors.green}✅ Database connection successful${colors.reset}\n`);
    }

    // Test 2: Check users table
    console.log('Test 2: Checking users table...');
    const [tables] = await pool.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = DATABASE()"
    );
    
    const columnNames = new Set(tables.map(t => t.COLUMN_NAME));
    const requiredColumns = ['id', 'email', 'password_hash', 'role', 'username', 'mobile'];
    const missingColumns = requiredColumns.filter(col => !columnNames.has(col));
    
    if (missingColumns.length === 0) {
      console.log(`${colors.green}✅ Users table has all required columns:${colors.reset}`);
      console.log('   ' + Array.from(columnNames).join(', '));
    } else {
      console.log(`${colors.red}❌ Missing columns: ${missingColumns.join(', ')}${colors.reset}`);
    }
    console.log();

    // Test 3: Check for google_id and picture columns
    console.log('Test 3: Checking for Google auth columns...');
    if (columnNames.has('google_id') && columnNames.has('picture')) {
      console.log(`${colors.green}✅ Google auth columns exist${colors.reset}\n`);
    } else {
      console.log(`${colors.yellow}⚠️  Google auth columns missing (will be added by migration)${colors.reset}\n`);
    }

    // Test 4: List existing users
    console.log('Test 4: Checking existing users...');
    const [users] = await pool.query('SELECT id, email, username, role FROM users LIMIT 5');
    if (users.length > 0) {
      console.log(`${colors.green}✅ Found ${users.length} user(s):${colors.reset}`);
      users.forEach(u => {
        console.log(`   - ${u.email || u.username} (role: ${u.role || 'N/A'})`);
      });
    } else {
      console.log(`${colors.yellow}⚠️  No users found in database${colors.reset}`);
    }
    console.log();

    console.log(`${colors.green}🎉 All tests completed!${colors.reset}`);
    
  } catch (err) {
    console.error(`${colors.red}❌ Error during tests:${colors.reset}`);
    console.error(`   Code: ${err.code || 'N/A'}`);
    console.error(`   Message: ${err.message}`);
    if (process.env.NODE_ENV === 'development') {
      console.error(`   Stack: ${err.stack}`);
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runTests();
