import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import authService from './services/auth.service';
import { setCredentials } from './store/slices/authSlice';
import { ThemeProvider } from './context/ThemeContext';

// Layout Components
import Layout from './components/layout/Layout';
import PrivateRoute from './components/common/PrivateRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Product Pages
import ProductList from './pages/products/ProductList';
import ProductCreate from './pages/products/ProductCreate';
import ProductEdit from './pages/products/ProductEdit';

// Quotation Pages
import QuotationList from './pages/quotations/QuotationList';
import QuotationCreate from './pages/quotations/QuotationCreate';
import QuotationDetail from './pages/quotations/QuotationDetail';
import QuotationEdit from './pages/quotations/QuotationEdit';



// Settings
import Settings from './pages/settings/Settings';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authService.getCurrentUser();
          if (response.success) {
            dispatch(setCredentials({
              user: response.user,
              token
            }));
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    };

    initializeAuth();
  }, [dispatch]);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              {/* Dashboard */}
              <Route path="/" element={<Dashboard />} />
              
              {/* Products & Services */}
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/create" element={<ProductCreate />} />
              <Route path="/products/edit/:id" element={<ProductEdit />} />
              
              {/* Quotations */}
              <Route path="/quotations" element={<QuotationList />} />
              <Route path="/quotations/create" element={<QuotationCreate />} />
              <Route path="/quotations/:id" element={<QuotationDetail />} />
              <Route path="/quotations/edit/:id" element={<QuotationEdit />} /> {/* Add this line */}

              
              {/* Settings */}
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;