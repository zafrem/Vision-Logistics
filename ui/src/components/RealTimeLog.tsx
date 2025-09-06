import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../utils/api';

interface LogEvent {
  id: string;
  timestamp: number;
  collector_id: string;
  camera_id: string;
  object_id: string;
  grid_cell: string;
  event_type: string;
  timestamp_ms: string;
}

interface RealTimeLogProps {
  isEnabled?: boolean;
  refreshInterval?: number;
  selectedCollectors?: string[];
  selectedCameras?: string[];
  onRefresh?: () => void;
}

export const RealTimeLog: React.FC<RealTimeLogProps> = ({
  isEnabled = true,
  refreshInterval = 2000,
  selectedCollectors = [],
  selectedCameras = [],
  onRefresh
}) => {
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Filter events based on selected collectors and cameras
  const filteredEvents = events.filter(event => {
    const collectorMatch = selectedCollectors.length === 0 || selectedCollectors.includes(event.collector_id);
    const cameraMatch = selectedCameras.length === 0 || selectedCameras.includes(event.camera_id);
    return collectorMatch && cameraMatch;
  });

  const fetchEvents = async () => {
    if (!isEnabled || isPaused) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.getRecentEvents();
      setEvents(response.events || []);
    } catch (err) {
      setError('Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = () => {
    fetchEvents();
    onRefresh?.();
  };

  useEffect(() => {
    if (!isEnabled) return;

    fetchEvents();
    const interval = setInterval(fetchEvents, refreshInterval);

    return () => clearInterval(interval);
  }, [isEnabled, refreshInterval, isPaused]);

  useEffect(() => {
    if (logContainerRef.current && !isPaused) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [filteredEvents, isPaused]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'enter': return 'text-green-600 bg-green-50';
      case 'exit': return 'text-red-600 bg-red-50';
      case 'move': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const clearLog = () => {
    setEvents([]);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium text-gray-900">Real-time Event Log</h3>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            )}
            <span className="text-sm text-gray-500">
              {filteredEvents.length} of {events.length} events
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={togglePause}
            className={`px-3 py-1 text-xs rounded ${
              isPaused 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={clearLog}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div
        ref={logContainerRef}
        className="h-64 overflow-y-auto bg-gray-50 font-mono text-xs"
      >
        {filteredEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            {isLoading ? 'Loading events...' : events.length === 0 ? 'No events to display' : 'No events match the selected filters'}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredEvents.map((event, index) => (
              <div
                key={`${event.id}-${index}`}
                className="flex items-center gap-2 py-1 px-2 hover:bg-white rounded"
              >
                <span className="text-gray-400 w-20 flex-shrink-0">
                  {formatTimestamp(event.timestamp)}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                  {event.event_type.toUpperCase()}
                </span>
                <span className="text-blue-600 font-medium">
                  {event.object_id}
                </span>
                <span className="text-gray-600">
                  @ {event.grid_cell}
                </span>
                <span className="text-gray-500 text-xs">
                  [{event.collector_id}:{event.camera_id}]
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};