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
      throw new Error(`${response.status} - ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new Error(
        `Expected a JSON response from ${GET_PRODUCTS_LIST}, but received ${contentType || 'an unknown content type'}. Check the products API URL.`
      );
    }

    const resJson = await response.json();
    const products = Array.isArray(resJson?.products) ? resJson?.products : [];
    onProductsListSuccess(products);
  }
  catch (error) {
    console.error('Unable to load the products list:', error);
    onProductsListError(error);
  }
  finally {
    onProductsListLoading(false);
  }
}