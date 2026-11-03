import { Amplify } from 'aws-amplify';

const userPoolId = import.meta.env.VITE_USER_POOL_ID?.trim();
const userPoolClientId =
  import.meta.env.VITE_USER_POOL_WEB_CLIENT_ID?.trim() ||
  import.meta.env.VITE_USER_POOL_CLIENT_ID?.trim();
const appsyncGraphqlUrl = import.meta.env.VITE_AWS_APPSYNC_GRAPHQL_URL?.trim();

export const isAuthConfigured = Boolean(userPoolId && userPoolClientId);

if (isAuthConfigured) {
  const amplifyConfig = {
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
      },
    },
  };

  if (appsyncGraphqlUrl) {
    amplifyConfig.API = {
      GraphQL: {
        endpoint: appsyncGraphqlUrl,
        region: userPoolId.split('_')[0],
        defaultAuthMode: 'userPool',
      },
    };
  }

  Amplify.configure({
    ...amplifyConfig,
  });
}
