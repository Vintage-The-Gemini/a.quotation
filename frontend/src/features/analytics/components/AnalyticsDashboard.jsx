import React from 'react';
import { Card } from '@/components/ui/card';
import { useAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { StatsCards } from './StatsCards';
import { TrendsChart } from './TrendsChart';

const AnalyticsDashboard = () => {
  const { data, isLoading, error } = useAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600 dark:text-red-400">Error loading analytics data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatsCards stats={data.stats} />
      <TrendsChart data={data.monthlyData} />
    </div>
  );
};

export default AnalyticsDashboard;