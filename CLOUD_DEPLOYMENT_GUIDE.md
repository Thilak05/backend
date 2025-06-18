# Usasya E-commerce Backend - Complete Deployment Guide

## 🚀 Production Cloud Deployment Guide

This guide covers complete deployment of the Usasya e-commerce backend to cloud servers (AWS, DigitalOcean, Google Cloud, Vultr, etc.).

---

## 📋 Table of Contents

1. [Server Requirements](#server-requirements)
2. [Cloud Server Setup](#cloud-server-setup)
3. [Domain and DNS Configuration](#domain-and-dns-configuration)
4. [Server Preparation](#server-preparation)
5. [Application Deployment](#application-deployment)
6. [Database Setup](#database-setup)
7. [SSL Certificate Setup](#ssl-certificate-setup)
8. [Process Management](#process-management)
9. [Security Configuration](#security-configuration)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)
11. [Troubleshooting](#troubleshooting)

---

## 📊 Server Requirements

### **Minimum Requirements:**
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: 1GB (2GB recommended)
- **CPU**: 1 vCPU (2 vCPU recommended)
- **Storage**: 20GB SSD minimum
- **Bandwidth**: 1TB/month

### **Recommended for Production:**
- **RAM**: 4GB+
- **CPU**: 2+ vCPU
- **Storage**: 40GB+ SSD
- **Bandwidth**: Unlimited
- **Backup**: Automated daily backups

### **Software Requirements:**
- Node.js 18+ LTS
- NPM 8+
- PM2 Process Manager
- Nginx (reverse proxy)
- UFW Firewall
- Certbot (SSL certificates)

---

## ☁️ Cloud Server Setup

### **1. Create Cloud Server Instance**

#### **DigitalOcean Droplet:**
```bash
# Create via CLI (optional)
doctl compute droplet create usasya-backend \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region nyc1 \
  --ssh-keys $SSH_KEY_ID
```

#### **AWS EC2:**
```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --count 1 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-groups usasya-sg
```

#### **Google Cloud Platform:**
```bash
# Create GCP instance
gcloud compute instances create usasya-backend \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --subnet=default \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud
```

### **2. Initial Server Access**
```bash
# Connect to your server
ssh root@your-server-ip

# Or with key file
ssh -i your-private-key.pem ubuntu@your-server-ip
```

---

## 🌐 Domain and DNS Configuration

### **1. Domain Setup**

#### **A Records (Required):**
```
Type    Name        Value           TTL
A       @           YOUR_SERVER_IP  3600
A       www         YOUR_SERVER_IP  3600
A       api         YOUR_SERVER_IP  3600
```

#### **CNAME Records (Optional):**
```
Type    Name        Value           TTL
CNAME   admin       yourdomain.com  3600
CNAME   app         yourdomain.com  3600
```

### **2. Verify DNS Propagation**
```bash
# Check DNS propagation
nslookup yourdomain.com
dig yourdomain.com
```

---

## 🔧 Server Preparation

### **1. Update System**
```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common
```

### **2. Create Application User**
```bash
# Create non-root user for application
sudo useradd -m -s /bin/bash usasya
sudo usermod -aG sudo usasya

# Switch to application user
sudo su - usasya
```

### **3. Install Node.js**
```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 8.x.x
```

### **4. Install PM2 Process Manager**
```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u usasya --hp /home/usasya
```

### **5. Install and Configure Nginx**
```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### **6. Configure Firewall**
```bash
# Install and configure UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443

# Check firewall status
sudo ufw status
```

---

## 📦 Application Deployment

### **1. Upload Application Files**

#### **Method 1: Git Clone (Recommended)**
```bash
# Clone repository
cd /home/usasya
git clone https://github.com/yourusername/usasya-backend.git
cd usasya-backend

# Or if using a specific branch
git clone -b production https://github.com/yourusername/usasya-backend.git
```

#### **Method 2: SCP Upload**
```bash
# From your local machine
scp -r ./usaya-server usasya@your-server-ip:/home/usasya/
```

#### **Method 3: SFTP Upload**
```bash
# Using SFTP client
sftp usasya@your-server-ip
put -r ./usaya-server /home/usasya/
```

### **2. Install Dependencies**
```bash
cd /home/usasya/usaya-server
npm install --production

# Audit and fix vulnerabilities
npm audit fix
```

### **3. Create Production Environment File**
```bash
# Create .env file
nano .env
```

Add the following configuration:
```env
# Server Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
DB_PATH=/home/usasya/usaya-server/database/usasya.db

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters-long

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=/home/usasya/usaya-server/uploads

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_MAX_LOGIN_ATTEMPTS=5

# UPI Payment Configuration (Optional)
MERCHANT_UPI=yourmerchant@upi
MERCHANT_NAME=Usasya Store

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring Configuration
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
```

### **4. Set Proper Permissions**
```bash
# Set ownership
sudo chown -R usasya:usasya /home/usasya/usaya-server

# Set directory permissions
chmod 755 /home/usasya/usaya-server
chmod 755 /home/usasya/usaya-server/uploads
chmod 755 /home/usasya/usaya-server/database

# Set file permissions
chmod 644 /home/usasya/usaya-server/.env
chmod 600 /home/usasya/usaya-server/database/usasya.db
```

---

## 🗄️ Database Setup

### **1. Initialize Database**
```bash
cd /home/usasya/usaya-server

# Initialize SQLite database
node -e "
const { initDatabase } = require('./database/init');
initDatabase().then(() => {
  console.log('Database initialized successfully');
  process.exit(0);
}).catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
"
```

### **2. Verify Database**
```bash
# Check if database file exists
ls -la database/

# Test database connection
node -e "
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/usasya.db');
db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
  if (err) console.error(err);
  else console.log('Database connection successful. Users count:', row.count);
  db.close();
});
"
```

### **3. Create Database Backup Script**
```bash
# Create backup script
nano /home/usasya/backup-db.sh
```

Add the following:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/usasya/backups"
DB_PATH="/home/usasya/usaya-server/database/usasya.db"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
cp $DB_PATH $BACKUP_DIR/usasya_backup_$DATE.db

# Compress backup
gzip $BACKUP_DIR/usasya_backup_$DATE.db

# Keep only last 30 days of backups
find $BACKUP_DIR -name "usasya_backup_*.db.gz" -mtime +30 -delete

echo "Database backup completed: usasya_backup_$DATE.db.gz"

# Optional: Upload to cloud storage
# aws s3 cp $BACKUP_DIR/usasya_backup_$DATE.db.gz s3://your-backup-bucket/
```

```bash
# Make script executable
chmod +x /home/usasya/backup-db.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /home/usasya/backup-db.sh
```

---

## 🔒 SSL Certificate Setup

### **1. Install Certbot**
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### **2. Configure Nginx for SSL**
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/usasya-backend
```

Add the following configuration:
```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be added by certbot)
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # API routes
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # CORS headers
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $http_origin;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
            add_header Access-Control-Allow-Credentials true;
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain charset=UTF-8';
            add_header Content-Length 0;
            return 204;
        }
    }

    # Serve uploaded files
    location /uploads/ {
        alias /home/usasya/usaya-server/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # Security for uploads
        add_header X-Content-Type-Options nosniff;
        location ~* \.(php|pl|py|jsp|asp|sh|cgi)$ {
            deny all;
        }
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/api/health;
        access_log off;
    }

    # Default fallback
    location / {
        return 404;
    }
}

# API subdomain configuration
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration (will be added by certbot)
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_subdomain:10m rate=20r/s;
    limit_req zone=api_subdomain burst=40 nodelay;

    location / {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials true always;
    }
}
```

### **3. Enable Nginx Site**
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/usasya-backend /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### **4. Generate SSL Certificates**
```bash
# Generate SSL certificates for all domains
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run

# Setup auto-renewal cron job
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## ⚙️ Process Management

### **1. Create PM2 Ecosystem File**
```bash
# Create PM2 configuration
nano /home/usasya/usaya-server/ecosystem.config.js
```

Add the following:
```javascript
module.exports = {
  apps: [{
    name: 'usasya-backend',
    script: 'server.js',
    cwd: '/home/usasya/usaya-server',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/home/usasya/logs/err.log',
    out_file: '/home/usasya/logs/out.log',
    log_file: '/home/usasya/logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false,
    ignore_watch: [
      'node_modules',
      'uploads',
      'logs',
      'database'
    ],
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

### **2. Start Application with PM2**
```bash
# Create logs directory
mkdir -p /home/usasya/logs

# Start the application
cd /home/usasya/usaya-server
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Generate startup script
pm2 startup

# Check application status
pm2 status
pm2 logs usasya-backend
```

### **3. PM2 Management Commands**
```bash
# View application status
pm2 list
pm2 show usasya-backend

# View logs
pm2 logs usasya-backend
pm2 logs usasya-backend --lines 100

# Restart application
pm2 restart usasya-backend

# Reload application (zero downtime)
pm2 reload usasya-backend

# Stop application
pm2 stop usasya-backend

# Monitor performance
pm2 monit
```

---

## 🛡️ Security Configuration

### **1. Server Security Hardening**
```bash
# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
# Set: PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd

# Install fail2ban
sudo apt install -y fail2ban

# Configure fail2ban
sudo nano /etc/fail2ban/jail.local
```

Add the following to jail.local:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

### **2. Application Security**
```bash
# Secure file permissions
chmod 600 /home/usasya/usaya-server/.env
chmod 755 /home/usasya/usaya-server/uploads
chmod 644 /home/usasya/usaya-server/database/usasya.db

# Create security headers file
sudo nano /etc/nginx/snippets/security-headers.conf
```

Add security headers:
```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self'; object-src 'none'; frame-src 'none';" always;
```

### **3. Database Security**
```bash
# Backup database with encryption
openssl enc -aes-256-cbc -salt -in database/usasya.db -out database/usasya.db.enc -k "your-encryption-password"

# Setup logrotate for application logs
sudo nano /etc/logrotate.d/usasya-backend
```

Add the following:
```
/home/usasya/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    create 644 usasya usasya
}
```

---

## 📊 Monitoring and Maintenance

### **1. System Monitoring**
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Setup disk space monitoring
echo '#!/bin/bash
THRESHOLD=80
USAGE=$(df / | grep -vE "^Filesystem|tmpfs|cdrom" | awk "{print \$5}" | sed "s/%//")
if [ $USAGE -gt $THRESHOLD ]; then
    echo "Disk usage is above ${THRESHOLD}%: ${USAGE}%" | mail -s "Disk Space Alert" admin@yourdomain.com
fi' > /home/usasya/check-disk-space.sh

chmod +x /home/usasya/check-disk-space.sh

# Add to crontab
crontab -e
# Add: 0 */6 * * * /home/usasya/check-disk-space.sh
```

### **2. Application Health Monitoring**
```bash
# Create health check script
nano /home/usasya/health-check.sh
```

Add the following:
```bash
#!/bin/bash
URL="http://localhost:3001/api/health"
EXPECTED="OK"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -eq 200 ]; then
    echo "Application is healthy"
else
    echo "Application health check failed. Response code: $RESPONSE"
    # Restart application
    pm2 restart usasya-backend
    # Send alert
    echo "Application was restarted due to health check failure" | mail -s "Application Alert" admin@yourdomain.com
fi
```

```bash
chmod +x /home/usasya/health-check.sh

# Add to crontab for every 5 minutes
crontab -e
# Add: */5 * * * * /home/usasya/health-check.sh
```

### **3. Log Monitoring**
```bash
# Setup log monitoring with logwatch
sudo apt install -y logwatch

# Configure logwatch
sudo nano /etc/logwatch/conf/logwatch.conf
# Set: MailTo = admin@yourdomain.com
# Set: Detail = Med
```

### **4. Performance Monitoring**
```bash
# Install and configure netdata (optional)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Access monitoring dashboard at: http://your-server-ip:19999
```

---

## 🚨 Troubleshooting

### **Common Issues and Solutions**

#### **1. Application Won't Start**
```bash
# Check PM2 logs
pm2 logs usasya-backend

# Check if port is in use
sudo netstat -tulpn | grep :3001

# Check application permissions
ls -la /home/usasya/usaya-server/

# Test manual start
cd /home/usasya/usaya-server
node server.js
```

#### **2. Database Connection Issues**
```bash
# Check database file permissions
ls -la database/usasya.db

# Test database connection
sqlite3 database/usasya.db ".tables"

# Check disk space
df -h
```

#### **3. SSL Certificate Issues**
```bash
# Check certificate status
sudo certbot certificates

# Test SSL configuration
sudo nginx -t

# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout | grep "Not After"
```

#### **4. High Memory Usage**
```bash
# Check memory usage
free -h
htop

# Restart application
pm2 restart usasya-backend

# Check for memory leaks
pm2 monit
```

#### **5. CORS Issues**
```bash
# Test CORS headers
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://api.yourdomain.com/products
```

### **Emergency Recovery**

#### **Rollback Application**
```bash
# Stop current application
pm2 stop usasya-backend

# Restore from backup
cp /home/usasya/backups/usasya_backup_YYYYMMDD.tar.gz /home/usasya/
tar -xzf usasya_backup_YYYYMMDD.tar.gz

# Restart application
pm2 start usasya-backend
```

#### **Database Recovery**
```bash
# Restore database from backup
gunzip /home/usasya/backups/usasya_backup_YYYYMMDD.db.gz
cp /home/usasya/backups/usasya_backup_YYYYMMDD.db /home/usasya/usaya-server/database/usasya.db

# Restart application
pm2 restart usasya-backend
```

---

## 📞 Support and Maintenance

### **Regular Maintenance Tasks**

#### **Weekly Tasks:**
- [ ] Check application logs for errors
- [ ] Monitor disk space usage
- [ ] Review security logs
- [ ] Check SSL certificate expiration
- [ ] Update application dependencies

#### **Monthly Tasks:**
- [ ] Update system packages
- [ ] Rotate and archive logs
- [ ] Review backup integrity
- [ ] Performance optimization review
- [ ] Security audit

#### **Commands for Maintenance:**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
cd /home/usasya/usaya-server
npm update

# Clean up old logs
pm2 flush usasya-backend

# Check disk usage
du -sh /home/usasya/*

# Monitor application performance
pm2 monit
```

---

## ✅ Deployment Checklist

### **Pre-Deployment:**
- [ ] Server provisioned and accessible
- [ ] Domain configured with proper DNS records
- [ ] SSL certificates ready
- [ ] Backup strategy planned

### **Deployment Steps:**
- [ ] Server updated and secured
- [ ] Node.js and PM2 installed
- [ ] Application code deployed
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database initialized
- [ ] Nginx configured
- [ ] SSL certificates installed
- [ ] PM2 process started
- [ ] Monitoring setup

### **Post-Deployment:**
- [ ] Application accessible via HTTPS
- [ ] API endpoints responding correctly
- [ ] Database queries working
- [ ] File uploads functional
- [ ] Monitoring alerts configured
- [ ] Backup system tested

---

## 🎯 Production URLs

After successful deployment, your application will be accessible at:

- **API Base URL**: `https://yourdomain.com/api` or `https://api.yourdomain.com`
- **Health Check**: `https://yourdomain.com/api/health`
- **Documentation**: `https://yourdomain.com/api/docs` (if implemented)
- **Admin Login**: Use API endpoints with admin credentials
- **File Uploads**: `https://yourdomain.com/uploads/filename.jpg`

---

## 🚀 Success!

Your Usasya e-commerce backend is now successfully deployed to production! 

**Default Admin Credentials:**
- **Email**: admin@usasya.com
- **Password**: admin123

**⚠️ Important**: Change the default admin password immediately after first login!

For ongoing support and updates, refer to the API documentation and maintain regular backups of your data.
