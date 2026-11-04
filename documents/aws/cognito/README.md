# Amazon Cognito: User Pools, Identity Pools and React authentication

This guide explains the two Cognito pool types and the User Pool flow used by
this application.

## 1. Choose the pool type

- **User Pool:** User directory and authentication. It issues JWTs (ID,
  access, and refresh tokens) and supports sign-up, confirmation, and sign-in.
- **Identity Pool:** Exchanges supported identities for temporary AWS
  credentials to access AWS services directly under IAM permissions.

This application uses a User Pool to sign users in. AppSync validates the User
Pool token. An Identity Pool is **not required** for this flow; enabling one
without correctly configured IAM roles can cause
`InvalidIdentityPoolConfigurationException`.

## 2. Create a User Pool

1. In the AWS Console, open **Amazon Cognito → User pools → Create user pool**.
2. Select email as the sign-in option. Configure self-service sign-up if users
   should create accounts.
3. Require and automatically verify the email attribute.
4. Set an appropriate password policy and email confirmation method.
5. Create a public app client for the browser:
   - Do not generate a client secret.
   - Enable a supported public-client flow such as SRP.
6. Record the User Pool ID, region, and public app client ID.

Avoid changing immutable pool choices after the pool contains users; some
settings require creating a new pool and migrating users.

## 3. Configure the React application

Use the public pool configuration in a local ignored environment file:

```dotenv
VITE_USER_POOL_ID=ap-south-1_example
VITE_USER_POOL_WEB_CLIENT_ID=public-client-id
```

Amplify v6 configuration used by this project:

```js
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_WEB_CLIENT_ID,
    },
  },
});
```

Configure Amplify once, before auth calls. This repo centralizes configuration
in `src/auth/authConfig.js` and imports it through the auth gate.

## 4. Sign up, confirm, sign in and sign out

The app's `src/auth/AuthForm.jsx` uses Amplify Auth. Core calls:

```js
import {
  confirmSignUp,
  getCurrentUser,
  signIn,
  signOut,
  signUp,
} from 'aws-amplify/auth';

const signup = await signUp({
  username: email,
  password,
  options: { userAttributes: { email } },
});

if (signup.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
  // Ask the user for the email verification code.
}

await confirmSignUp({ username: email, confirmationCode });
const result = await signIn({ username: email, password });
if (result.isSignedIn) {
  const user = await getCurrentUser();
}

await signOut();
```

Handle `nextStep`; sign-up may require confirmation and sign-in may require an
additional challenge. Do not log passwords, confirmation codes, tokens, or
complete Cognito responses containing credentials.

## 5. Gate protected UI and call APIs

`AuthGate.jsx` checks the current user when the app starts. It renders the auth
form until a user is signed in, then renders the products view. For AppSync,
the Amplify GraphQL client uses `authMode: 'userPool'`; Amplify attaches the
session token:

```js
import { generateClient } from 'aws-amplify/api';

const client = generateClient();
const result = await client.graphql({
  query: `query { listProducts { id title } }`,
  authMode: 'userPool',
});
```

Do not configure `identityPoolId` unless direct AWS credentials are needed.
For example, browser-to-S3 access requires a deliberately configured Identity
Pool, authenticated role, trust policy, and narrow S3 permissions. Do not grant
guest access for a signed-in-only application.

## 6. Environment separation and troubleshooting

Use distinct User Pools and app clients for development and production where
practical. Set the corresponding public IDs in each Amplify branch's build
environment. Vite reads them at build time.

- **Authentication not configured:** check User Pool ID and app client ID,
  spelling, region, and whether the frontend was rebuilt.
- **Invalid identity pool configuration:** remove Identity Pool configuration
  if this app only uses User Pool tokens; otherwise configure authenticated
  IAM roles first.
- **AppSync unauthorized:** verify the API User Pool region/ID, audience (app
  client ID), frontend token, and GraphQL auth mode.
- **Unconfirmed user:** submit the email confirmation code before signing in.

## References

- [Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Cognito Identity Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-identity.html)
- [Amplify Auth for React](https://docs.amplify.aws/react/build-a-backend/auth/)
