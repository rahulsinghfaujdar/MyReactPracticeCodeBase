import React, { lazy, Suspense } from 'react';
import { ProductsListContextProvider } from './context/ProductsListContext.jsx';
const ProductsListView = lazy(() => import('./views/ProductsListView.jsx'));

function App() {

  return (
    <div style={styles.main}>
      <Suspense fallback={<div>Products List Loading...</div>}>
        <ProductsListContextProvider>
          <ProductsListView />
        </ProductsListContextProvider>
      </Suspense>
    </div>
  )
}

const styles = {
  main: {
    padding: '20px',
  },
  title: {
    color: '#5C6AC4'
  },
};

export default App
