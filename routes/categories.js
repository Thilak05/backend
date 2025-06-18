const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const path = require('path');

const router = express.Router();
const DB_PATH = process.env.DB_PATH || './database/usasya.db';

// Get all categories
router.get('/', authenticateToken, (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  
  const query = `
    SELECT 
      c.*,
      COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
    GROUP BY c.id
    ORDER BY c.name
  `;
  
  db.all(query, [], (err, rows) => {
    db.close();
    
    if (err) {
      console.error('Error fetching categories:', err);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
    
    res.json({ categories: rows });
  });
});

// Get all categories (public endpoint for clients)
router.get('/public', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  
  const query = `
    SELECT 
      c.id,
      c.name,
      c.description,
      COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
    WHERE c.is_active = 1
    GROUP BY c.id
    HAVING product_count > 0
    ORDER BY c.name
  `;
  
  db.all(query, [], (err, rows) => {
    db.close();
    
    if (err) {
      console.error('Error fetching public categories:', err);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
    
    res.json({ categories: rows });
  });
});

// Get category by ID
router.get('/:id', authenticateToken, (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  const categoryId = req.params.id;
  
  db.get(
    'SELECT * FROM categories WHERE id = ?',
    [categoryId],
    (err, row) => {
      db.close();
      
      if (err) {
        console.error('Error fetching category:', err);
        return res.status(500).json({ error: 'Failed to fetch category' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ category: row });
    }
  );
});

// Create new category (admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { name, description } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  
  const db = new sqlite3.Database(DB_PATH);
  
  db.run(
    'INSERT INTO categories (name, description) VALUES (?, ?)',
    [name.trim(), description || ''],
    function(err) {
      db.close();
      
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Category name already exists' });
        }
        console.error('Error creating category:', err);
        return res.status(500).json({ error: 'Failed to create category' });
      }
      
      res.status(201).json({
        message: 'Category created successfully',
        category: {
          id: this.lastID,
          name: name.trim(),
          description: description || '',
          is_active: true,
          created_at: new Date().toISOString()
        }
      });
    }
  );
});

// Update category (admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const categoryId = req.params.id;
  const { name, description, is_active } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  
  const db = new sqlite3.Database(DB_PATH);
  
  db.run(
    'UPDATE categories SET name = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name.trim(), description || '', is_active !== undefined ? is_active : true, categoryId],
    function(err) {
      db.close();
      
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Category name already exists' });
        }
        console.error('Error updating category:', err);
        return res.status(500).json({ error: 'Failed to update category' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ message: 'Category updated successfully' });
    }
  );
});

// Delete category (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const categoryId = req.params.id;
  const db = new sqlite3.Database(DB_PATH);
  
  // First check if category has products
  db.get(
    'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
    [categoryId],
    (err, row) => {
      if (err) {
        db.close();
        console.error('Error checking category products:', err);
        return res.status(500).json({ error: 'Failed to check category usage' });
      }
      
      if (row.count > 0) {
        db.close();
        return res.status(400).json({ 
          error: 'Cannot delete category that has products. Please reassign or delete products first.' 
        });
      }
      
      // Delete category
      db.run(
        'DELETE FROM categories WHERE id = ?',
        [categoryId],
        function(err) {
          db.close();
          
          if (err) {
            console.error('Error deleting category:', err);
            return res.status(500).json({ error: 'Failed to delete category' });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Category not found' });
          }
          
          res.json({ message: 'Category deleted successfully' });
        }
      );
    }
  );
});

module.exports = router;
