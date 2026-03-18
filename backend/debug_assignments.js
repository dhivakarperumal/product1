const db = require('./src/config/db');
async function run() {
  const [tu] = await db.query("SELECT id,username,email,role FROM users WHERE role='trainer'");
  const [asgn] = await db.query("SELECT id,trainer_id,trainer_name,status FROM trainer_assignments LIMIT 10");
  const [staff] = await db.query("SELECT id,name,email,username,role FROM staff LIMIT 20");
  
  // Write to a file for easier reading
  const fs = require('fs');
  const output = {
    trainer_users: tu,
    assignments: asgn,
    all_staff: staff
  };
  fs.writeFileSync('debug_output.json', JSON.stringify(output, null, 2));
  console.log('Written to debug_output.json');
  process.exit(0);
}
run().catch(e=>{ console.error(e.message); process.exit(1); });
