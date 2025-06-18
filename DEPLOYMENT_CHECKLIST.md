# Usasya Backend - Production Deployment Checklist

## 🚀 Pre-Deployment Checklist

Use this checklist to ensure your Usasya backend is properly configured for production deployment.

---

## ✅ Code Preparation

### **1. Environment Configuration**
- [ ] **Copy environment file**: `cp .env.example .env`
- [ ] **Set production mode**: `NODE_ENV=production`
- [ ] **Configure strong JWT secrets**: Change `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] **Set CORS origin**: Configure `CORS_ORIGIN` for your frontend domain
- [ ] **Configure UPI details**: Set `UPI_ID` and `UPI_MERCHANT_NAME`
- [ ] **Set admin credentials**: Configure `ADMIN_EMAIL` and strong `ADMIN_PASSWORD`

### **2. Security Review**
- [ ] **JWT secrets are unique and strong** (minimum 32 characters)
- [ ] **Admin password is strong** (minimum 8 characters, mixed case, numbers, symbols)
- [ ] **Rate limiting is enabled** (default: 100 requests per 15 minutes)
- [ ] **CORS is properly configured** (not using `*` in production)
- [ ] **File upload restrictions are set** (file types and size limits)

### **3. Database Preparation**
- [ ] **Database path is correct**: `DB_PATH=./database/usasya.db`
- [ ] **Backup strategy is planned**: Database backup location and frequency
- [ ] **Database permissions are secure**: Appropriate file permissions

---

## 🌐 Server Deployment

### **1. Server Requirements Met**
- [ ] **Node.js 18+ LTS installed**
- [ ] **NPM 8+ installed**
- [ ] **PM2 installed globally**: `npm install -g pm2`
- [ ] **Nginx installed** (for reverse proxy)
- [ ] **UFW firewall configured**
- [ ] **SSL certificate ready** (Let's Encrypt or custom)

### **2. Application Deployment**
- [ ] **Code uploaded to server**
- [ ] **Dependencies installed**: `npm install --production`
- [ ] **Environment file configured**: Production `.env` settings
- [ ] **Upload directory created**: `mkdir -p uploads/products uploads/users`
- [ ] **Proper file permissions set**: Writable uploads directory

### **3. Process Management**
- [ ] **PM2 configured**: Application running with PM2
- [ ] **PM2 startup script**: `pm2 startup` and `pm2 save`
- [ ] **Application auto-restart**: PM2 monitoring enabled
- [ ] **Log management**: PM2 log rotation configured

---

## 🔒 Security Configuration

### **1. Firewall Setup**
- [ ] **UFW enabled**: `sudo ufw enable`
- [ ] **SSH port allowed**: `sudo ufw allow 22`
- [ ] **HTTP port allowed**: `sudo ufw allow 80`
- [ ] **HTTPS port allowed**: `sudo ufw allow 443`
- [ ] **Application port secured**: Not directly exposed (behind Nginx)

### **2. Nginx Configuration**
- [ ] **Reverse proxy configured**: Nginx forwards to Node.js app
- [ ] **SSL certificate installed**: HTTPS enabled
- [ ] **Security headers configured**: Nginx security headers
- [ ] **Rate limiting configured**: Nginx-level rate limiting
- [ ] **Static file serving**: Efficient static file delivery

### **3. SSL/TLS Setup**
- [ ] **SSL certificate installed**: Let's Encrypt or commercial certificate
- [ ] **HTTPS redirect enabled**: All HTTP traffic redirected to HTTPS
- [ ] **Strong SSL configuration**: Modern TLS versions only
- [ ] **HSTS header configured**: HTTP Strict Transport Security

---

## 📊 Monitoring & Maintenance

### **1. Health Monitoring**
- [ ] **Health check endpoint working**: `GET /api/health`
- [ ] **Uptime monitoring setup**: External monitoring service configured
- [ ] **Log monitoring**: Error tracking and alert system
- [ ] **Performance monitoring**: Server resource monitoring

### **2. Backup Strategy**
- [ ] **Database backup automated**: Daily database backups
- [ ] **File upload backup**: Uploads directory backed up
- [ ] **Configuration backup**: Environment and config files backed up
- [ ] **Backup testing**: Restore procedures tested

### **3. Maintenance Procedures**
- [ ] **Update strategy planned**: Node.js and dependency updates
- [ ] **Log rotation configured**: Prevent log files from growing too large
- [ ] **Monitoring alerts setup**: Notifications for downtime or errors
- [ ] **Documentation updated**: Deployment procedures documented

---

## 🧪 Testing

### **1. API Testing**
- [ ] **Health check**: `curl https://yourdomain.com/api/health`
- [ ] **Authentication**: Test login and registration
- [ ] **Product API**: Test product listing and creation
- [ ] **Order API**: Test order creation and processing
- [ ] **File upload**: Test image upload functionality

### **2. Performance Testing**
- [ ] **Load testing**: Test server under expected load
- [ ] **Response times**: Verify acceptable response times
- [ ] **Memory usage**: Monitor memory consumption
- [ ] **Database performance**: Check query performance

### **3. Security Testing**
- [ ] **SSL certificate valid**: Verify SSL configuration
- [ ] **Rate limiting working**: Test rate limiting functionality
- [ ] **Authentication secure**: Test JWT token security
- [ ] **File upload security**: Test file type and size restrictions

---

## 📚 Documentation

### **1. Deployment Documentation**
- [ ] **Server details documented**: IP address, login credentials
- [ ] **Nginx configuration saved**: Backup of Nginx config
- [ ] **PM2 configuration saved**: PM2 ecosystem file created
- [ ] **SSL renewal process**: Certificate renewal procedures

### **2. API Documentation**
- [ ] **API endpoints documented**: Complete API reference available
- [ ] **Authentication flow**: Frontend integration guide provided
- [ ] **Error handling**: Error codes and responses documented
- [ ] **Rate limits**: API rate limiting information provided

---

## 🚀 Go-Live

### **1. Final Checks**
- [ ] **All tests passing**: API functionality verified
- [ ] **Frontend connected**: Frontend successfully connecting to API
- [ ] **Admin panel working**: Admin functionality tested
- [ ] **Guest checkout working**: Anonymous orders tested
- [ ] **UPI payments working**: Payment link generation tested

### **2. Launch Preparation**
- [ ] **DNS configured**: Domain pointing to server
- [ ] **SSL certificate valid**: HTTPS working correctly
- [ ] **Monitoring active**: All monitoring systems operational
- [ ] **Team notified**: Team aware of go-live status

### **3. Post-Launch**
- [ ] **Monitor for 24 hours**: Watch for any issues
- [ ] **Check error logs**: Review error logs for problems
- [ ] **Verify backups**: Ensure backup systems working
- [ ] **Performance monitoring**: Monitor server performance

---

## 📞 Support & Troubleshooting

### **Common Issues**
- **Port conflicts**: Check if port 3001 is available
- **Permission errors**: Verify file permissions for uploads directory
- **Database errors**: Check SQLite database file permissions
- **JWT errors**: Verify JWT secrets are configured
- **CORS errors**: Check CORS origin configuration

### **Helpful Commands**
```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs usasya-api

# Restart application
pm2 restart usasya-api

# Check Nginx status
sudo systemctl status nginx

# Check server resources
htop

# Check disk space
df -h
```

### **Documentation References**
- **[Cloud Deployment Guide](./CLOUD_DEPLOYMENT_GUIDE.md)**: Complete deployment instructions
- **[API Documentation](./API_DOCUMENTATION_FRONTEND.md)**: Frontend integration guide
- **[Production API Reference](./PRODUCTION_API_DOCUMENTATION.md)**: Complete API reference

---

## ✅ Deployment Complete!

Once all items in this checklist are completed, your Usasya backend will be:

- ✅ **Secure**: Properly configured security measures
- ✅ **Scalable**: Ready for production traffic
- ✅ **Monitored**: Health and performance monitoring
- ✅ **Documented**: Complete documentation for maintenance
- ✅ **Backed up**: Data protection and recovery procedures

**Your e-commerce backend is now live and ready to serve customers!** 🎉
