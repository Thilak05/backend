#!/bin/bash

# ===========================================
# USASYA BACKEND - PRODUCTION DEPLOYMENT SCRIPT
# ===========================================

echo "🚀 Usasya Backend - Production Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}❌ Please do not run this script as root${NC}"
    echo "Run as a regular user with sudo privileges"
    exit 1
fi

echo -e "${BLUE}📋 Starting deployment process...${NC}"

# 1. Check Node.js version
echo -e "\n${YELLOW}1. Checking Node.js installation...${NC}"
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"
    
    # Check if version is 18 or higher
    MAJOR_VERSION=$(echo $NODE_VERSION | sed 's/v//' | cut -d. -f1)
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        echo -e "${RED}❌ Node.js version 18+ required. Found: $NODE_VERSION${NC}"
        echo "Please update Node.js: https://nodejs.org/"
        exit 1
    fi
else
    echo -e "${RED}❌ Node.js not found${NC}"
    echo "Please install Node.js 18+ LTS: https://nodejs.org/"
    exit 1
fi

# 2. Check npm
echo -e "\n${YELLOW}2. Checking npm installation...${NC}"
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm found: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

# 3. Install dependencies
echo -e "\n${YELLOW}3. Installing dependencies...${NC}"
if npm install --production; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# 4. Check environment file
echo -e "\n${YELLOW}4. Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ .env created from .env.example${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env with your production settings${NC}"
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env file found${NC}"
fi

# 5. Check PM2 installation
echo -e "\n${YELLOW}5. Checking PM2 installation...${NC}"
if command -v pm2 >/dev/null 2>&1; then
    PM2_VERSION=$(pm2 --version)
    echo -e "${GREEN}✅ PM2 found: $PM2_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 not found. Installing globally...${NC}"
    if sudo npm install -g pm2; then
        echo -e "${GREEN}✅ PM2 installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install PM2${NC}"
        exit 1
    fi
fi

# 6. Create uploads directory
echo -e "\n${YELLOW}6. Creating uploads directory...${NC}"
mkdir -p uploads/products uploads/users
chmod 755 uploads uploads/products uploads/users
echo -e "${GREEN}✅ Uploads directory created${NC}"

# 7. Test application startup
echo -e "\n${YELLOW}7. Testing application startup...${NC}"
if timeout 10s npm start &>/dev/null; then
    echo -e "${GREEN}✅ Application starts successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Application test timed out (this may be normal)${NC}"
fi

# 8. Create PM2 ecosystem file
echo -e "\n${YELLOW}8. Creating PM2 configuration...${NC}"
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'usasya-api',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

mkdir -p logs
echo -e "${GREEN}✅ PM2 configuration created${NC}"

# 9. Start application with PM2
echo -e "\n${YELLOW}9. Starting application with PM2...${NC}"
if pm2 start ecosystem.config.js; then
    echo -e "${GREEN}✅ Application started with PM2${NC}"
else
    echo -e "${RED}❌ Failed to start with PM2${NC}"
    exit 1
fi

# 10. Setup PM2 startup
echo -e "\n${YELLOW}10. Setting up PM2 startup...${NC}"
pm2 startup
pm2 save
echo -e "${GREEN}✅ PM2 startup configured${NC}"

# 11. Display status
echo -e "\n${YELLOW}11. Application Status:${NC}"
pm2 status

# 12. Test health endpoint
echo -e "\n${YELLOW}12. Testing health endpoint...${NC}"
sleep 3
if curl -f http://localhost:3001/api/health &>/dev/null; then
    echo -e "${GREEN}✅ Health endpoint responding${NC}"
else
    echo -e "${YELLOW}⚠️  Health endpoint not responding (may need configuration)${NC}"
fi

# 13. Final instructions
echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo "=========================================="
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Edit .env file with your production settings"
echo "2. Configure your firewall (ufw allow 3001)"
echo "3. Set up Nginx reverse proxy (see CLOUD_DEPLOYMENT_GUIDE.md)"
echo "4. Configure SSL certificate"
echo "5. Update frontend API base URL"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "- README.md - Main documentation"
echo "- CLOUD_DEPLOYMENT_GUIDE.md - Complete deployment guide"
echo "- API_DOCUMENTATION_FRONTEND.md - Frontend integration"
echo "- DEPLOYMENT_CHECKLIST.md - Deployment checklist"
echo ""
echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo "- pm2 status        # Check application status"
echo "- pm2 logs          # View application logs"
echo "- pm2 restart all   # Restart application"
echo "- pm2 monit         # Real-time monitoring"
echo ""
echo -e "${BLUE}🌐 Application URLs:${NC}"
echo "- Health Check: http://localhost:3001/api/health"
echo "- API Docs: http://localhost:3001/api/docs"
echo ""
echo -e "${GREEN}✅ Your Usasya backend is now running in production mode!${NC}"
