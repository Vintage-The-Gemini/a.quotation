import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  CubeIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalQuotations: 0,
    totalProducts: 0,
    totalServices: 0,
    recentQuotations: [],
    activeQuotations: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

 // ... other imports

const fetchDashboardData = async () => {
  try {
      setError(null);
      const response = await api.get('/dashboard/stats'); // Remove the extra 'api'
      if (response.data?.success) {
          setStats(response.data.data || {
              totalQuotations: 0,
              totalProducts: 0,
              totalServices: 0,
              recentQuotations: [],
              activeQuotations: 0
          });
      }
  } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      setStats({
          totalQuotations: 0,
          totalProducts: 0,
          totalServices: 0,
          recentQuotations: [],
          activeQuotations: 0
      });
  } finally {
      setIsLoading(false);
  }
};

  const StatCard = ({ title, value, icon: Icon, linkTo }) => (
    <Link 
      to={linkTo}
      className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-white">
                {value || 0}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </Link>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    const classes = {
      accepted: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
      sent: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    };
    return classes[status] || classes.draft;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of your business metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Quotations"
          value={stats.totalQuotations}
          icon={DocumentTextIcon}
          linkTo="/quotations"
        />
        <StatCard
          title="Products"
          value={stats.totalProducts}
          icon={CubeIcon}
          linkTo="/products"
        />
        <StatCard
          title="Services"
          value={stats.totalServices}
          icon={CurrencyDollarIcon}
          linkTo="/products"
        />
        <StatCard
          title="Active Quotations"
          value={stats.activeQuotations}
          icon={ChartBarIcon}
          linkTo="/quotations"
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            to="/quotations/create"
            className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            <DocumentTextIcon className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
            <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
              Create New Quotation
            </span>
          </Link>

          <Link
            to="/products/create"
            className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            <CubeIcon className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
            <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
              Add Product/Service
            </span>
          </Link>
        </div>
      </div>

      {/* Recent Quotations */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Quotations</h2>
          <Link 
            to="/quotations" 
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
          >
            View all
          </Link>
        </div>
        
        <div className="mt-4 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg transition-colors duration-200">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quotation #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {Array.isArray(stats.recentQuotations) && stats.recentQuotations.length > 0 ? (
                stats.recentQuotations.map((quotation) => (
                  <tr key={quotation._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {quotation.quotationNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {quotation.customer?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      KES {(quotation.total || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(quotation.status)}`}>
                        {quotation.status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No quotations yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;