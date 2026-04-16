const pool = require('./src/config/db');

async function testOrderCreation() {
  console.log('Starting order creation test...');
  
  let connection;
  try {
    // Get a connection from the pool
    connection = await pool.getConnection();
    console.log('✅ Connection obtained');

    // Start transaction
    await connection.beginTransaction();
    console.log('✅ Transaction started');

    // Test data
    const orderId = `ORD${String(999).padStart(3, '0')}`; // ORD999
    const userId = 1; // or null to test

    // Insert order
    const insertOrderQuery = `INSERT INTO orders 
      (order_id,user_id,status,payment_status,total,payment_method,payment_id,order_type,shipping,pickup,order_track,notes,created_by,updated_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    
    const orderValues = [
      orderId,
      userId || null,
      'orderPlaced',
      'pending',
      450,
      'CASH',
      null,
      'DELIVERY',
      JSON.stringify({ name: 'Test', address: 'Test Address' }),
      null,
      JSON.stringify([]),
      null,
      null,
      null
    ];
    
    console.log('Inserting order with values:', orderValues);
    const result = await connection.query(insertOrderQuery, orderValues);
    console.log('✅ Order inserted successfully:', result);

    // Insert test item
    const itemQuery = `INSERT INTO order_items
      (order_id,product_id,product_name,price,qty,size,color,image)
      VALUES (?,?,?,?,?,?,?,?)`;
    
    const itemValues = [
      orderId,
      1,
      'Test Product',
      450,
      1,
      null,
      null,
      ''
    ];
    
    console.log('Inserting order item...');
    const itemResult = await connection.query(itemQuery, itemValues);
    console.log('✅ Order item inserted successfully:', itemResult);

    // Commit transaction
    await connection.commit();
    console.log('✅ Transaction committed successfully');

    // Verify the order was created
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE order_id = ?',
      [orderId]
    );
    console.log('✅ Order verification:', orders);

    console.log('\n✅ All tests passed!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Error code:', err.code);
    console.error('SQL State:', err.sqlState);
    console.error('SQL Message:', err.sqlMessage);
    console.error('Stack:', err.stack);
    
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

testOrderCreation();
