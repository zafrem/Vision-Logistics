import { z } from 'zod';

export const NormalizedEventSchema = z.object({
  event_id: z.string(),
  collector_id: z.string(),
  camera_id: z.string(),
  object_id: z.string(),
  grid_cell_id: z.string(),
  ts_ms: z.number(),
});

export const ObjectStateSchema = z.object({
  collector_id: z.string(),
  camera_id: z.string(),
  object_id: z.string(),
  current_cell: z.string().nullable(),
  enter_ts_ms: z.number().nullable(),
  last_seen_ts_ms: z.number(),
  accumulated_ms: z.number(),
});

export const TimelineEntrySchema = z.object({
  type: z.enum(['enter', 'leave', 'correct', 'delete']),
  cell_id: z.string(),
  from_ts_ms: z.number(),
  to_ts_ms: z.number().nullable(),
  meta: z.record(z.unknown()).optional(),
});

export const FeedbackRelabelSchema = z.object({
  collector_id: z.string(),
  camera_id: z.string(),
  old_object_id: z.string(),
  new_object_id: z.string(),
  timestamp_ms: z.number(),
});

export const FeedbackCorrectCellSchema = z.object({
  collector_id: z.string(),
  camera_id: z.string(),
  object_id: z.string(),
  frame_ts_ms: z.number(),
  correct_cell_id: z.string(),
});

export const FeedbackDeleteSpanSchema = z.object({
  collector_id: z.string(),
  camera_id: z.string(),
  object_id: z.string(),
  from_ts_ms: z.number(),
  to_ts_ms: z.number(),
});

export type NormalizedEvent = z.infer<typeof NormalizedEventSchema>;
export type ObjectState = z.infer<typeof ObjectStateSchema>;
export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;
export type FeedbackRelabel = z.infer<typeof FeedbackRelabelSchema>;
export type FeedbackCorrectCell = z.infer<typeof FeedbackCorrectCellSchema>;
export type FeedbackDeleteSpan = z.infer<typeof FeedbackDeleteSpanSchema>;

export interface CellStats {
  collector_id: string;
  camera_id: string;
  grid_cell_id: string;
  total_dwell_ms: number;
  object_count: number;
  avg_dwell_ms: number;
  max_dwell_ms: number;
  min_dwell_ms: number;
}

export interface HeatmapData {
  collector_id: string;
  camera_id: string;
  grid_size: { width: number; height: number };
  cells: Array<{
    grid_cell_id: string;
    x: number;
    y: number;
    dwell_ms: number;
    object_count: number;
    intensity: number;
  }>;
  timestamp: number;
  window_ms: number;
}