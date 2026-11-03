const env = import.meta.env ?? {};
const DEFAULT_BASE_URL = 'https://dummyjson.com';
const BASE_URL = env.VITE_BASE_URL?.trim() || DEFAULT_BASE_URL;
const GET_PRODUCTS_LIST =
  env.VITE_GET_PRODUCTS_LIST?.trim() || `${BASE_URL.replace(/\/+$/, '')}/products`;

export {
  BASE_URL,
  GET_PRODUCTS_LIST
}