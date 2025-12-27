"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestQueue = void 0;
class RequestQueue {
    constructor() {
        this.queue = [];
        this.requestMap = new Map();
    }
    /**
     * Add requests to the queue
     */
    addRequests(requests, campaignId) {
        const queuedRequests = requests.map((req, index) => {
            const queuedReq = {
                id: `${campaignId}_req_${index}_${Date.now()}`,
                request: req,
                campaignId,
                status: 'pending',
            };
            this.queue.push(queuedReq);
            this.requestMap.set(queuedReq.id, queuedReq);
            return queuedReq;
        });
        console.log(`Added ${queuedRequests.length} requests to queue`);
        return queuedRequests;
    }
    /**
     * Get the next pending request
     */
    getNextRequest() {
        return this.queue.find(req => req.status === 'pending');
    }
    /**
     * Mark request as executing
     */
    markAsExecuting(requestId) {
        const request = this.requestMap.get(requestId);
        if (request) {
            request.status = 'executing';
        }
    }
    /**
     * Mark request as completed
     */
    markAsCompleted(requestId, result) {
        const request = this.requestMap.get(requestId);
        if (request) {
            request.status = 'completed';
            request.executedAt = new Date();
            request.result = result;
        }
    }
    /**
     * Mark request as failed
     */
    markAsFailed(requestId, error) {
        const request = this.requestMap.get(requestId);
        if (request) {
            request.status = 'failed';
            request.error = error;
            request.executedAt = new Date();
        }
    }
    /**
     * Get queue length
     */
    getQueueLength() {
        return this.queue.length;
    }
    /**
     * Get pending requests count
     */
    getPendingCount() {
        return this.queue.filter(req => req.status === 'pending').length;
    }
    /**
     * Get requests by campaign
     */
    getRequestsByCampaign(campaignId) {
        return this.queue.filter(req => req.campaignId === campaignId);
    }
    /**
     * Get all requests
     */
    getAllRequests() {
        return this.queue;
    }
    /**
     * Clear completed requests from a campaign
     */
    clearCampaignRequests(campaignId) {
        const campaignRequests = this.queue.filter(req => req.campaignId === campaignId);
        campaignRequests.forEach(req => {
            this.requestMap.delete(req.id);
        });
        this.queue = this.queue.filter(req => req.campaignId !== campaignId);
    }
    /**
     * Serialize queue for persistence
     */
    serialize() {
        return this.queue.map(req => ({
            id: req.id,
            request: req.request,
            campaignId: req.campaignId,
            status: req.status,
            error: req.error,
            executedAt: req.executedAt?.toISOString(),
            result: req.result,
        }));
    }
    /**
     * Deserialize queue from persistence
     */
    static deserialize(data) {
        const queue = new RequestQueue();
        for (const item of data) {
            const queuedReq = {
                id: item.id,
                request: item.request,
                campaignId: item.campaignId,
                status: item.status,
                error: item.error,
                executedAt: item.executedAt ? new Date(item.executedAt) : undefined,
                result: item.result,
            };
            queue.queue.push(queuedReq);
            queue.requestMap.set(queuedReq.id, queuedReq);
        }
        return queue;
    }
}
exports.RequestQueue = RequestQueue;
//# sourceMappingURL=request-queue.js.map