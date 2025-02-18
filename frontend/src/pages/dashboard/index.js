// pages/dashboard/index.jsx
import React from 'react';
import AnalyticsDashboard from '@/features/analytics/components/AnalyticsDashboard';

const DashboardPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Dashboard Overview
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          View your business metrics and performance
        </p>
      </div>

      <AnalyticsDashboard />
    </div>
  );
};

export default DashboardPage;