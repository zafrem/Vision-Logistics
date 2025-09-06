import React from 'react';
import type { CellStats } from '../types/api';
import { formatDuration, formatNumber } from '../utils/formatters';

interface StatsTableProps {
  stats: CellStats[];
  onCellClick?: (cellId: string) => void;
  selectedCell?: string;
}

export const StatsTable: React.FC<StatsTableProps> = ({ 
  stats, 
  onCellClick, 
  selectedCell 
}) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold">Cell Statistics</h3>
        <p className="text-sm text-gray-600">
          Top {stats.length} cells by total dwell time
        </p>
      </div>

      <div className="overflow-auto max-h-96">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cell ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Objects</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Dwell</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Dwell</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Max Dwell</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {stats.map((stat) => (
              <tr 
                key={stat.grid_cell_id}
                className={`
                  hover:bg-gray-50 cursor-pointer transition-colors
                  ${selectedCell === stat.grid_cell_id ? 'bg-primary-50 border-l-4 border-primary-500' : ''}
                `}
                onClick={() => onCellClick?.(stat.grid_cell_id)}
              >
                <td className="px-4 py-2 text-sm font-mono">
                  {stat.grid_cell_id}
                </td>
                <td className="px-4 py-2 text-sm">
                  {formatNumber(stat.object_count)}
                </td>
                <td className="px-4 py-2 text-sm">
                  {formatDuration(stat.total_dwell_ms)}
                </td>
                <td className="px-4 py-2 text-sm">
                  {formatDuration(stat.avg_dwell_ms)}
                </td>
                <td className="px-4 py-2 text-sm">
                  {formatDuration(stat.max_dwell_ms)}
                </td>
              </tr>
            ))}
            {stats.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};