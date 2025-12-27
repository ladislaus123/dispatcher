import axios from 'axios';
import { RequestQueue, QueuedRequest } from './request-queue';

const EXECUTION_INTERVAL = parseInt(process.env.EXECUTION_INTERVAL || '60000', 10); // Default 1 minute in milliseconds

interface SerializedWorker {
  session: string;
  isActive: boolean;
  createdAt: string;
}

export class SessionWorker {
  private session: string;
  private queue: RequestQueue;
  private isRunning: boolean = false;
  private executionTimer?: NodeJS.Timeout;
  private createdAt: Date;

  constructor(session: string, queue: RequestQueue) {
    this.session = session;
    this.queue = queue;
    this.createdAt = new Date();
  }

  /**
   * Start the worker
   */
  async start(): Promise<void> {
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
  stop(): void {
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
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get session name
   */
  getSession(): string {
    return this.session;
  }

  /**
   * Main queue processing loop
   */
  private async processQueue(): Promise<void> {
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
  private async executeRequest(request: QueuedRequest): Promise<void> {
    try {
      this.queue.markAsExecuting(request.id);

      console.log(
        `[${this.session}] Executing request ${request.id} to ${request.request.data.chatId}`
      );

      // DEBUG: Log full request details
      console.log(`[${this.session}] ========== REQUEST DEBUG ==========`);
      console.log(`[${this.session}] Request URL: ${request.request.url}`);
      console.log(`[${this.session}] Request Method: ${request.request.method}`);
      console.log(`[${this.session}] Request Headers:`, JSON.stringify(request.request.headers, null, 2));
      console.log(`[${this.session}] Request Data:`, JSON.stringify(request.request.data, null, 2));
      console.log(`[${this.session}] ==================================`);

      const response = await axios({
        method: request.request.method,
        url: request.request.url,
        headers: request.request.headers,
        data: request.request.data,
        timeout: 30000, // 30 second timeout
      });

      this.queue.markAsCompleted(request.id, response.data);
      console.log(
        `[${this.session}] Request ${request.id} completed successfully`
      );
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
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
      console.error(
        `[${this.session}] Request ${request.id} failed: ${errorMessage}`
      );
    }
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Serialize worker for persistence
   */
  serialize(): SerializedWorker {
    return {
      session: this.session,
      isActive: this.isRunning,
      createdAt: this.createdAt.toISOString(),
    };
  }

  /**
   * Deserialize worker from persistence
   */
  static deserialize(data: SerializedWorker, queue: RequestQueue): SessionWorker {
    const worker = new SessionWorker(data.session, queue);
    worker.createdAt = new Date(data.createdAt);
    return worker;
  }
}
