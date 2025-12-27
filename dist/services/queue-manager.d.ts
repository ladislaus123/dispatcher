import { RequestQueue } from './request-queue';
import { WAHARequest } from '../types/waha';
export declare class QueueManager {
    private static queues;
    private static workers;
    /**
     * Get or create a queue for a session
     */
    private static getOrCreateQueue;
    /**
     * Add requests to a session queue and start worker if needed
     */
    static enqueueRequests(session: string, requests: WAHARequest[], campaignId: string): void;
    /**
     * Get worker status with detailed campaign progress
     */
    static getWorkerStatus(session: string): {
        session: string;
        isActive: boolean;
        totalRequests: number;
        pendingRequests: number;
        completedRequests: number;
        failedRequests: number;
        executingRequests: number;
        campaigns: any[];
    } | null;
    /**
     * Get all active workers
     */
    static getAllWorkerStatus(): ({
        session: string;
        isActive: boolean;
        totalRequests: number;
        pendingRequests: number;
        completedRequests: number;
        failedRequests: number;
        executingRequests: number;
        campaigns: any[];
    } | null)[];
    /**
     * Start a worker
     */
    static startWorker(session: string): Promise<void>;
    /**
     * Stop a worker
     */
    static stopWorker(session: string): void;
    /**
     * Get queue for a session
     */
    static getQueue(session: string): RequestQueue | undefined;
    /**
     * Get all queues
     */
    static getAllQueues(): Record<string, any>;
    /**
     * Clear a campaign from all queues
     */
    static clearCampaign(campaignId: string): void;
    /**
     * Get queue statistics
     */
    static getStats(): {
        totalSessions: number;
        activeSessions: number;
        totalRequests: number;
        totalPending: number;
    };
    /**
     * Load queues and workers from persistent storage
     */
    static load(): Promise<void>;
    /**
     * Save queues and workers to persistent storage
     */
    static save(): Promise<void>;
    /**
     * Restore workers (start those that were active)
     */
    static restoreWorkers(): Promise<void>;
    /**
     * Serialize queues and workers for persistence
     */
    private static serializeQueues;
}
//# sourceMappingURL=queue-manager.d.ts.map