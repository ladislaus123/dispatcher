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

export class RequestQueue {
  private queue: QueuedRequest[] = [];
  private requestMap: Map<string, QueuedRequest> = new Map();

  /**
   * Add requests to the queue
   */
  addRequests(
    requests: WAHARequest[],
    campaignId: string
  ): QueuedRequest[] {
    const queuedRequests: QueuedRequest[] = requests.map((req, index) => {
      const queuedReq: QueuedRequest = {
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
  getNextRequest(): QueuedRequest | undefined {
    return this.queue.find(req => req.status === 'pending');
  }

  /**
   * Mark request as executing
   */
  markAsExecuting(requestId: string): void {
    const request = this.requestMap.get(requestId);
    if (request) {
      request.status = 'executing';
    }
  }

  /**
   * Mark request as completed
   */
  markAsCompleted(requestId: string, result?: any): void {
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
  markAsFailed(requestId: string, error: string): void {
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
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Get pending requests count
   */
  getPendingCount(): number {
    return this.queue.filter(req => req.status === 'pending').length;
  }

  /**
   * Get requests by campaign
   */
  getRequestsByCampaign(campaignId: string): QueuedRequest[] {
    return this.queue.filter(req => req.campaignId === campaignId);
  }

  /**
   * Get all requests
   */
  getAllRequests(): QueuedRequest[] {
    return this.queue;
  }

  /**
   * Clear completed requests from a campaign
   */
  clearCampaignRequests(campaignId: string): void {
    const campaignRequests = this.queue.filter(req => req.campaignId === campaignId);
    campaignRequests.forEach(req => {
      this.requestMap.delete(req.id);
    });
    this.queue = this.queue.filter(req => req.campaignId !== campaignId);
  }

  /**
   * Serialize queue for persistence
   */
  serialize(): SerializedQueuedRequest[] {
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
  static deserialize(data: SerializedQueuedRequest[]): RequestQueue {
    const queue = new RequestQueue();

    for (const item of data) {
      const queuedReq: QueuedRequest = {
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
