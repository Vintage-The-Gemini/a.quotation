// store/slices/templateSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import templateService from '../../services/template.service';

// Async thunks
export const fetchTemplates = createAsyncThunk(
  'templates/fetchTemplates',
  async () => {
    const response = await templateService.getTemplates();
    return response.data;
  }
);

export const createTemplate = createAsyncThunk(
  'templates/createTemplate',
  async (templateData) => {
    const response = await templateService.createTemplate(templateData);
    return response.data;
  }
);

export const updateTemplate = createAsyncThunk(
  'templates/updateTemplate',
  async ({ id, data }) => {
    const response = await templateService.updateTemplate(id, data);
    return response.data;
  }
);

export const deleteTemplate = createAsyncThunk(
  'templates/deleteTemplate',
  async (id) => {
    await templateService.deleteTemplate(id);
    return id;
  }
);

const initialState = {
  templates: [],
  selectedTemplate: null,
  isLoading: false,
  error: null,
  lastGeneratedPDF: null
};

const templateSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    setSelectedTemplate: (state, action) => {
      state.selectedTemplate = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLastGeneratedPDF: (state, action) => {
      state.lastGeneratedPDF = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch templates
      .addCase(fetchTemplates.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates = action.payload;
        state.error = null;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // Create template
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.templates.push(action.payload);
        state.error = null;
      })
      // Update template
      .addCase(updateTemplate.fulfilled, (state, action) => {
        const index = state.templates.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        state.error = null;
      })
      // Delete template
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.templates = state.templates.filter(t => t._id !== action.payload);
        state.error = null;
      });
  }
});

export const { setSelectedTemplate, clearError, setLastGeneratedPDF } = templateSlice.actions;

export default templateSlice.reducer;