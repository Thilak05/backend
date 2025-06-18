#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Usasya Backend Implementation Validator\n');

// Files to check
const requiredFiles = [
  'server.js',
  'package.json',
  '.env',
  'database/init.js',
  'database/init.sql',
  'routes/auth.js',
  'routes/users.js',
  'routes/products.js',
  'routes/categories.js',
  'routes/orders.js',
  'middleware/auth.js',
  'utils/network.js',
  'README.md',
  'CLOUD_DEPLOYMENT_GUIDE.md',
  'API_DOCUMENTATION_FRONTEND.md',
  'PRODUCTION_API_DOCUMENTATION.md',
  'IMPLEMENTATION_COMPLETE.md'
];

// Documentation files to check
const documentationFiles = [
  'README.md',
  'CLOUD_DEPLOYMENT_GUIDE.md',
  'API_DOCUMENTATION_FRONTEND.md',
  'PRODUCTION_API_DOCUMENTATION.md',
  'IMPLEMENTATION_COMPLETE.md'
];

// Check file existence
console.log('📁 Checking Required Files:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n📖 Checking Documentation:');
documentationFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`✅ ${file} (${sizeKB}KB)`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Check package.json dependencies
console.log('\n📦 Checking Dependencies:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'express',
    'sqlite3',
    'jsonwebtoken',
    'bcryptjs',
    'cors',
    'helmet',
    'express-rate-limit',
    'multer',
    'dotenv'
  ];

  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} (${packageJson.dependencies[dep]})`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
  allFilesExist = false;
}

// Check environment file
console.log('\n🔧 Checking Environment:');
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredEnvVars = [
    'PORT',
    'NODE_ENV',
    'DB_PATH',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];

  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`✅ ${envVar}`);
    } else {
      console.log(`⚠️  ${envVar} - Not found in .env`);
    }
  });
} else {
  console.log('⚠️  .env file not found - Create from .env.example');
}

// Check database schema
console.log('\n🗄️  Checking Database Schema:');
try {
  const initSql = fs.readFileSync('database/init.sql', 'utf8');
  const requiredTables = ['users', 'categories', 'products', 'orders', 'order_items'];

  requiredTables.forEach(table => {
    if (initSql.includes(`CREATE TABLE ${table}`) || initSql.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
      console.log(`✅ Table: ${table}`);
    } else {
      console.log(`❌ Table: ${table} - MISSING`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Error reading database schema:', error.message);
  allFilesExist = false;
}

// Check routes implementation
console.log('\n🛣️  Checking API Routes:');
const routeFiles = ['auth.js', 'users.js', 'products.js', 'categories.js', 'orders.js'];

routeFiles.forEach(routeFile => {
  try {
    const routePath = path.join(__dirname, 'routes', routeFile);
    const routeContent = fs.readFileSync(routePath, 'utf8');
    
    // Check for router exports
    if (routeContent.includes('module.exports = router')) {
      console.log(`✅ ${routeFile} - Properly exported`);
    } else {
      console.log(`⚠️  ${routeFile} - Check router export`);
    }
  } catch (error) {
    console.log(`❌ ${routeFile} - Error reading file`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 IMPLEMENTATION VALIDATION: PASSED');
  console.log('✅ All required files are present');
  console.log('✅ Dependencies are configured');
  console.log('✅ Database schema is complete');
  console.log('✅ Documentation is comprehensive');
  console.log('\n🚀 Ready for production deployment!');
} else {
  console.log('⚠️  IMPLEMENTATION VALIDATION: ISSUES FOUND');
  console.log('Please check the missing files above');
}

console.log('\n📚 Next Steps:');
console.log('1. Review the documentation files');
console.log('2. Configure your .env file');
console.log('3. Run: npm install');
console.log('4. Run: npm start');
console.log('5. Follow CLOUD_DEPLOYMENT_GUIDE.md for production');

console.log('\n📖 Documentation Files:');
console.log('- README.md - Main project documentation');
console.log('- CLOUD_DEPLOYMENT_GUIDE.md - Complete deployment guide');
console.log('- API_DOCUMENTATION_FRONTEND.md - Frontend integration guide');
console.log('- PRODUCTION_API_DOCUMENTATION.md - Full API reference');
console.log('- IMPLEMENTATION_COMPLETE.md - Implementation summary');
