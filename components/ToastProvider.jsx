'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: '#27272a',
          color: '#fff',
          border: '1px solid #3f3f46',
        },
        duration: 3000,
      }}
    />
  );
}
