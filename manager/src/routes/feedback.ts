import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { RedisClient } from '../services/redis-client.js';
import { 
  FeedbackRelabelSchema, 
  FeedbackCorrectCellSchema, 
  FeedbackDeleteSpanSchema 
} from '../types/index.js';

export async function feedbackRoutes(fastify: FastifyInstance, { redisClient }: { redisClient: RedisClient }) {
  
  fastify.post<{
    Body: z.infer<typeof FeedbackRelabelSchema>
  }>('/feedback/relabel', async (request, reply) => {
    try {
      const feedback = FeedbackRelabelSchema.parse(request.body);
      
      const oldState = await redisClient.getObjectState(
        feedback.collector_id,
        feedback.camera_id,
        feedback.old_object_id
      );

      if (!oldState) {
        reply.status(404).send({ error: 'Object not found' });
        return;
      }

      const newState = {
        ...oldState,
        object_id: feedback.new_object_id,
      };

      await redisClient.setObjectState(newState);

      if (oldState.current_cell && oldState.accumulated_ms > 0) {
        await redisClient.removeCellDwell(
          feedback.collector_id,
          feedback.camera_id,
          oldState.current_cell,
          feedback.old_object_id
        );
        
        await redisClient.updateCellDwell(
          feedback.collector_id,
          feedback.camera_id,
          oldState.current_cell,
          feedback.new_object_id,
          oldState.accumulated_ms
        );
      }

      await redisClient.logFeedbackEvent('relabel', feedback);

      fastify.log.info({ feedback }, 'Object relabeled');

      return {
        status: 'success',
        message: 'Object relabeled successfully',
        old_object_id: feedback.old_object_id,
        new_object_id: feedback.new_object_id,
        timestamp: Date.now(),
      };

    } catch (error) {
      fastify.log.error({ error }, 'Failed to relabel object');
      reply.status(500).send({ error: 'Failed to relabel object' });
    }
  });

  fastify.post<{
    Body: z.infer<typeof FeedbackCorrectCellSchema>
  }>('/feedback/correct-cell', async (request, reply) => {
    try {
      const feedback = FeedbackCorrectCellSchema.parse(request.body);
      
      const objectState = await redisClient.getObjectState(
        feedback.collector_id,
        feedback.camera_id,
        feedback.object_id
      );

      if (!objectState) {
        reply.status(404).send({ error: 'Object not found' });
        return;
      }

      if (objectState.current_cell === feedback.correct_cell_id) {
        return {
          status: 'no_change',
          message: 'Object is already in the correct cell',
          timestamp: Date.now(),
        };
      }

      if (objectState.current_cell && objectState.enter_ts_ms) {
        const currentDwell = feedback.frame_ts_ms - objectState.enter_ts_ms;
        
        await redisClient.removeCellDwell(
          feedback.collector_id,
          feedback.camera_id,
          objectState.current_cell,
          feedback.object_id
        );

        await redisClient.addTimelineEntry(
          feedback.collector_id,
          feedback.camera_id,
          feedback.object_id,
          {
            type: 'correct',
            cell_id: objectState.current_cell,
            from_ts_ms: objectState.enter_ts_ms,
            to_ts_ms: feedback.frame_ts_ms,
            meta: { 
              reason: 'correction',
              original_cell: objectState.current_cell,
              corrected_cell: feedback.correct_cell_id 
            },
          }
        );
      }

      const correctedState = {
        ...objectState,
        current_cell: feedback.correct_cell_id,
        enter_ts_ms: feedback.frame_ts_ms,
        last_seen_ts_ms: feedback.frame_ts_ms,
      };

      await redisClient.setObjectState(correctedState);

      await redisClient.addTimelineEntry(
        feedback.collector_id,
        feedback.camera_id,
        feedback.object_id,
        {
          type: 'enter',
          cell_id: feedback.correct_cell_id,
          from_ts_ms: feedback.frame_ts_ms,
          to_ts_ms: null,
          meta: { reason: 'correction' },
        }
      );

      await redisClient.logFeedbackEvent('correct_cell', feedback);

      fastify.log.info({ feedback }, 'Cell assignment corrected');

      return {
        status: 'success',
        message: 'Cell assignment corrected successfully',
        old_cell: objectState.current_cell,
        new_cell: feedback.correct_cell_id,
        timestamp: Date.now(),
      };

    } catch (error) {
      fastify.log.error({ error }, 'Failed to correct cell assignment');
      reply.status(500).send({ error: 'Failed to correct cell assignment' });
    }
  });

  fastify.post<{
    Body: z.infer<typeof FeedbackDeleteSpanSchema>
  }>('/feedback/delete-span', async (request, reply) => {
    try {
      const feedback = FeedbackDeleteSpanSchema.parse(request.body);
      
      if (feedback.from_ts_ms >= feedback.to_ts_ms) {
        reply.status(400).send({ error: 'Invalid time span' });
        return;
      }

      await redisClient.addTimelineEntry(
        feedback.collector_id,
        feedback.camera_id,
        feedback.object_id,
        {
          type: 'delete',
          cell_id: 'deleted',
          from_ts_ms: feedback.from_ts_ms,
          to_ts_ms: feedback.to_ts_ms,
          meta: { 
            reason: 'false_positive_removal',
            duration_ms: feedback.to_ts_ms - feedback.from_ts_ms 
          },
        }
      );

      await redisClient.logFeedbackEvent('delete_span', feedback);

      fastify.log.info({ feedback }, 'False positive span deleted');

      return {
        status: 'success',
        message: 'False positive span deleted successfully',
        deleted_span: {
          from_ts_ms: feedback.from_ts_ms,
          to_ts_ms: feedback.to_ts_ms,
          duration_ms: feedback.to_ts_ms - feedback.from_ts_ms,
        },
        timestamp: Date.now(),
      };

    } catch (error) {
      fastify.log.error({ error }, 'Failed to delete span');
      reply.status(500).send({ error: 'Failed to delete span' });
    }
  });
}