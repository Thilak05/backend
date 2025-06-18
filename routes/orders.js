const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { getDb } = require('../database/init');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const orderValidation = [
  body('customer_name').trim().isLength({ min: 2 }).withMessage('Customer name is required'),
  body('customer_phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('customer_email').optional().isEmail().withMessage('Valid email is required'),
  body('shipping_address').trim().isLength({ min: 10 }).withMessage('Shipping address must be at least 10 characters'),
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('payment_method').optional().isIn(['upi', 'cod', 'online']).withMessage('Invalid payment method'),
  body('notes').optional().trim()
];

const statusUpdateValidation = [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
];

const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid order ID is required')
];

// Generate UPI payment link
const generateUPILink = (amount, orderId, merchantUPI = 'merchant@paytm') => {
  const upiUrl = `upi://pay?pa=${merchantUPI}&pn=Usasya&tn=Order%20${orderId}&am=${amount}&cu=INR`;
  return upiUrl;
};

// Get all orders (admin gets all, users get their own)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, user_id } = req.query;
    const db = getDb();

    let query = `
      SELECT o.*, u.name as registered_user_name, u.email as registered_user_email 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id
    `;
    let params = [];

    // Build WHERE clause
    let whereConditions = [];

    // If not admin, only show user's own orders
    if (req.user.role !== 'admin') {
      whereConditions.push('o.user_id = ?');
      params.push(req.user.id);
    } else if (user_id) {
      // Admin can filter by user_id
      whereConditions.push('o.user_id = ?');
      params.push(user_id);
    }

    if (status) {
      whereConditions.push('o.status = ?');
      params.push(status);
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    query += ' ORDER BY o.created_at DESC';

    // Add pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    // Get orders
    const orders = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get order items for each order
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const items = await new Promise((resolve, reject) => {
        db.all(
          `SELECT oi.*, p.name as product_name, p.images as product_images 
           FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = ?`,
          [order.id],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      return {
        ...order,
        items: items.map(item => ({
          ...item,
          product_images: item.product_images ? JSON.parse(item.product_images) : []
        }))
      };
    }));

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM orders o';
    let countParams = [];

    if (whereConditions.length > 0) {
      countQuery += ' WHERE ' + whereConditions.join(' AND ');
      countParams = params.slice(0, -2); // Remove limit and offset
    }

    const totalCount = await new Promise((resolve, reject) => {
      db.get(countQuery, countParams, (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    });

    db.close();

    res.json({
      orders: ordersWithItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single order
router.get('/:id', authenticateToken, idValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const db = getDb();

    // Get order with user info
    const order = await new Promise((resolve, reject) => {
      db.get(
        `SELECT o.*, u.name as registered_user_name, u.email as registered_user_email 
         FROM orders o 
         LEFT JOIN users u ON o.user_id = u.id 
         WHERE o.id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!order) {
      db.close();
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check ownership (users can only see their own orders, admins can see all)
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      db.close();
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get order items
    const items = await new Promise((resolve, reject) => {
      db.all(
        `SELECT oi.*, p.name as product_name, p.images as product_images, p.description as product_description
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    db.close();

    const orderWithItems = {
      ...order,
      items: items.map(item => ({
        ...item,
        product_images: item.product_images ? JSON.parse(item.product_images) : []
      }))
    };

    res.json(orderWithItems);

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new order (supports both authenticated and guest users)
router.post('/', orderValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      customer_name, 
      customer_phone, 
      customer_email, 
      shipping_address, 
      items, 
      payment_method = 'upi', 
      notes 
    } = req.body;

    // Get user_id if authenticated, otherwise null for guest order
    const user_id = req.user ? req.user.id : null;
    
    const db = getDb();

    // Start transaction
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    try {
      // Validate products and calculate total
      let total_amount = 0;
      const validatedItems = [];

      for (const item of items) {
        const product = await new Promise((resolve, reject) => {
          db.get(
            'SELECT id, name, price, current_stock FROM products WHERE id = ? AND status = "active"',
            [item.product_id],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        if (!product) {
          throw new Error(`Product with ID ${item.product_id} not found or inactive`);
        }

        if (product.current_stock < item.quantity) {
          throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.current_stock}, Requested: ${item.quantity}`);
        }

        const itemTotal = product.price * item.quantity;
        total_amount += itemTotal;

        validatedItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price: product.price
        });
      }

      // Create order
      const orderResult = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO orders (user_id, customer_name, customer_phone, customer_email, total_amount, shipping_address, payment_method, notes, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [user_id, customer_name, customer_phone, customer_email || null, total_amount, shipping_address, payment_method, notes || null],
          function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID });
          }
        );
      });

      const order_id = orderResult.id;

      // Generate UPI link if payment method is UPI
      let upi_link = null;
      if (payment_method === 'upi') {
        upi_link = generateUPILink(total_amount, order_id);
        
        // Update order with UPI link
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE orders SET upi_link = ? WHERE id = ?',
            [upi_link, order_id],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      // Insert order items and update stock
      for (const item of validatedItems) {
        // Insert order item
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO order_items (order_id, product_id, quantity, price, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [order_id, item.product_id, item.quantity, item.price],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        // Update product stock
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE products SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [item.quantity, item.product_id],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      // Commit transaction
      await new Promise((resolve, reject) => {
        db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Get created order with items
      const createdOrder = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM orders WHERE id = ?',
          [order_id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      const orderItems = await new Promise((resolve, reject) => {
        db.all(
          `SELECT oi.*, p.name as product_name, p.images as product_images 
           FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = ?`,
          [order_id],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      db.close();

      res.status(201).json({
        message: 'Order created successfully',
        order: {
          ...createdOrder,
          items: orderItems.map(item => ({
            ...item,
            product_images: item.product_images ? JSON.parse(item.product_images) : []
          }))
        }
      });

    } catch (error) {
      // Rollback transaction
      await new Promise((resolve) => {
        db.run('ROLLBACK', () => resolve());
      });
      throw error;
    }

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ error: error.message || 'Server error' });
  }
});

// Create guest order (dedicated endpoint for clarity)
router.post('/guest', orderValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      customer_name, 
      customer_phone, 
      customer_email, 
      shipping_address, 
      items, 
      payment_method = 'upi', 
      notes 
    } = req.body;

    const db = getDb();

    // Start transaction
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    try {
      // Validate products and calculate total
      let total_amount = 0;
      const validatedItems = [];

      for (const item of items) {
        const product = await new Promise((resolve, reject) => {
          db.get(
            'SELECT id, name, price, current_stock FROM products WHERE id = ? AND status = "active"',
            [item.product_id],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        if (!product) {
          throw new Error(`Product with ID ${item.product_id} not found or inactive`);
        }

        if (product.current_stock < item.quantity) {
          throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.current_stock}, Requested: ${item.quantity}`);
        }

        const itemTotal = product.price * item.quantity;
        total_amount += itemTotal;

        validatedItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price: product.price
        });
      }

      // Create guest order (user_id is null)
      const orderResult = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO orders (user_id, customer_name, customer_phone, customer_email, total_amount, shipping_address, payment_method, notes, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [null, customer_name, customer_phone, customer_email || null, total_amount, shipping_address, payment_method, notes || null],
          function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID });
          }
        );
      });

      const order_id = orderResult.id;

      // Generate UPI link if payment method is UPI
      let upi_link = null;
      if (payment_method === 'upi') {
        upi_link = generateUPILink(total_amount, order_id);
        
        // Update order with UPI link
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE orders SET upi_link = ? WHERE id = ?',
            [upi_link, order_id],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      // Insert order items and update stock
      for (const item of validatedItems) {
        // Insert order item
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO order_items (order_id, product_id, quantity, price, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [order_id, item.product_id, item.quantity, item.price],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        // Update product stock
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE products SET current_stock = current_stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [item.quantity, item.product_id],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      // Commit transaction
      await new Promise((resolve, reject) => {
        db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Get created order with items
      const createdOrder = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM orders WHERE id = ?',
          [order_id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      const items_with_details = await Promise.all(validatedItems.map(async (item) => {
        const product = await new Promise((resolve, reject) => {
          db.get(
            'SELECT name, images FROM products WHERE id = ?',
            [item.product_id],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        return {
          ...item,
          product_name: product.name,
          product_images: product.images ? JSON.parse(product.images) : []
        };
      }));

      db.close();

      res.status(201).json({
        message: 'Guest order created successfully',
        order: {
          ...createdOrder,
          items: items_with_details
        }
      });

    } catch (error) {
      // Rollback transaction on error
      await new Promise((resolve) => {
        db.run('ROLLBACK', () => resolve());
      });
      throw error;
    }

  } catch (error) {
    console.error('Error creating guest order:', error);
    res.status(400).json({ error: error.message || 'Server error' });
  }
});

// Update order status (admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, [...idValidation, ...statusUpdateValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;
    const db = getDb();

    // Check if order exists
    const existingOrder = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM orders WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!existingOrder) {
      db.close();
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order status
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Get updated order with customer info
    const updatedOrder = await new Promise((resolve, reject) => {
      db.get(
        `SELECT o.*, u.name as registered_user_name, u.email as registered_user_email 
         FROM orders o 
         LEFT JOIN users u ON o.user_id = u.id 
         WHERE o.id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    db.close();

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Process order (admin only) - changes status from pending to processing
router.patch('/:id/process', authenticateToken, requireAdmin, idValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const db = getDb();

    // Check if order exists and is in pending status
    const existingOrder = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM orders WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!existingOrder) {
      db.close();
      return res.status(404).json({ error: 'Order not found' });
    }

    if (existingOrder.status !== 'pending') {
      db.close();
      return res.status(400).json({ error: `Cannot process order with status: ${existingOrder.status}` });
    }

    // Update order status to processing
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['processing', id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Get updated order
    const updatedOrder = await new Promise((resolve, reject) => {
      db.get(
        `SELECT o.*, u.name as registered_user_name, u.email as registered_user_email 
         FROM orders o 
         LEFT JOIN users u ON o.user_id = u.id 
         WHERE o.id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    db.close();

    res.json({
      message: 'Order processed successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel order (user can cancel their own pending orders, admin can cancel any)
router.patch('/:id/cancel', authenticateToken, idValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const db = getDb();

    // Get order
    const order = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM orders WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!order) {
      db.close();
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      db.close();
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if order can be cancelled
    if (order.status === 'cancelled') {
      db.close();
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    if (['delivered', 'shipped'].includes(order.status)) {
      db.close();
      return res.status(400).json({ error: `Cannot cancel ${order.status} order` });
    }

    // Start transaction to restore stock and update order
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    try {
      // Get order items to restore stock
      const orderItems = await new Promise((resolve, reject) => {
        db.all(
          'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
          [id],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      // Restore stock for each item
      for (const item of orderItems) {
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE products SET current_stock = current_stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [item.quantity, item.product_id],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      // Update order status to cancelled
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['cancelled', id],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Commit transaction
      await new Promise((resolve, reject) => {
        db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      db.close();

      res.json({ message: 'Order cancelled successfully' });

    } catch (error) {
      // Rollback transaction
      await new Promise((resolve) => {
        db.run('ROLLBACK', () => resolve());
      });
      throw error;
    }

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's order history (client only - for user profile)
router.get('/user/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const user_id = req.user.id;
    const db = getDb();

    let query = `
      SELECT * FROM orders 
      WHERE user_id = ?
    `;
    let params = [user_id];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    // Add pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    // Get orders
    const orders = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get order items for each order
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const items = await new Promise((resolve, reject) => {
        db.all(
          `SELECT oi.*, p.name as product_name, p.images as product_images 
           FROM order_items oi 
           JOIN products p ON oi.product_id = p.id 
           WHERE oi.order_id = ?`,
          [order.id],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      return {
        ...order,
        items: items.map(item => ({
          ...item,
          product_images: item.product_images ? JSON.parse(item.product_images) : []
        }))
      };
    }));

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
    let countParams = [user_id];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const totalCount = await new Promise((resolve, reject) => {
      db.get(countQuery, countParams, (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    });

    db.close();

    res.json({
      orders: ordersWithItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user order history:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get order statistics (admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDb();

    // Get order statistics
    const stats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
          SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
          SUM(CASE WHEN DATE(created_at) = DATE('now') THEN 1 ELSE 0 END) as orders_today,
          SUM(CASE WHEN DATE(created_at) >= DATE('now', '-7 days') THEN 1 ELSE 0 END) as orders_this_week,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as average_order_value
        FROM orders
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0]);
      });
    });

    db.close();

    res.json(stats);

  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get comprehensive dashboard analytics (admin only)
router.get('/stats/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDb();

    // Get current period stats
    const currentStats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(total_amount) as total_revenue,
          COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN user_id ELSE customer_email END) as total_customers,
          AVG(total_amount) as average_order_value,
          SUM(CASE WHEN DATE(created_at) >= DATE('now', '-30 days') THEN total_amount ELSE 0 END) as revenue_this_month,
          SUM(CASE WHEN DATE(created_at) >= DATE('now', '-30 days') THEN 1 ELSE 0 END) as orders_this_month
        FROM orders
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Get previous period stats for comparison
    const previousStats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          SUM(CASE WHEN DATE(created_at) >= DATE('now', '-60 days') AND DATE(created_at) < DATE('now', '-30 days') THEN total_amount ELSE 0 END) as revenue_last_month,
          SUM(CASE WHEN DATE(created_at) >= DATE('now', '-60 days') AND DATE(created_at) < DATE('now', '-30 days') THEN 1 ELSE 0 END) as orders_last_month,
          COUNT(DISTINCT CASE WHEN DATE(created_at) >= DATE('now', '-60 days') AND DATE(created_at) < DATE('now', '-30 days') AND user_id IS NOT NULL THEN user_id WHEN DATE(created_at) >= DATE('now', '-60 days') AND DATE(created_at) < DATE('now', '-30 days') AND user_id IS NULL THEN customer_email END) as customers_last_month
        FROM orders
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Calculate percentage changes
    const revenueChange = previousStats.revenue_last_month > 0 
      ? ((currentStats.revenue_this_month - previousStats.revenue_last_month) / previousStats.revenue_last_month * 100).toFixed(1)
      : currentStats.revenue_this_month > 0 ? 100 : 0;

    const ordersChange = previousStats.orders_last_month > 0
      ? ((currentStats.orders_this_month - previousStats.orders_last_month) / previousStats.orders_last_month * 100).toFixed(1)
      : currentStats.orders_this_month > 0 ? 100 : 0;

    const customersChange = previousStats.customers_last_month > 0
      ? ((currentStats.total_customers - previousStats.customers_last_month) / previousStats.customers_last_month * 100).toFixed(1)
      : currentStats.total_customers > 0 ? 100 : 0;

    // Get recent orders
    const recentOrders = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          o.id,
          o.customer_name,
          o.total_amount,
          o.status,
          o.created_at,
          CASE WHEN o.user_id IS NOT NULL THEN 'ORD' ELSE 'GST' END || 
          printf('%03d', o.id) as order_number
        FROM orders o
        ORDER BY o.created_at DESC
        LIMIT 10
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    db.close();

    const dashboardData = {
      overview: {
        total_revenue: parseFloat(currentStats.total_revenue || 0),
        revenue_change: parseFloat(revenueChange),
        total_orders: parseInt(currentStats.total_orders || 0),
        orders_change: parseFloat(ordersChange),
        total_customers: parseInt(currentStats.total_customers || 0),
        customers_change: parseFloat(customersChange),
        average_order_value: parseFloat(currentStats.average_order_value || 0),
        aov_change: 0 // You can calculate this if needed
      },
      recent_orders: recentOrders.map(order => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        amount: parseFloat(order.total_amount),
        status: order.status,
        created_at: order.created_at
      }))
    };

    res.json(dashboardData);

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get top products analytics (admin only)
router.get('/stats/top-products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 10, period = '30' } = req.query;
    const db = getDb();

    const topProducts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          p.id,
          p.name as product_name,
          p.price,
          SUM(oi.quantity) as units_sold,
          SUM(oi.quantity * oi.price) as total_revenue,
          COUNT(DISTINCT o.id) as order_count
        FROM products p
        JOIN order_items oi ON p.id = oi.product_id
        JOIN orders o ON oi.order_id = o.id
        WHERE DATE(o.created_at) >= DATE('now', '-${period} days')
        GROUP BY p.id, p.name, p.price
        ORDER BY total_revenue DESC
        LIMIT ?
      `, [parseInt(limit)], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get previous period data for comparison
    const previousProducts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          p.id,
          SUM(oi.quantity * oi.price) as prev_revenue
        FROM products p
        JOIN order_items oi ON p.id = oi.product_id
        JOIN orders o ON oi.order_id = o.id
        WHERE DATE(o.created_at) >= DATE('now', '-${parseInt(period) * 2} days')
          AND DATE(o.created_at) < DATE('now', '-${period} days')
        GROUP BY p.id
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Create lookup for previous period data
    const prevLookup = {};
    previousProducts.forEach(item => {
      prevLookup[item.id] = item.prev_revenue;
    });

    // Calculate growth percentages
    const productsWithGrowth = topProducts.map(product => {
      const prevRevenue = prevLookup[product.id] || 0;
      const growth = prevRevenue > 0 
        ? ((product.total_revenue - prevRevenue) / prevRevenue * 100).toFixed(1)
        : product.total_revenue > 0 ? 100 : 0;

      return {
        ...product,
        units_sold: parseInt(product.units_sold),
        total_revenue: parseFloat(product.total_revenue),
        growth_percentage: parseFloat(growth),
        order_count: parseInt(product.order_count)
      };
    });

    db.close();

    res.json({
      products: productsWithGrowth,
      period_days: parseInt(period)
    });

  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get revenue analytics by period (admin only)
router.get('/stats/revenue', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = 'daily', days = 30 } = req.query;
    const db = getDb();

    let dateFormat = '%Y-%m-%d';
    let groupBy = "DATE(created_at)";
    
    if (period === 'weekly') {
      dateFormat = '%Y-W%W';
      groupBy = "strftime('%Y-W%W', created_at)";
    } else if (period === 'monthly') {
      dateFormat = '%Y-%m';
      groupBy = "strftime('%Y-%m', created_at)";
    }

    const revenueData = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          strftime('${dateFormat}', created_at) as period,
          SUM(total_amount) as revenue,
          COUNT(*) as orders,
          AVG(total_amount) as avg_order_value
        FROM orders
        WHERE DATE(created_at) >= DATE('now', '-${parseInt(days)} days')
        GROUP BY ${groupBy}
        ORDER BY period ASC
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    db.close();

    res.json({
      period: period,
      days: parseInt(days),
      data: revenueData.map(item => ({
        period: item.period,
        revenue: parseFloat(item.revenue),
        orders: parseInt(item.orders),
        avg_order_value: parseFloat(item.avg_order_value)
      }))
    });

  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
