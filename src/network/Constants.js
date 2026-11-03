const env = import.meta.env ?? {};
const DEFAULT_BASE_URL = 'https://dummyjson.com';
const BASE_URL = env.VITE_BASE_URL?.trim() || DEFAULT_BASE_URL;
const GET_PRODUCTS_LIST = env.VITE_GET_PRODUCTS_LIST?.trim() || `${BASE_URL.replace(/\/+$/, '')}/products`;
const AWS_PRODUCTS_API_URL = env.VITE_AWS_PRODUCTS_API_URL?.trim() || '';
const AWS_APPSYNC_GRAPHQL_URL = env.VITE_AWS_APPSYNC_GRAPHQL_URL?.trim() || '';
const isAWSNetworking = false;
const isAWSAppSync = true;

export {
  BASE_URL,
  GET_PRODUCTS_LIST,
  AWS_PRODUCTS_API_URL,
  AWS_APPSYNC_GRAPHQL_URL,
  isAWSNetworking,
  isAWSAppSync,
};