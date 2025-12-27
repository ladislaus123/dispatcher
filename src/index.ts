import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import campaignRoutes from './routes/campaigns';
import { CampaignManager } from './services/campaign-manager';
import { QueueManager } from './services/queue-manager';
import { PersistenceManager } from './services/persistence-manager';

// Load environment variables from .env file
dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0'; // Listen on all network interfaces
const NODE_ENV = process.env.NODE_ENV || 'development';
const AUTO_SAVE_INTERVAL = parseInt(process.env.AUTO_SAVE_INTERVAL || '30000', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(cors({
  origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',').map(o => o.trim())
}));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/campaigns', campaignRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Turbozap backend is running',
  });
});

// Serve index.html for root path (SPA support)
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

/**
 * Start the server with persistence restoration
 */
async function startServer() {
  try {
    console.log('[Server] Loading persisted data...');

    // Load campaigns from storage
    await CampaignManager.load();

    // Load queues and workers from storage
    await QueueManager.load();

    // Restore active workers (start those that were running)
    await QueueManager.restoreWorkers();

    // Setup periodic auto-save
    setInterval(async () => {
      try {
        await CampaignManager.save();
        await QueueManager.save();
      } catch (error) {
        console.error('[Server] Auto-save failed:', error);
      }
    }, AUTO_SAVE_INTERVAL);

    // Start Express server
    app.listen(PORT, HOST, () => {
      const os = require('os');
      const interfaces = os.networkInterfaces();
      const addresses: string[] = [];

      // Get all available IP addresses
      for (const name in interfaces) {
        const ifaces = interfaces[name];
        if (ifaces) {
          for (const iface of ifaces) {
            // Skip internal and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
              addresses.push(iface.address);
            }
          }
        }
      }

      console.log('\n================================');
      console.log('Turbozap Backend Server Started');
      console.log('================================');
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`Local: http://localhost:${PORT}`);

      if (addresses.length > 0) {
        console.log('\nNetwork Access (LAN):');
        addresses.forEach(addr => {
          console.log(`  http://${addr}:${PORT}`);
        });
      }

      console.log('\nTo access from the internet:');
      console.log(`  1. Get your public IP: https://ifconfig.me`);
      console.log(`  2. Open port ${PORT} on your router/firewall`);
      console.log(`  3. Use: http://YOUR_PUBLIC_IP:${PORT}`);
      console.log(`  4. Enter the URL in Turbozap's "Backend URL" field`);
      console.log('\nConfiguration:');
      console.log(`  Auto-save interval: ${AUTO_SAVE_INTERVAL}ms`);
      console.log(`  CORS origin: ${CORS_ORIGIN}`);
      console.log('\nPORT: Make sure port ' + PORT + ' is open on your firewall');
      console.log('================================\n');
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);

      try {
        // Stop all workers gracefully
        const workers = QueueManager.getAllWorkerStatus() || [];
        for (const worker of workers) {
          if (worker) {
            console.log(`[Server] Stopping worker for session: ${worker.session}`);
            QueueManager.stopWorker(worker.session);
          }
        }

        // Flush all pending saves
        await PersistenceManager.flushAllSaves();

        // Final save
        console.log('[Server] Saving final state...');
        await CampaignManager.save();
        await QueueManager.save();

        console.log('[Server] State saved. Shutting down.');
        process.exit(0);
      } catch (error) {
        console.error('[Server] Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
