# AWS AppSync GraphQL with React and DynamoDB

The default product data path in this app is an AppSync GraphQL API protected
by the Cognito User Pool and backed by DynamoDB.

## 1. Create/configure Cognito first

Create a Cognito User Pool and a public app client without a client secret.
Configure email sign-in and confirmation if required. Record the pool ID,
region and client ID. See [Cognito](../cognito/README.md).

## 2. Define a GraphQL schema

The deployed project schema is intentionally small:

```graphql
type Product {
  id: Int!
  title: String!
  description: String!
  availabilityStatus: String
  thumbnail: String!
}

type Query {
  listProducts: [Product!]!
}
```

Extend the schema only when the frontend needs additional fields. Do not expose
all DynamoDB attributes by default.

## 3. Configure AppSync authorization and data source

The CloudFormation template creates:

- An AppSync API with `AMAZON_COGNITO_USER_POOLS` authentication.
- A Cognito User Pool config for the existing pool.
- A DynamoDB data source using an AppSync IAM role.
- A `Query.listProducts` resolver connected to the DynamoDB table.

The role has table-scoped read permission. The API does not expose DynamoDB
credentials to the client. Review and deploy the stack:

```sh
aws cloudformation validate-template \
  --template-body file://infrastructure/products-api.yaml \
  --region ap-south-1

aws cloudformation deploy \
  --template-file infrastructure/products-api.yaml \
  --stack-name MyReactPracticeCodeBaseProducts \
  --parameter-overrides UserPoolId=POOL_ID UserPoolClientId=CLIENT_ID \
  --capabilities CAPABILITY_IAM \
  --region ap-south-1
```

Retrieve the `ProductsGraphQLUrl` output. The template's resolver uses DynamoDB
`Scan` for this small sample. For larger data, add a paginated `Query` resolver
and key/index design instead.

## 4. Configure Amplify JS v6

```js
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_WEB_CLIENT_ID,
    },
  },
  API: {
    GraphQL: {
      endpoint: import.meta.env.VITE_AWS_APPSYNC_GRAPHQL_URL,
      region: 'ap-south-1',
      defaultAuthMode: 'userPool',
    },
  },
});
```

The project derives region from the User Pool ID and conditionally configures
the GraphQL endpoint in `src/auth/authConfig.js`. Keep this setup before
`generateClient` requests.

## 5. Query from React

```js
import { generateClient } from 'aws-amplify/api';

const client = generateClient();
const query = /* GraphQL */ `
  query ListProducts {
    listProducts {
      id
      title
      description
      availabilityStatus
      thumbnail
    }
  }
`;

const { data, errors } = await client.graphql({
  query,
  authMode: 'userPool',
});
if (errors?.length) throw new Error(errors.map((error) => error.message).join('; '));
const products = data.listProducts;
```

The repository's callback performs this request and reports success/error to
the products repository. Run it from the authenticated view; unauthenticated
requests should be rejected.

## 6. Configure the React endpoint

Set `VITE_AWS_APPSYNC_GRAPHQL_URL` in local `.env.development` and
`.env.production`, then configure the same variable in each Amplify Hosting
branch. Vite embeds values at build time, so rebuild after updates. The API URL
and IDs are public identifiers, not credentials.

Set `isAWSAppSync = true` to use GraphQL. Set it to false to select the REST
path or DummyJSON via `isAWSNetworking`.

## 7. Test and monitor

- Sign in with a confirmed Cognito user.
- Query `listProducts` in the app or AppSync console.
- Confirm unauthenticated requests are denied.
- Check AppSync request metrics and X-Ray traces if enabled.
- Check DynamoDB throttles/errors and AppSync resolver errors.
- Never log authorization headers or JWTs.

## References

- [AppSync developer guide](https://docs.aws.amazon.com/appsync/latest/devguide/what-is-appsync.html)
- [Amplify GraphQL API client](https://docs.amplify.aws/react/build-a-backend/data/connect-to-API/)
- [AppSync authorization](https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html)
