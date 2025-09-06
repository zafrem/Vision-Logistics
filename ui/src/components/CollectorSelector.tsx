import React from 'react';

interface CollectorSelectorProps {
  selectedCollectors: string[];
  selectedCameras: string[];
  onCollectorsChange: (collectors: string[]) => void;
  onCamerasChange: (cameras: string[]) => void;
}

export const CollectorSelector: React.FC<CollectorSelectorProps> = ({
  selectedCollectors,
  selectedCameras,
  onCollectorsChange,
  onCamerasChange,
}) => {
  const collectors = ['collector-01', 'collector-02', 'collector-03'];
  
  // Define 1:1 mapping between collectors and cameras
  const collectorCameraMap = {
    'collector-01': ['cam-001', 'cam-002', 'heatwave-cam'],
    'collector-02': ['cam-003', 'cam-004'],
    'collector-03': ['cam-005']
  };
  
  // Get all available cameras
  const cameras = Object.values(collectorCameraMap).flat();
  
  // Get cameras for selected collectors
  const getAvailableCameras = () => {
    if (selectedCollectors.length === 0) return cameras;
    return selectedCollectors.flatMap(collector => collectorCameraMap[collector] || []);
  };
  
  const availableCameras = getAvailableCameras();

  const handleCollectorToggle = (collector: string) => {
    if (selectedCollectors.includes(collector)) {
      // Remove collector and its cameras
      const collectorCameras = collectorCameraMap[collector] || [];
      onCollectorsChange(selectedCollectors.filter(c => c !== collector));
      onCamerasChange(selectedCameras.filter(c => !collectorCameras.includes(c)));
    } else {
      // Add collector and optionally its cameras
      onCollectorsChange([...selectedCollectors, collector]);
    }
  };

  const handleCameraToggle = (camera: string) => {
    if (selectedCameras.includes(camera)) {
      onCamerasChange(selectedCameras.filter(c => c !== camera));
    } else {
      onCamerasChange([...selectedCameras, camera]);
    }
  };

  const toggleAllCollectors = () => {
    if (selectedCollectors.length === collectors.length) {
      onCollectorsChange([]);
      onCamerasChange([]); // Clear cameras when clearing all collectors
    } else {
      onCollectorsChange([...collectors]);
    }
  };

  const toggleAllCameras = () => {
    if (selectedCameras.length === availableCameras.length) {
      onCamerasChange([]);
    } else {
      onCamerasChange([...availableCameras]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Data Sources</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Collectors
            </label>
            <button
              onClick={toggleAllCollectors}
              className="text-xs text-primary-600 hover:text-primary-800"
            >
              {selectedCollectors.length === collectors.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
            {collectors.map((collector) => (
              <label key={collector} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCollectors.includes(collector)}
                  onChange={() => handleCollectorToggle(collector)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-mono">{collector}</span>
              </label>
            ))}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {selectedCollectors.length} of {collectors.length} selected
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Cameras
            </label>
            <button
              onClick={toggleAllCameras}
              className="text-xs text-primary-600 hover:text-primary-800"
            >
              {selectedCameras.length === availableCameras.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
            {availableCameras.map((camera) => {
              // Find which collector this camera belongs to
              const collector = Object.keys(collectorCameraMap).find(c => 
                collectorCameraMap[c].includes(camera)
              );
              const isDisabled = selectedCollectors.length > 0 && !availableCameras.includes(camera);
              
              return (
                <label key={camera} className={`flex items-center space-x-2 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={selectedCameras.includes(camera)}
                    onChange={() => handleCameraToggle(camera)}
                    disabled={isDisabled}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-mono">{camera}</span>
                  <span className="text-xs text-gray-400">({collector})</span>
                </label>
              );
            })}
            {selectedCollectors.length > 0 && availableCameras.length === 0 && (
              <div className="text-sm text-gray-500 italic">No cameras available for selected collectors</div>
            )}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {selectedCameras.length} of {availableCameras.length} available cameras selected
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <div className="text-sm text-gray-700">
          <div className="font-medium mb-1">Active Data Sources:</div>
          {selectedCollectors.length === 0 || selectedCameras.length === 0 ? (
            <div className="text-gray-500 italic">No data sources selected</div>
          ) : (
            <div className="text-xs">
              <span className="font-medium">{selectedCollectors.length} collector{selectedCollectors.length !== 1 ? 's' : ''}</span> with <span className="font-medium">{selectedCameras.length} camera{selectedCameras.length !== 1 ? 's' : ''}</span> = <span className="font-medium text-primary-600">{selectedCameras.length} data stream{selectedCameras.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};