import { config } from 'dotenv';
import fastify from 'fastify';
import cors from '@fastify/cors';
import pino from 'pino';
import { CollectorService } from './services/collector.js';
import { RedisPublisher } from './services/redis-publisher.js';
import type { CameraFrame } from './types/detection.js';

config();

const logger = pino({ name: 'collector-main' });

const COLLECTOR_ID = process.env.COLLECTOR_ID || 'collector-01';
const PORT = parseInt(process.env.PORT || '3001');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function main() {
  const server = fastify({ logger: true });
  
  await server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  });

  const redisPublisher = new RedisPublisher(REDIS_URL);
  const collectorService = new CollectorService(COLLECTOR_ID, redisPublisher);

  server.get('/health', async (request, reply) => {
    return { status: 'healthy', collector_id: COLLECTOR_ID, timestamp: Date.now() };
  });

  server.post<{ Body: CameraFrame }>('/frames', async (request, reply) => {
    try {
      await collectorService.processCameraFrame(request.body);
      return { status: 'processed', frame_id: request.body.frame_id };
    } catch (error) {
      logger.error({ error }, 'Failed to process frame');
      reply.status(500).send({ error: 'Failed to process frame' });
    }
  });

  server.post<{ Body: { camera_id: string; object_count?: number } }>('/generate-test-frame', async (request, reply) => {
    try {
      const { camera_id, object_count = 3 } = request.body;
      const testFrame = collectorService.generateTestFrame(camera_id, object_count);
      await collectorService.processCameraFrame(testFrame);
      return { 
        status: 'generated_and_processed', 
        frame: testFrame,
        event_count: testFrame.objects.length 
      };
    } catch (error) {
      logger.error({ error }, 'Failed to generate test frame');
      reply.status(500).send({ error: 'Failed to generate test frame' });
    }
  });

  server.post<{ Body: { camera_ids: string[]; frames_per_camera?: number; interval_ms?: number } }>('/simulate-batch', async (request, reply) => {
    try {
      const { camera_ids, frames_per_camera = 5, interval_ms = 1000 } = request.body;
      
      reply.send({ status: 'simulation_started', camera_ids, frames_per_camera, interval_ms });

      for (let i = 0; i < frames_per_camera; i++) {
        const frames = camera_ids.map(cameraId => 
          collectorService.generateTestFrame(cameraId, Math.floor(Math.random() * 5) + 1)
        );
        
        await collectorService.processMultipleFrames(frames);
        
        if (i < frames_per_camera - 1) {
          await new Promise(resolve => setTimeout(resolve, interval_ms));
        }
      }

      logger.info({ camera_ids, frames_per_camera, interval_ms }, 'Batch simulation completed');
    } catch (error) {
      logger.error({ error }, 'Failed to run batch simulation');
    }
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    await collectorService.stop();
    await server.close();
  });

  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully');
    await collectorService.stop();
    await server.close();
  });

  try {
    await collectorService.start();
    await server.listen({ port: PORT, host: '0.0.0.0' });
    logger.info(`Collector service started on port ${PORT} with ID: ${COLLECTOR_ID}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});