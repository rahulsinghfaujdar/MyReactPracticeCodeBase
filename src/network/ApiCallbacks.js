import { fetchAuthSession } from 'aws-amplify/auth';
import {
  AWS_PRODUCTS_API_URL,
  GET_PRODUCTS_LIST,
  isAWSNetworking,
} from './Constants.js';

export async function getProductsListfromApi(
  onProductsListLoading,
  onProductsListSuccess,
  onProductsListError
) {
  try {
    onProductsListLoading(true);

    let url = GET_PRODUCTS_LIST;
    const requestOptions = { headers: { Accept: 'application/json' } };
    if (isAWSNetworking) {
      if (!AWS_PRODUCTS_API_URL) {
        throw new Error('VITE_AWS_PRODUCTS_API_URL is required when isAWSNetworking is true.');
      }

      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (!idToken) {
        throw new Error('A signed-in Cognito session is required to load products from AWS.');
      }

      url = AWS_PRODUCTS_API_URL;
      requestOptions.headers.Authorization = idToken;
    }

    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(
        `${response.status} - ${response.statusText}${responseBody ? `: ${responseBody}` : ''}`
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new Error(
        `Expected a JSON response from ${url}, but received ${contentType || 'an unknown content type'}. Check the products API URL.`
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