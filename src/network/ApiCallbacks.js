import { fetchAuthSession } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import {
  AWS_APPSYNC_GRAPHQL_URL,
  AWS_PRODUCTS_API_URL,
  GET_PRODUCTS_LIST,
  isAWSAppSync,
  isAWSNetworking,
} from './Constants.js';

const appSyncClient = generateClient();

const listProductsQuery = `query ListProducts {
  listProducts {
    id
    title
    description
    availabilityStatus
    thumbnail
  }
}`;

async function getProductsFromAppSync() {
  if (!AWS_APPSYNC_GRAPHQL_URL) {
    throw new Error(
      'VITE_AWS_APPSYNC_GRAPHQL_URL is required when isAWSAppSync is true.'
    );
  }

  const result = await appSyncClient.graphql({
    query: listProductsQuery,
    authMode: 'userPool',
  });

  if (Array.isArray(result.errors) && result.errors.length > 0) {
    throw new Error(result.errors.map((error) => error.message).join('; '));
  }

  if (!Array.isArray(result.data?.listProducts)) {
    throw new Error('AppSync response did not contain a products list.');
  }

  return result.data.listProducts;
}

export async function getProductsListfromApi(
  onProductsListLoading,
  onProductsListSuccess,
  onProductsListError
) {
  try {
    onProductsListLoading(true);

    let products;
    if (isAWSAppSync) {
      products = await getProductsFromAppSync();
    } else {
      const url = isAWSNetworking ? AWS_PRODUCTS_API_URL : GET_PRODUCTS_LIST;
      if (isAWSNetworking && !url) {
        throw new Error('VITE_AWS_PRODUCTS_API_URL is required when isAWSNetworking is true.');
      }

      const headers = { Accept: 'application/json' };
      if (isAWSNetworking) {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();
        if (!idToken) {
          throw new Error('A signed-in Cognito session is required to load products from AWS.');
        }
        headers.Authorization = idToken;
      }

      const response = await fetch(url, { headers });
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
      products = Array.isArray(resJson?.products) ? resJson.products : [];
    }

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