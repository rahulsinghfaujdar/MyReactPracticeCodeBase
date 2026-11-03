import React, { lazy, Suspense } from 'react';
import { ProductsListContextProvider } from './context/ProductsListContext.jsx';
import AuthGate from './auth/AuthGate.jsx';

const ProductsListView = lazy(() => import('./views/ProductsListView.jsx'));

function App() {
  return (
    <div style={styles.main}>
      <AuthGate>
        <header style={styles.header}>
          <h1 style={styles.title}>Products</h1>
        </header>
        <Suspense fallback={<p>Products List Loading...</p>}>
          <ProductsListContextProvider>
            <ProductsListView />
          </ProductsListContextProvider>
        </Suspense>
      </AuthGate>
    </div>
  )
}

const styles = {
  main: {
    boxSizing: 'border-box',
    minHeight: '100vh',
    padding: '1px',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#5C6AC4',
    fontSize: '24px',
  },
};

export default App
