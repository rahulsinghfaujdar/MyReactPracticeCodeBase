import React from 'react';
import Loading from '../components/Loading.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import ProductsList from '../components/products_list/ProductsList.jsx';
import useProductsListRepo from '../repositories/ProductsListRepo.jsx';
import SearchInput from '../components/SearchInput.jsx';

const ProductsListView = React.memo(() => {
  const {
    isProductsListLoading,
    productsListError,
    filteredProductsListData,
    onProductsListItemClickedListener,
    searchText,
    onSearchTextChange,
  } = useProductsListRepo();

  if (isProductsListLoading) {
    return <Loading />;
  }

  if (productsListError) {
    return <ErrorMessage message={productsListError?.message ?? productsListError} />;
  }

  return (
    <>
      <SearchInput value={searchText} onSearchTextChange={onSearchTextChange} />
      <ProductsList
        filteredProductsListData={filteredProductsListData}
        onProductsListItemClickedListener={onProductsListItemClickedListener}
      />
    </>
  );
});

export default ProductsListView;