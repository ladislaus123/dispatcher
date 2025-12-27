"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionWorker = void 0;
const axios_1 = __importDefault(require("axios"));
const EXECUTION_INTERVAL = parseInt(process.env.EXECUTION_INTERVAL || '60000', 10); // Default 1 minute in milliseconds
class SessionWorker {
    constructor(session, queue) {
        this.isRunning = false;
        this.session = session;
        this.queue = queue;
        this.createdAt = new Date();
    }
    /**
     * Start the worker
     */
    async start() {
        if (this.isRunning) {
            console.log(`Worker for session "${this.session}" is already running`);
            return;
        }
        this.isRunning = true;
        console.log(`Worker for session "${this.session}" started`);
        await this.processQueue();
    }
    /**
     * Stop the worker
     */
    stop() {
        this.isRunning = false;
        if (this.executionTimer) {
            clearTimeout(this.executionTimer);
            this.executionTimer = undefined;
        }
        console.log(`Worker for session "${this.session}" stopped`);
    }
    /**
     * Check if worker is running
     */
    isActive() {
        return this.isRunning;
    }
    /**
     * Get session name
     */
    getSession() {
        return this.session;
    }
    /**
     * Main queue processing loop
     */
    async processQueue() {
        while (this.isRunning) {
            const request = this.queue.getNextRequest();
            if (!request) {
                // No pending requests, wait a bit and check again
                await this.delay(5000);
                continue;
            }
            await this.executeRequest(request);
            // Wait 1 minute before processing the next request
            await this.delay(EXECUTION_INTERVAL);
        }
    }
    /**
     * Execute a single request
     */
    async executeRequest(request) {
        try {
            this.queue.markAsExecuting(request.id);
            console.log(`[${this.session}] Executing request ${request.id} to ${request.request.data.chatId}`);
            // DEBUG: Log full request details
            console.log(`[${this.session}] ========== REQUEST DEBUG ==========`);
            console.log(`[${this.session}] Request URL: ${request.request.url}`);
            console.log(`[${this.session}] Request Method: ${request.request.method}`);
            console.log(`[${this.session}] Request Headers:`, JSON.stringify(request.request.headers, null, 2));
            console.log(`[${this.session}] Request Data:`, JSON.stringify(request.request.data, null, 2));
            console.log(`[${this.session}] ==================================`);
            const response = await (0, axios_1.default)({
                method: request.request.method,
                url: request.request.url,
                headers: request.request.headers,
                data: request.request.data,
                timeout: 30000, // 30 second timeout
            });
            this.queue.markAsCompleted(request.id, response.data);
            console.log(`[${this.session}] Request ${request.id} completed successfully`);
        }
        catch (error) {
            const errorMessage = error.response?.data?.message ||
                error.message ||
                'Unknown error occurred';
            // DEBUG: Log full error details
            console.error(`[${this.session}] ========== ERROR DEBUG ==========`);
            console.error(`[${this.session}] Error Status: ${error.response?.status}`);
            console.error(`[${this.session}] Error Data:`, JSON.stringify(error.response?.data, null, 2));
            console.error(`[${this.session}] Error Message: ${errorMessage}`);
            if (error.config) {
                console.error(`[${this.session}] Request Config:`, {
                    url: error.config.url,
                    method: error.config.method,
                    headers: error.config.headers,
                });
            }
            console.error(`[${this.session}] ==================================`);
            this.queue.markAsFailed(request.id, errorMessage);
            console.error(`[${this.session}] Request ${request.id} failed: ${errorMessage}`);
        }
    }
    /**
     * Helper to delay execution
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Serialize worker for persistence
     */
    serialize() {
        return {
            session: this.session,
            isActive: this.isRunning,
            createdAt: this.createdAt.toISOString(),
        };
    }
    /**
     * Deserialize worker from persistence
     */
    static deserialize(data, queue) {
        const worker = new SessionWorker(data.session, queue);
        worker.createdAt = new Date(data.createdAt);
        return worker;
    }
}
exports.SessionWorker = SessionWorker;
//# sourceMappingURL=worker.js.map