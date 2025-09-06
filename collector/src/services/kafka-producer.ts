import { Kafka } from 'kafkajs';
import type { Producer, ProducerRecord } from 'kafkajs';
import pino from 'pino';
import type { NormalizedEvent } from '../types/detection.js';

const logger = pino({ name: 'kafka-producer' });

export class KafkaProducer {
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor(brokers: string[] = ['localhost:9092']) {
    this.kafka = new Kafka({
      clientId: 'vision-collector-producer',
      brokers,
    });

    this.producer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000,
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.producer.connect();
      this.isConnected = true;
      logger.info('Kafka producer connected');
    } catch (error) {
      logger.error({ error }, 'Failed to connect to Kafka');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.producer.disconnect();
      this.isConnected = false;
      logger.info('Kafka producer disconnected');
    } catch (error) {
      logger.error({ error }, 'Failed to disconnect from Kafka');
      throw error;
    }
  }

  async sendDetectionEvents(events: NormalizedEvent[]): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Producer not connected');
    }

    const messages = events.map(event => ({
      key: `${event.collector_id}:${event.camera_id}`,
      value: JSON.stringify(event),
      partition: this.getPartition(event.collector_id, event.camera_id),
      headers: {
        'content-type': 'application/json',
        'event-type': 'detection',
        'collector-id': event.collector_id,
        'camera-id': event.camera_id,
      },
    }));

    const record: ProducerRecord = {
      topic: 'raw.detections',
      messages,
    };

    try {
      const result = await this.producer.send(record);
      logger.debug({ 
        topic: 'raw.detections', 
        messageCount: events.length,
        result 
      }, 'Sent detection events');
    } catch (error) {
      logger.error({ error, events }, 'Failed to send detection events');
      throw error;
    }
  }

  private getPartition(collectorId: string, cameraId: string): number {
    const key = `${collectorId}:${cameraId}`;
    return Math.abs(this.hashCode(key)) % 3;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}