import React from 'react';

// Main page loading spinner (like dashboard)
export const PageLoader: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007c7c] mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);

// Table/List loading skeleton
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 6 }) => (
  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
    {/* Header skeleton */}
    <div className="bg-gray-50 px-6 py-4">
      <div className="grid grid-cols-6 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
    
    {/* Rows skeleton */}
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4">
          <div className="grid grid-cols-6 gap-4 items-center">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="space-y-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                {j === 0 && <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4"></div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Card loading skeleton
export const CardSkeleton: React.FC<{ height?: string }> = ({ height = "h-64" }) => (
  <div className={`bg-white rounded-lg shadow border border-gray-200 p-6 ${height}`}>
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
      <div className="mt-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);

// Mobile card loading skeleton
export const MobileCardSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <div className="lg:hidden space-y-4">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center flex-1">
              <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
            <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div>
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>

          <div className="mb-4">
            <div className="h-3 bg-gray-100 rounded w-1/3 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 h-10 bg-gray-200 rounded"></div>
            <div className="w-10 h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Inline loading spinner (for buttons, small areas)
export const InlineSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; color?: string }> = ({ 
  size = 'md', 
  color = 'border-[#007c7c]' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-transparent ${sizeClasses[size]} ${color}`} />
  );
};

// Error state component (consistent with dashboard)
export const ErrorState: React.FC<{ 
  title?: string; 
  message: string; 
  onRetry?: () => void; 
  retryText?: string 
}> = ({ 
  title = "Something went wrong", 
  message, 
  onRetry, 
  retryText = "Try again" 
}) => (
  <div className="min-h-[400px] bg-white rounded-lg shadow border border-gray-200 flex items-center justify-center p-6">
    <div className="text-center max-w-md">
      <div className="text-4xl mb-4">😞</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="bg-[#007c7c] text-white px-6 py-3 rounded-lg hover:bg-[#005f5f] transition-colors font-medium"
        >
          {retryText}
        </button>
      )}
    </div>
  </div>
);

// Empty state component
export const EmptyState: React.FC<{ 
  icon?: string; 
  title: string; 
  message: string; 
  actionText?: string; 
  onAction?: () => void 
}> = ({ 
  icon = "📝", 
  title, 
  message, 
  actionText, 
  onAction 
}) => (
  <div className="bg-white rounded-lg shadow border border-gray-200 p-12">
    <div className="text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">{message}</p>
      {actionText && onAction && (
        <button 
          onClick={onAction}
          className="bg-[#007c7c] text-white px-6 py-3 rounded-lg hover:bg-[#005f5f] transition-colors font-medium"
        >
          {actionText}
        </button>
      )}
    </div>
  </div>
);

// Combined loading component (mobile + desktop)
export const ResponsiveTableLoader: React.FC<{ message?: string }> = ({ message = "Loading data..." }) => (
  <>
    <div className="text-center py-8 lg:hidden">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007c7c] mx-auto mb-3"></div>
      <p className="text-gray-600">{message}</p>
    </div>
    <div className="hidden lg:block">
      <TableSkeleton />
    </div>
  </>
); 