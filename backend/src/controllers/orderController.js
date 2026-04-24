const pool = require('../config/db');
const { getActorUuid } = require('../utils/auditTrail');

// Extract admin UUID from request user
const getAdminUuid = (user) =>
  user?.adminUuid || user?.userUuid || user?.admin_uuid || user?.user_uuid || null;

// Helper function to construct proper image URLs
const constructImageUrl = (imageData) => {
  if (!imageData) return null;
  
  // Already a full URL
  if (typeof imageData === 'string' && (imageData.startsWith('http') || imageData.startsWith('data:'))) {
    return imageData;
  }
  
  // Try to parse JSON (in case it's stored as JSON array)
  let imagePath = imageData;
  if (typeof imageData === 'string') {
    try {
      const parsed = JSON.parse(imageData);
      imagePath = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch (e) {
      // Not JSON, use as-is
    }
  }
  
  if (!imagePath) return null;
  
  // Make sure it's a string
  imagePath = String(imagePath).trim();
  if (!imagePath) return null;
  
  // If it's a relative path, construct the full URL
  if (!imagePath.startsWith('http') && !imagePath.startsWith('data:')) {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/${imagePath.replace(/^\/+/, '')}`;
  }
  
  return imagePath;
};

// Helper function to parse JSON fields
const parseOrder = (order) => {
  if (!order) return order;
  return {
    ...order,
    shipping: typeof order.shipping === 'string' ? JSON.parse(order.shipping || '{}') : (order.shipping || {}),
    billing_address: typeof order.billing_address === 'string' ? JSON.parse(order.billing_address || '{}') : (order.billing_address || {}),
    pickup: typeof order.pickup === 'string' ? JSON.parse(order.pickup || '{}') : (order.pickup || {}),
    order_track: typeof order.order_track === 'string' ? JSON.parse(order.order_track || '[]') : (order.order_track || [])
  };
};

// fetch all orders (most recent first) with their items
async function getAllOrders(req, res) {
  try {
    // Check if user is super admin
    const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
    const adminUuid = getAdminUuid(req.user);
    // Get optional admin filter from query params (for super admin)
    const filterAdminUuid = req.query.adminUuid || req.query.admin_uuid || null;

    let ordersQuery = '';
    let params = [];

    if (isSuperAdmin && filterAdminUuid) {
      // Super admin filtering by specific admin: show orders for members managed by that admin
      ordersQuery = `SELECT o.* FROM orders o
        LEFT JOIN members m ON o.member_uuid = m.member_id
        WHERE m.created_by = ?
        ORDER BY o.created_at DESC`;
      params.push(filterAdminUuid);
    } else if (req.user && adminUuid) {
      // Both super admin (no filter) and regular admin: show only orders for members managed by this admin
      ordersQuery = `SELECT o.* FROM orders o
        LEFT JOIN members m ON o.member_uuid = m.member_id
        WHERE m.created_by = ?
        ORDER BY o.created_at DESC`;
      params.push(adminUuid);
    } else {
      // Fallback: show all orders (shouldn't happen in normal cases)
      ordersQuery = 'SELECT * FROM orders ORDER BY created_at DESC';
    }

    const [orders] = await pool.query(ordersQuery, params);

    // Return empty array if no orders found
    if (!orders || orders.length === 0) {
      return res.json([]);
    }

    // Get all items for these orders in one go
    const orderIds = orders.map(o => o.order_id);
    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id IN (?)',
      [orderIds]
    );

    // Get product images for items that are missing them
    const itemsWithoutImages = items.filter(item => !item.image || (typeof item.image === 'string' && item.image.trim() === ''));
    const productIds = [...new Set(itemsWithoutImages.map(item => item.product_id).filter(Boolean))];
    
    let productImages = {};
    if (productIds.length > 0) {
      const [products] = await pool.query(
        'SELECT id, images FROM products WHERE id IN (?)',
        [productIds]
      );
      productImages = products.reduce((acc, prod) => {
        const imageUrl = constructImageUrl(prod.images);
        if (imageUrl) {
          acc[prod.id] = imageUrl;
        }
        return acc;
      }, {});
    }

    // Enrich items with product images if missing
    const enrichedItems = items.map(item => {
      if ((!item.image || (typeof item.image === 'string' && item.image.trim() === '')) && item.product_id && productImages[item.product_id]) {
        return {
          ...item,
          image: productImages[item.product_id]
        };
      }
      return {
        ...item,
        image: item.image ? constructImageUrl(item.image) : null
      };
    });

    // Group items by order_id
    const ordersWithItems = orders.map(order => {
      return {
        ...parseOrder(order),
        items: enrichedItems.filter(item => item.order_id === order.order_id)
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

    // Get product images for items that are missing them
    const itemsWithoutImages = items.filter(item => !item.image || (typeof item.image === 'string' && item.image.trim() === ''));
    const productIds = [...new Set(itemsWithoutImages.map(item => item.product_id).filter(Boolean))];
    
    let productImages = {};
    if (productIds.length > 0) {
      const [products] = await pool.query(
        'SELECT id, images FROM products WHERE id IN (?)',
        [productIds]
      );
      productImages = products.reduce((acc, prod) => {
        const imageUrl = constructImageUrl(prod.images);
        if (imageUrl) {
          acc[prod.id] = imageUrl;
        }
        return acc;
      }, {});
    }

    // Enrich items with product images if missing
    const enrichedItems = items.map(item => {
      if ((!item.image || (typeof item.image === 'string' && item.image.trim() === '')) && item.product_id && productImages[item.product_id]) {
        return {
          ...item,
          image: productImages[item.product_id]
        };
      }
      return {
        ...item,
        image: item.image ? constructImageUrl(item.image) : null
      };
    });

    res.json({
      ...order[0],
      items: enrichedItems
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
  if (!status) {
    console.warn(`[OrderStatus] No status provided in request body for order_id:`, id, 'Body:', req.body);
    return res.status(400).json({ message: 'status required' });
  }
  try {
    console.log(`[OrderStatus] Attempting to update order_id:`, id, 'to status:', status, 'Body:', req.body, 'User:', req.user);
    // Normalize order_id format if needed
    let normalizedId = id;
    if (typeof id === 'string' && !id.startsWith('ORD')) {
      const num = parseInt(id.replace(/[^0-9]/g, ''), 10) || 0;
      normalizedId = `ORD${String(num).padStart(3, '0')}`;
    }
    // Get the current order_track
    const [existingOrder] = await pool.query(
      'SELECT order_track FROM orders WHERE order_id = ?',
      [normalizedId]
    );

    if (existingOrder.length === 0) {
      console.warn(`[OrderStatus] Order not found for id:`, normalizedId, 'Requested by user:', req.user);
      return res.status(404).json({ message: 'Order not found' });
    }

    let trackArray = [];
    if (existingOrder[0].order_track) {
      try {
        trackArray = JSON.parse(existingOrder[0].order_track);
      } catch (e) {
        trackArray = [];
      }
    }
    // Add new status to track
    trackArray.push({ status, time: new Date() });

    const updatedBy = getActorUuid(req.user) || null;

    // Build update query dynamically to avoid overwriting existing tracking info if not provided
    let query = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP, order_track = ?, updated_by = ?';
    let params = [status, JSON.stringify(trackArray), updatedBy];

    if (courierName) {
      query += ', courier_name = ?';
      params.push(courierName);
    }
    if (docketNumber) {
      query += ', docket_number = ?';
      params.push(docketNumber);
    }

    query += ' WHERE order_id = ?';
    params.push(normalizedId);

    const [result] = await pool.query(query, params);
    if (result.affectedRows === 0) {
      console.error(`[OrderStatus] Update failed for order_id:`, normalizedId, 'Query:', query, 'Params:', params, 'User:', req.user);
      return res.status(500).json({ message: 'Failed to update order status (no rows affected)' });
    }

    const [updated] = await pool.query('SELECT * FROM orders WHERE order_id = ?', [normalizedId]);
    if (!updated[0]) {
      console.error(`[OrderStatus] Order updated but not found for id:`, normalizedId, 'User:', req.user);
      return res.status(500).json({ message: 'Order updated but not found' });
    }
    res.json(parseOrder(updated[0]));
  } catch (err) {
    console.error('[OrderStatus] updateOrderStatus error', err, 'Request body:', req.body, 'User:', req.user);
    res.status(500).json({ message: 'Server error', error: err.message });
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

    // Helper to validate and normalize UUID-like strings (reject numeric-only values)
    const normalizeUuid = (value) => {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      if (trimmed.length === 0) return null;
      // Reject numeric-only values like "5" or "123"
      if (/^\d+$/.test(trimmed)) return null;
      return trimmed;
    };

    // Resolve the member's UUID from available data and membership records.
    let memberUuid = normalizeUuid(data.member_uuid) || normalizeUuid(data.memberUuid) || null;
    if (req.user) {
      memberUuid =
        normalizeUuid(req.user.memberUuid) ||
        normalizeUuid(req.user.member_uuid) ||
        normalizeUuid(req.user.member_id) ||
        memberUuid ||
        null;
    }
    console.log("Resolved member UUID from request/auth:", memberUuid);

    // Use only a valid users.id for order.user_id. Do not store member record IDs in orders.user_id.
    let validUserId = null;
    let validMemberUuid = memberUuid;
    const incomingUserId = data.user_id || req.user?.userId || req.user?.user_id || null;

    if (incomingUserId) {
      const [userRows] = await connection.query(
        'SELECT id FROM users WHERE id = ? LIMIT 1',
        [incomingUserId]
      );
      if (userRows.length > 0) {
        validUserId = incomingUserId;
        console.log("Valid users.id found for order.user_id:", validUserId);
      } else {
        const [memberRows] = await connection.query(
          'SELECT member_id FROM members WHERE id = ? LIMIT 1',
          [incomingUserId]
        );
        if (memberRows.length > 0) {
          const memberIdValue = normalizeUuid(memberRows[0].member_id);
          if (memberIdValue) {
            validMemberUuid = memberIdValue;
            console.log("Resolved member_uuid from members.id:", validMemberUuid);
          }
        } else {
          console.warn("Incoming user_id", incomingUserId, "is not a valid users.id or members.id. Will omit order.user_id.");
        }
      }
    }

    // For member / trainer sessions where req.user is a members record with only id, resolve member_uuid if missing.
    if (!validMemberUuid && req.user && ['member', 'trainer'].includes((req.user.role || '').toLowerCase())) {
      const memberLookupId = req.user.userId || req.user.user_id || req.user.id;
      if (memberLookupId) {
        const [memberRows] = await connection.query(
          'SELECT member_id FROM members WHERE id = ? LIMIT 1',
          [memberLookupId]
        );
        if (memberRows.length > 0) {
          const memberIdValue = normalizeUuid(memberRows[0].member_id);
          if (memberIdValue) {
            validMemberUuid = memberIdValue;
            console.log("Resolved member_uuid from req.user member record:", validMemberUuid);
          }
        }
      }
    }

    console.log("Storing user_id:", validUserId, "member_uuid:", validMemberUuid);

    // If still no member UUID, this order cannot be created without audit trail
    if (!validMemberUuid) {
      console.warn("No valid member UUID found for order. Cannot create order without member UUID.");
      return res.status(400).json({ message: "Member UUID required for order creation" });
    }

    // Fetch member's created_by and updated_by for audit and admin linkage
    const [memberAuditRows] = await connection.query(
      'SELECT created_by, updated_by FROM members WHERE member_id = ? LIMIT 1',
      [validMemberUuid]
    );
    let memberCreatedBy = null;
    let memberUpdatedBy = null;
    if (memberAuditRows.length > 0) {
      memberCreatedBy = memberAuditRows[0].created_by;
      memberUpdatedBy = memberAuditRows[0].updated_by;
    }

    // Use shipping address as billing address if not provided separately
    const billingAddress = data.billing_address || data.shipping;
    const billingName = data.billing_name || data.shipping?.name || null;
    const billingEmail = data.billing_email || data.shipping?.email || null;
    const billingPhone = data.billing_phone || data.shipping?.phone || null;

    // Insert order with admin_uuid, created_by, updated_by from member
    const insertOrderQuery = `INSERT INTO orders 
      (order_id,user_id,member_uuid,status,payment_status,total,payment_method,payment_id,order_type,shipping,billing_address,billing_name,billing_email,billing_phone,pickup,order_track,notes,created_by,updated_by,admin_uuid)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const orderValues = [
      data.order_id,
      validUserId || null,
      validMemberUuid || null,
      data.status || "orderPlaced",
      data.payment_status || "pending",
      data.total || 0,
      data.payment_method || "CASH",
      data.payment_id || null,
      data.order_type || null,
      data.shipping ? JSON.stringify(data.shipping) : null,
      billingAddress ? JSON.stringify(billingAddress) : null,
      billingName,
      billingEmail,
      billingPhone,
      data.pickup ? JSON.stringify(data.pickup) : null,
      JSON.stringify(data.order_track || []),
      data.notes || null,
      validMemberUuid, // created_by is member's UUID
      memberUpdatedBy,
      memberCreatedBy // admin_uuid is member's created_by
    ];
    
    console.log("Inserting order with values:", orderValues);
    await connection.query(insertOrderQuery, orderValues);
    console.log("Order inserted successfully");

    // Insert order items (frontend may send various key names) and update stock inside the same transaction
    if (Array.isArray(data.items) && data.items.length > 0) {
      console.log("Inserting", data.items.length, "order items");
      
      for (const raw of data.items) {
        // normalise keys from frontend
        const product_id = raw.product_id || raw.productId || null;
        const product_name = raw.product_name || raw.name || null;
        const price = raw.price || 0;
        const qty = Number(raw.qty ?? raw.quantity ?? 0) || 0;
        const size = raw.size || raw.weight || raw.variant || null;
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

        if (product_id && qty > 0 && size) {
          const [productRows] = await connection.query(
            'SELECT stock FROM products WHERE id = ? FOR UPDATE',
            [product_id]
          );

          if (productRows.length === 0) {
            throw new Error(`Product ${product_id} not found for stock update`);
          }

          let stock = {};
          try {
            stock = JSON.parse(productRows[0].stock || '{}');
          } catch (err) {
            stock = {};
          }

          if (!stock || typeof stock !== 'object' || Array.isArray(stock)) {
            throw new Error(`Invalid stock data for product ${product_id}`);
          }

          if (!(size in stock)) {
            throw new Error(`Stock variant '${size}' not found for product ${product_id}`);
          }

          const stockValue = stock[size];
          let currentQty = Number(
            stockValue?.qty ?? stockValue?.quantity ?? stockValue ?? 0
          );
          if (Number.isNaN(currentQty)) currentQty = 0;

          if (currentQty < qty) {
            throw new Error(
              `Insufficient stock for product ${product_id} variant ${size}. Available: ${currentQty}, Requested: ${qty}`
            );
          }

          stock[size] =
            typeof stockValue === 'object'
              ? { ...stockValue, qty: currentQty - qty }
              : currentQty - qty;

          await connection.query(
            'UPDATE products SET stock = ?, updated_by = ? WHERE id = ?',
            [JSON.stringify(stock), getActorUuid(req.user), product_id]
          );
        }
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
    console.error("Error code:", err.code);
    console.error("Error SQL:", err.sqlMessage);
    console.error("Error stack:", err.stack);
    try {
      await connection.rollback();
    } catch (rollbackErr) {
      console.error("Rollback error:", rollbackErr);
    }
    res.status(500).json({ 
      success: false,
      message: err.message || "Server error",
      sqlMessage: process.env.NODE_ENV === 'development' ? err.sqlMessage : undefined
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
    console.log("Fetching orders for userId:", userId);
    
    // Query by user_id first, or by member_uuid as fallback
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? OR member_uuid = ? ORDER BY created_at DESC',
      [userId, userId]
    );

    console.log("Found", orders.length, "orders for userId", userId);

    if (orders.length === 0) {
      return res.json([]);
    }

    // Get all items for all orders of this user in one go
    const orderIds = orders.map(o => o.order_id);
    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id IN (?)',
      [orderIds]
    );

    // Get product images for items that are missing them
    const itemsWithoutImages = items.filter(item => !item.image || (typeof item.image === 'string' && item.image.trim() === ''));
    const productIds = [...new Set(itemsWithoutImages.map(item => item.product_id).filter(Boolean))];
    
    let productImages = {};
    if (productIds.length > 0) {
      const [products] = await pool.query(
        'SELECT id, images FROM products WHERE id IN (?)',
        [productIds]
      );
      productImages = products.reduce((acc, prod) => {
        const imageUrl = constructImageUrl(prod.images);
        if (imageUrl) {
          acc[prod.id] = imageUrl;
        }
        return acc;
      }, {});
    }

    // Enrich items with product images if missing
    const enrichedItems = items.map(item => {
      if ((!item.image || (typeof item.image === 'string' && item.image.trim() === '')) && item.product_id && productImages[item.product_id]) {
        return {
          ...item,
          image: productImages[item.product_id]
        };
      }
      return {
        ...item,
        image: item.image ? constructImageUrl(item.image) : null
      };
    });

    // Group items by order_id
    const ordersWithItems = orders.map(order => {
      return {
        ...parseOrder(order),
        items: enrichedItems.filter(item => item.order_id === order.order_id)
      };
    });

    return res.json(ordersWithItems);
  } catch (err) {
    console.error('getUserOrders error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// fetch today's orders (only from current admin's members)
async function getTodayOrders(req, res) {
  try {
    // Check if user is super admin
    const isSuperAdmin = req.user && String(req.user.role || '').toLowerCase() === 'super admin';
    const adminUuid = req.user?.adminUuid || req.user?.userUuid || req.user?.admin_uuid || req.user?.user_uuid || null;
    const filterAdminUuid = req.query.adminUuid || req.query.admin_uuid || null;

    let ordersQuery = '';
    let params = [];

    if (isSuperAdmin && filterAdminUuid) {
      // Super admin filtering by specific admin: show today's orders from that admin's members only
      ordersQuery = `SELECT o.* FROM orders o
        INNER JOIN members m ON o.member_uuid = m.member_id
        WHERE DATE(o.created_at) = CURDATE() AND m.created_by = ?
        ORDER BY o.created_at DESC`;
      params.push(filterAdminUuid);
    } else if (req.user && adminUuid) {
      // Regular admin: show today's orders from their own members only (INNER JOIN ensures member exists and belongs to admin)
      ordersQuery = `SELECT o.* FROM orders o
        INNER JOIN members m ON o.member_uuid = m.member_id
        WHERE DATE(o.created_at) = CURDATE() AND m.created_by = ?
        ORDER BY o.created_at DESC`;
      params.push(adminUuid);
    } else {
      // Fallback: show all today's orders (shouldn't happen in normal cases)
      ordersQuery = 'SELECT * FROM orders WHERE DATE(created_at) = CURDATE() ORDER BY created_at DESC';
    }

    const [orders] = await pool.query(ordersQuery, params);
    if (orders.length === 0) {
      return res.json([]);
    }

    const orderIds = orders.map(o => o.order_id);
    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id IN (?)',
      [orderIds]
    );

    // Get product images for items that are missing them
    const itemsWithoutImages = items.filter(item => !item.image || (typeof item.image === 'string' && item.image.trim() === ''));
    const productIds = [...new Set(itemsWithoutImages.map(item => item.product_id).filter(Boolean))];
    
    let productImages = {};
    if (productIds.length > 0) {
      const [products] = await pool.query(
        'SELECT id, images FROM products WHERE id IN (?)',
        [productIds]
      );
      productImages = products.reduce((acc, prod) => {
        let images = prod.images;
        if (typeof images === 'string') {
          try {
            images = JSON.parse(images);
            acc[prod.id] = Array.isArray(images) ? images[0] : images;
          } catch {
            acc[prod.id] = images;
          }
        } else if (Array.isArray(images)) {
          acc[prod.id] = images[0];
        }
        return acc;
      }, {});
    }

    // Enrich items with product images if missing
    const enrichedItems = items.map(item => {
      if ((!item.image || (typeof item.image === 'string' && item.image.trim() === '')) && item.product_id && productImages[item.product_id]) {
        return {
          ...item,
          image: productImages[item.product_id]
        };
      }
      return item;
    });

    const ordersWithItems = orders.map(order => ({
      ...parseOrder(order),
      order_id: order.order_id,
      total: order.total,
      created_at: order.created_at,
      items: enrichedItems.filter(item => item.order_id === order.order_id)
    }));
 

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
