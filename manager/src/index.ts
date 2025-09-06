import { config } from 'dotenv';
import fastify from 'fastify';
import cors from '@fastify/cors';
import pino from 'pino';
import { RedisClient } from './services/redis-client.js';
import { DwellProcessor } from './services/dwell-processor.js';
import { RedisConsumer } from './services/redis-consumer.js';
import { queryRoutes } from './routes/query.js';
import { feedbackRoutes } from './routes/feedback.js';

config();

const logger = pino({ name: 'manager-main' });

const PORT = parseInt(process.env.PORT || '3002');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DWELL_TIMEOUT_MS = parseInt(process.env.DWELL_TIMEOUT_MS || '30000');

async function main() {
  const server = fastify({ 
    logger: {
      level: process.env.LOG_LEVEL || 'info'
    }
  });
  
  await server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  });

  const redisClient = new RedisClient(REDIS_URL);
  const dwellProcessor = new DwellProcessor(redisClient, DWELL_TIMEOUT_MS);
  const redisConsumer = new RedisConsumer(dwellProcessor, redisClient, REDIS_URL);

  await server.register(queryRoutes, { redisClient });
  await server.register(feedbackRoutes, { redisClient });

  server.get('/status', async (request, reply) => {
    const consumerState = redisConsumer.getConsumerState();
    
    return {
      service: 'vision-manager',
      status: 'running',
      timestamp: Date.now(),
      uptime: process.uptime(),
      redis_consumer: consumerState,
      redis_connected: true,
    };
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    await redisConsumer.stop();
    await redisClient.disconnect();
    await server.close();
  });

  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully');
    await redisConsumer.stop();
    await redisClient.disconnect();
    await server.close();
  });

  try {
    await redisClient.connect();
    await redisConsumer.start();
    await server.listen({ port: PORT, host: '0.0.0.0' });
    
    logger.info({
      port: PORT,
      redisUrl: REDIS_URL,
      dwellTimeoutMs: DWELL_TIMEOUT_MS
    }, 'Manager service started successfully');

  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});