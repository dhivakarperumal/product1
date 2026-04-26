const axios = require('axios');
const db = require('./src/config/db');
const jwt = require('jsonwebtoken');

async function run() {
  try {
    console.log('=== TESTING ASSIGNMENTS API WITH MOCK TOKEN ===\n');

    // Get an admin user and create a valid token
    const [admins] = await db.query(`
      SELECT id, email, username, user_uuid FROM users WHERE role = 'admin' LIMIT 1
    `);

    if (admins.length === 0) {
      console.log('No admin user found');
      process.exit(1);
    }

    const admin = admins[0];
    console.log(`Admin user: ${admin.email} (user_uuid: ${admin.user_uuid})`);

    // Create a valid JWT token
    const token = jwt.sign(
      {
        userId: admin.id,
        useruser_uuid: admin.user_uuid,
        adminuser_uuid: admin.user_uuid,
        role: 'admin',
        email: admin.email
      },
      process.env.JWT_SECRET || 'defaultSecret',
      { expiresIn: '24h' }
    );

    console.log(`Created JWT token for admin\n`);

    // Make API call with token
    console.log('Making API call to /api/assignments...\n');
    const response = await axios.get('http://localhost:5000/api/assignments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const assignments = response.data;
    console.log(`✅ SUCCESS! Received ${assignments.length} assignments\n`);

    if (assignments.length > 0) {
      console.log('Sample assignments:');
      assignments.slice(0, 5).forEach((a, i) => {
        console.log(`  [${i+1}] User: ${a.userId} (${a.username}), Trainer: ${a.trainerId} (${a.trainerName}), Status: ${a.status}`);
      });
    }

  } catch (err) {
    if (err.response) {
      console.error('API Error:', err.response.status, err.response.data);
    } else {
      console.error('ERROR:', err.message);
    }
  }
  process.exit();
}

run();
