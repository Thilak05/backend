const os = require('os');

function getNetworkIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal (localhost) and non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        ips.push({
          name: name,
          address: interface.address
        });
      }
    }
  }
  
  return ips;
}

function displayNetworkInfo(port) {
  const networkIPs = getNetworkIPs();
  
  console.log('\n🌐 SERVER NETWORK ACCESS INFORMATION');
  console.log('=====================================');
  console.log(`📱 Local Access: http://localhost:${port}`);
  console.log(`🖥️  Local Network Access:`);
  
  if (networkIPs.length > 0) {
    networkIPs.forEach(ip => {
      console.log(`   • http://${ip.address}:${port} (${ip.name})`);
    });
    
    console.log('\n📋 FRONTEND CONFIGURATION:');
    console.log('Update your frontend API_BASE to:');
    console.log(`   const API_BASE = 'http://${networkIPs[0].address}:${port}/api';`);
    
    console.log('\n📱 MOBILE ACCESS:');
    console.log('Other devices on your network can access:');
    networkIPs.forEach(ip => {
      console.log(`   • Frontend: http://${ip.address}:3000`);
      console.log(`   • API: http://${ip.address}:${port}/api`);
    });
    
    console.log('\n🔧 QUICK SETUP FOR NETWORK ACCESS:');
    console.log('1. Update frontend AuthContext.tsx:');
    console.log(`   const API_BASE = 'http://${networkIPs[0].address}:${port}/api';`);
    console.log('2. Start frontend with: npm run dev -- --host 0.0.0.0');
    console.log('3. Access from other devices using the IPs shown above');
    
  } else {
    console.log('   ❌ No network interfaces found');
    console.log('   Make sure you are connected to a network');
  }
  
  console.log('\n🔐 FIREWALL NOTE:');
  console.log('Make sure Windows Firewall allows connections on ports 3000 and 3001');
  console.log('=====================================\n');
}

module.exports = { getNetworkIPs, displayNetworkInfo };
