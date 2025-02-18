import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

const QuotationEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [items, setItems] = useState([]); // Available products/services
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
    validUntil: '',
    status: 'draft'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quotationResponse, itemsResponse] = await Promise.all([
          api.get(`/quotations/${id}`),
          api.get('/items')
        ]);
        
        const quotation = quotationResponse.data.data;
        setFormData({
          customer: quotation.customer,
          items: quotation.items.map(item => ({
            item: item.item._id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            tax: item.tax,
            subtotal: item.subtotal
          })),
          notes: quotation.notes,
          terms: quotation.terms,
          validUntil: new Date(quotation.validUntil).toISOString().split('T')[0],
          status: quotation.status
        });
        setItems(itemsResponse.data.data);
      } catch (error) {
        toast.error('Failed to fetch quotation data');
        navigate('/quotations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

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
    setIsSaving(true);

    try {
      const response = await api.put(`/quotations/${id}`, {
        customer: formData.customer,
        items: formData.items,
        notes: formData.notes,
        terms: formData.terms,
        validUntil: formData.validUntil,
        status: formData.status
      });

      if (response.data.success) {
        toast.success('Quotation updated successfully');
        navigate(`/quotations/${id}`);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update quotation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/quotations/${id}/status`, { status: newStatus });
      setFormData(prev => ({ ...prev, status: newStatus }));
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Edit Quotation
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Update quotation details and items
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <select
            value={formData.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
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
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="inline-flex items-center p-2 border border-transparent rounded-md text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
  
            {/* Totals */}
            {formData.items.length > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-4">
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
                  <div className="flex justify-between border-t border-gray-200 pt-2">
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
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
            </div>
          </div>
  
          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/quotations/${id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    );
  };
  
  export default QuotationEdit;