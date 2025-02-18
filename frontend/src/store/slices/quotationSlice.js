// store/slices/quotationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import quotationService from '../../services/quotation.service';

// Async thunks
export const fetchQuotations = createAsyncThunk(
  'quotations/fetchQuotations',
  async (filters = {}) => {
    const response = await quotationService.getQuotations(filters);
    return response;
  }
);

export const fetchQuotationById = createAsyncThunk(
  'quotations/fetchQuotationById',
  async (id) => {
    const response = await quotationService.getQuotationById(id);
    return response;
  }
);

export const createQuotation = createAsyncThunk(
  'quotations/createQuotation',
  async (quotationData) => {
    const response = await quotationService.createQuotation(quotationData);
    return response;
  }
);

export const updateQuotation = createAsyncThunk(
  'quotations/updateQuotation',
  async ({ id, data }) => {
    const response = await quotationService.updateQuotation(id, data);
    return response;
  }
);

export const updateQuotationStatus = createAsyncThunk(
  'quotations/updateStatus',
  async ({ id, status }) => {
    const response = await quotationService.updateStatus(id, status);
    return { id, ...response };
  }
);

export const deleteQuotation = createAsyncThunk(
  'quotations/deleteQuotation',
  async (id) => {
    await quotationService.deleteQuotation(id);
    return id;
  }
);

const initialState = {
  quotations: [],
  currentQuotation: null,
  isLoading: false,
  error: null,
  filters: {
    search: '',
    status: '',
    dateRange: {
      start: null,
      end: null
    },
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  }
};

const quotationSlice = createSlice({
  name: 'quotations',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload
      };
    },
    setPagination: (state, action) => {
      state.pagination = {
        ...state.pagination,
        ...action.payload
      };
    },
    clearCurrentQuotation: (state) => {
      state.currentQuotation = null;
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Quotations
      .addCase(fetchQuotations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuotations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.quotations = action.payload.data;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalItems: action.payload.totalItems,
          itemsPerPage: action.payload.itemsPerPage
        };
      })
      .addCase(fetchQuotations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      
      // Fetch Single Quotation
      .addCase(fetchQuotationById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchQuotationById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentQuotation = action.payload;
      })
      .addCase(fetchQuotationById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })

      // Create Quotation
      .addCase(createQuotation.fulfilled, (state, action) => {
        state.quotations.unshift(action.payload);
        state.pagination.totalItems += 1;
      })

      // Update Quotation
      .addCase(updateQuotation.fulfilled, (state, action) => {
        const index = state.quotations.findIndex(q => q._id === action.payload._id);
        if (index !== -1) {
          state.quotations[index] = action.payload;
        }
        if (state.currentQuotation?._id === action.payload._id) {
          state.currentQuotation = action.payload;
        }
      })

      // Update Status
      .addCase(updateQuotationStatus.fulfilled, (state, action) => {
        const index = state.quotations.findIndex(q => q._id === action.payload.id);
        if (index !== -1) {
          state.quotations[index].status = action.payload.status;
        }
        if (state.currentQuotation?._id === action.payload.id) {
          state.currentQuotation.status = action.payload.status;
        }
      })

      // Delete Quotation
      .addCase(deleteQuotation.fulfilled, (state, action) => {
        state.quotations = state.quotations.filter(q => q._id !== action.payload);
        state.pagination.totalItems -= 1;
        if (state.currentQuotation?._id === action.payload) {
          state.currentQuotation = null;
        }
      });
  }
});

export const { 
  setFilters, 
  setPagination, 
  clearCurrentQuotation, 
  resetFilters 
} = quotationSlice.actions;

export default quotationSlice.reducer;