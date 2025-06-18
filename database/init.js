const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './database/usasya.db';
const SQL_INIT_PATH = path.join(__dirname, 'init.sql');

function initDatabase() {
  return new Promise((resolve, reject) => {
    // Ensure database directory exists
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        return reject(err);
      }
      console.log('Connected to SQLite database');
    });

    // Read and execute initialization SQL
    fs.readFile(SQL_INIT_PATH, 'utf8', (err, sql) => {
      if (err) {
        console.error('Error reading init.sql:', err);
        db.close();
        return reject(err);
      }

      // Execute SQL statements
      db.exec(sql, (err) => {
        if (err) {
          console.error('Error executing init.sql:', err);
          db.close();
          return reject(err);
        }

        console.log('Database initialized successfully');
        
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
            return reject(err);
          }
          console.log('Database connection closed');
          resolve();
        });
      });
    });
  });
}

// Function to get database connection
function getDb() {
  return new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      throw err;
    }
  });
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Database setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase, getDb };
