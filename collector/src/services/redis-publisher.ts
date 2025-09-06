import { createClient } from 'redis';
import pino from 'pino';
import type { NormalizedEvent } from '../types/detection.js';

const logger = pino({ name: 'redis-publisher' });

export class RedisPublisher {
  private client: any;
  private isConnected = false;

  constructor(redisUrl: string = 'redis://localhost:6379') {
    this.client = createClient({ url: redisUrl });
    
    this.client.on('error', (err) => {
      logger.error({ error: err }, 'Redis client error');
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
      this.isConnected = true;
    });

    this.client.on('end', () => {
      logger.info('Redis client disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  async publishDetectionEvents(events: NormalizedEvent[]): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Redis client not connected');
    }

    try {
      const multi = this.client.multi();
      
      for (const event of events) {
        // Publish to detection events channel
        multi.publish('detection:events', JSON.stringify(event));
        
        // Store in sorted set for manager to process
        multi.zAdd('detection:queue', { score: Date.now(), value: JSON.stringify(event) });
      }

      await multi.exec();
      
      logger.info({ eventCount: events.length }, 'Published detection events to Redis');
    } catch (error) {
      logger.error({ error, eventCount: events.length }, 'Failed to publish detection events');
      throw error;
    }
  }
}