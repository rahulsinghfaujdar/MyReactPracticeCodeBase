import React from 'react';
import { ProductsListContext } from '../../context/ProductsListContext.jsx';
import ProductsListItem from './ProductsListItem.jsx';
import EmptyMessage from '../EmptyMessage.jsx';

const ProductsList = React.memo(({
  filteredProductsListData = [],
  onProductsListItemClickedListener
}) => {

  const { selectedProduct } = React.useContext(ProductsListContext);

  if (filteredProductsListData.length === 0) {
    return <EmptyMessage />;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
    }}>
      <h1 style={{ color: '#000', fontSize: '14px' }}>{selectedProduct?.title}</h1>
      {
        filteredProductsListData.map((item, index) => {
          return (
            <ProductsListItem
              key={item?.id || index}
              onProductsListItemClickedListener={onProductsListItemClickedListener}
              item={item}
              index={index}
            />)
        })
      }
    </div >);
})

export default ProductsList;