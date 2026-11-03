import React from 'react';

const ProductsListItem = React.memo(({ onProductsListItemClickedListener, item, index }) => {
    const id = item?.id;
    const title = item?.title;
    const image = item?.thumbnail;
    const desc = item?.description;
    const isShowDesc = item?.isShowDesc;
    return (
      <div
        key={id || index}
        onClick={() => onProductsListItemClickedListener(item, index)}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#f4f5f6',
          gap: '5px',
          height: '40px',
          width: '100%',
          padding: '5px',
          margin: '2px',
          borderRadius: '5px'
        }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '5px',
          }}>
          <img
            src={image}
            alt={title}
            style={{ height: '40px', width: '40px' }}
          />
          <h1 style={{ color: '#000', fontSize: '14px' }}>{id}. {title}</h1>
        </div>
        {isShowDesc && <h1 style={{ color: '#000', fontSize: '14px', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>{desc}</h1>}
      </div>
    );
  })

  export default ProductsListItem;