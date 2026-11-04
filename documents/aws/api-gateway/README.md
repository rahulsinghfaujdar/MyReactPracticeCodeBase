# Amazon API Gateway with React, Cognito and Lambda

This is the REST alternative to the default AppSync products path. It exposes
`GET /products`, validates a Cognito User Pool JWT, then invokes Lambda to read
the DynamoDB products table.

## 1. Create an HTTP API

The project's `infrastructure/products-api.yaml` creates an API Gateway v2
HTTP API, Lambda integration and `GET /products` route. HTTP APIs are a
lightweight choice for a straightforward JSON API.

Deploy with the existing Cognito pool and public client:

```sh
aws cloudformation deploy \
  --template-file infrastructure/products-api.yaml \
  --stack-name MyReactPracticeCodeBaseProducts \
  --parameter-overrides UserPoolId=POOL_ID UserPoolClientId=CLIENT_ID \
  --capabilities CAPABILITY_IAM \
  --region ap-south-1
```

Use CloudFormation rather than creating duplicate resources manually.

## 2. Add Cognito JWT authorization

Configure the HTTP API JWT authorizer with:

- Issuer: `https://cognito-idp.<region>.amazonaws.com/<user-pool-id>`
- Audience: the Cognito public app client ID.
- Identity source: `Authorization` header.

Attach the authorizer to protected routes. The frontend sends the signed-in
user's Cognito ID token as the Authorization value. Never accept a client
supplied user ID as proof of identity.

## 3. Implement and protect Lambda

API Gateway invokes Lambda through a resource permission scoped to the API,
route and method. Lambda uses its own IAM execution role to access DynamoDB.
Validate the authorizer claims used by business logic and return JSON with
appropriate status codes. Do not return stack traces or internal details.

## 4. Configure CORS

Allow only the origins and HTTP methods needed by the app. Permit the
`authorization` and `content-type` headers. CORS is a browser policy, not
authentication; the JWT authorizer remains required.

## 5. Configure logs

The `$default` stage sends structured access logs to
`/aws/apigateway/MyReactPracticeCodeBaseProductsApi`; Lambda logs go to
`/aws/lambda/MyReactPracticeCodeBaseProductsApi`. The access log format omits
the Authorization header and token.

Use CloudWatch Logs Insights to query requests by status, route, request ID or
integration error. Add alarms for 5xx rate and latency when appropriate.

## 6. Call from React

```js
import { fetchAuthSession } from 'aws-amplify/auth';

const { tokens } = await fetchAuthSession();
const idToken = tokens?.idToken?.toString();
if (!idToken) throw new Error('Sign in before loading products.');

const response = await fetch(import.meta.env.VITE_AWS_PRODUCTS_API_URL, {
  headers: { Authorization: idToken, Accept: 'application/json' },
});
if (!response.ok) throw new Error(`Products API failed: ${response.status}`);
const { products } = await response.json();
```

The app's `ApiCallbacks.js` implements this alternative path. Set
`isAWSAppSync = false` and `isAWSNetworking = true` in `Constants.js` to select
it. Both variables are source-code switches.

## 7. Test

- Missing/invalid token should return `401`/`403`.
- A confirmed signed-in user should receive JSON products.
- Verify browser CORS preflight and allowed origin.
- Inspect API Gateway access logs and Lambda logs.
- Never record JWTs in logs or analytics.

## References

- [API Gateway HTTP APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api.html)
- [JWT authorizers for HTTP APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html)
- [Amplify Auth session](https://docs.amplify.aws/react/build-a-backend/auth/connect-your-frontend/manage-user-sessions/)
