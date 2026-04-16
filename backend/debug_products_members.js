const pool = require("./src/config/db");

async function checkProductsAndMembers() {
  try {
    console.log("=== PRODUCTS DATA ===\n");
    
    // Check total products count
    const [productCount] = await pool.query("SELECT COUNT(*) as count FROM products");
    console.log(`Total products in database: ${productCount[0].count}\n`);
    
    // Check products with their created_by values
    const [products] = await pool.query(
      "SELECT id, name, created_by, created_at FROM products ORDER BY id DESC LIMIT 20"
    );
    console.log("Products (showing first 20):");
    products.forEach(p => {
      console.log(`  ID: ${p.id}, Name: ${p.name}, created_by: ${p.created_by || 'NULL'}, Created: ${p.created_at}`);
    });
    
    // Check how many have NULL created_by
    const [nullProducts] = await pool.query(
      "SELECT COUNT(*) as count FROM products WHERE created_by IS NULL"
    );
    console.log(`\nProducts with NULL created_by: ${nullProducts[0].count}`);
    
    // Check how many have non-NULL created_by (grouped by admin)
    const [byAdmin] = await pool.query(
      "SELECT created_by, COUNT(*) as count FROM products WHERE created_by IS NOT NULL GROUP BY created_by"
    );
    console.log("\nProducts grouped by created_by admin:");
    byAdmin.forEach(row => {
      console.log(`  Admin UUID: ${row.created_by}, Count: ${row.count}`);
    });
    
    console.log("\n=== MEMBERS DATA ===\n");
    
    // Check total members
    const [memberCount] = await pool.query("SELECT COUNT(*) as count FROM members");
    console.log(`Total members in database: ${memberCount[0].count}\n`);
    
    // Check members with their created_by (admin UUID)
    const [members] = await pool.query(
      "SELECT id, name, email, created_by, created_at FROM members ORDER BY id DESC LIMIT 20"
    );
    console.log("Members (showing first 20):");
    members.forEach(m => {
      console.log(`  ID: ${m.id}, Name: ${m.name}, Email: ${m.email}, Admin (created_by): ${m.created_by || 'NULL'}, Created: ${m.created_at}`);
    });
    
    // Check member-to-admin mapping
    const [membersByAdmin] = await pool.query(
      "SELECT created_by, COUNT(*) as count FROM members WHERE created_by IS NOT NULL GROUP BY created_by"
    );
    console.log("\nMembers grouped by Admin (created_by):");
    membersByAdmin.forEach(row => {
      console.log(`  Admin UUID: ${row.created_by}, Member Count: ${row.count}`);
    });
    
    console.log("\n=== API ENDPOINT CHECK ===\n");
    
    // Check the productRoutes to see how endpoints are configured
    console.log("Checking API routes configuration...");
    
    console.log("\n=== SUMMARY ===");
    console.log(`Total Products: ${productCount[0].count}`);
    console.log(`Products with NULL created_by: ${nullProducts[0].count}`);
    console.log(`Products with admin UUID: ${productCount[0].count - nullProducts[0].count}`);
    console.log(`Total Members: ${memberCount[0].count}`);
    console.log(`Admin UUIDs in products: ${byAdmin.length}`);
    console.log(`Admin UUIDs with members: ${membersByAdmin.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkProductsAndMembers();
