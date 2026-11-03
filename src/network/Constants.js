const env = import.meta.env ?? {};
//const BASE_URL = env.VITE_BASE_URL ?? 'https://dummyjson.com';
//const GET_PRODUCTS_LIST = env.VITE_GET_PRODUCTS_LIST ?? `${BASE_URL}/products`;
const BASE_URL = env.VITE_BASE_URL ?? '';
const GET_PRODUCTS_LIST = env.VITE_GET_PRODUCTS_LIST ?? ``;

export {
  BASE_URL,
  GET_PRODUCTS_LIST
}