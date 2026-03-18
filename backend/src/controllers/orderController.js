const pool = require('../config/db');

// Helper function to parse JSON fields
const parseOrder = (order) => {
  if (!order) return order;
  return {
    ...order,
    shipping: typeof order.shipping === 'string' ? JSON.parse(order.shipping || '{}') : (order.shipping || {}),
    pickup: typeof order.pickup === 'string' ? JSON.parse(order.pickup || '{}') : (order.pickup || {}),
    order_track: typeof order.order_track === 'string' ? JSON.parse(order.order_track || '[]') : (order.order_track || [])
  };
};

// fetch all orders (most recent first) with their items
async function getAllOrders(req, res) {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );
    
    if (orders.length === 0) {
      return res.json([]);
    }

    // Get all items for these orders in one go
    const orderIds = orders.map(o => o.order_id);
    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id IN (?)',
      [orderIds]
    );

    // Group items by order_id
    const ordersWithItems = orders.map(order => {
      return {
        ...parseOrder(order),
        items: items.filter(item => item.order_id === order.order_id)
      };
    });

    return res.json(ordersWithItems);
  } catch (err) {
    console.error('getAllOrders error', err);
    res.status(500).json({ message: 'Server error' });
  }
}


// fetch single order by order_id
async function getOrder(req, res) {
  const { id } = req.params;

  try {

    const [order] = await pool.query(
      "SELECT * FROM orders WHERE order_id = ?",
      [id]
    );

    if (order.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const [items] = await pool.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [id]
    );

    res.json({
      ...order[0],
      items
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// update order status and optionally cancelled reason or shipping info
async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status, cancelledReason, courierName, docketNumber } = req.body;
  if (!status) return res.status(400).json({ message: 'status required' });
  try {
    // Get the current order_track
    const [existingOrder] = await pool.query(
      'SELECT order_track FROM orders WHERE order_id = ?',
      [id]
    );

    let trackArray = [];
    if (existingOrder.length > 0 && existingOrder[0].order_track) {
      try {
        trackArray = JSON.parse(existingOrder[0].order_track);
      } catch (e) {
        trackArray = [];
      }
    }
    
    // Add new status to track
    trackArray.push({ status, time: new Date() });

    // Build update query dynamically to avoid overwriting existing tracking info if not provided
    let query = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP, order_track = ?';
    let params = [status, JSON.stringify(trackArray)];

    if (courierName) {
      query += ', courier_name = ?';
      params.push(courierName);
    }
    if (docketNumber) {
      query += ', docket_number = ?';
      params.push(docketNumber);
    }

    query += ' WHERE order_id = ?';
    params.push(id);

    await pool.query(query, params);
    
    const [updated] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [id]);
    res.json(parseOrder(updated[0]));
  } catch (err) {
    console.error('updateOrderStatus error', err);
    res.status(500).json({ message: 'Server error' });
  }
}


// create new order
async function createOrder(req, res) {
  const data = req.body;
  console.log("Creating order with data:", data);

  if (!data.order_id) {
    console.error("Missing order_id");
    return res.status(400).json({ message: "order_id required" });
  }

  // normalize order_id formatting (ensure ORD### pattern)
  if (typeof data.order_id === 'string') {
    const num = parseInt(data.order_id.replace(/[^0-9]/g, ''), 10) || 0;
    data.order_id = `ORD${String(num).padStart(3, '0')}`;
  }
  console.log("Normalized order_id:", data.order_id);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    console.log("Transaction started");

    // Insert order
    const insertOrderQuery = `INSERT INTO orders 
      (order_id,user_id,status,payment_status,total,payment_method,payment_id,order_type,shipping,pickup,order_track,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
    
    const orderValues = [
      data.order_id,
      data.user_id || null,
      data.status || "orderPlaced",
      data.payment_status || "pending",
      data.total || 0,
      data.payment_method || "CASH",
      data.payment_id || null,
      data.order_type || null,
      data.shipping ? JSON.stringify(data.shipping) : null,
      data.pickup ? JSON.stringify(data.pickup) : null,
      JSON.stringify(data.order_track || []),
      data.notes || null
    ];
    
    console.log("Inserting order with values:", orderValues);
    await connection.query(insertOrderQuery, orderValues);
    console.log("Order inserted successfully");

    // Insert order items (frontend may send various key names)
    if (Array.isArray(data.items) && data.items.length > 0) {
      console.log("Inserting", data.items.length, "order items");
      
      for (const raw of data.items) {
        // normalise keys from frontend
        const product_id = raw.product_id || raw.productId || null;
        const product_name = raw.product_name || raw.name || null;
        const price = raw.price || 0;
        const qty = raw.qty || raw.quantity || 0;
        const size = raw.size || raw.weight || null;
        const color = raw.color || null;
        // image may be array or single
        let image = raw.image || "";
        if (!image && raw.images) {
          if (Array.isArray(raw.images)) image = raw.images[0] || "";
          else image = raw.images;
        }

        console.log("Inserting item:", { product_id, product_name, price, qty, size, color });
        if (image && image.length) {
          console.log("item image length", image.length);
          // warn if we're about to insert a very long string (likely base64)
          if (image.length > 1000) {
            console.warn("large image detected; consider storing URL instead");
          }
        }

        await connection.query(
          `INSERT INTO order_items
          (order_id,product_id,product_name,price,qty,size,color,image)
          VALUES (?,?,?,?,?,?,?,?)`,
          [
            data.order_id,
            product_id,
            product_name,
            price,
            qty,
            size,
            color,
            image
          ]
        );
      }
    }

    await connection.commit();
    console.log("Transaction committed successfully");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order_id: data.order_id
    });

  } catch (err) {
    console.error("Order creation error:", err);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    await connection.rollback();
    res.status(500).json({ 
      success: false,
      message: err.message || "Server error", 
      error: process.env.NODE_ENV === 'development' ? err : undefined 
    });

  } finally {
    connection.release();
  }
}


async function generateOrderId(req, res) {
  try {
    console.log("Generating next order ID...");

    const [rows] = await pool.query(
      "SELECT order_id FROM orders WHERE order_id LIKE 'ORD%' ORDER BY id DESC LIMIT 1"
    );

    let nextNumber = 1;

    if (rows.length > 0 && rows[0].order_id) {
      const lastOrderId = rows[0].order_id; // ORD001
      console.log("Last order ID:", lastOrderId);
      
      // Extract number from ORD001 format
      const numberMatch = lastOrderId.match(/\d+/);
      if (numberMatch) {
        const number = parseInt(numberMatch[0], 10);
        nextNumber = number + 1;
      }
    }

    const order_id = `ORD${String(nextNumber).padStart(3, "0")}`;
    console.log("Generated order ID:", order_id);

    res.json({ order_id });

  } catch (err) {
    console.error("Generate order ID error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

// fetch all orders for a specific user with their items
async function getUserOrders(req, res) {
  const { userId } = req.params;
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    if (orders.length === 0) {
      return res.json([]);
    }

    // Get all items for all orders of this user in one go
    const orderIds = orders.map(o => o.order_id);
    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id IN (?)',
      [orderIds]
    );

    // Group items by order_id
    const ordersWithItems = orders.map(order => {
      return {
        ...parseOrder(order),
        items: items.filter(item => item.order_id === order.order_id)
      };
    });

    return res.json(ordersWithItems);
  } catch (err) {
    console.error('getUserOrders error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// fetch today's orders
async function getTodayOrders(req, res) {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE DATE(created_at) = CURDATE() ORDER BY created_at DESC'
    );
    
    if (orders.length === 0) {
      return res.json([]);
    }

    const orderIds = orders.map(o => o.order_id);
    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id IN (?)',
      [orderIds]
    );

    const ordersWithItems = orders.map(order => {
      return {
        ...parseOrder(order),
        items: items.filter(item => item.order_id === order.order_id)
      };
    });

    return res.json(ordersWithItems);
  } catch (err) {
    console.error('getTodayOrders error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { 
  getAllOrders, 
  getOrder, 
  updateOrderStatus, 
  createOrder, 
  generateOrderId, 
  getUserOrders,
  getTodayOrders
};
