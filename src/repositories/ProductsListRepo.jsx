import React from 'react';
import { getProductsListfromApi } from '../network/ApiCallbacks.js';
import { ProductsListContext } from '../context/ProductsListContext.jsx';

const useProductsListRepo = () => {

  const { setSelectedProduct } = React.useContext(ProductsListContext);
  const [isProductsListLoading, setIsProductsListLoading] = React.useState(false);
  const [productsListError, setProductsListError] = React.useState(null);
  const [productsListData, setProductsListData] = React.useState([]);
  const [filteredProductsListData, setFilteredProductsListData] = React.useState([]);
  const [searchText, setSearchText] = React.useState('');
  const searchTextDebounce = React.useRef(null);

  const onProductsListLoading = React.useCallback((isLoading) => {
    setIsProductsListLoading(isLoading);
  }, []);

  const onProductsListSuccess = React.useCallback((products) => {
    setProductsListData(products);
    setFilteredProductsListData(products);
    console.log(JSON.stringify(products));
  }, []);

  const onProductsListError = React.useCallback((error) => {
    setProductsListError(error);
  }, []);

  React.useEffect(() => {
    getProductsListfromApi(
      onProductsListLoading,
      onProductsListSuccess,
      onProductsListError
    );
  }, [onProductsListLoading, onProductsListSuccess, onProductsListError]);

  React.useEffect(() => () => {
    if (searchTextDebounce.current) {
      clearTimeout(searchTextDebounce.current);
    }
  }, []);

  const onProductsListItemClickedListener = React.useCallback((item, index) => {
    const newList = filteredProductsListData.map((product, productIndex) => ({
      ...product,
      isShowDesc: productIndex === index && !product?.isShowDesc,
    }));
    const selectedItem = newList[index] ?? item;
    setFilteredProductsListData(newList);
    setSelectedProduct(selectedItem);

    //operations();

  }, [filteredProductsListData, setSelectedProduct]);

  const operations = () => {
    // 1. Group by item.availabilityStatus (In Stock, Low Stock)
    const groupByAvailability = Object.groupBy(
      filteredProductsListData,
      (item) => item.availabilityStatus
    )
    //console.log(JSON.stringify(groupByAvailability))

    // 2. Sort by item.price (Lowest to Highest)
    const sortedByPrice = filteredProductsListData.toSorted(
      (a, b) => b.price - a.price
    );
    //console.log(JSON.stringify(sortedByPrice));

    const numbers = [3, 1, 4];
    const sorted = numbers.toSorted();
    //console.log(`Sorted : ${sorted}`);

    // 2. Sort alphabetically by title, then reverse the order (Z to A)
    const reversedByTitle = filteredProductsListData.toReversed(
      (a, b) => a.title.trim().localCompare(b.title.trim())
    );
    //console.log(JSON.stringify(reversed));

    const reversed = numbers.toReversed();
    //console.log(`Reversed : ${reversed}`);


    //originalArray.toSpliced(start, deleteCount)
    // In array.toSpliced(start, deleteCount), the number 1 represents the delete count. 
    // It explicitly tells JavaScript to remove exactly one item from the array, starting at the position of the targetIndex.
    // If you had written 2 instead, it would have removed the target item plus the item right next to it.

    // The Exact Syntax Breakdown
    // const newArray = originalArray.toSpliced(start, deleteCount, item1, item2, ...);

    // • start (Required): The index position where the modification begins. In your code, this is the targetIndex (the position where "In Stock" was found).
    // • deleteCount (Optional): An integer indicating the number of elements to remove from the array starting at the start position. This is why your code uses 1.
    // • item1, item2, ... (Optional): The elements you want to insert into the array at that specific position. If you do not specify any items (like in your snippet), toSpliced() will only remove items and won't add anything new.

    
    // 3. Remove 1 item starting at the index of the first "In Stock" item
    // (Finds where availabilityStatus is "In Stock" and splices it out)
    const targetIndex = filteredProductsListData.findIndex(item => item.availabilityStatus === "In Stock");
    const productsWithStockSpliced = filteredProductsListData.toSpliced(targetIndex, 1);    
    //console.log(JSON.stringify(productsWithStockSpliced));

    
  }

  const onSearchTextChange = React.useCallback((event) => {
    const value = event.target.value;
    setSearchText(value);

    if (searchTextDebounce.current) {
      clearTimeout(searchTextDebounce.current);
    }

    searchTextDebounce.current = setTimeout(() => {
      const normalizedValue = value.trim().toLowerCase();
      const searchList = productsListData.filter((item) =>
        item.title.trim().toLowerCase().includes(normalizedValue)
      );
      setFilteredProductsListData(searchList);
    }, 300);
  }, [productsListData]);

  return React.useMemo(() => ({
    isProductsListLoading,
    productsListError,
    productsListData,
    filteredProductsListData,
    setFilteredProductsListData,
    onProductsListItemClickedListener,
    searchText,
    onSearchTextChange,
  }));
};

export default useProductsListRepo;
