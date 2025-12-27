# Production Setup Guide

This guide covers deploying Turbozap Backend to production with proper environment configuration.

## Prerequisites

- Node.js v16+ installed
- npm v7+ installed
- Access to your server via SSH or file transfer
- Port 3000 (or your chosen port) open on firewall

## Step 1: Prepare Environment Configuration

### Create .env file on your server

Copy `.env.example` to `.env` and configure for production:

```bash
cp .env.example .env
```

Then edit `.env` with your production settings:

```bash
# For Linux/Mac
nano .env

# For Windows
notepad .env
```

### Production .env Example

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Execution Settings
# How long to wait between sending each message (milliseconds)
# Default 60000 = 1 minute, set higher to slow down sending
EXECUTION_INTERVAL=60000

# Data Persistence
DATA_DIR=./data

# Auto-save interval (save state every N milliseconds)
AUTO_SAVE_INTERVAL=30000

# Logging
LOG_LEVEL=info

# Request Timeout
REQUEST_TIMEOUT=30000

# CORS Configuration
# For production, restrict to your domain:
# CORS_ORIGIN=https://yourdomain.com,http://yourdomain.com
# Or keep open for development:
CORS_ORIGIN=*

# File Upload Settings (50MB default)
MAX_FILE_SIZE=52428800

# Features
ENABLE_PDF_EXPORT=true
ENABLE_CAMPAIGN_DELETION=true
```

## Step 2: Upload and Install

### Upload Files

**Option A: Using SFTP**
```bash
# On your local machine
sftp user@your-server-ip
> cd Dispatcher/backend
> put -r src/ public/ package.json package-lock.json tsconfig.json .env.example
> quit
```

**Option B: Using Git**
```bash
# On your server
cd ~/Dispatcher
git clone <your-repo-url> backend
cd backend
cp .env.example .env
# Edit .env with production values
```

### Install Dependencies

```bash
cd ~/Dispatcher/backend
npm install
```

## Step 3: Build Project

```bash
npm run build
```

Verify successful build with no TypeScript errors.

## Step 4: Data Directory Setup

```bash
mkdir -p data/backups
chmod 755 data
```

## Step 5: Start the Server

### Test Run (Development)
```bash
npm run dev
```

### Production Run
```bash
npm run prod           # Linux/Mac
npm run prod:win       # Windows
```

Or directly:
```bash
NODE_ENV=production node dist/index.js
```

### Verify Server Started

```
================================
Turbozap Backend Server Started
================================
Environment: production
Local: http://localhost:3000

Network Access (LAN):
  http://192.168.1.100:3000

Configuration:
  Auto-save interval: 30000ms
  CORS origin: *

PORT: Make sure port 3000 is open on your firewall
================================
```

## Step 6: Run as Background Service (Production)

### Option A: Using PM2 (Recommended)

Install PM2 globally:
```bash
npm install -g pm2
```

Start the application:
```bash
pm2 start npm --name "turbozap" -- run prod
pm2 save
pm2 startup
```

Check status:
```bash
pm2 status
pm2 logs turbozap
```

Stop/Restart:
```bash
pm2 stop turbozap
pm2 restart turbozap
pm2 delete turbozap
```

### Option B: Using Systemd (Linux)

Create `/etc/systemd/system/turbozap.service`:

```ini
[Unit]
Description=Turbozap Backend Service
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/Dispatcher/backend
ExecStart=/usr/bin/npm run prod
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable turbozap
sudo systemctl start turbozap
```

Check logs:
```bash
sudo journalctl -u turbozap -f
```

### Option C: Using Screen (Quick/Temporary)

```bash
screen -S turbozap
npm run prod
# Press Ctrl+A then D to detach
# Later: screen -r turbozap
```

## Step 7: Firewall Configuration

### Linux (UFW)
```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

### Linux (FirewallD)
```bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### Windows
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find Node.js and allow both Private and Public networks

## Step 8: Access the Application

### Local Network
```
http://192.168.1.100:3000
```
(Replace 192.168.1.100 with your server's IP)

### From Internet (Port Forward)
1. Log into your router
2. Find Port Forwarding settings
3. Forward external port 3000 to internal port 3000
4. Use your public IP: `http://YOUR_PUBLIC_IP:3000`

## Environment Variables Explained

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `EXECUTION_INTERVAL` | Wait time between messages (ms) | 60000 |
| `DATA_DIR` | Where campaigns/queues are stored | ./data |
| `AUTO_SAVE_INTERVAL` | How often to save state (ms) | 30000 |
| `LOG_LEVEL` | Logging verbosity | info |
| `REQUEST_TIMEOUT` | HTTP request timeout (ms) | 30000 |
| `CORS_ORIGIN` | Allowed origins (comma-separated or *) | * |
| `MAX_FILE_SIZE` | Max upload size (bytes) | 52428800 (50MB) |
| `ENABLE_PDF_EXPORT` | Allow PDF reports | true |
| `ENABLE_CAMPAIGN_DELETION` | Allow deleting campaigns | true |

## Monitoring and Maintenance

### Check Application Health
```bash
curl http://localhost:3000/health
```

### View Data Files
```bash
ls -lh data/
cat data/campaigns.json | jq  # if jq installed
```

### Clear Old Backups
```bash
rm data/backups/*.json  # removes all backups
```

### View Logs (PM2)
```bash
pm2 logs turbozap
pm2 logs turbozap --lines 100
pm2 logs turbozap --err
```

### View Logs (Systemd)
```bash
sudo journalctl -u turbozap -f        # Follow logs
sudo journalctl -u turbozap -n 100    # Last 100 lines
sudo journalctl -u turbozap --since "1 hour ago"
```

## Troubleshooting

### Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows

# Kill the process or use different port
kill -9 <PID>  # Linux/Mac
```

### Data Not Persisting
```bash
# Check directory permissions
ls -la data/
chmod 755 data/

# Check disk space
df -h

# Verify data files exist
ls -la data/*.json
```

### Workers Not Resuming After Restart
- Ensure campaigns were created before restart
- Check `data/campaigns.json` contains your campaigns
- Check `data/queues.json` contains worker state
- Review logs for errors during startup

### High CPU/Memory Usage
- Reduce `EXECUTION_INTERVAL` if too fast
- Check worker logs for stuck requests
- Restart service if memory keeps growing

### Connection Issues
- Verify server is listening: `netstat -tuln | grep 3000`
- Check firewall is open: `sudo ufw status`
- Test connectivity: `curl http://localhost:3000/health`
- Try different port if 3000 blocked

## Performance Tuning

### Slow Message Sending
Increase `EXECUTION_INTERVAL` to send slower:
```env
EXECUTION_INTERVAL=120000  # 2 minutes between messages
```

### Frequent Crashes/OOM
Reduce auto-save frequency:
```env
AUTO_SAVE_INTERVAL=60000   # Save every 1 minute instead of 30 seconds
```

### High Server Load
- Limit concurrent campaigns
- Increase execution interval
- Monitor with `top` or `htop`

## Backup and Recovery

### Manual Backup
```bash
cp -r data/ data-backup-$(date +%Y%m%d)
tar -czf turbozap-backup-$(date +%Y%m%d).tar.gz data/
```

### Restore from Backup
```bash
rm -rf data
cp -r data-backup-20241227 data
# OR
tar -xzf turbozap-backup-20241227.tar.gz
npm run prod
```

## Security Recommendations

1. **Restrict CORS**: Set specific origins instead of `*`
   ```env
   CORS_ORIGIN=https://yourdomain.com,http://localhost:3000
   ```

2. **Use HTTPS**: Deploy behind nginx with SSL
3. **Firewall**: Only open port 3000 to trusted networks
4. **Regular Backups**: Backup `data/` directory weekly
5. **Monitor Logs**: Set up log rotation and monitoring
6. **Update Dependencies**: Run `npm audit fix` regularly

## Nginx Reverse Proxy (Optional)

For HTTPS and load balancing, use Nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-key.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Updating the Application

```bash
cd ~/Dispatcher/backend
git pull origin main           # Get latest code
npm install                    # Update dependencies
npm run build                  # Rebuild
pm2 restart turbozap          # Restart service
```

## Support and Debugging

Enable debug logging:
```env
LOG_LEVEL=debug
```

Check for errors:
```bash
pm2 logs turbozap --err
# or
journalctl -u turbozap -e
```

Verify all data is saved:
```bash
npm run prod  # This does a final save on shutdown (Ctrl+C)
```
