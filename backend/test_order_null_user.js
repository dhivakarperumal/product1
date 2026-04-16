const pool = require('./src/config/db');

async function testOrderCreationWithNull() {
  console.log('Testing order creation with NULL user_id...\n');
  
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅ Connection obtained');

    await connection.beginTransaction();
    console.log('✅ Transaction started');

    // Test data - NULL user_id
    const orderId = `ORD${String(1001).padStart(3, '0')}`; // ORD1001
    const userId = null; // No user association

    const insertOrderQuery = `INSERT INTO orders 
      (order_id,user_id,status,payment_status,total,payment_method,payment_id,order_type,shipping,pickup,order_track,notes,created_by,updated_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    
    const orderValues = [
      orderId,
      userId, // NULL - should work now
      'orderPlaced',
      'pending',
      450,
      'CASH',
      null,
      'DELIVERY',
      JSON.stringify({ name: 'Guest Customer', address: 'Test Address', city: 'Test City' }),
      null,
      JSON.stringify([]),
      null,
      null,
      null
    ];
    
    console.log('Inserting order (NULL user_id):', orderValues);
    const result = await connection.query(insertOrderQuery, orderValues);
    console.log('✅ Order inserted successfully');

    // Insert test item
    const itemQuery = `INSERT INTO order_items
      (order_id,product_id,product_name,price,qty,size,color,image)
      VALUES (?,?,?,?,?,?,?,?)`;
    
    const itemValues = [
      orderId,
      1,
      'Almond',
      450,
      1,
      '250g',
      null,
      ''
    ];
    
    console.log('Inserting order item...');
    await connection.query(itemQuery, itemValues);
    console.log('✅ Order item inserted successfully');

    await connection.commit();
    console.log('✅ Transaction committed successfully');

    // Verify
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE order_id = ?',
      [orderId]
    );
    console.log('\n✅ VERIFICATION - Order Details:');
    console.log(JSON.stringify(orders, null, 2));

    console.log('\n✅ ALL TESTS PASSED! Orders can now be created without user association.');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Error code:', err.code);
    console.error('SQL Message:', err.sqlMessage);
    
    if (connection) {
      try {
        await connection.rollback();
        console.log('✅ Transaction rolled back');
      } catch (rollbackErr) {
        console.error('❌ Rollback failed:', rollbackErr.message);
      }
    }
  } finally {
    if (connection) {
      await connection.release();
      console.log('✅ Connection released');
    }
    process.exit(0);
  }
}

testOrderCreationWithNull();
