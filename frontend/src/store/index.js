import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import productReducer from './slices/productSlice'
import quotationReducer from './slices/quotationSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    quotations: quotationReducer,
  },
})