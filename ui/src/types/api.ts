export interface ObjectState {
  collector_id: string;
  camera_id: string;
  object_id: string;
  current_cell: string | null;
  enter_ts_ms: number | null;
  last_seen_ts_ms: number;
  accumulated_ms: number;
}

export interface TimelineEntry {
  type: 'enter' | 'leave' | 'correct' | 'delete';
  cell_id: string;
  from_ts_ms: number;
  to_ts_ms: number | null;
  meta?: Record<string, unknown>;
}

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

export interface HeatmapCell {
  grid_cell_id: string;
  x: number;
  y: number;
  dwell_ms: number;
  object_count: number;
  intensity: number;
}

export interface HeatmapData {
  collector_id: string;
  camera_id: string;
  grid_size: { width: number; height: number };
  cells: HeatmapCell[];
  timestamp: number;
  window_ms: number;
}

export interface CellStatsResponse {
  collector_id: string;
  camera_id: string;
  cell_id?: string;
  stats: CellStats[];
  timestamp: number;
  total_cells: number;
}

export interface ObjectDetailsResponse {
  object_state: ObjectState;
  timeline: TimelineEntry[];
  timestamp: number;
}

export interface FeedbackRelabel {
  collector_id: string;
  camera_id: string;
  old_object_id: string;
  new_object_id: string;
  timestamp_ms: number;
}

export interface FeedbackCorrectCell {
  collector_id: string;
  camera_id: string;
  object_id: string;
  frame_ts_ms: number;
  correct_cell_id: string;
}

export interface FeedbackDeleteSpan {
  collector_id: string;
  camera_id: string;
  object_id: string;
  from_ts_ms: number;
  to_ts_ms: number;
}