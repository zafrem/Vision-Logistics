import { z } from 'zod';

export const BboxSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]);

export const DetectedObjectSchema = z.object({
  object_id: z.string(),
  class: z.string(),
  confidence: z.number().min(0).max(1),
  grid_cell_id: z.string(),
  bbox: BboxSchema,
});

export const DetectionPayloadSchema = z.object({
  collector_id: z.string(),
  camera_id: z.string(),
  timestamp_ms: z.number(),
  frame_id: z.string(),
  objects: z.array(DetectedObjectSchema),
});

export const NormalizedEventSchema = z.object({
  event_id: z.string(),
  collector_id: z.string(),
  camera_id: z.string(),
  object_id: z.string(),
  grid_cell_id: z.string(),
  ts_ms: z.number(),
});

export type Bbox = z.infer<typeof BboxSchema>;
export type DetectedObject = z.infer<typeof DetectedObjectSchema>;
export type DetectionPayload = z.infer<typeof DetectionPayloadSchema>;
export type NormalizedEvent = z.infer<typeof NormalizedEventSchema>;

export interface CameraFrame {
  camera_id: string;
  frame_id: string;
  timestamp_ms: number;
  objects: DetectedObject[];
}