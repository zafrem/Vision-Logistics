import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import type { DetectionPayload, NormalizedEvent, CameraFrame, DetectedObject } from '../types/detection.js';
import { RedisPublisher } from './redis-publisher.js';

const logger = pino({ name: 'collector-service' });

export class CollectorService {
  private collectorId: string;
  private redisPublisher: RedisPublisher;
  private isProcessing = false;

  constructor(collectorId: string, redisPublisher: RedisPublisher) {
    this.collectorId = collectorId;
    this.redisPublisher = redisPublisher;
  }

  async start(): Promise<void> {
    await this.redisPublisher.connect();
    this.isProcessing = true;
    logger.info({ collectorId: this.collectorId }, 'Collector service started');
  }

  async stop(): Promise<void> {
    this.isProcessing = false;
    await this.redisPublisher.disconnect();
    logger.info({ collectorId: this.collectorId }, 'Collector service stopped');
  }

  async processCameraFrame(frame: CameraFrame): Promise<void> {
    if (!this.isProcessing) {
      throw new Error('Collector service not started');
    }

    try {
      const detectionPayload = this.buildDetectionPayload(frame);
      const normalizedEvents = this.normalizeDetectionPayload(detectionPayload);
      
      if (normalizedEvents.length > 0) {
        await this.redisPublisher.publishDetectionEvents(normalizedEvents);
      }

      logger.info({
        collectorId: this.collectorId,
        cameraId: frame.camera_id,
        frameId: frame.frame_id,
        objectCount: frame.objects.length,
        eventCount: normalizedEvents.length
      }, 'Processed camera frame');

    } catch (error) {
      logger.error({ error, frame }, 'Failed to process camera frame');
      throw error;
    }
  }

  private buildDetectionPayload(frame: CameraFrame): DetectionPayload {
    return {
      collector_id: this.collectorId,
      camera_id: frame.camera_id,
      timestamp_ms: frame.timestamp_ms,
      frame_id: frame.frame_id,
      objects: frame.objects,
    };
  }

  private normalizeDetectionPayload(payload: DetectionPayload): NormalizedEvent[] {
    return payload.objects.map(obj => ({
      event_id: `evt-${payload.collector_id}-${payload.camera_id}-${payload.timestamp_ms}-${obj.object_id}`,
      collector_id: payload.collector_id,
      camera_id: payload.camera_id,
      object_id: obj.object_id,
      grid_cell_id: obj.grid_cell_id,
      ts_ms: payload.timestamp_ms,
    }));
  }

  async processMultipleFrames(frames: CameraFrame[]): Promise<void> {
    const batchSize = 10;
    
    for (let i = 0; i < frames.length; i += batchSize) {
      const batch = frames.slice(i, i + batchSize);
      await Promise.all(batch.map(frame => this.processCameraFrame(frame)));
      
      if (i + batchSize < frames.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  generateTestFrame(cameraId: string, objectCount: number = 3): CameraFrame {
    const timestamp = Date.now();
    const objects: DetectedObject[] = [];

    for (let i = 0; i < objectCount; i++) {
      const gridX = Math.floor(Math.random() * 20);
      const gridY = Math.floor(Math.random() * 15);
      
      objects.push({
        object_id: `obj-${uuidv4().slice(0, 8)}`,
        class: this.getRandomObjectClass(),
        confidence: 0.7 + Math.random() * 0.3,
        grid_cell_id: `G_${gridX.toString().padStart(2, '0')}_${gridY.toString().padStart(2, '0')}`,
        bbox: [
          Math.floor(Math.random() * 1000),
          Math.floor(Math.random() * 800), 
          50 + Math.floor(Math.random() * 200),
          50 + Math.floor(Math.random() * 200)
        ]
      });
    }

    return {
      camera_id: cameraId,
      frame_id: `${cameraId}-${timestamp}`,
      timestamp_ms: timestamp,
      objects
    };
  }

  private getRandomObjectClass(): string {
    const classes = ['pallet', 'forklift', 'worker', 'box', 'container', 'truck'];
    return classes[Math.floor(Math.random() * classes.length)];
  }
}