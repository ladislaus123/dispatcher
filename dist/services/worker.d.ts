import { RequestQueue } from './request-queue';
interface SerializedWorker {
    session: string;
    isActive: boolean;
    createdAt: string;
}
export declare class SessionWorker {
    private session;
    private queue;
    private isRunning;
    private executionTimer?;
    private createdAt;
    constructor(session: string, queue: RequestQueue);
    /**
     * Start the worker
     */
    start(): Promise<void>;
    /**
     * Stop the worker
     */
    stop(): void;
    /**
     * Check if worker is running
     */
    isActive(): boolean;
    /**
     * Get session name
     */
    getSession(): string;
    /**
     * Main queue processing loop
     */
    private processQueue;
    /**
     * Execute a single request
     */
    private executeRequest;
    /**
     * Helper to delay execution
     */
    private delay;
    /**
     * Serialize worker for persistence
     */
    serialize(): SerializedWorker;
    /**
     * Deserialize worker from persistence
     */
    static deserialize(data: SerializedWorker, queue: RequestQueue): SessionWorker;
}
export {};
//# sourceMappingURL=worker.d.ts.map