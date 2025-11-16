// app/api/admin/queue-status/route.ts
/**
 * Queue and memory monitoring endpoint
 * Protected by ADMIN_API_KEY
 */

import { inpaintQueue } from '@/lib/utils/requestQueue';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Check authorization
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token || token !== process.env.ADMIN_API_KEY) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get queue status
        const queueStatus = inpaintQueue.getStatus();

        // Get memory usage
        const memoryUsage = process.memoryUsage();
        const memoryMB = {
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024),
            rss: Math.round(memoryUsage.rss / 1024 / 1024)
        };

        // Calculate capacity utilization
        const concurrentPercent = Math.round(
            (queueStatus.processing / queueStatus.maxConcurrent) * 100
        );
        const queuePercent = Math.round(
            (queueStatus.queued / queueStatus.maxQueueSize) * 100
        );

        // Determine alerts
        const alerts = [];
        if (concurrentPercent > 80) {
            alerts.push('⚠️  High concurrent load (>80%)');
        }
        if (queuePercent > 50) {
            alerts.push('⚠️  Queue is filling up (>50%)');
        }
        if (memoryMB.heapUsed > 400) {
            alerts.push('⚠️  High memory usage (>400MB)');
        }

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            queue: queueStatus,
            memory: memoryMB,
            capacityUtilization: {
                concurrent: `${queueStatus.processing}/${queueStatus.maxConcurrent} (${concurrentPercent}%)`,
                queue: `${queueStatus.queued}/${queueStatus.maxQueueSize} (${queuePercent}%)`
            },
            alerts: alerts.length > 0 ? alerts : ['✅ All systems normal']
        });

    } catch (error: any) {
        console.error('Queue status error:', error);
        return NextResponse.json(
            { error: 'Failed to get queue status', details: error.message },
            { status: 500 }
        );
    }
}

// Optional: Reset metrics endpoint
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token || token !== process.env.ADMIN_API_KEY) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        inpaintQueue.resetMetrics();

        return NextResponse.json({
            success: true,
            message: 'Queue metrics reset'
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to reset metrics', details: error.message },
            { status: 500 }
        );
    }
}
