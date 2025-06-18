const os = require('os');
const fs = require('fs');
const path = require('path');

function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

function updateFrontendConfig() {
  const networkIP = getNetworkIP();
  const backendPort = process.env.PORT || 3001;
  const frontendAuthContextPath = path.join(__dirname, '..', 'src', 'context', 'AuthContext.tsx');
  
  try {
    if (fs.existsSync(frontendAuthContextPath)) {
      let content = fs.readFileSync(frontendAuthContextPath, 'utf8');
      
      // Replace the API_BASE URL
      const oldApiBase = /const API_BASE = ['"](.*?)['"];/;
      const newApiBase = `const API_BASE = 'http://${networkIP}:${backendPort}/api'; // Auto-configured for network access`;
      
      if (oldApiBase.test(content)) {
        content = content.replace(oldApiBase, newApiBase);
        fs.writeFileSync(frontendAuthContextPath, content);
        
        console.log('✅ Frontend configured for network access!');
        console.log(`📡 API_BASE updated to: http://${networkIP}:${backendPort}/api`);
        console.log(`🌐 Frontend will be accessible at: http://${networkIP}:3000`);
        console.log(`🔧 Backend accessible at: http://${networkIP}:${backendPort}`);
      } else {
        console.log('⚠️  Could not find API_BASE in AuthContext.tsx');
        console.log(`📝 Please manually update API_BASE to: http://${networkIP}:${backendPort}/api`);
      }
    } else {
      console.log('⚠️  AuthContext.tsx not found');
      console.log(`📝 Please manually set API_BASE to: http://${networkIP}:${backendPort}/api`);
    }
  } catch (error) {
    console.error('❌ Error updating frontend config:', error.message);
    console.log(`📝 Please manually set API_BASE to: http://${networkIP}:${backendPort}/api`);
  }
}

function createNetworkStartScript() {
  const networkIP = getNetworkIP();
  const backendPort = process.env.PORT || 3001;
  
  const scriptContent = `@echo off
echo 🚀 Starting Usasya Server for Network Access
echo ==========================================
echo 🌐 Network IP: ${networkIP}
echo 🔧 Backend Port: ${backendPort}
echo 📱 Frontend Port: 3000
echo ==========================================
echo.

echo 📡 Starting Backend Server...
cd usaya-server
start "Usasya Backend" cmd /k "node server.js"
cd ..

echo ⏳ Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo 🎨 Starting Frontend Server...
start "Usasya Frontend" cmd /k "npm run dev -- --host 0.0.0.0"

echo ⏳ Waiting for frontend to start...
timeout /t 5 /nobreak >nul

echo 🌐 Opening browser...
start http://${networkIP}:3000

echo.
echo ✅ Servers started successfully!
echo ==========================================
echo 📱 Access from this computer: http://localhost:3000
echo 🌐 Access from network devices: http://${networkIP}:3000
echo 🔧 Backend API: http://${networkIP}:${backendPort}/api
echo ==========================================
echo.
echo Press any key to close this window...
pause >nul`;

  fs.writeFileSync(path.join(__dirname, '..', 'start-network.bat'), scriptContent);
  console.log('📄 Created start-network.bat script');
}

if (require.main === module) {
  console.log('🔧 Configuring Usasya for Network Access...\n');
  updateFrontendConfig();
  createNetworkStartScript();
  console.log('\n✅ Network configuration complete!');
  console.log('📋 Run "start-network.bat" to start both servers for network access');
}

module.exports = { getNetworkIP, updateFrontendConfig, createNetworkStartScript };
