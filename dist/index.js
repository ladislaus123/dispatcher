"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const campaigns_1 = __importDefault(require("./routes/campaigns"));
const campaign_manager_1 = require("./services/campaign-manager");
const queue_manager_1 = require("./services/queue-manager");
const persistence_manager_1 = require("./services/persistence-manager");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0'; // Listen on all network interfaces
// Middleware
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb' }));
app.use((0, cors_1.default)());
// Serve static files from public directory
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Serve uploads directory
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Routes
app.use('/api/campaigns', campaigns_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Turbozap backend is running',
    });
});
// Serve index.html for root path (SPA support)
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
/**
 * Start the server with persistence restoration
 */
async function startServer() {
    try {
        console.log('[Server] Loading persisted data...');
        // Load campaigns from storage
        await campaign_manager_1.CampaignManager.load();
        // Load queues and workers from storage
        await queue_manager_1.QueueManager.load();
        // Restore active workers (start those that were running)
        await queue_manager_1.QueueManager.restoreWorkers();
        // Setup periodic auto-save every 30 seconds
        setInterval(async () => {
            try {
                await campaign_manager_1.CampaignManager.save();
                await queue_manager_1.QueueManager.save();
            }
            catch (error) {
                console.error('[Server] Auto-save failed:', error);
            }
        }, 30000);
        // Start Express server
        app.listen(PORT, HOST, () => {
            const os = require('os');
            const interfaces = os.networkInterfaces();
            const addresses = [];
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
            console.log('\nPORT: Make sure port ' + PORT + ' is open on your firewall');
            console.log('================================\n');
        });
        // Graceful shutdown handlers
        const gracefulShutdown = async (signal) => {
            console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
            try {
                // Stop all workers gracefully
                const workers = queue_manager_1.QueueManager.getAllWorkerStatus() || [];
                for (const worker of workers) {
                    if (worker) {
                        console.log(`[Server] Stopping worker for session: ${worker.session}`);
                        queue_manager_1.QueueManager.stopWorker(worker.session);
                    }
                }
                // Flush all pending saves
                await persistence_manager_1.PersistenceManager.flushAllSaves();
                // Final save
                console.log('[Server] Saving final state...');
                await campaign_manager_1.CampaignManager.save();
                await queue_manager_1.QueueManager.save();
                console.log('[Server] State saved. Shutting down.');
                process.exit(0);
            }
            catch (error) {
                console.error('[Server] Error during graceful shutdown:', error);
                process.exit(1);
            }
        };
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    }
    catch (error) {
        console.error('[Server] Failed to start server:', error);
        process.exit(1);
    }
}
// Start the server
startServer();
//# sourceMappingURL=index.js.map