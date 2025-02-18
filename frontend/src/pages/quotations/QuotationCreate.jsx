import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import quotationService from '../../services/quotation.service';


const QuotationCreate = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    customer: {
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    },
    items: [],
    notes: '',
    terms: '',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Fetch available items (products/services)
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.get('/items');
        setItems(response.data.data);
      } catch (error) {
        toast.error('Failed to fetch items');
      }
    };
    fetchItems();
  }, []);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          tax: 0,
          subtotal: 0
        }
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      if (field === 'item') {
        const selectedItem = items.find(i => i._id === value);
        newItems[index] = {
          ...newItems[index],
          item: value,
          unitPrice: selectedItem?.price || 0,
          tax: selectedItem?.tax?.rate || 0
        };
      } else {
        newItems[index] = {
          ...newItems[index],
          [field]: value
        };
      }

      // Calculate subtotal
      const quantity = Number(newItems[index].quantity);
      const unitPrice = Number(newItems[index].unitPrice);
      const discount = Number(newItems[index].discount);
      const subtotal = quantity * unitPrice * (1 - discount / 100);
      newItems[index].subtotal = subtotal;

      return { ...prev, items: newItems };
    });
  };

  const calculateTotals = () => {
    return formData.items.reduce(
      (acc, item) => {
        const subtotal = Number(item.subtotal);
        const tax = subtotal * (Number(item.tax) / 100);
        return {
          subtotal: acc.subtotal + subtotal,
          tax: acc.tax + tax,
          total: acc.total + subtotal + tax
        };
      },
      { subtotal: 0, tax: 0, total: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        if (!formData.customer.name) {
            throw new Error('Customer name is required');
        }

        if (formData.items.length === 0) {
            throw new Error('Please add at least one item to the quotation');
        }

        // Process items to ensure all required fields
        const processedItems = formData.items.map(item => ({
            item: item.item,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            discount: Number(item.discount || 0),
            tax: Number(item.tax || 0),
            subtotal: Number(item.quantity) * Number(item.unitPrice)
        }));

        const quotationData = {
            customer: {
                name: formData.customer.name,
                email: formData.customer.email,
                phone: formData.customer.phone,
                address: formData.customer.address
            },
            items: processedItems,
            validUntil: formData.validUntil,
            notes: formData.notes,
            terms: formData.terms
        };

        const response = await quotationService.create(quotationData);
        
        if (response.success) {
            toast.success('Quotation created successfully');
            navigate('/quotations');
        } else {
            throw new Error(response.message || 'Failed to create quotation');
        }
    } catch (error) {
        toast.error(error.message || 'Failed to create quotation');
        console.error('Create quotation error:', error);
    } finally {
        setIsLoading(false);
    }
};

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create Quotation</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Create a new quotation for your customer
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer Information</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <input
                type="text"
                required
                value={formData.customer.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  customer: { ...prev.customer, name: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={formData.customer.email}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  customer: { ...prev.customer, email: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone
              </label>
              <input
                type="tel"
                value={formData.customer.phone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  customer: { ...prev.customer, phone: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Address
              </label>
              <input
                type="text"
                value={formData.customer.address.street}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  customer: {
                    ...prev.customer,
                    address: { ...prev.customer.address, street: e.target.value }
                  }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                placeholder="Street Address"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Items</h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            >
              <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" />
              Add Item
            </button>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-6 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Item
                  </label>
                  <select
                    value={item.item}
                    onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                    required
                  >
                    <option value="">Select Item</option>
                    {items.map((i) => (
                      <option key={i._id} value={i._id}>
                        {i.name} - KES {i.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Discount %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.discount}
                    onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tax %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.tax}
                    onChange={(e) => handleItemChange(index, 'tax', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="inline-flex items-center p-2 border border-transparent rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          {formData.items.length > 0 && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Subtotal</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    KES {totals.subtotal.toFixed(2)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Tax</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    KES {totals.tax.toFixed(2)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                  <dt className="text-base font-medium text-gray-900 dark:text-white">Total</dt>
                  <dd className="text-base font-medium text-gray-900 dark:text-white">
                    KES {totals.total.toFixed(2)}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>

       {/* Additional Information */}
       <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Additional Information</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                placeholder="Additional notes for the quotation..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Terms & Conditions
              </label>
              <textarea
                rows={3}
                value={formData.terms}
                onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                placeholder="Terms and conditions..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Valid Until
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
                required
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/quotations')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Quotation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuotationCreate;