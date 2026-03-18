const pool = require("./src/config/db");

async function checkOrders() {
  try {
    const [orders] = await pool.query("SELECT * FROM orders LIMIT 10");
    console.log("Orders in DB:", JSON.stringify(orders, null, 2));
    
    const [users] = await pool.query("SELECT id, email FROM users LIMIT 10");
    console.log("Users in DB:", JSON.stringify(users, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkOrders();
