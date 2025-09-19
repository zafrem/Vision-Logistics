import http from 'http';
import url from 'url';

// CORS headers helper
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Mock data
const mockHeatmapData = {
  collector_id: "collector-01",
  camera_id: "heatwave-cam",
  grid_size: { width: 20, height: 15 },
  cells: [
    { grid_cell_id: "G_05_08", x: 5, y: 8, dwell_ms: 45000, object_count: 3, intensity: 0.9 },
    { grid_cell_id: "G_12_05", x: 12, y: 5, dwell_ms: 32000, object_count: 2, intensity: 0.64 },
    { grid_cell_id: "G_08_12", x: 8, y: 12, dwell_ms: 28000, object_count: 4, intensity: 0.56 },
    { grid_cell_id: "G_15_03", x: 15, y: 3, dwell_ms: 21000, object_count: 1, intensity: 0.42 },
    { grid_cell_id: "G_03_14", x: 3, y: 14, dwell_ms: 19000, object_count: 2, intensity: 0.38 },
    { grid_cell_id: "G_18_07", x: 18, y: 7, dwell_ms: 15000, object_count: 1, intensity: 0.3 },
    { grid_cell_id: "G_07_02", x: 7, y: 2, dwell_ms: 12000, object_count: 1, intensity: 0.24 },
    { grid_cell_id: "G_14_11", x: 14, y: 11, dwell_ms: 8000, object_count: 1, intensity: 0.16 }
  ],
  timestamp: Date.now(),
  window_ms: 3600000
};

const mockCellStats = {
  stats: [
    { collector_id: "collector-01", camera_id: "heatwave-cam", grid_cell_id: "G_05_08", total_dwell_ms: 45000, object_count: 3, avg_dwell_ms: 15000, max_dwell_ms: 25000, min_dwell_ms: 8000 },
    { collector_id: "collector-01", camera_id: "heatwave-cam", grid_cell_id: "G_12_05", total_dwell_ms: 32000, object_count: 2, avg_dwell_ms: 16000, max_dwell_ms: 20000, min_dwell_ms: 12000 },
    { collector_id: "collector-01", camera_id: "heatwave-cam", grid_cell_id: "G_08_12", total_dwell_ms: 28000, object_count: 4, avg_dwell_ms: 7000, max_dwell_ms: 12000, min_dwell_ms: 3000 },
    { collector_id: "collector-01", camera_id: "heatwave-cam", grid_cell_id: "G_15_03", total_dwell_ms: 21000, object_count: 1, avg_dwell_ms: 21000, max_dwell_ms: 21000, min_dwell_ms: 21000 },
    { collector_id: "collector-01", camera_id: "heatwave-cam", grid_cell_id: "G_03_14", total_dwell_ms: 19000, object_count: 2, avg_dwell_ms: 9500, max_dwell_ms: 11000, min_dwell_ms: 8000 }
  ]
};

const mockActiveObjects = {
  objects: [
    { collector_id: "collector-01", camera_id: "heatwave-cam", object_id: "obj-123", current_cell: "G_05_08", enter_ts_ms: Date.now() - 30000, last_seen_ts_ms: Date.now() - 1000, accumulated_ms: 29000 },
    { collector_id: "collector-01", camera_id: "heatwave-cam", object_id: "obj-456", current_cell: "G_12_05", enter_ts_ms: Date.now() - 15000, last_seen_ts_ms: Date.now() - 500, accumulated_ms: 14500 },
    { collector_id: "collector-01", camera_id: "heatwave-cam", object_id: "obj-789", current_cell: "G_08_12", enter_ts_ms: Date.now() - 8000, last_seen_ts_ms: Date.now() - 200, accumulated_ms: 7800 }
  ]
};

const mockRecentEvents = [
  { id: "evt-1", timestamp: Date.now() - 5000, collector_id: "collector-01", camera_id: "heatwave-cam", object_id: "obj-123", grid_cell: "G_05_08", event_type: "enter", timestamp_ms: (Date.now() - 5000).toString() },
  { id: "evt-2", timestamp: Date.now() - 3000, collector_id: "collector-01", camera_id: "heatwave-cam", object_id: "obj-456", grid_cell: "G_12_05", event_type: "enter", timestamp_ms: (Date.now() - 3000).toString() },
  { id: "evt-3", timestamp: Date.now() - 1000, collector_id: "collector-01", camera_id: "heatwave-cam", object_id: "obj-789", grid_cell: "G_08_12", event_type: "enter", timestamp_ms: (Date.now() - 1000).toString() }
];

// Create HTTP server
const server = http.createServer((req, res) => {
  setCORSHeaders(res);

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  res.setHeader('Content-Type', 'application/json');

  try {
    if (pathname === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'healthy', service: 'mock-manager', timestamp: Date.now() }));
    }
    else if (pathname === '/status') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'running', service: 'mock-manager', uptime: process.uptime() }));
    }
    else if (pathname === '/heatmap') {
      // Create animated movement patterns on the heatmap
      const dynamicData = { ...mockHeatmapData };
      const now = Date.now();

      // Create moving hotspots that travel across the heatmap
      const animationSpeed = 15000; // Complete cycle every 15 seconds
      const cycleProgress = (now % animationSpeed) / animationSpeed; // 0 to 1

      // Define movement paths for different "objects"
      const movingObjects = [
        {
          // Object 1: moves in a horizontal line from left to right
          path: (progress) => ({
            x: Math.floor(2 + progress * 16), // x: 2 to 18
            y: 8,
            intensity: 0.9 - Math.abs(progress - 0.5) * 0.4, // peaks in middle
            size: 2 // affects surrounding cells
          })
        },
        {
          // Object 2: moves in a diagonal pattern
          path: (progress) => ({
            x: Math.floor(3 + progress * 12),
            y: Math.floor(3 + progress * 8),
            intensity: 0.7 - Math.abs(progress - 0.3) * 0.3,
            size: 1
          })
        },
        {
          // Object 3: moves in a circular pattern
          path: (progress) => {
            const angle = progress * Math.PI * 2;
            return {
              x: Math.floor(10 + Math.cos(angle) * 6),
              y: Math.floor(7 + Math.sin(angle) * 4),
              intensity: 0.8,
              size: 1
            };
          }
        },
        {
          // Object 4: oscillates back and forth vertically
          path: (progress) => ({
            x: 15,
            y: Math.floor(2 + Math.sin(progress * Math.PI * 2) * 5 + 5),
            intensity: 0.6 + Math.sin(progress * Math.PI * 4) * 0.2,
            size: 1
          })
        }
      ];

      // Create base heatmap grid
      const heatmapGrid = {};

      // Add animated moving objects
      movingObjects.forEach((obj, objIndex) => {
        const pos = obj.path(cycleProgress);

        // Add heat to the main cell and surrounding cells
        for (let dx = -pos.size; dx <= pos.size; dx++) {
          for (let dy = -pos.size; dy <= pos.size; dy++) {
            const x = pos.x + dx;
            const y = pos.y + dy;

            if (x >= 0 && x < 20 && y >= 0 && y < 15) {
              const cellId = `G_${x.toString().padStart(2, '0')}_${y.toString().padStart(2, '0')}`;
              const distance = Math.sqrt(dx*dx + dy*dy);
              const falloff = Math.max(0, 1 - distance / (pos.size + 1));
              const cellIntensity = pos.intensity * falloff;

              if (!heatmapGrid[cellId]) {
                heatmapGrid[cellId] = {
                  grid_cell_id: cellId,
                  x: x,
                  y: y,
                  dwell_ms: 0,
                  object_count: 0,
                  intensity: 0
                };
              }

              // Accumulate intensity and simulate dwell time
              heatmapGrid[cellId].intensity = Math.min(1, heatmapGrid[cellId].intensity + cellIntensity);
              heatmapGrid[cellId].dwell_ms += Math.floor(cellIntensity * 20000);
              heatmapGrid[cellId].object_count = Math.max(heatmapGrid[cellId].object_count, Math.floor(cellIntensity * 3));
            }
          }
        }
      });

      // Add some random background activity
      const backgroundCells = [
        { x: 1, y: 1 }, { x: 18, y: 2 }, { x: 5, y: 13 }, { x: 12, y: 11 }
      ];

      backgroundCells.forEach(cell => {
        const cellId = `G_${cell.x.toString().padStart(2, '0')}_${cell.y.toString().padStart(2, '0')}`;
        const randomIntensity = 0.2 + Math.sin(now / 5000 + cell.x) * 0.15;

        heatmapGrid[cellId] = {
          grid_cell_id: cellId,
          x: cell.x,
          y: cell.y,
          dwell_ms: Math.floor(5000 + randomIntensity * 15000),
          object_count: Math.floor(randomIntensity * 4),
          intensity: Math.max(0, randomIntensity)
        };
      });

      // Convert grid to array and filter out zero-intensity cells
      dynamicData.cells = Object.values(heatmapGrid)
        .filter(cell => cell.intensity > 0.05)
        .sort((a, b) => b.intensity - a.intensity);

      dynamicData.timestamp = now;

      res.writeHead(200);
      res.end(JSON.stringify(dynamicData));
    }
    else if (pathname === '/stats/cells') {
      // Add some randomness
      const dynamicStats = { ...mockCellStats };
      dynamicStats.stats = dynamicStats.stats.map(stat => ({
        ...stat,
        total_dwell_ms: stat.total_dwell_ms + Math.floor(Math.random() * 3000) - 1500,
        object_count: Math.max(0, stat.object_count + Math.floor(Math.random() * 3) - 1)
      }));

      res.writeHead(200);
      res.end(JSON.stringify(dynamicStats));
    }
    else if (pathname === '/objects/active') {
      // Create active objects that match the animated heatmap
      const now = Date.now();
      const animationSpeed = 15000;
      const cycleProgress = (now % animationSpeed) / animationSpeed;

      // Generate objects matching the animated movement patterns
      const activeObjects = [
        {
          collector_id: "collector-01",
          camera_id: "heatwave-cam",
          object_id: "obj-forklift-horizontal",
          current_cell: `G_${Math.floor(2 + cycleProgress * 16).toString().padStart(2, '0')}_08`,
          enter_ts_ms: now - 45000,
          last_seen_ts_ms: now - Math.floor(Math.random() * 1000),
          accumulated_ms: 45000 + Math.floor(Math.random() * 5000)
        },
        {
          collector_id: "collector-01",
          camera_id: "heatwave-cam",
          object_id: "obj-worker-diagonal",
          current_cell: `G_${Math.floor(3 + cycleProgress * 12).toString().padStart(2, '0')}_${Math.floor(3 + cycleProgress * 8).toString().padStart(2, '0')}`,
          enter_ts_ms: now - 30000,
          last_seen_ts_ms: now - Math.floor(Math.random() * 800),
          accumulated_ms: 30000 + Math.floor(Math.random() * 3000)
        },
        {
          collector_id: "collector-01",
          camera_id: "heatwave-cam",
          object_id: "obj-pallet-circular",
          current_cell: `G_${Math.floor(10 + Math.cos(cycleProgress * Math.PI * 2) * 6).toString().padStart(2, '0')}_${Math.floor(7 + Math.sin(cycleProgress * Math.PI * 2) * 4).toString().padStart(2, '0')}`,
          enter_ts_ms: now - 25000,
          last_seen_ts_ms: now - Math.floor(Math.random() * 600),
          accumulated_ms: 25000 + Math.floor(Math.random() * 2000)
        },
        {
          collector_id: "collector-01",
          camera_id: "heatwave-cam",
          object_id: "obj-cart-vertical",
          current_cell: `G_15_${Math.floor(2 + Math.sin(cycleProgress * Math.PI * 2) * 5 + 5).toString().padStart(2, '0')}`,
          enter_ts_ms: now - 15000,
          last_seen_ts_ms: now - Math.floor(Math.random() * 400),
          accumulated_ms: 15000 + Math.floor(Math.random() * 1000)
        }
      ];

      res.writeHead(200);
      res.end(JSON.stringify({ objects: activeObjects }));
    }
    else if (pathname === '/events/recent') {
      // Generate much more dynamic events
      const events = [];
      const now = Date.now();

      // Always generate 2-4 new recent events to make it very visible
      const numEvents = 2 + Math.floor(Math.random() * 3);

      for (let i = 0; i < numEvents; i++) {
        const objectIds = ['obj-123', 'obj-456', 'obj-789', 'obj-abc', 'obj-def', 'obj-xyz', 'obj-new', 'obj-test'];
        const cells = ['G_05_08', 'G_12_05', 'G_08_12', 'G_15_03', 'G_03_14', 'G_09_06', 'G_16_09', 'G_07_11', 'G_02_13'];
        const eventTypes = ['enter', 'exit', 'move', 'dwell_start', 'dwell_end'];

        events.push({
          id: `evt-${now}-${i}`,
          timestamp: now - (i * 1000) - Math.floor(Math.random() * 5000),
          collector_id: "collector-01",
          camera_id: "heatwave-cam",
          object_id: objectIds[Math.floor(Math.random() * objectIds.length)],
          grid_cell: cells[Math.floor(Math.random() * cells.length)],
          event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          timestamp_ms: (now - (i * 1000) - Math.floor(Math.random() * 5000)).toString()
        });
      }

      // Add some base events to make the list longer
      events.push(...mockRecentEvents.slice(0, 10));

      res.writeHead(200);
      res.end(JSON.stringify(events.slice(0, 20)));
    }
    else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

// Start server
server.listen(3002, '0.0.0.0', () => {
  console.log('🚀 Mock API server started on port 3002');
});