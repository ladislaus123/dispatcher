"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueManager = void 0;
const request_queue_1 = require("./request-queue");
const worker_1 = require("./worker");
const persistence_manager_1 = require("./persistence-manager");
class QueueManager {
    /**
     * Get or create a queue for a session
     */
    static getOrCreateQueue(session) {
        if (!this.queues.has(session)) {
            this.queues.set(session, new request_queue_1.RequestQueue());
            console.log(`Created new queue for session "${session}"`);
        }
        return this.queues.get(session);
    }
    /**
     * Add requests to a session queue and start worker if needed
     */
    static enqueueRequests(session, requests, campaignId) {
        const queue = this.getOrCreateQueue(session);
        queue.addRequests(requests, campaignId);
        // Start worker if not already running
        if (!this.workers.has(session)) {
            const worker = new worker_1.SessionWorker(session, queue);
            this.workers.set(session, worker);
            worker.start();
        }
        else if (!this.workers.get(session).isActive()) {
            this.workers.get(session).start();
        }
        // Persist queues
        persistence_manager_1.PersistenceManager.debouncedSave('queues.json', () => this.serializeQueues());
    }
    /**
     * Get worker status with detailed campaign progress
     */
    static getWorkerStatus(session) {
        const worker = this.workers.get(session);
        const queue = this.queues.get(session);
        if (!worker) {
            return null;
        }
        const allRequests = queue?.getAllRequests() || [];
        const pendingRequests = allRequests.filter(r => r.status === 'pending');
        const completedRequests = allRequests.filter(r => r.status === 'completed');
        const failedRequests = allRequests.filter(r => r.status === 'failed');
        const executingRequests = allRequests.filter(r => r.status === 'executing');
        // Group by campaign
        const campaignProgress = {};
        allRequests.forEach(req => {
            if (!campaignProgress[req.campaignId]) {
                campaignProgress[req.campaignId] = {
                    campaignId: req.campaignId,
                    total: 0,
                    completed: 0,
                    failed: 0,
                    pending: 0,
                    executing: 0,
                    messages: [],
                };
            }
            campaignProgress[req.campaignId].total++;
            if (req.status === 'completed')
                campaignProgress[req.campaignId].completed++;
            if (req.status === 'failed')
                campaignProgress[req.campaignId].failed++;
            if (req.status === 'pending')
                campaignProgress[req.campaignId].pending++;
            if (req.status === 'executing')
                campaignProgress[req.campaignId].executing++;
            // Add message details
            const chatId = req.request.data.chatId;
            campaignProgress[req.campaignId].messages.push({
                requestId: req.id,
                chatId,
                status: req.status,
                error: req.error,
                result: req.result,
            });
        });
        return {
            session,
            isActive: worker.isActive(),
            totalRequests: allRequests.length,
            pendingRequests: pendingRequests.length,
            completedRequests: completedRequests.length,
            failedRequests: failedRequests.length,
            executingRequests: executingRequests.length,
            campaigns: Object.values(campaignProgress),
        };
    }
    /**
     * Get all active workers
     */
    static getAllWorkerStatus() {
        return Array.from(this.workers.keys()).map(session => this.getWorkerStatus(session));
    }
    /**
     * Start a worker
     */
    static async startWorker(session) {
        let worker = this.workers.get(session);
        if (!worker) {
            const queue = this.getOrCreateQueue(session);
            worker = new worker_1.SessionWorker(session, queue);
            this.workers.set(session, worker);
        }
        await worker.start();
    }
    /**
     * Stop a worker
     */
    static stopWorker(session) {
        const worker = this.workers.get(session);
        if (worker) {
            worker.stop();
            // Persist worker state change
            persistence_manager_1.PersistenceManager.debouncedSave('queues.json', () => this.serializeQueues());
        }
    }
    /**
     * Get queue for a session
     */
    static getQueue(session) {
        return this.queues.get(session);
    }
    /**
     * Get all queues
     */
    static getAllQueues() {
        const result = {};
        this.queues.forEach((queue, session) => {
            result[session] = {
                totalRequests: queue.getQueueLength(),
                pendingRequests: queue.getPendingCount(),
                requests: queue.getAllRequests(),
            };
        });
        return result;
    }
    /**
     * Clear a campaign from all queues
     */
    static clearCampaign(campaignId) {
        this.queues.forEach(queue => {
            queue.clearCampaignRequests(campaignId);
        });
        // Persist after clearing
        persistence_manager_1.PersistenceManager.debouncedSave('queues.json', () => this.serializeQueues());
    }
    /**
     * Get queue statistics
     */
    static getStats() {
        let totalRequests = 0;
        let totalPending = 0;
        let totalSessions = 0;
        this.queues.forEach(queue => {
            totalRequests += queue.getQueueLength();
            totalPending += queue.getPendingCount();
        });
        totalSessions = this.workers.size;
        return {
            totalSessions,
            activeSessions: Array.from(this.workers.values()).filter(w => w.isActive()).length,
            totalRequests,
            totalPending,
        };
    }
    /**
     * Load queues and workers from persistent storage
     */
    static async load() {
        try {
            const data = await persistence_manager_1.PersistenceManager.loadData('queues.json');
            if (!data)
                return;
            // Load queues
            if (data.queues) {
                for (const [session, queueData] of Object.entries(data.queues)) {
                    if (Array.isArray(queueData)) {
                        const queue = request_queue_1.RequestQueue.deserialize(queueData);
                        this.queues.set(session, queue);
                    }
                }
            }
            // Load workers (but don't start them yet)
            if (data.workers) {
                for (const [session, workerData] of Object.entries(data.workers)) {
                    const queue = this.queues.get(session);
                    if (queue && workerData) {
                        const worker = worker_1.SessionWorker.deserialize(workerData, queue);
                        this.workers.set(session, worker);
                    }
                }
            }
            console.log(`[QueueManager] Loaded ${this.queues.size} queues and ${this.workers.size} workers from storage`);
        }
        catch (error) {
            console.error('[QueueManager] Failed to load queues:', error);
        }
    }
    /**
     * Save queues and workers to persistent storage
     */
    static async save() {
        try {
            const data = this.serializeQueues();
            await persistence_manager_1.PersistenceManager.saveData('queues.json', data);
        }
        catch (error) {
            console.error('[QueueManager] Failed to save queues:', error);
        }
    }
    /**
     * Restore workers (start those that were active)
     */
    static async restoreWorkers() {
        try {
            let restoredCount = 0;
            for (const [session, worker] of this.workers.entries()) {
                const workerData = worker.serialize();
                if (workerData.isActive) {
                    await worker.start();
                    restoredCount++;
                    console.log(`[QueueManager] Restored worker for session: ${session}`);
                }
            }
            console.log(`[QueueManager] Restored ${restoredCount} active workers`);
        }
        catch (error) {
            console.error('[QueueManager] Failed to restore workers:', error);
        }
    }
    /**
     * Serialize queues and workers for persistence
     */
    static serializeQueues() {
        const queues = {};
        const workers = {};
        // Serialize all queues
        for (const [session, queue] of this.queues.entries()) {
            queues[session] = queue.serialize();
        }
        // Serialize all workers
        for (const [session, worker] of this.workers.entries()) {
            workers[session] = worker.serialize();
        }
        return { queues, workers };
    }
}
exports.QueueManager = QueueManager;
QueueManager.queues = new Map();
QueueManager.workers = new Map();
//# sourceMappingURL=queue-manager.js.map