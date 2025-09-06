import React from 'react';
import { formatRelativeTime, formatBytes } from '../utils/formatters';

interface SystemStatusProps {
  status: any;
  health: any;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ status, health }) => {
  const getStatusColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">System Status</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Manager Service</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status?.status === 'running')}`}>
                {status?.status || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Uptime:</span>
              <span>{status?.uptime ? `${Math.floor(status.uptime)}s` : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span>{status?.timestamp ? formatRelativeTime(status.timestamp) : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-700 mb-2">Kafka Consumer</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Running:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status?.kafka_consumer?.isRunning)}`}>
                {status?.kafka_consumer?.isRunning ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Topics:</span>
              <span className="text-right">
                {status?.kafka_consumer?.topics?.join(', ') || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {health?.memory && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Memory Usage</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">RSS:</span>
                <span>{formatBytes(health.memory.rss)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Heap Used:</span>
                <span>{formatBytes(health.memory.heapUsed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Heap Total:</span>
                <span>{formatBytes(health.memory.heapTotal)}</span>
              </div>
            </div>
          </div>
        )}

        <div>
          <h4 className="font-medium text-gray-700 mb-2">Redis</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Connected:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status?.redis_connected)}`}>
                {status?.redis_connected ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};