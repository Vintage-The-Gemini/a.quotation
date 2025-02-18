import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const fetchItems = createAsyncThunk(
  'products/fetchItems',
  async ({ page = 1, limit = 10, search = '', type = '', category = '' }) => {
    const response = await axios.get(`/api/items`, {
      params: { page, limit, search, type, category }
    });
    return response.data;
  }
);

export const fetchItemById = createAsyncThunk(
  'products/fetchItemById',
  async (id) => {
    const response = await axios.get(`/api/items/${id}`);
    return response.data;
  }
);

export const createItem = createAsyncThunk(
  'products/createItem',
  async (itemData) => {
    const response = await axios.post('/api/items', itemData);
    return response.data;
  }
);

export const updateItem = createAsyncThunk(
  'products/updateItem',
  async ({ id, data }) => {
    const response = await axios.put(`/api/items/${id}`, data);
    return response.data;
  }
);

export const deleteItem = createAsyncThunk(
  'products/deleteItem',
  async (id) => {
    await axios.delete(`/api/items/${id}`);
    return id;
  }
);

const initialState = {
  items: [],
  selectedItem: null,
  categories: [],
  filters: {
    search: '',
    type: '', // 'product' or 'service'
    category: '',
    status: 'active'
  },
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    limit: 10
  },
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  sortBy: {
    field: 'createdAt',
    order: 'desc'
  }
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    setItemsPerPage: (state, action) => {
      state.pagination.limit = action.payload;
    },
    clearSelectedItem: (state) => {
      state.selectedItem = null;
    },
    addCategory: (state, action) => {
      if (!state.categories.includes(action.payload)) {
        state.categories.push(action.payload);
      }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Items
      .addCase(fetchItems.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.data;
        state.pagination = {
          currentPage: action.payload.pagination.page,
          totalPages: action.payload.pagination.pages,
          totalItems: action.payload.pagination.total,
          limit: action.payload.pagination.limit
        };
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })

      // Fetch Single Item
      .addCase(fetchItemById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchItemById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selectedItem = action.payload.data;
      })
      .addCase(fetchItemById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })

      // Create Item
      .addCase(createItem.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items.push(action.payload.data);
        // Add category if it's new
        if (!state.categories.includes(action.payload.data.category)) {
          state.categories.push(action.payload.data.category);
        }
      })
      .addCase(createItem.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })

      // Update Item
      .addCase(updateItem.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.items.findIndex(item => item._id === action.payload.data._id);
        if (index !== -1) {
          state.items[index] = action.payload.data;
        }
        if (state.selectedItem?._id === action.payload.data._id) {
          state.selectedItem = action.payload.data;
        }
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })

      // Delete Item
      .addCase(deleteItem.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = state.items.filter(item => item._id !== action.payload);
        if (state.selectedItem?._id === action.payload) {
          state.selectedItem = null;
        }
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

// Selectors
export const selectAllItems = (state) => state.products.items;
export const selectItemById = (id) => (state) => 
  state.products.items.find(item => item._id === id);
export const selectItemsByType = (type) => (state) =>
  state.products.items.filter(item => item.type === type);
export const selectActiveItems = (state) =>
  state.products.items.filter(item => item.status === 'active');
export const selectItemsByCategory = (category) => (state) =>
  state.products.items.filter(item => item.category === category);
export const selectCategories = (state) => state.products.categories;
export const selectPagination = (state) => state.products.pagination;
export const selectFilters = (state) => state.products.filters;
export const selectStatus = (state) => state.products.status;
export const selectError = (state) => state.products.error;

export const {
  setFilters,
  setSortBy,
  setCurrentPage,
  setItemsPerPage,
  clearSelectedItem,
  addCategory,
  clearFilters
} = productSlice.actions;

export default productSlice.reducer;