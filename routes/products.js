const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadProductImage, uploadProductImages } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const DB_PATH = process.env.DB_PATH || './database/usasya.db';

console.log('🚀 PRODUCTS ROUTER FILE LOADED - Registering routes...');

// Get all products with category information (admin endpoint)
router.get('/', authenticateToken, (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  const { 
    category_id, 
    status, 
    search, 
    sort_by = 'created_at', 
    sort_order = 'DESC',
    limit = 50, 
    offset = 0 
  } = req.query;
  
  // Validate sort_by to prevent SQL injection
  const allowedSortFields = ['name', 'price', 'created_at', 'category_name', 'current_stock', 'status'];
  const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
  const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  
  let query = `
    SELECT 
      p.*,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (category_id) {
    query += ' AND p.category_id = ?';
    params.push(category_id);
  }
    if (status) {
    query += ' AND p.status = ?';
    params.push(status);
  }
  
  if (search) {
    query += ' AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  // Handle sorting
  if (sortField === 'category_name') {
    query += ` ORDER BY c.name ${sortDirection}, p.name ASC`;
  } else {
    query += ` ORDER BY p.${sortField} ${sortDirection}`;
  }
  
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      db.close();
      console.error('Error fetching products:', err);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    
    // Parse images JSON
    const products = rows.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : []
    }));
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE 1=1';
    const countParams = [];
    
    if (category_id) {
      countQuery += ' AND p.category_id = ?';
      countParams.push(category_id);
    }
    
    if (status) {
      countQuery += ' AND p.status = ?';
      countParams.push(status);
    } else {
      countQuery += ' AND p.status = ?';
      countParams.push('active');
    }
    
    if (search) {
      countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    db.get(countQuery, countParams, (err, countRow) => {
      db.close();
      
      if (err) {
        console.error('Error getting product count:', err);
        return res.status(500).json({ error: 'Failed to get product count' });
      }
      
      res.json({
        products,
        total: countRow.total,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(countRow.total / limit)
      });
    });
  });
});

// Get products by category (public endpoint for clients)
router.get('/public', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  const { 
    category_id, 
    search, 
    sort_by = 'created_at', 
    sort_order = 'DESC',
    limit = 20, 
    offset = 0,
    min_price,
    max_price
  } = req.query;
  
  // Validate sort_by to prevent SQL injection
  const allowedSortFields = ['name', 'price', 'created_at', 'category_name'];
  const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
  const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  
  let query = `
    SELECT 
      p.id,
      p.name,
      p.description,
      p.price,
      p.images,
      p.current_stock,
      p.unit,
      p.created_at,
      c.name as category_name,
      c.id as category_id
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'active' AND p.current_stock > 0
  `;
  
  const params = [];
  
  if (category_id) {
    query += ' AND p.category_id = ?';
    params.push(category_id);
  }
  
  if (search) {
    query += ' AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  if (min_price) {
    query += ' AND p.price >= ?';
    params.push(parseFloat(min_price));
  }
  
  if (max_price) {
    query += ' AND p.price <= ?';
    params.push(parseFloat(max_price));
  }
  
  // Handle sorting
  if (sortField === 'category_name') {
    query += ` ORDER BY c.name ${sortDirection}, p.name ASC`;
  } else {
    query += ` ORDER BY p.${sortField} ${sortDirection}`;
  }
  
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      db.close();
      console.error('Error fetching public products:', err);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    
    // Parse images JSON
    const products = rows.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : []
    }));
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id  
      WHERE p.status = 'active' AND p.current_stock > 0
    `;
    const countParams = [];
    
    if (category_id) {
      countQuery += ' AND p.category_id = ?';
      countParams.push(category_id);
    }
    
    if (search) {
      countQuery += ' AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (min_price) {
      countQuery += ' AND p.price >= ?';
      countParams.push(parseFloat(min_price));
    }
    
    if (max_price) {
      countQuery += ' AND p.price <= ?';
      countParams.push(parseFloat(max_price));
    }
    
    db.get(countQuery, countParams, (err, countRow) => {
      db.close();
      
      if (err) {
        console.error('Error fetching product count:', err);
        return res.status(500).json({ error: 'Failed to fetch product count' });
      }
      
      res.json({
        products,
        pagination: {
          total: countRow.total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: countRow.total > (parseInt(offset) + parseInt(limit))
        },
        filters: {
          category_id: category_id || null,
          search: search || null,
          sort_by: sortField,
          sort_order: sortDirection,
          min_price: min_price || null,
          max_price: max_price || null
        }
      });
    });
  });
});

// Get products grouped by category (public endpoint for category-based display)
router.get('/public/by-category', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  const { limit_per_category = 10 } = req.query;
  
  // Get all active categories with products
  const categoryQuery = `
    SELECT 
      c.id,
      c.name,
      c.description
    FROM categories c
    WHERE c.is_active = 1 
    AND EXISTS (
      SELECT 1 FROM products p 
      WHERE p.category_id = c.id 
      AND p.status = 'active' 
      AND p.current_stock > 0
    )
    ORDER BY c.name
  `;
  
  db.all(categoryQuery, [], (err, categories) => {
    if (err) {
      db.close();
      console.error('Error fetching categories:', err);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
    
    // Get products for each category
    const promises = categories.map(category => {
      return new Promise((resolve, reject) => {
        const productQuery = `
          SELECT 
            p.id,
            p.name,
            p.description,
            p.price,
            p.images,
            p.current_stock,
            p.unit
          FROM products p
          WHERE p.category_id = ? 
          AND p.status = 'active' 
          AND p.current_stock > 0
          ORDER BY p.created_at DESC
          LIMIT ?
        `;
        
        db.all(productQuery, [category.id, parseInt(limit_per_category)], (err, products) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              ...category,
              products: products.map(product => ({
                ...product,
                images: product.images ? JSON.parse(product.images) : []
              }))
            });
          }
        });
      });
    });
    
    Promise.all(promises)
      .then(categoriesWithProducts => {
        db.close();
        res.json({ 
          categories: categoriesWithProducts.filter(cat => cat.products.length > 0) 
        });
      })
      .catch(error => {
        db.close();
        console.error('Error fetching products by category:', error);
        res.status(500).json({ error: 'Failed to fetch products by category' });
      });
  });
});

// Get product by ID
router.get('/:id', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  const productId = req.params.id;
  
  const query = `
    SELECT 
      p.*,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `;
  
  db.get(query, [productId], (err, row) => {
    db.close();
    
    if (err) {
      console.error('Error fetching product:', err);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Parse images JSON
    const product = {
      ...row,
      images: row.images ? JSON.parse(row.images) : []
    };
    
    res.json({ product });
  });
});

// Create new product (admin only)
console.log('📝 REGISTERING POST / route for product creation');
router.post('/', authenticateToken, requireAdmin, uploadProductImages, (req, res) => {
  const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  console.log(`🔍 [${requestId}] PRODUCT CREATION REQUEST STARTED`);
  console.log(`🔍 [${requestId}] Request URL: ${req.method} ${req.originalUrl}`);
  console.log(`🔍 [${requestId}] User: ${req.user?.email || 'Unknown'}`);
  console.log(`🔍 [${requestId}] Request Body:`, req.body);
  console.log(`🔍 [${requestId}] Uploaded Files:`, req.files?.map(f => f.filename) || 'None');
  
  const { name, description, price, category_id, current_stock, minimum_stock_alert, unit, supplier, status } = req.body;
  
  // Validation
  console.log(`🔍 [${requestId}] Starting validation...`);
  if (!name || !name.trim()) {
    console.log(`❌ [${requestId}] Validation failed: Product name is required`);
    return res.status(400).json({ error: 'Product name is required' });
  }
  
  if (!price || isNaN(price) || parseFloat(price) < 0) {
    console.log(`❌ [${requestId}] Validation failed: Invalid price`);
    return res.status(400).json({ error: 'Valid price is required' });
  }
  
  if (!category_id || isNaN(category_id)) {
    console.log(`❌ [${requestId}] Validation failed: Invalid category`);
    return res.status(400).json({ error: 'Valid category is required' });
  }
  
  console.log(`✅ [${requestId}] Validation passed`);
  
  // Process uploaded images
  const images = req.files ? req.files.map(file => `uploads/products/${file.filename}`) : [];
  console.log(`🔍 [${requestId}] Processed images:`, images);
  
  const db = new sqlite3.Database(DB_PATH);
  console.log(`🔍 [${requestId}] Database connection opened`);
  
  // First verify category exists
  console.log(`🔍 [${requestId}] Checking if category ${category_id} exists...`);
  db.get('SELECT id FROM categories WHERE id = ?', [category_id], (err, category) => {
    if (err) {
      db.close();
      console.error(`❌ [${requestId}] Error checking category:`, err);
      return res.status(500).json({ error: 'Failed to verify category' });
    }
    
    if (!category) {
      db.close();
      console.log(`❌ [${requestId}] Category ${category_id} not found`);
      return res.status(400).json({ error: 'Invalid category selected' });
    }
    
    console.log(`✅ [${requestId}] Category ${category_id} exists`);
    
    // Insert product
    console.log(`🔍 [${requestId}] ATTEMPTING DATABASE INSERT...`);
    const insertData = [
      name.trim(),
      description || '',
      parseFloat(price),
      parseInt(category_id),
      parseInt(current_stock) || 0,
      parseInt(minimum_stock_alert) || 5,
      unit || 'piece',
      supplier || '',
      status || 'active',
      JSON.stringify(images)
    ];
    console.log(`🔍 [${requestId}] Insert data:`, insertData);
    
    db.run(
      `INSERT INTO products (
        name, description, price, category_id, current_stock, 
        minimum_stock_alert, unit, supplier, status, images
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      insertData,
      function(err) {
        console.log(`🔍 [${requestId}] Database INSERT callback executed`);
        db.close();
        
        if (err) {
          console.error(`❌ [${requestId}] Error creating product:`, err);
          return res.status(500).json({ error: 'Failed to create product' });
        }
        
        console.log(`✅ [${requestId}] Product created successfully with ID: ${this.lastID}`);
        console.log(`🔍 [${requestId}] PRODUCT CREATION REQUEST COMPLETED`);
        
        res.status(201).json({
          message: 'Product created successfully',
          product: {
            id: this.lastID,
            name: name.trim(),
            description: description || '',
            price: parseFloat(price),
            category_id: parseInt(category_id),
            current_stock: parseInt(current_stock) || 0,
            minimum_stock_alert: parseInt(minimum_stock_alert) || 5,
            unit: unit || 'piece',
            supplier: supplier || '',
            status: status || 'active',
            images: images,
            created_at: new Date().toISOString()
          }
        });
      }
    );
  });
});

// Update product (admin only)
router.put('/:id', authenticateToken, requireAdmin, uploadProductImages, (req, res) => {
  const productId = req.params.id;
  const { name, description, price, category_id, current_stock, minimum_stock_alert, unit, supplier, status, keep_existing_images } = req.body;
  
  // Validation
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Product name is required' });
  }
  
  if (!price || isNaN(price) || parseFloat(price) < 0) {
    return res.status(400).json({ error: 'Valid price is required' });
  }
  
  if (!category_id || isNaN(category_id)) {
    return res.status(400).json({ error: 'Valid category is required' });
  }
  
  const db = new sqlite3.Database(DB_PATH);
  
  // Get existing product
  db.get('SELECT images FROM products WHERE id = ?', [productId], (err, existingProduct) => {
    if (err) {
      db.close();
      console.error('Error fetching existing product:', err);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
    
    if (!existingProduct) {
      db.close();
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Handle images
    let images = [];
    if (keep_existing_images === 'true') {
      images = existingProduct.images ? JSON.parse(existingProduct.images) : [];
    }
    
    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `uploads/products/${file.filename}`);
      images = [...images, ...newImages];
    }
    
    // Verify category exists
    db.get('SELECT id FROM categories WHERE id = ?', [category_id], (err, category) => {
      if (err) {
        db.close();
        console.error('Error checking category:', err);
        return res.status(500).json({ error: 'Failed to verify category' });
      }
      
      if (!category) {
        db.close();
        return res.status(400).json({ error: 'Invalid category selected' });
      }
      
      // Update product
      db.run(
        `UPDATE products SET 
          name = ?, description = ?, price = ?, category_id = ?, 
          current_stock = ?, minimum_stock_alert = ?, unit = ?, 
          supplier = ?, status = ?, images = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          name.trim(),
          description || '',
          parseFloat(price),
          parseInt(category_id),
          parseInt(current_stock) || 0,
          parseInt(minimum_stock_alert) || 5,
          unit || 'piece',
          supplier || '',
          status || 'active',
          JSON.stringify(images),
          productId
        ],
        function(err) {
          db.close();
          
          if (err) {
            console.error('Error updating product:', err);
            return res.status(500).json({ error: 'Failed to update product' });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
          }
          
          res.json({ message: 'Product updated successfully' });
        }
      );
    });
  });
});

// Delete product (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const productId = req.params.id;
  const db = new sqlite3.Database(DB_PATH);
  
  // Get product images for cleanup
  db.get('SELECT images FROM products WHERE id = ?', [productId], (err, product) => {
    if (err) {
      db.close();
      console.error('Error fetching product:', err);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
    
    if (!product) {
      db.close();
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Delete product
    db.run('DELETE FROM products WHERE id = ?', [productId], function(err) {
      db.close();
      
      if (err) {
        console.error('Error deleting product:', err);
        return res.status(500).json({ error: 'Failed to delete product' });
      }
      
      // Clean up image files
      if (product.images) {
        try {
          const images = JSON.parse(product.images);
          images.forEach(imagePath => {
            const fullPath = path.join(__dirname, '..', imagePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          });
        } catch (error) {
          console.error('Error cleaning up image files:', error);
        }
      }
      
      res.json({ message: 'Product deleted successfully' });
    });
  });
});

// Get low stock products (admin only)
router.get('/admin/low-stock', authenticateToken, requireAdmin, (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  
  const query = `
    SELECT 
      p.*,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.current_stock <= p.minimum_stock_alert
    AND p.status = 'active'
    ORDER BY p.current_stock ASC
  `;
  
  db.all(query, [], (err, rows) => {
    db.close();
    
    if (err) {
      console.error('Error fetching low stock products:', err);
      return res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
    
    const products = rows.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : []
    }));
    
    res.json({ products });
  });
});

// Get product analytics (admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  
  const query = `
    SELECT 
      COUNT(*) as total_products,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_products,
      SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_products,
      SUM(CASE WHEN current_stock <= minimum_stock_alert THEN 1 ELSE 0 END) as low_stock_products,
      SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock_products,
      AVG(price) as average_price,
      SUM(current_stock) as total_inventory_value
    FROM products
  `;
  
  db.get(query, [], (err, row) => {
    if (err) {
      db.close();
      console.error('Error fetching product analytics:', err);
      return res.status(500).json({ error: 'Failed to fetch product analytics' });
    }

    // Get category distribution
    const categoryQuery = `
      SELECT 
        c.name as category_name,
        COUNT(p.id) as product_count,
        SUM(p.current_stock) as total_stock
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
      GROUP BY c.id, c.name
      ORDER BY product_count DESC
    `;

    db.all(categoryQuery, [], (err, categories) => {
      db.close();
      
      if (err) {
        console.error('Error fetching category distribution:', err);
        return res.status(500).json({ error: 'Failed to fetch category distribution' });
      }

      const analytics = {
        overview: {
          total_products: parseInt(row.total_products || 0),
          active_products: parseInt(row.active_products || 0),
          inactive_products: parseInt(row.inactive_products || 0),
          low_stock_products: parseInt(row.low_stock_products || 0),
          out_of_stock_products: parseInt(row.out_of_stock_products || 0),
          average_price: parseFloat(row.average_price || 0),
          total_inventory_value: parseFloat(row.total_inventory_value || 0)
        },
        category_distribution: categories.map(cat => ({
          category_name: cat.category_name,
          product_count: parseInt(cat.product_count || 0),
          total_stock: parseInt(cat.total_stock || 0)
        }))
      };

      res.json(analytics);
    });
  });
});

// Get all products with enhanced admin sorting options
router.get('/admin', authenticateToken, requireAdmin, (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  const { 
    category_id, 
    search, 
    sort_by = 'created_at', 
    sort_order = 'DESC',
    limit = 50, 
    offset = 0,
    min_price,
    max_price
  } = req.query;
  
  // Validate sort_by to prevent SQL injection
  const allowedSortFields = ['name', 'price', 'created_at', 'category_name', 'status', 'current_stock'];
  const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
  const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  
  let query = `
    SELECT 
      p.*,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (category_id) {
    query += ' AND p.category_id = ?';
    params.push(category_id);
  }
  
  if (search) {
    query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (min_price) {
    query += ' AND p.price >= ?';
    params.push(parseFloat(min_price));
  }
  
  if (max_price) {
    query += ' AND p.price <= ?';
    params.push(parseFloat(max_price));
  }
  
  // Handle sorting
  if (sortField === 'category_name') {
    query += ` ORDER BY c.name ${sortDirection}, p.name ASC`;
  } else {
    query += ` ORDER BY p.${sortField} ${sortDirection}`;
  }
  
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      db.close();
      console.error('Error fetching admin products:', err);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    
    // Parse images JSON
    const products = rows.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : []
    }));
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE 1=1';
    const countParams = [];
    
    if (category_id) {
      countQuery += ' AND p.category_id = ?';
      countParams.push(category_id);
    }
    
    if (search) {
      countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (min_price) {
      countQuery += ' AND p.price >= ?';
      countParams.push(parseFloat(min_price));
    }
    
    if (max_price) {
      countQuery += ' AND p.price <= ?';
      countParams.push(parseFloat(max_price));
    }
    
    db.get(countQuery, countParams, (err, countRow) => {
      db.close();
      
      if (err) {
        console.error('Error getting admin product count:', err);
        return res.status(500).json({ error: 'Failed to get product count' });
      }
      
      res.json({
        products,
        total: countRow.total,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(countRow.total / limit)
      });
    });
  });
});

// Upload product image (admin only) - dedicated route for frontend
router.post('/:id/image', authenticateToken, requireAdmin, uploadProductImage, (req, res) => {
  const productId = req.params.id;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  const db = new sqlite3.Database(DB_PATH);
  
  // Get existing product
  db.get('SELECT images FROM products WHERE id = ?', [productId], (err, product) => {
    if (err) {
      db.close();
      console.error('Error fetching product:', err);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
    
    if (!product) {
      db.close();
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Add new image to existing images
    let images = [];
    if (product.images) {
      try {
        images = JSON.parse(product.images);
      } catch (e) {
        images = [];
      }
    }
    
    const newImagePath = `uploads/products/${req.file.filename}`;
    images.push(newImagePath);
    
    // Update product with new image
    db.run(
      'UPDATE products SET images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(images), productId],
      function(err) {
        db.close();
        
        if (err) {
          console.error('Error updating product images:', err);
          // Clean up uploaded file
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(500).json({ error: 'Failed to update product images' });
        }
        
        res.json({
          message: 'Image uploaded successfully',
          image: {
            path: newImagePath,
            url: `${req.protocol}://${req.get('host')}/${newImagePath}`
          }
        });
      }
    );
  });
});

// Upload multiple product images (admin only)
router.post('/:id/images', authenticateToken, requireAdmin, uploadProductImages, (req, res) => {
  const productId = req.params.id;
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No image files provided' });
  }

  const db = new sqlite3.Database(DB_PATH);
  
  // Get existing product
  db.get('SELECT images FROM products WHERE id = ?', [productId], (err, product) => {
    if (err) {
      db.close();
      console.error('Error fetching product:', err);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
    
    if (!product) {
      db.close();
      // Clean up uploaded files
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Add new images to existing images
    let images = [];
    if (product.images) {
      try {
        images = JSON.parse(product.images);
      } catch (e) {
        images = [];
      }
    }
    
    const newImagePaths = req.files.map(file => `uploads/products/${file.filename}`);
    images = [...images, ...newImagePaths];
    
    // Update product with new images
    db.run(
      'UPDATE products SET images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(images), productId],
      function(err) {
        db.close();
        
        if (err) {
          console.error('Error updating product images:', err);
          // Clean up uploaded files
          req.files.forEach(file => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
          return res.status(500).json({ error: 'Failed to update product images' });
        }
        
        res.json({
          message: 'Images uploaded successfully',
          images: newImagePaths.map(path => ({
            path: path,
            url: `${req.protocol}://${req.get('host')}/${path}`
          }))
        });
      }
    );
  });
});

module.exports = router;
