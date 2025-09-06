import React from 'react';
import type { HeatmapData, ObjectState } from '../types/api';
import { formatDuration, getIntensityColor, getCellId } from '../utils/formatters';

interface HeatmapGridProps {
  data: HeatmapData;
  onCellClick?: (cellId: string) => void;
  selectedCell?: string;
  selectedCameras?: string[];
  selectedCollectors?: string[];
  activeObjects?: ObjectState[];
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({ 
  data, 
  onCellClick, 
  selectedCell,
  selectedCameras = [],
  selectedCollectors = [],
  activeObjects = []
}) => {
  const { grid_size, cells } = data;
  
  const getCellData = (x: number, y: number) => {
    const cellId = getCellId(x, y);
    return cells.find(cell => cell.grid_cell_id === cellId);
  };

  const getObjectsInCell = (x: number, y: number) => {
    const cellId = getCellId(x, y);
    return activeObjects.filter(obj => obj.current_cell === cellId);
  };

  const getObjectColors = (objects: ObjectState[]) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-orange-500'
    ];
    return objects.map((_, index) => colors[index % colors.length]);
  };

  const getDisplayInfo = () => {
    const hasSelections = selectedCameras.length > 0 || selectedCollectors.length > 0;
    
    if (!hasSelections) {
      return `${data.camera_id} • Window: ${formatDuration(data.window_ms)}`;
    }
    
    const cameraText = selectedCameras.length === 0 ? 'All cameras' :
                     selectedCameras.length === 1 ? selectedCameras[0] :
                     `${selectedCameras.length} cameras`;
    
    const collectorText = selectedCollectors.length === 0 ? 'All collectors' :
                        selectedCollectors.length === 1 ? selectedCollectors[0] :
                        `${selectedCollectors.length} collectors`;
    
    return `${collectorText} → ${cameraText} • Window: ${formatDuration(data.window_ms)}`;
  };

  const handleCellClick = (x: number, y: number) => {
    const cellId = getCellId(x, y);
    onCellClick?.(cellId);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Dwell Time Heatmap</h3>
        <p className="text-sm text-gray-600">
          {getDisplayInfo()}
        </p>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>No data</span>
          </div>
        </div>
        
        {activeObjects.length > 0 && (
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
              <span>Live objects</span>
            </div>
            <div className="text-gray-500">
              {activeObjects.length} active object{activeObjects.length !== 1 ? 's' : ''} currently tracked
            </div>
          </div>
        )}
      </div>

      <div 
        className="grid gap-1 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${grid_size.width}, 1fr)`,
          maxWidth: `${grid_size.width * 24}px`,
        }}
      >
        {Array.from({ length: grid_size.height }, (_, y) =>
          Array.from({ length: grid_size.width }, (_, x) => {
            const cellData = getCellData(x, y);
            const cellId = getCellId(x, y);
            const isSelected = selectedCell === cellId;
            const objectsInCell = getObjectsInCell(x, y);
            const objectColors = getObjectColors(objectsInCell);
            
            return (
              <div
                key={cellId}
                className={`
                  w-6 h-6 border border-gray-300 cursor-pointer relative group transition-all
                  ${cellData ? getIntensityColor(cellData.intensity) : 'bg-gray-200'}
                  ${isSelected ? 'ring-2 ring-primary-500' : ''}
                  hover:ring-2 hover:ring-primary-300
                `}
                onClick={() => handleCellClick(x, y)}
                title={`${cellId}${cellData ? ` • ${formatDuration(cellData.dwell_ms)} • ${cellData.object_count} objects` : ' • No data'}${objectsInCell.length > 0 ? ` • Active: ${objectsInCell.map(obj => obj.object_id).join(', ')}` : ''}`}
              >
                {cellData && cellData.object_count > 0 && objectsInCell.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-white font-bold drop-shadow">
                      {cellData.object_count}
                    </span>
                  </div>
                )}

                {/* Display active objects as colored dots */}
                {objectsInCell.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-wrap gap-0.5 max-w-full">
                      {objectsInCell.slice(0, 4).map((obj, index) => (
                        <div
                          key={obj.object_id}
                          className={`w-1.5 h-1.5 rounded-full ${objectColors[index]} border border-white shadow-sm`}
                          title={`${obj.object_id}`}
                        />
                      ))}
                      {objectsInCell.length > 4 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-800 border border-white shadow-sm flex items-center justify-center">
                          <span className="text-xs text-white font-bold">+</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                  {cellId}
                  {cellData && (
                    <>
                      <br />
                      Dwell: {formatDuration(cellData.dwell_ms)}
                      <br />
                      Objects: {cellData.object_count}
                    </>
                  )}
                  {objectsInCell.length > 0 && (
                    <>
                      <br />
                      <span className="text-green-300">Active:</span> {objectsInCell.map(obj => obj.object_id).join(', ')}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Grid: {grid_size.width} × {grid_size.height} • Total cells with data: {cells.length}
      </div>
    </div>
  );
};