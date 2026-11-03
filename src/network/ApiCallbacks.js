import { GET_PRODUCTS_LIST } from './Constants.js'

export async function getProductsListfromApi(
  onProductsListLoading,
  onProductsListSuccess,
  onProductsListError
) {
  try {
    onProductsListLoading(true);
    const response = await fetch(GET_PRODUCTS_LIST);
    if (!response.ok) {
      const error = { message: `${response.status} - ${response.statusText}` }
      onProductsListError(error);
      throw new Error(error);
    }
    const resJson = await response.json();
    const products = Array.isArray(resJson?.products) ? resJson?.products : [];
    onProductsListSuccess(products);
  }
  catch (error) {
    console.log(`Error : ${error}`);
    onProductsListError(error);
  }
  finally {
    onProductsListLoading(false);
  }
}