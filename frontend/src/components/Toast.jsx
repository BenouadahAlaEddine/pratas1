import { useState, useCallback } from 'react';

let toastIdCounter = 0;
let externalAddToast = null;

export const useToastController = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  externalAddToast = addToast;
  return { toasts, addToast };
};

export const toast = {
  success: (msg) => externalAddToast?.(msg, 'success'),
  error:   (msg) => externalAddToast?.(msg, 'error'),
  info:    (msg) => externalAddToast?.(msg, 'info'),
};

const icons = { success: '✅', error: '❌', info: 'ℹ️' };

export const ToastContainer = ({ toasts }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <div key={t.id} className={`toast ${t.type}`}>
        <span>{icons[t.type]}</span>
        <span style={{ fontSize: 14 }}>{t.message}</span>
      </div>
    ))}
  </div>
);
