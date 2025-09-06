import { Kafka } from 'kafkajs';
import type { Consumer, EachMessagePayload } from 'kafkajs';
import pino from 'pino';
import { NormalizedEventSchema, type NormalizedEvent } from '../types/index.js';
import { DwellProcessor } from './dwell-processor.js';

const logger = pino({ name: 'kafka-consumer' });

export class KafkaConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private dwellProcessor: DwellProcessor;
  private isRunning = false;

  constructor(dwellProcessor: DwellProcessor, brokers: string[] = ['localhost:9092']) {
    this.dwellProcessor = dwellProcessor;
    
    this.kafka = new Kafka({
      clientId: 'vision-manager-consumer',
      brokers,
    });

    this.consumer = this.kafka.consumer({ 
      groupId: 'vision-manager-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    try {
      await this.consumer.connect();
      
      await this.consumer.subscribe({ 
        topics: ['raw.detections', 'feedback.updates'],
        fromBeginning: false
      });

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.isRunning = true;
      logger.info('Kafka consumer started');

    } catch (error) {
      logger.error({ error }, 'Failed to start Kafka consumer');
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.consumer.disconnect();
      this.isRunning = false;
      logger.info('Kafka consumer stopped');
    } catch (error) {
      logger.error({ error }, 'Failed to stop Kafka consumer');
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    if (!message.value) {
      logger.warn({ topic, partition }, 'Received empty message');
      return;
    }

    try {
      const messageStr = message.value.toString();
      
      switch (topic) {
        case 'raw.detections':
          await this.handleDetectionEvent(messageStr, message);
          break;
        case 'feedback.updates':
          await this.handleFeedbackEvent(messageStr, message);
          break;
        default:
          logger.warn({ topic }, 'Unknown topic received');
      }

    } catch (error) {
      logger.error({ 
        error, 
        topic, 
        partition, 
        offset: message.offset,
        key: message.key?.toString()
      }, 'Failed to process message');
    }
  }

  private async handleDetectionEvent(messageStr: string, message: any): Promise<void> {
    try {
      const eventData = JSON.parse(messageStr);
      const event = NormalizedEventSchema.parse(eventData);
      
      await this.dwellProcessor.processEvent(event);

      logger.debug({
        eventId: event.event_id,
        collectorId: event.collector_id,
        cameraId: event.camera_id,
        objectId: event.object_id,
        cellId: event.grid_cell_id,
        offset: message.offset
      }, 'Processed detection event');

    } catch (error) {
      logger.error({ error, messageStr }, 'Failed to parse detection event');
      throw error;
    }
  }

  private async handleFeedbackEvent(messageStr: string, message: any): Promise<void> {
    try {
      const feedbackData = JSON.parse(messageStr);
      
      logger.info({
        feedbackType: feedbackData.type,
        offset: message.offset
      }, 'Received feedback event');

    } catch (error) {
      logger.error({ error, messageStr }, 'Failed to parse feedback event');
      throw error;
    }
  }

  getConsumerState(): { isRunning: boolean; topics: string[] } {
    return {
      isRunning: this.isRunning,
      topics: ['raw.detections', 'feedback.updates']
    };
  }
}