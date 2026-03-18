const pool = require("./src/config/db");

async function checkOrders() {
  try {
    const [orders] = await pool.query("SELECT id, order_id, user_id FROM orders");
    console.log("All Orders:", orders);
    
    const [user] = await pool.query("SELECT id, email FROM users WHERE email = 'cemcadhivakar23@gmail.com'");
    console.log("Current User:", user);
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkOrders();
