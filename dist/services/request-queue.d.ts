import { WAHARequest } from '../types/waha';
export interface QueuedRequest {
    id: string;
    request: WAHARequest;
    campaignId: string;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    error?: string;
    executedAt?: Date;
    result?: any;
}
interface SerializedQueuedRequest {
    id: string;
    request: WAHARequest;
    campaignId: string;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    error?: string;
    executedAt?: string;
    result?: any;
}
export declare class RequestQueue {
    private queue;
    private requestMap;
    /**
     * Add requests to the queue
     */
    addRequests(requests: WAHARequest[], campaignId: string): QueuedRequest[];
    /**
     * Get the next pending request
     */
    getNextRequest(): QueuedRequest | undefined;
    /**
     * Mark request as executing
     */
    markAsExecuting(requestId: string): void;
    /**
     * Mark request as completed
     */
    markAsCompleted(requestId: string, result?: any): void;
    /**
     * Mark request as failed
     */
    markAsFailed(requestId: string, error: string): void;
    /**
     * Get queue length
     */
    getQueueLength(): number;
    /**
     * Get pending requests count
     */
    getPendingCount(): number;
    /**
     * Get requests by campaign
     */
    getRequestsByCampaign(campaignId: string): QueuedRequest[];
    /**
     * Get all requests
     */
    getAllRequests(): QueuedRequest[];
    /**
     * Clear completed requests from a campaign
     */
    clearCampaignRequests(campaignId: string): void;
    /**
     * Serialize queue for persistence
     */
    serialize(): SerializedQueuedRequest[];
    /**
     * Deserialize queue from persistence
     */
    static deserialize(data: SerializedQueuedRequest[]): RequestQueue;
}
export {};
//# sourceMappingURL=request-queue.d.ts.map