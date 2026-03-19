import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { store } from './store';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#1e293b', color: '#f8fafc' },
            success: { style: { background: '#065f46', color: '#ecfdf5' } },
            error: { style: { background: '#7f1d1d', color: '#fef2f2' } },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
