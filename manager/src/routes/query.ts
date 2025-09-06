import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { RedisClient } from '../services/redis-client.js';

const QueryParamsSchema = z.object({
  collector_id: z.string(),
  camera_id: z.string(),
  cell_id: z.string().optional(),
});

const HeatmapQuerySchema = z.object({
  collector_id: z.string(),
  camera_id: z.string(),
  window_ms: z.coerce.number().optional().default(3600000),
});

const ObjectQuerySchema = z.object({
  collector_id: z.string(),
  camera_id: z.string(),
  object_id: z.string(),
});

const ActiveObjectsQuerySchema = z.object({
  collector_id: z.string(),
  camera_id: z.string(),
});

export async function queryRoutes(fastify: FastifyInstance, { redisClient }: { redisClient: RedisClient }) {
  
  fastify.get<{
    Querystring: z.infer<typeof QueryParamsSchema>
  }>('/stats/cells', async (request, reply) => {
    try {
      const params = QueryParamsSchema.parse(request.query);
      
      const stats = await redisClient.getCellStats(
        params.collector_id,
        params.camera_id,
        params.cell_id
      );

      return {
        collector_id: params.collector_id,
        camera_id: params.camera_id,
        cell_id: params.cell_id,
        stats,
        timestamp: Date.now(),
        total_cells: stats.length,
      };

    } catch (error) {
      fastify.log.error({ error }, 'Failed to get cell stats');
      reply.status(500).send({ error: 'Failed to get cell stats' });
    }
  });

  fastify.get<{
    Params: z.infer<typeof ObjectQuerySchema>
  }>('/objects/:collector_id/:camera_id/:object_id', async (request, reply) => {
    try {
      const params = ObjectQuerySchema.parse(request.params);
      
      const [objectState, timeline] = await Promise.all([
        redisClient.getObjectState(params.collector_id, params.camera_id, params.object_id),
        redisClient.getTimeline(params.collector_id, params.camera_id, params.object_id)
      ]);

      if (!objectState) {
        reply.status(404).send({ error: 'Object not found' });
        return;
      }

      return {
        object_state: objectState,
        timeline,
        timestamp: Date.now(),
      };

    } catch (error) {
      fastify.log.error({ error }, 'Failed to get object details');
      reply.status(500).send({ error: 'Failed to get object details' });
    }
  });

  fastify.get<{
    Querystring: z.infer<typeof HeatmapQuerySchema>
  }>('/heatmap', async (request, reply) => {
    try {
      const params = HeatmapQuerySchema.parse(request.query);
      
      const heatmapData = await redisClient.generateHeatmapData(
        params.collector_id,
        params.camera_id,
        params.window_ms
      );

      return heatmapData;

    } catch (error) {
      fastify.log.error({ error }, 'Failed to generate heatmap');
      reply.status(500).send({ error: 'Failed to generate heatmap' });
    }
  });

  fastify.get('/health', async (request, reply) => {
    return {
      status: 'healthy',
      service: 'vision-manager',
      timestamp: Date.now(),
      uptime: process.uptime(),
    };
  });

  fastify.get('/metrics', async (request, reply) => {
    const memUsage = process.memoryUsage();
    
    return {
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
      },
      load: process.cpuUsage(),
    };
  });

  fastify.get('/events/recent', async (request, reply) => {
    try {
      const recentEvents = await redisClient.getRecentEvents(50);
      
      return {
        events: recentEvents,
        timestamp: Date.now(),
        count: recentEvents.length,
      };
    } catch (error) {
      fastify.log.error({ error }, 'Failed to get recent events');
      reply.status(500).send({ error: 'Failed to get recent events' });
    }
  });

  fastify.get<{
    Querystring: z.infer<typeof ActiveObjectsQuerySchema>
  }>('/objects/active', async (request, reply) => {
    try {
      const params = ActiveObjectsQuerySchema.parse(request.query);
      
      const activeObjects = await redisClient.getActiveObjects(
        params.collector_id,
        params.camera_id
      );

      return {
        collector_id: params.collector_id,
        camera_id: params.camera_id,
        objects: activeObjects,
        timestamp: Date.now(),
        count: activeObjects.length,
      };

    } catch (error) {
      fastify.log.error({ error }, 'Failed to get active objects');
      reply.status(500).send({ error: 'Failed to get active objects' });
    }
  });
}