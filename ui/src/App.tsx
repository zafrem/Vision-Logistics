import React, { useState, useCallback } from 'react';
import { HeatmapGrid } from './components/HeatmapGrid';
import { StatsTable } from './components/StatsTable';
import { SystemStatus } from './components/SystemStatus';
import { CollectorSelector } from './components/CollectorSelector';
import { RealTimeLog } from './components/RealTimeLog';
import { useHeatmap, useCellStats, useSystemStatus, useAutoRefresh, useActiveObjects } from './hooks/useApi';
import { formatDate, formatDuration } from './utils/formatters';

function App() {
  const [selectedCollectors, setSelectedCollectors] = useState(['collector-01']);
  const [selectedCameras, setSelectedCameras] = useState(['heatwave-cam']);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [refreshInterval, setRefreshInterval] = useState(30000); // Default 30 seconds
  const [heatmapTimeWindow, setHeatmapTimeWindow] = useState(3600000); // Default 1 hour

  // For now, use the first selected collector/camera for the main views
  // TODO: Implement aggregated data across multiple sources
  const primaryCollector = selectedCollectors[0] || 'collector-01';
  const primaryCamera = selectedCameras[0] || 'heatwave-cam';

  const { data: heatmapData, loading: heatmapLoading, error: heatmapError, refresh: refreshHeatmap } = useHeatmap(primaryCollector, primaryCamera, heatmapTimeWindow);
  const { data: statsData, loading: statsLoading, error: statsError } = useCellStats(primaryCollector, primaryCamera);
  const { status, health, loading: statusLoading } = useSystemStatus();
  const { data: activeObjectsData, loading: objectsLoading, error: objectsError, refresh: refreshActiveObjects } = useActiveObjects(primaryCollector, primaryCamera);

  const refreshHeatmapAndLogs = useCallback(() => {
    setLastRefresh(Date.now());
    refreshHeatmap();
    refreshActiveObjects();
  }, [refreshHeatmap, refreshActiveObjects]);

  const { isEnabled: autoRefreshEnabled, setIsEnabled: setAutoRefreshEnabled } = useAutoRefresh(
    refreshHeatmapAndLogs, 
    refreshInterval
  );

  const handleCellClick = (cellId: string) => {
    setSelectedCell(cellId === selectedCell ? null : cellId);
  };

  const handleManualRefresh = () => {
    refreshHeatmapAndLogs();
  };

  const formatIntervalDisplay = (intervalMs: number) => {
    const seconds = intervalMs / 1000;
    return `${seconds}s`;
  };

  const getTimeWindowLabel = (windowMs: number) => {
    if (windowMs === 0) return 'Real-time';
    if (windowMs === 3600000) return '1 Hour';
    if (windowMs === 86400000) return '1 Day';
    return formatDuration(windowMs);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vision Logistics</h1>
              <p className="text-sm text-gray-600">Real-time Object Tracking & Analytics</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-700 font-medium">
                  Heatmap Window:
                </label>
                <select
                  value={heatmapTimeWindow}
                  onChange={(e) => setHeatmapTimeWindow(parseInt(e.target.value))}
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <option value={0}>Real-time</option>
                  <option value={3600000}>1 Hour</option>
                  <option value={86400000}>1 Day</option>
                </select>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoRefreshEnabled}
                    onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                    className="rounded"
                  />
                  Auto-refresh
                </label>
                
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                  disabled={!autoRefreshEnabled}
                >
                  <option value={5000}>5s</option>
                  <option value={10000}>10s</option>
                  <option value={30000}>30s</option>
                  <option value={60000}>60s</option>
                </select>
              </div>
              
              <button
                onClick={handleManualRefresh}
                className="px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
              >
                Refresh Now
              </button>
              
              <div className="text-xs text-gray-500">
                Last updated: {formatDate(lastRefresh)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-3">
            <CollectorSelector
              selectedCollectors={selectedCollectors}
              selectedCameras={selectedCameras}
              onCollectorsChange={setSelectedCollectors}
              onCamerasChange={setSelectedCameras}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-6">
              {heatmapLoading && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-300 rounded"></div>
                  </div>
                </div>
              )}

              {heatmapError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-red-800 font-medium">Heatmap Error</h3>
                  <p className="text-red-600 text-sm mt-1">{heatmapError}</p>
                </div>
              )}

              {heatmapData && !heatmapLoading && (
                <HeatmapGrid
                  data={heatmapData}
                  onCellClick={handleCellClick}
                  selectedCell={selectedCell || undefined}
                  selectedCameras={selectedCameras}
                  selectedCollectors={selectedCollectors}
                  activeObjects={activeObjectsData?.objects || []}
                />
              )}
            </div>
          </div>

          <div className="space-y-6">
            {statsLoading && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-300 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {statsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-medium">Stats Error</h3>
                <p className="text-red-600 text-sm mt-1">{statsError}</p>
              </div>
            )}

            {statsData && !statsLoading && (
              <StatsTable
                stats={statsData.stats}
                onCellClick={handleCellClick}
                selectedCell={selectedCell || undefined}
              />
            )}

            {!statusLoading && (
              <SystemStatus status={status} health={health} />
            )}
          </div>

        </div>

        {selectedCell && (
          <div className="mt-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-primary-800 font-medium">Selected Cell: {selectedCell}</h3>
                {statsData?.stats.find(s => s.grid_cell_id === selectedCell) && (
                  <p className="text-primary-600 text-sm mt-1">
                    Click on the table or heatmap to view details for different cells
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-primary-600 hover:text-primary-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="mt-6">
          <RealTimeLog 
            isEnabled={autoRefreshEnabled} 
            refreshInterval={2000}
            selectedCollectors={selectedCollectors}
            selectedCameras={selectedCameras}
            onRefresh={refreshHeatmapAndLogs}
          />
        </div>
      </main>
    </div>
  );
}

export default App;