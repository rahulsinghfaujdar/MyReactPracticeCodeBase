import React from 'react';

export const ProductsListContext = React.createContext({
  selectedProduct: null,
  setSelectedProduct: () => { }
});

export const ProductsListContextProvider = ({ children }) => {
  const [selectedProduct, setSelectedProduct] = React.useState(null);
  return (
    <ProductsListContext.Provider value={{ selectedProduct, setSelectedProduct }}>
      {children}
    </ProductsListContext.Provider>
  )
}