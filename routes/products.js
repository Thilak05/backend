const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { uploadProductImage, uploadProductImages } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const DB_PATH = process.env.DB_PATH || './database/usasya.db';

// Helper to add image fetching to a query
const addImageAggregation = (query) => {
  return query.replace(
    'SELECT ',
    `SELECT p.*, c.name as category_name, (SELECT GROUP_CONCAT(pi.image_url) FROM product_images pi WHERE pi.product_id = p.id) as images_agg `
  );
};

// Helper to parse aggregated images
const parseImages = (rows) => {
  return rows.map(p => {
    const { images_agg, images, ...product } = p;
    return {
      ...product,
      images: images_agg ? images_agg.split(',') : []
    };
  });
};

// Get all products
router.get('/', authenticateToken, (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  const {
    category_id, status, search, sort_by = 'created_at', sort_order = 'DESC',
    limit = 50, offset = 0
  } = req.query;

  const allowedSortFields = ['name', 'price', 'created_at', 'category_name', 'current_stock', 'status'];
  const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
  const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  let baseQuery = `FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1`;
  const params = [];
  const countParams = [];

  if (category_id) {
    baseQuery += ' AND p.category_id = ?';
    params.push(category_id);
    countParams.push(category_id);
  }
  if (status) {
    baseQuery += ' AND p.status = ?';
    params.push(status);
    countParams.push(status);
  }
  if (search) {
    baseQuery += ' AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
    countParams.push(searchTerm, searchTerm, searchTerm);
  }

  let finalQuery = addImageAggregation('SELECT ' + baseQuery);
  finalQuery += sortField === 'category_name' ? ` ORDER BY c.name ${sortDirection}, p.name ASC` : ` ORDER BY p.${sortField} ${sortDirection}`;
  finalQuery += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(finalQuery, params, (err, rows) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    const products = parseImages(rows);
    const countQuery = 'SELECT COUNT(*) as total ' + baseQuery;
    db.get(countQuery, countParams, (err, countRow) => {
      db.close();
      if (err) return res.status(500).json({ error: 'Failed to get product count' });
      res.json({
        products,
        total: countRow.total,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(countRow.total / limit)
      });
    });
  });
});

// Get public products
router.get('/public', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  const {
    category_id, search, sort_by = 'created_at', sort_order = 'DESC',
    limit = 20, offset = 0, min_price, max_price
  } = req.query;

  const allowedSortFields = ['name', 'price', 'created_at', 'category_name'];
  const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
  const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  let baseQuery = `FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = 'active' AND p.current_stock > 0`;
  const params = [];
  const countParams = [];

  if (category_id) {
    baseQuery += ' AND p.category_id = ?';
    params.push(category_id);
    countParams.push(category_id);
  }
  if (search) {
    baseQuery += ' AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
    countParams.push(searchTerm, searchTerm, searchTerm);
  }
  if (min_price) {
    baseQuery += ' AND p.price >= ?';
    params.push(parseFloat(min_price));
    countParams.push(parseFloat(min_price));
  }
  if (max_price) {
    baseQuery += ' AND p.price <= ?';
    params.push(parseFloat(max_price));
    countParams.push(parseFloat(max_price));
  }

  let finalQuery = addImageAggregation('SELECT ' + baseQuery);
  finalQuery += sortField === 'category_name' ? ` ORDER BY c.name ${sortDirection}, p.name ASC` : ` ORDER BY p.${sortField} ${sortDirection}`;
  finalQuery += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(finalQuery, params, (err, rows) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Failed to fetch public products.' });
    }
    const products = parseImages(rows);
    const countQuery = 'SELECT COUNT(*) as total ' + baseQuery;
    db.get(countQuery, countParams, (err, countRow) => {
      db.close();
      if (err) return res.status(500).json({ error: 'Failed to get public product count.' });
      res.json({
        products,
        pagination: {
          total: countRow.total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: countRow.total > (parseInt(offset) + parseInt(limit))
        },
        filters: { category_id, search, sort_by: sortField, sort_order: sortDirection, min_price, max_price }
      });
    });
  });
});

// Get product by ID
router.get('/:id', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  const productId = req.params.id;
  const query = `
    SELECT p.*, c.name as category_name,
    (SELECT GROUP_CONCAT(image_url) FROM product_images WHERE product_id = p.id) as images_agg
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?`;

  db.get(query, [productId], (err, row) => {
    db.close();
    if (err) return res.status(500).json({ error: 'Failed to fetch product' });
    if (!row) return res.status(404).json({ error: 'Product not found' });
    const product = parseImages([row])[0];
    res.json({ product });
  });
});

// Create new product
router.post('/', authenticateToken, requireAdmin, uploadProductImages, (req, res) => {
  const { name, description, price, category_id, current_stock, minimum_stock_alert, unit, supplier, status } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Product name is required' });
  if (!price || isNaN(price) || parseFloat(price) < 0) return res.status(400).json({ error: 'Valid price is required' });
  if (!category_id || isNaN(category_id)) return res.status(400).json({ error: 'Valid category is required' });

  const images = req.files ? req.files.map(file => `uploads/products/${file.filename}`) : [];
  const db = new sqlite3.Database(DB_PATH);
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    const productInsertSql = `INSERT INTO products (name, description, price, category_id, current_stock, minimum_stock_alert, unit, supplier, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const productParams = [name.trim(), description || '', parseFloat(price), parseInt(category_id), parseInt(current_stock) || 0, parseInt(minimum_stock_alert) || 5, unit || 'piece', supplier || '', status || 'active'];
    db.run(productInsertSql, productParams, function (err) {
      if (err) {
        db.run('ROLLBACK');
        db.close();
        return res.status(500).json({ error: 'Failed to create product', details: err.message });
      }
      const productId = this.lastID;
      if (images.length === 0) {
        db.run('COMMIT');
        db.close();
        return res.status(201).json({ message: 'Product created successfully', product: { id: productId, images: [], ...req.body } });
      }
      const imageInsertSql = 'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)';
      const imagePromises = images.map(imageUrl => {
        return new Promise((resolve, reject) => {
          db.run(imageInsertSql, [productId, imageUrl], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
      Promise.all(imagePromises).then(() => {
        db.run('COMMIT', err => {
          db.close();
          if (err) return res.status(500).json({ error: 'Failed to commit product creation' });
          res.status(201).json({ message: 'Product created successfully', product: { id: productId, images: images, ...req.body } });
        });
      }).catch(err => {
        db.run('ROLLBACK');
        db.close();
        res.status(500).json({ error: 'Failed to save product images', details: err.message });
      });
    });
  });
});

// Updated PUT route
router.put('/:id', authenticateToken, requireAdmin, uploadProductImages, (req, res) => {
  const productId = req.params.id;
  const { name, description, price, category_id, current_stock, minimum_stock_alert, unit, supplier, status, remove_image_urls } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'Product name is required' });
  if (!price || isNaN(price) || parseFloat(price) < 0) return res.status(400).json({ error: 'Valid price is required' });
  if (!category_id || isNaN(category_id)) return res.status(400).json({ error: 'Valid category is required' });

  const db = new sqlite3.Database(DB_PATH);
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run(
      `UPDATE products SET name = ?, description = ?, price = ?, category_id = ?, current_stock = ?, minimum_stock_alert = ?, unit = ?, supplier = ?, status = ? WHERE id = ?`,
      [name.trim(), description || '', parseFloat(price), parseInt(category_id), parseInt(current_stock) || 0, parseInt(minimum_stock_alert) || 5, unit || 'piece', supplier || '', status || 'active', productId],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          db.close();
          return res.status(500).json({ error: 'Failed to update product', details: err.message });
        }

        let removeImages = [];
        try {
          removeImages = remove_image_urls ? JSON.parse(remove_image_urls) : [];
        } catch (e) {
          removeImages = [];
        }

        const removePromises = removeImages.map(url => {
          return new Promise((resolve, reject) => {
            db.run('DELETE FROM product_images WHERE product_id = ? AND image_url = ?', [productId, url], (err) => {
              if (err) reject(err);
              else {
                const fullPath = path.join(__dirname, '..', url);
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
                resolve();
              }
            });
          });
        });

        const newImages = req.files ? req.files.map(file => `uploads/products/${file.filename}`) : [];
        const addPromises = newImages.map(imageUrl => {
          return new Promise((resolve, reject) => {
            db.run('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [productId, imageUrl], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        });

        Promise.all([...removePromises, ...addPromises])
          .then(() => {
            db.run('COMMIT', err => {
              db.close();
              if (err) return res.status(500).json({ error: 'Failed to commit product update' });
              res.json({ message: 'Product updated successfully' });
            });
          })
          .catch(err => {
            db.run('ROLLBACK');
            db.close();
            res.status(500).json({ error: 'Failed to update product images', details: err.message });
          });
      }
    );
  });
});

// Delete product
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const productId = req.params.id;
  const db = new sqlite3.Database(DB_PATH);
  db.serialize(() => {
    db.all('SELECT image_url FROM product_images WHERE product_id = ?', [productId], (err, images) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Could not fetch images for deletion.' });
      }
      db.run('DELETE FROM products WHERE id = ?', [productId], function (err) {
        db.close();
        if (err) return res.status(500).json({ error: 'Failed to delete product.' });
        if (this.changes === 0) return res.status(404).json({ error: 'Product not found.' });
        images.forEach(image => {
          const fullPath = path.join(__dirname, '..', image.image_url);
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        });
        res.json({ message: 'Product deleted successfully' });
      });
    });
  });
});

// Upload single image
router.post('/:id/image', authenticateToken, requireAdmin, uploadProductImage, (req, res) => {
  const productId = req.params.id;
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });
  const db = new sqlite3.Database(DB_PATH);
  const imageUrl = `uploads/products/${req.file.filename}`;
  db.run('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [productId, imageUrl], function (err) {
    db.close();
    if (err) return res.status(500).json({ error: 'Failed to upload image' });
    res.json({
      message: 'Image uploaded successfully',
      image: {
        path: imageUrl,
        url: `${req.protocol}://${req.get('host')}/${imageUrl}`
      }
    });
  });
});

module.exports = router;
