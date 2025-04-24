'use client';

import React from 'react';

interface ProgressBarProps {
  progress: number;
  className?: string;
  height?: number;
  showPercentage?: boolean;
  color?: string;
  backgroundColor?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  height = 8,
  showPercentage = false,
  color = 'bg-blue-600',
  backgroundColor = 'bg-gray-200',
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={`w-full ${className}`}>
      <div 
        className={`w-full ${backgroundColor} rounded-full overflow-hidden`} 
        style={{ height: `${height}px` }}
      >
        <div
          className={`${color} transition-all duration-300 ease-in-out`}
          style={{ 
            width: `${normalizedProgress}%`,
            height: '100%',
          }}
        />
      </div>
      {showPercentage && (
        <div className="text-xs text-gray-500 mt-1 text-right">
          {normalizedProgress}%
        </div>
      )}
    </div>
  );
};

export default ProgressBar;