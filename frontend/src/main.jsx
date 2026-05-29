import './utils/api/axiosInterceptor.js';
import './index.css';
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import './styles/globals.css';
import App from './App.jsx';
import { StoreProvider } from './context/Store';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <HelmetProvider>
        <PayPalScriptProvider deferLoading={true}>
          <App />
        </PayPalScriptProvider>
      </HelmetProvider>
    </StoreProvider>
  </StrictMode>
);
