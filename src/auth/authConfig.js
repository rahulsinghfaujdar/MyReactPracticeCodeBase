import { Amplify } from 'aws-amplify';

const userPoolId = import.meta.env.VITE_USER_POOL_ID?.trim();
const userPoolClientId =
  import.meta.env.VITE_USER_POOL_WEB_CLIENT_ID?.trim() ||
  import.meta.env.VITE_USER_POOL_CLIENT_ID?.trim();

export const isAuthConfigured = Boolean(userPoolId && userPoolClientId);

if (isAuthConfigured) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
      },
    },
  });
}
