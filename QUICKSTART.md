# Quick Start Guide

Get Turbozap Backend running in production within 5 minutes.

## Local Setup (Development)

```bash
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# 3. Start in development mode
npm run dev
```

Access at: http://localhost:3000

## Production Setup

### On Your Server

```bash
# 1. Create .env file from example
cp .env.example .env

# 2. Edit configuration (nano, vim, or text editor)
nano .env
# Edit:
# - PORT=3000 (change if needed)
# - NODE_ENV=production
# - CORS_ORIGIN=* (restrict in production)

# 3. Install dependencies
npm install

# 4. Build
npm run build

# 5. Create data directory
mkdir -p data/backups

# 6. Start server
npm run prod          # Linux/Mac
# or
npm run prod:win      # Windows
```

Access at: http://YOUR_SERVER_IP:3000

## Environment Variables

Only need to set if different from defaults:

```env
PORT=3000                          # Server port
NODE_ENV=production                # production or development
EXECUTION_INTERVAL=60000           # Milliseconds between messages
AUTO_SAVE_INTERVAL=30000           # Auto-save frequency (ms)
CORS_ORIGIN=*                      # Comma-separated or *
```

## Run as Service (Production)

### PM2 (Recommended - All Platforms)

```bash
npm install -g pm2
pm2 start npm --name "turbozap" -- run prod
pm2 save
pm2 startup
pm2 logs turbozap
```

### Systemd (Linux)

```bash
# See PRODUCTION_SETUP.md for full instructions
```

## Verify It's Running

```bash
# Check health endpoint
curl http://localhost:3000/health

# Should return:
# {"success":true,"message":"Turbozap backend is running"}
```

## Accessing from Another Machine

```
http://SERVER_IP:3000
```

Example: `http://192.168.1.100:3000`

## Troubleshooting

### Port already in use?
```bash
# Change PORT in .env to 3001 or another number
PORT=3001
npm run prod
```

### Data not saving?
```bash
# Check data directory exists
mkdir -p data/backups

# Check permissions (Linux)
chmod 755 data
```

### Workers not resuming after restart?
- Ensure you created campaigns before restarting
- Check that `data/campaigns.json` exists
- Look for errors in logs

## Full Documentation

See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for:
- Complete environment variable reference
- Detailed firewall configuration
- PM2 and Systemd service setup
- Nginx reverse proxy
- Monitoring and maintenance
- Backup and recovery
- Performance tuning
- Security recommendations

## Key Files

- `.env.example` - Configuration template (copy to `.env`)
- `src/index.ts` - Server entry point
- `src/routes/campaigns.ts` - Campaign API endpoints
- `src/services/` - Business logic (persistence, workers, etc.)
- `public/` - Frontend (HTML, CSS, JavaScript)
- `data/` - Campaign and queue persistence (created at runtime)

## Default Behavior

- **Port**: 3000 (configurable via .env)
- **Data Storage**: `data/` directory (JSON files)
- **Auto-save**: Every 30 seconds (configurable)
- **Message Interval**: 60 seconds between sends (configurable)
- **Execution Timeout**: 30 seconds per request
- **Auto-backup**: 5 backups per file kept automatically

## Features Included

✅ Campaign creation and management
✅ Worker persistence (survives restarts)
✅ Queue management with request tracking
✅ PDF report generation
✅ Campaign deletion
✅ File uploads (media/documents)
✅ Automatic backups
✅ Health check endpoint
✅ CORS support
✅ Graceful shutdown

## Next Steps

1. Copy `.env.example` to `.env`
2. Configure environment variables
3. Run `npm install && npm run build`
4. Start with `npm run prod`
5. Visit http://localhost:3000
6. For production, use PM2 or Systemd (see PRODUCTION_SETUP.md)
