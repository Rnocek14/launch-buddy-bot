import { RefreshCw, Loader2 } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const rotation = (pullDistance / threshold) * 360;
  const scale = Math.min(pullDistance / threshold, 1);
  const opacity = Math.min(pullDistance / (threshold * 0.3), 1);

  if (!pullDistance && !isRefreshing) return null;

  return (
    <div
      className="fixed left-0 right-0 z-50 flex items-center justify-center transition-opacity duration-200"
      style={{
        top: `${Math.min(pullDistance * 0.5, 60)}px`,
        opacity,
      }}
    >
      <div
        className="relative flex flex-col items-center justify-center"
        style={{
          transform: `scale(${scale})`,
          transition: isRefreshing ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {/* Circular progress ring */}
        <div className="relative h-12 w-12">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48">
            {/* Background circle */}
            <circle
              cx="24"
              cy="24"
              r="20"
              className="stroke-muted"
              strokeWidth="3"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="24"
              cy="24"
              r="20"
              className="stroke-primary transition-all duration-200"
              strokeWidth="3"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Icon in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isRefreshing ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <RefreshCw
                className="h-6 w-6 text-primary transition-transform duration-100"
                style={{
                  transform: `rotate(${rotation}deg)`,
                }}
              />
            )}
          </div>
        </div>

        {/* Text feedback */}
        <div className="mt-2 text-xs font-medium text-muted-foreground">
          {isRefreshing ? (
            'Scanning...'
          ) : progress >= 100 ? (
            'Release to scan'
          ) : (
            'Pull to scan'
          )}
        </div>
      </div>
    </div>
  );
}
