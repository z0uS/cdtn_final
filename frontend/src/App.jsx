// App.jsx – Entry point của ứng dụng

import { Toaster } from 'react-hot-toast';
import AppRouter from './routes/AppRouter';

function App() {
  return (
    <>
      <AppRouter />
      {/* Toast notifications toàn app */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            fontSize:     '13px',
            fontFamily:   '"Be Vietnam Pro", Inter, sans-serif',
            boxShadow:    '0 4px 12px rgba(0,0,0,0.08)',
          },
          success: {
            iconTheme: { primary: '#16a34a', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
          },
        }}
      />
    </>
  );
}

export default App;
