import { format, formatDistanceToNow } from 'date-fns';

export const formatDuration = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else if (ms < 3600000) {
    return `${(ms / 60000).toFixed(1)}m`;
  } else {
    return `${(ms / 3600000).toFixed(1)}h`;
  }
};

export const formatTimestamp = (timestamp: number): string => {
  return format(new Date(timestamp), 'HH:mm:ss');
};

export const formatDate = (timestamp: number): string => {
  return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
};

export const formatRelativeTime = (timestamp: number): string => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getIntensityColor = (intensity: number): string => {
  if (intensity >= 0.8) return 'bg-red-500';
  if (intensity >= 0.6) return 'bg-orange-500';
  if (intensity >= 0.4) return 'bg-yellow-500';
  if (intensity >= 0.2) return 'bg-blue-500';
  if (intensity > 0) return 'bg-green-500';
  return 'bg-gray-200';
};

export const getCellId = (x: number, y: number): string => {
  return `G_${x.toString().padStart(2, '0')}_${y.toString().padStart(2, '0')}`;
};