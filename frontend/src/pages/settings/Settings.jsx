import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const Settings = () => {
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const user = useSelector(state => state.auth.user);
  const [activeTab, setActiveTab] = useState('business');
  const [isLoading, setIsLoading] = useState(false);
  const [businessSettings, setBusinessSettings] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    quotationPrefix: 'QT',
    defaultTax: {
      enabled: true,
      rate: 16,
      name: 'VAT'
    },
    currency: 'KES'
  });

  const handleSaveBusinessSettings = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.put('/business/settings', businessSettings);
      if (response.data.success) {
        toast.success('Business settings updated successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your business settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 space-y-1">
          <button
            onClick={() => setActiveTab('business')}
            className={`w-full px-4 py-2 text-left text-sm font-medium rounded-md transition-colors
              ${activeTab === 'business' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            Business Information
          </button>
          
          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full px-4 py-2 text-left text-sm font-medium rounded-md transition-colors
              ${activeTab === 'appearance' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            Appearance
          </button>

          <button
            onClick={() => setActiveTab('quotation')}
            className={`w-full px-4 py-2 text-left text-sm font-medium rounded-md transition-colors
              ${activeTab === 'quotation' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            Quotation Settings
          </button>

          <button
            onClick={() => setActiveTab('tax')}
            className={`w-full px-4 py-2 text-left text-sm font-medium rounded-md transition-colors
              ${activeTab === 'tax' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            Tax Settings
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors">
            {/* Business Information */}
            {activeTab === 'business' && (
              <form onSubmit={handleSaveBusinessSettings} className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Business Information</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Update your business details and contact information
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={businessSettings.name}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={businessSettings.email}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={businessSettings.phone}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Currency
                    </label>
                    <select
                      value={businessSettings.currency}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, currency: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                    >
                      <option value="KES">KES - Kenyan Shilling</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={businessSettings.address.street}
                      onChange={(e) => setBusinessSettings(prev => ({
                        ...prev,
                        address: { ...prev.address, street: e.target.value }
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      City
                    </label>
                    <input
                      type="text"
                      value={businessSettings.address.city}
                      onChange={(e) => setBusinessSettings(prev => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      State / Province
                    </label>
                    <input
                      type="text"
                      value={businessSettings.address.state}
                      onChange={(e) => setBusinessSettings(prev => ({
                        ...prev,
                        address: { ...prev.address, state: e.target.value }
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Customize the look and feel of your application
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Dark Mode
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Toggle between light and dark theme
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className={`${
                        theme === 'dark'
                          ? 'bg-blue-600 dark:bg-blue-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                    >
                      <span
                        className={`${
                          theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                      >
                        <span
                          className={`${
                            theme === 'dark'
                              ? 'opacity-0 duration-100 ease-out'
                              : 'opacity-100 duration-200 ease-in'
                          } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                          aria-hidden="true"
                        >
                          🌞
                        </span>
                        <span
                          className={`${
                            theme === 'dark'
                              ? 'opacity-100 duration-200 ease-in'
                              : 'opacity-0 duration-100 ease-out'
                          } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                          aria-hidden="true"
                        >
                          🌙
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quotation Settings */}
            {activeTab === 'quotation' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Quotation Settings</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Configure your quotation preferences
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Quotation Number Prefix
                    </label>
                    <input
                      type="text"
                      value={businessSettings.quotationPrefix}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, quotationPrefix: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                      placeholder="QT"
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      This prefix will be added to all quotation numbers (e.g., QT-0001)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tax Settings */}
            {/* Tax Settings */}
            {activeTab === 'tax' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tax Settings</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Configure your default tax settings for quotations
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={businessSettings.defaultTax.enabled}
                      onChange={(e) => setBusinessSettings(prev => ({
                        ...prev,
                        defaultTax: { ...prev.defaultTax, enabled: e.target.checked }
                      }))}
                      className="h-4 w-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                    <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Enable Default Tax
                    </label>
                  </div>

                  {businessSettings.defaultTax.enabled && (
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Tax Name
                        </label>
                        <input
                          type="text"
                          value={businessSettings.defaultTax.name}
                          onChange={(e) => setBusinessSettings(prev => ({
                            ...prev,
                            defaultTax: { ...prev.defaultTax, name: e.target.value }
                          }))}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                          placeholder="VAT"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          value={businessSettings.defaultTax.rate}
                          onChange={(e) => setBusinessSettings(prev => ({
                            ...prev,
                            defaultTax: { ...prev.defaultTax, rate: parseFloat(e.target.value) }
                          }))}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleSaveBusinessSettings}
                    disabled={isLoading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Saving...' : 'Save Tax Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;