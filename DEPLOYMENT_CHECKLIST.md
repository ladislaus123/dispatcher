# Production Deployment Checklist

Use this checklist to ensure your Turbozap deployment is production-ready.

## Pre-Deployment (Development Machine)

- [ ] Clone/download repository
- [ ] Run `npm install`
- [ ] Run `npm run build` (verify no TypeScript errors)
- [ ] Test locally: `npm run dev`
- [ ] Create test campaign
- [ ] Verify workers start and process
- [ ] Test campaign deletion
- [ ] Test PDF export
- [ ] Stop server (Ctrl+C) and verify state saves
- [ ] Restart and verify state restores
- [ ] Review `.env.example` for all available options

## Server Setup

- [ ] Node.js v16+ installed on server
- [ ] npm v7+ installed on server
- [ ] SSH access or file transfer capability
- [ ] Sufficient disk space (minimum 500MB, recommended 1GB+)
- [ ] Port 3000 (or chosen port) available on firewall

## File Transfer

- [ ] Create project directory: `mkdir -p ~/Dispatcher/backend`
- [ ] Upload files:
  - [ ] `src/` directory
  - [ ] `public/` directory
  - [ ] `package.json`
  - [ ] `package-lock.json`
  - [ ] `tsconfig.json`
  - [ ] `.env.example`
  - [ ] `PRODUCTION_SETUP.md`
  - [ ] `QUICKSTART.md`
- [ ] Verify all files transferred

## Environment Configuration

- [ ] Copy: `cp .env.example .env`
- [ ] Edit `.env` with production values:
  - [ ] PORT (default 3000)
  - [ ] NODE_ENV=production
  - [ ] EXECUTION_INTERVAL (default 60000ms)
  - [ ] AUTO_SAVE_INTERVAL (default 30000ms)
  - [ ] CORS_ORIGIN (set to domain or *)
  - [ ] All other variables reviewed

## Build & Test

- [ ] Install dependencies: `npm install`
- [ ] Build: `npm run build` (no errors)
- [ ] Create data directory: `mkdir -p data/backups`
- [ ] Test run: `npm run prod` (Ctrl+C to stop)
- [ ] Verify startup messages show correct configuration
- [ ] Test health endpoint: `curl http://localhost:3000/health`

## Service Setup (Choose One)

### PM2
- [ ] Install: `npm install -g pm2`
- [ ] Start: `pm2 start npm --name "turbozap" -- run prod`
- [ ] Save: `pm2 save`
- [ ] Startup: `pm2 startup`
- [ ] Verify: `pm2 status`
- [ ] Verify: `pm2 logs turbozap`

### Systemd
- [ ] Create service file: `/etc/systemd/system/turbozap.service`
- [ ] Configure WorkingDirectory and User
- [ ] Enable: `sudo systemctl enable turbozap`
- [ ] Start: `sudo systemctl start turbozap`
- [ ] Verify: `sudo systemctl status turbozap`

### Other (Screen/Tmux/etc)
- [ ] Document your service method
- [ ] Verify service starts on reboot
- [ ] Verify logs are accessible

## Firewall Configuration

### Linux (UFW)
- [ ] Run: `sudo ufw allow 3000/tcp`
- [ ] Run: `sudo ufw reload`
- [ ] Verify: `sudo ufw status`

### Linux (FirewallD)
- [ ] Run: `sudo firewall-cmd --permanent --add-port=3000/tcp`
- [ ] Run: `sudo firewall-cmd --reload`

### Windows
- [ ] Open Windows Defender Firewall
- [ ] Add Node.js to allowed apps
- [ ] Allow both Private and Public networks

## Network Access

### Local Network
- [ ] Get server IP: `hostname -I` (Linux) or `ipconfig` (Windows)
- [ ] Test access: `http://192.168.X.X:3000` from another machine
- [ ] Test health: `curl http://SERVER_IP:3000/health`

### Internet Access (Optional)
- [ ] Port forward router to server port
- [ ] Get public IP: https://ifconfig.me
- [ ] Test: `http://YOUR_PUBLIC_IP:3000`
- [ ] Update DNS if using domain
- [ ] Test from external network

## Functionality Testing

### Campaign Management
- [ ] Create campaign
- [ ] View campaign details
- [ ] Start campaign execution
- [ ] Stop campaign execution
- [ ] Export campaign to PDF
- [ ] Delete campaign
- [ ] Verify workers persist across restarts

### File Uploads
- [ ] Upload media/documents
- [ ] Verify files saved to `uploads/`
- [ ] Verify relative URLs work
- [ ] Test with multiple files

### Data Persistence
- [ ] Create campaign and restart server
- [ ] Verify campaign still exists
- [ ] Start worker and restart server
- [ ] Verify worker resumed
- [ ] Check `data/campaigns.json` exists
- [ ] Check `data/queues.json` exists

## Backup & Recovery

- [ ] Create backup script
- [ ] Test backup: `tar -czf backup-$(date +%Y%m%d).tar.gz data/`
- [ ] Verify backup file created
- [ ] Test restore process
- [ ] Document backup location/schedule

## Monitoring Setup

### Logs
- [ ] Verify logs are accessible
- [ ] Set up log rotation if needed
- [ ] Test log viewing command:
  - PM2: `pm2 logs turbozap`
  - Systemd: `journalctl -u turbozap -f`

### Health Checks
- [ ] Set up periodic health checks
- [ ] Example: `curl -s http://localhost:3000/health`
- [ ] Alert on failure

### Disk Space
- [ ] Check available space: `df -h`
- [ ] Monitor `data/` directory growth
- [ ] Set up cleanup if needed

## Security Hardening

- [ ] CORS restricted (not `*` in production)
- [ ] Firewall allows only necessary ports
- [ ] SSH key-based authentication only (no passwords)
- [ ] Review `.gitignore` (`.env` not included)
- [ ] Regular npm audit: `npm audit fix`
- [ ] Keep Node.js updated
- [ ] Document access procedures

## SSL/HTTPS (Optional but Recommended)

- [ ] Install Nginx
- [ ] Configure SSL certificate (Let's Encrypt)
- [ ] Proxy to Node.js on localhost:3000
- [ ] Redirect HTTP to HTTPS
- [ ] Test HTTPS access

## Documentation

- [ ] Provide `.env` file only to authorized personnel
- [ ] Document server IP and port
- [ ] Document admin access procedures
- [ ] Document backup/restore procedures
- [ ] Document escalation procedures
- [ ] Keep PRODUCTION_SETUP.md accessible

## Handoff

- [ ] Document everything
- [ ] Provide server credentials securely
- [ ] Train user/team on:
  - [ ] Accessing frontend
  - [ ] Creating campaigns
  - [ ] Monitoring execution
  - [ ] Troubleshooting basic issues
  - [ ] Restarting service if needed
  - [ ] Viewing logs
  - [ ] Where to find data files

## Post-Deployment

- [ ] Monitor for first 24 hours
- [ ] Check logs for any errors
- [ ] Verify workers are running stably
- [ ] Monitor disk space usage
- [ ] Monitor memory usage
- [ ] Document any issues
- [ ] Make configuration adjustments if needed

## Emergency Procedures

- [ ] Document how to stop the service
- [ ] Document how to restart the service
- [ ] Document how to restore from backup
- [ ] Document contact for emergencies
- [ ] Test emergency procedures

## Sign-Off

- [ ] Project Manager: _____________________ Date: _______
- [ ] DevOps/IT: _____________________ Date: _______
- [ ] End User: _____________________ Date: _______

## Notes

```
Document any custom configurations, issues encountered, or deviations from this checklist:

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```
