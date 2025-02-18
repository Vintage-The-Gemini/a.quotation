// features/analytics/hooks/useAnalytics.js
import { useState, useEffect } from 'react';
import api from '@/services/api';

export const useAnalytics = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setData(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return { data, isLoading, error };
};