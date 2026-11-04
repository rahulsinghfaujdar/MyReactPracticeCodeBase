# AWS integration runbook

This runbook connects the AWS setup recorded in this repository to the React
application. It covers the project-level wiring, AWS Console setup, CLI
commands, and the requests/events produced at runtime.

It describes the configuration in this repository; it does not verify the
current state of any AWS account. Run commands only in the intended account
and region, and review CloudFormation changes before applying them.

## What is integrated

| Service/tool | Project use | Status |
| --- | --- | --- |
| Amazon Cognito User Pool | Email/password sign-up, confirmation and sign-in; supplies JWTs | Used |
| AWS Amplify JavaScript v6 | Configures Cognito and sends authenticated GraphQL requests | Used |
| AWS AppSync | Default `listProducts` GraphQL endpoint | Used |
| Amazon DynamoDB | Product table behind AppSync and the REST alternative | Used |
| Amazon API Gateway HTTP API | Optional Cognito-protected `GET /products` route | Deployed alternative |
| AWS Lambda (Python 3.12) | Reads products for the REST alternative | Deployed alternative |
| AWS CloudFormation | Defines the table, APIs, roles, function and log groups | Used |
| AWS Amplify Hosting | Builds and hosts the Vite frontend from a Git branch | Used |
| AWS CLI and Python seeder | Deploys/inspects resources and loads sample products | Used by operators |
| Amazon CloudWatch Logs | API Gateway and Lambda logs; CloudTrail delivery/search | Used |
| AWS CloudTrail | AWS account audit trail, with CloudWatch and S3 destinations documented for this project | Account-level operations |
| IAM | Service roles and operator/deployment permissions | Used |
| Amazon S3 / CloudFront | Object storage and separate CDN are not in the current app request path | Optional |
| Cognito Identity Pool | Not needed for User Pool-token access to AppSync or API Gateway | Not used |

The app's default product flow is:

```text
React app -> Cognito User Pool sign-in -> ID token -> AppSync
                                                -> DynamoDB products table
```

The alternate REST flow is:

```text
React app -> Cognito User Pool sign-in -> ID token -> API Gateway HTTP API
                                                -> Lambda -> DynamoDB
```

Amplify Hosting deploys the frontend; it is separate from the backend resources
in the CloudFormation stack.

## 1. Prepare the project and AWS access

Use the repository root as the working directory. Node.js/npm are needed for
the app, Python 3 for the sample-data script, and AWS CLI for AWS operations.
Use an approved short-lived AWS CLI profile/SSO role with permissions scoped
to the resources being managed; do not put AWS credentials in React or a
`VITE_` variable.

```sh
npm install
aws --version
aws configure sso --profile YOUR_PROFILE
aws sso login --profile YOUR_PROFILE
aws sts get-caller-identity --profile YOUR_PROFILE
export AWS_PROFILE=YOUR_PROFILE
```

The stack and example commands use **Asia Pacific (Mumbai), `ap-south-1`**.
Pass the same region to the CLI commands and use the matching region in the
AWS Console. The commands below omit `--profile`; either add
`--profile YOUR_PROFILE` to each AWS CLI command or set
`AWS_PROFILE=YOUR_PROFILE` in your shell first.

## 2. Create the Cognito User Pool in the AWS Console

The CloudFormation template expects an existing User Pool and public app
client; it does not create Cognito resources.

1. In **Amazon Cognito → User pools**, create or select the application pool.
2. Configure email sign-in and the sign-up/email-confirmation behavior needed
   by the app.
3. Create a browser app client with **no client secret**. Enable a supported
   public-client sign-in flow.
4. Record the User Pool ID, its region, and the app client ID.
5. Create/confirm a test account using the pool's configured email process.

Copy the placeholder environment file for local development and fill in the
public identifiers:

```sh
cp .env.example .env.development
```

```dotenv
VITE_USER_POOL_ID=ap-south-1_example
VITE_USER_POOL_WEB_CLIENT_ID=public-client-id
```

`src/auth/authConfig.js` reads those variables and calls `Amplify.configure`.
`src/auth/AuthForm.jsx` calls Amplify Auth `signUp`, `confirmSignUp`, `signIn`,
and `getCurrentUser`; `src/auth/AuthGate.jsx` checks the current session and
provides sign-out. Do not log passwords, confirmation codes, or tokens.

## 3. Provision the AWS backend

`infrastructure/products-api.yaml` defines these resources:

- DynamoDB table `MyReactPracticeCodeBaseProducts`, on-demand billing, keyed
  by numeric `id`, with a retain policy.
- AppSync GraphQL API authenticated by the supplied Cognito User Pool, its
  DynamoDB data source and the `Query.listProducts` resolver.
- An AppSync service role scoped to read the products table.
- The REST alternative: API Gateway HTTP API, Cognito JWT authorizer,
  `GET /products` route, Lambda integration and invoke permission.
- Python 3.12 Lambda `MyReactPracticeCodeBaseProductsApi` and a role scoped to
  scan the products table and write its function logs.
- API Gateway and Lambda log groups, with 14-day retention, and AppSync X-Ray
  tracing.

### AWS Console workflow

1. Open **CloudFormation → Stacks → Create stack → With new resources
   (standard)**.
2. Upload `infrastructure/products-api.yaml` and enter a stack name such as
   `MyReactPracticeCodeBaseProducts`.
3. Supply the existing Cognito User Pool ID and public app client ID as the
   `UserPoolId` and `UserPoolClientId` parameters.
4. Review the change set, acknowledge IAM resource creation, and create the
   stack. Wait for `CREATE_COMPLETE` (or `UPDATE_COMPLETE`).
5. Open the stack's **Outputs** tab and copy the GraphQL URL, REST URL, and
   table name. These are endpoint/configuration values, not credentials.

### AWS CLI workflow

Validate and deploy the same template with an operator/deployment identity
that can create the resources and IAM roles:

```sh
aws cloudformation validate-template \
  --template-body file://infrastructure/products-api.yaml \
  --region ap-south-1

aws cloudformation deploy \
  --template-file infrastructure/products-api.yaml \
  --stack-name MyReactPracticeCodeBaseProducts \
  --parameter-overrides \
    UserPoolId=YOUR_USER_POOL_ID \
    UserPoolClientId=YOUR_USER_POOL_WEB_CLIENT_ID \
  --capabilities CAPABILITY_IAM \
  --region ap-south-1

aws cloudformation describe-stacks \
  --stack-name MyReactPracticeCodeBaseProducts \
  --region ap-south-1 \
  --query 'Stacks[0].Outputs'
```

Review the proposed resources/changeset before production updates. The stack
creates both product API paths, although the frontend selects one path at a
time.

### AWS Console verification after deployment

Use the Console to confirm that the stack created and connected the expected
resources:

| Console page | What to check |
| --- | --- |
| **CloudFormation → Stacks → MyReactPracticeCodeBaseProducts** | `CREATE_COMPLETE`/`UPDATE_COMPLETE`, stack events, and the GraphQL URL, REST URL, and table outputs |
| **DynamoDB → Tables → MyReactPracticeCodeBaseProducts → Explore table items** | Table exists in `ap-south-1`, `id` is the partition key, and seeded product items appear |
| **AWS AppSync → APIs → MyReactPracticeCodeBaseProducts** | Cognito User Pool authorization, `Product`/`Query` schema, DynamoDB data source, and `Query.listProducts` resolver |
| **API Gateway → APIs → MyReactPracticeCodeBaseProductsApi** | `GET /products` route, Cognito JWT authorizer, Lambda integration, `$default` stage, and access-log destination |
| **Lambda → Functions → MyReactPracticeCodeBaseProductsApi** | Python 3.12 runtime, execution role, `PRODUCTS_TABLE_NAME`, and recent invocations when REST mode is exercised |
| **IAM → Roles** | AppSync and Lambda trust relationships and resource-scoped table/log permissions; deployment identity has only the required deployment permissions |
| **CloudWatch → Logs → Log groups** | API Gateway and Lambda log groups, retention, and recent REST requests/errors |
| **CloudTrail → Trails / Event history** | Trail status, regions, event selectors and destinations; verify whether the event types you need are included |

Use the AppSync query editor or the signed-in app to run `listProducts`.
CloudFormation enables AppSync X-Ray tracing, but this template does not
configure AppSync CloudWatch resolver logging. For the REST path, use the app
to exercise the Cognito-authorized route, then inspect API Gateway and Lambda
logs.

## 4. Load the sample DynamoDB items

The canonical seed data is `src/assets/json/sample_products_list.json`.
`scripts/seed_products.py` validates a non-empty products array and unique
IDs, converts JSON values to DynamoDB attributes, writes batches of up to 25,
and retries unprocessed writes with backoff. The AWS CLI caller needs
`dynamodb:BatchWriteItem` on this table.

```sh
python3 scripts/seed_products.py --region ap-south-1
```

To select another authorized table or JSON file:

```sh
python3 scripts/seed_products.py \
  --region ap-south-1 \
  --table MyReactPracticeCodeBaseProducts \
  --file src/assets/json/sample_products_list.json
```

The script sends DynamoDB `BatchWriteItem` requests; it does not create
resources or configure the browser. Confirm the target account and table before
running it, especially if using production data.

## 5. Connect the project to the deployed endpoints

Set the endpoint values in `.env.development` for local work and in the
appropriate production environment file/build environment for deployment:

```dotenv
VITE_USER_POOL_ID=YOUR_USER_POOL_ID
VITE_USER_POOL_WEB_CLIENT_ID=YOUR_USER_POOL_WEB_CLIENT_ID
VITE_AWS_APPSYNC_GRAPHQL_URL=YOUR_PRODUCTS_GRAPHQL_URL
VITE_AWS_PRODUCTS_API_URL=YOUR_PRODUCTS_REST_URL
```

Use the exact outputs from CloudFormation. Vite embeds `VITE_` values into the
public browser bundle; never put access keys, app client secrets, or other
server credentials there.

The current source switches in `src/network/Constants.js` are:

| `isAWSAppSync` | `isAWSNetworking` | Request path |
| --- | --- | --- |
| `true` | Any value | AppSync GraphQL (current default) |
| `false` | `true` | API Gateway HTTP API and Lambda |
| `false` | `false` | DummyJSON |

`src/network/ApiCallbacks.js` uses Amplify's GraphQL client with
`authMode: 'userPool'` for AppSync. In REST mode, it gets the Cognito ID token
with `fetchAuthSession()` and sends it in the `Authorization` header. The
browser never accesses DynamoDB directly.

Start and build the app:

```sh
npm run dev
npm run build
npm run preview
```

Sign in with a confirmed Cognito user and verify that products load. For REST
mode, set `isAWSAppSync = false` and `isAWSNetworking = true`; restore the
AppSync switch when finished testing if that should remain the default.

## 6. Host the frontend with Amplify

1. Push the repository to a Git provider supported by Amplify.
2. In **AWS Amplify → Create new app → Host web app**, connect the repository
   and select the intended branch.
3. Set the build command to `npm run build` and the artifact directory to
   `dist` if Amplify does not detect the Vite settings automatically.
4. In the Amplify app's **Hosting → Environment variables**, add the Cognito
   IDs and the endpoint(s) needed by that branch.
5. Save the settings and run/re-run the branch build. Check **Build history**
   and load the deployed URL to test sign-in and product loading.

A push to the connected branch triggers an Amplify build and deployment.
Changing an environment variable requires a new build because Vite substitutes
the value at build time. Keep development and production branches pointed at
their matching backend resources.

## 7. Runtime requests and events

| User/operator action | Request or event | Result to verify |
| --- | --- | --- |
| Submit sign-up form | Cognito `signUp` | User is created; confirmation is required according to pool settings |
| Submit email code | Cognito `confirmSignUp` | User becomes confirmed |
| Sign in / restore session / sign out | Amplify Auth `signIn`, `getCurrentUser`, `signOut` | Authenticated UI is shown only for a valid session |
| Open product list (default) | GraphQL `Query.listProducts` to AppSync | Cognito User Pool token is checked; resolver scans DynamoDB and returns products |
| Open product list (REST switch) | `GET /products` with the Cognito ID token | API Gateway JWT authorizer validates the token; Lambda scans DynamoDB |
| Deploy or update backend | CloudFormation stack create/update | Resources reach `CREATE_COMPLETE` or `UPDATE_COMPLETE`; inspect stack outputs/events |
| Push to connected hosting branch | Amplify branch build/deploy | Build succeeds and hosted app uses branch environment values |
| Seed/refresh sample data | DynamoDB `BatchWriteItem` | Script reports number of products written |

CloudTrail records AWS account activity according to the trail's region,
management/data event selectors, and destinations. Do not assume every
Cognito sign-in or application request is present in CloudTrail; inspect the
trail configuration and use API/runtime logs for application request
diagnostics. This project does not define EventBridge rules or event-triggered
AWS workflows; the triggers listed above are user actions, Git pushes, stack
operations, and explicit CLI commands.

## 8. Verify and troubleshoot

Inspect stack state and outputs:

```sh
aws cloudformation describe-stacks \
  --stack-name MyReactPracticeCodeBaseProducts \
  --region ap-south-1 \
  --query 'Stacks[0].[StackStatus,Outputs]'
```

Inspect recent API Gateway or Lambda log events when the corresponding REST
path is being used:

```sh
aws logs tail /aws/apigateway/MyReactPracticeCodeBaseProductsApi \
  --since 1h --region ap-south-1

aws logs tail /aws/lambda/MyReactPracticeCodeBaseProductsApi \
  --since 1h --region ap-south-1
```

In the Console, use **CloudWatch → Logs Insights** with the corresponding
log group. The API access log includes request ID, route, status, response
length, source IP, Cognito subject, and integration error; it intentionally
does not include the Authorization header. AppSync request metrics and X-Ray
traces are available where the configured instrumentation captures them.
Resolver-level CloudWatch logging must be enabled separately if needed. Use
the browser Developer Tools **Network** and **Console** panels for frontend
failures.

Common checks:

- `401`/`403`: confirm the user is signed in, the User Pool region/ID and
  client ID match, and the API authorizer audience/issuer matches the pool.
- Missing AppSync data: check the CloudFormation `ProductsGraphQLUrl` output,
  `VITE_AWS_APPSYNC_GRAPHQL_URL`, AppSync User Pool configuration, and the
  `listProducts` resolver.
- REST request failure: check the REST URL, HTTP API route/stage, CORS
  configuration, JWT authorizer, Lambda invocation permission and function
  logs.
- Empty data: check the DynamoDB table and seed-script target region/table.
- Hosted app still uses old settings: verify branch environment variables and
  start a new Amplify build.

The existing CloudTrail trail and S3 log archive are account audit/retention
destinations, not the product API's runtime data store. Search delivered
CloudTrail events in CloudWatch Logs Insights after allowing time for delivery.
Review the [operations guide](./operations/README.md) for example queries.

## 9. Optional AWS services and boundaries

- **S3:** the app currently serves `public/bg_react.jpg` from its frontend
  build; it does not make browser-to-S3 upload/download calls. The S3 guide
  covers adding private object storage. Keep account/bucket public access
  blocked and use a backend or carefully scoped Identity Pool permissions.
- **CloudFront:** no separate CloudFront distribution is part of the current
  product flow. Amplify Hosting distributes the static frontend; add another
  distribution only for a specific origin/caching requirement.
- **Cognito Identity Pool:** not required for Cognito User Pool JWT
  authorization to AppSync or API Gateway. Add one only if the browser truly
  needs temporary scoped AWS credentials, such as a designed direct S3 flow.
- **AWS SDK for JavaScript:** the frontend uses Amplify Auth and API packages;
  it does not use browser AWS access keys or call DynamoDB directly.

## Project history checked

The repository's AWS integration commit sequence records these milestones:

- `6d74e1b` — added the initial Amplify/Cognito and DynamoDB-backed product
  integration, sample data, and seeding script.
- `4227384` — moved the background image into `public/` for the frontend; the
  current app serves it through frontend hosting, not as an S3 API request.
- `6fd47c0` — corrected the configurable products API URL.
- `b5030c6` — added AppSync GraphQL as the default data path and added the
  CloudFormation-defined backend/API integration.
- `b96078c` — added the service-specific AWS guides and implementation index
  that this runbook links together.

The service-specific guides linked below include additional console and
implementation details for each service.

## Related guides

- [Amplify Hosting](./amplify/README.md)
- [Cognito](./cognito/README.md)
- [AppSync](./appsync/README.md)
- [DynamoDB](./dynamodb/README.md)
- [API Gateway](./api-gateway/README.md)
- [Lambda](./lambda/README.md)
- [IAM](./iam/README.md)
- [S3](./s3/README.md)
- [CloudFront, CloudWatch and CloudTrail](./operations/README.md)
