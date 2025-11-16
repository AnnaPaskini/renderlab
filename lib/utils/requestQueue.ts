// lib/utils/requestQueue.ts
/**
 * Request queue to prevent exceeding Vercel concurrent execution limits
 * Handles graceful queueing when >100 requests are processing simultaneously
 */

type QueuedRequest<T> = {
    execute: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: any) => void;
    addedAt: number;
};

class RequestQueue {
    private queue: QueuedRequest<any>[] = [];
    private processing = 0;
    private maxConcurrent: number;
    private maxQueueSize: number;
    private metrics = {
        totalProcessed: 0,
        totalQueued: 0,
        totalRejected: 0,
        peakConcurrent: 0,
        peakQueueSize: 0
    };

    constructor(maxConcurrent = 100, maxQueueSize = 500) {
        this.maxConcurrent = maxConcurrent;
        this.maxQueueSize = maxQueueSize;
    }

    /**
     * Add request to queue
     * Returns promise that resolves when request completes
     */
    async add<T>(fn: () => Promise<T>): Promise<T> {
        // If under limit, execute immediately
        if (this.processing < this.maxConcurrent) {
            return this.execute(fn);
        }

        // Check queue size limit
        if (this.queue.length >= this.maxQueueSize) {
            this.metrics.totalRejected++;
            throw new Error(
                `Queue full (${this.maxQueueSize} requests). Please try again in a few seconds.`
            );
        }

        // Add to queue
        return new Promise<T>((resolve, reject) => {
            const queuedRequest: QueuedRequest<T> = {
                execute: fn,
                resolve,
                reject,
                addedAt: Date.now()
            };

            this.queue.push(queuedRequest);
            this.metrics.totalQueued++;
            this.metrics.peakQueueSize = Math.max(
                this.metrics.peakQueueSize,
                this.queue.length
            );

            console.log(`📋 Queued request. Position: ${this.queue.length}, Processing: ${this.processing}`);
        });
    }

    /**
     * Execute a request
     */
    private async execute<T>(fn: () => Promise<T>): Promise<T> {
        this.processing++;
        this.metrics.peakConcurrent = Math.max(
            this.metrics.peakConcurrent,
            this.processing
        );

        try {
            const result = await fn();
            this.metrics.totalProcessed++;
            return result;
        } finally {
            this.processing--;
            this.processNext();
        }
    }

    /**
     * Process next item in queue
     */
    private processNext() {
        if (this.queue.length === 0) return;
        if (this.processing >= this.maxConcurrent) return;

        const next = this.queue.shift();
        if (!next) return;

        const waitTime = Date.now() - next.addedAt;
        console.log(`⚡ Processing queued request (waited ${waitTime}ms)`);

        this.execute(next.execute)
            .then(next.resolve)
            .catch(next.reject);
    }

    /**
     * Get current queue status
     */
    getStatus() {
        return {
            processing: this.processing,
            queued: this.queue.length,
            maxConcurrent: this.maxConcurrent,
            maxQueueSize: this.maxQueueSize,
            metrics: this.metrics
        };
    }

    /**
     * Reset metrics (useful for monitoring)
     */
    resetMetrics() {
        this.metrics = {
            totalProcessed: 0,
            totalQueued: 0,
            totalRejected: 0,
            peakConcurrent: 0,
            peakQueueSize: 0
        };
    }
}

// Singleton instance for inpainting requests
export const inpaintQueue = new RequestQueue(
    100,  // Max 100 concurrent (Vercel Pro limit)
    500   // Max 500 in queue (prevents memory issues)
);

// Export for monitoring endpoint
export { RequestQueue };
