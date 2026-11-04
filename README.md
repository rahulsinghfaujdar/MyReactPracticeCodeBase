# My React Practice Code Base

A React product-list application with Cognito authentication and AWS-backed
product data. It supports switching between AWS AppSync GraphQL, an API Gateway
REST endpoint, and DummyJSON.

## Contents

- [Features and use cases](#features-and-use-cases)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Application modules and logic](#application-modules-and-logic)
- [Data-source switches](#data-source-switches)
- [Local development](#local-development)
- [AWS infrastructure and sample data](#aws-infrastructure-and-sample-data)
- [Configuration](#configuration)
- [Build and deploy](#build-and-deploy)
- [Logging and troubleshooting](#logging-and-troubleshooting)
- [Security notes](#security-notes)
- [Step-by-step AWS service guides](#step-by-step-aws-service-guides)

## Features and use cases

- **Create an account:** A visitor signs up with an email and password. Cognito
  sends an email confirmation code.
- **Confirm email:** The user submits the code to activate the account.
- **Sign in and sign out:** Cognito authenticates the user. The product list is
  only shown while the user is signed in.
- **Browse products:** The app loads products from the selected data source and
  displays each product's image, title, and description.
- **Expand a product:** Selecting a product toggles its description.
- **Search products:** The search input filters product titles after a
  300-millisecond debounce.
- **Switch backends:** Developers can select AppSync, API Gateway, or
  DummyJSON by changing the source switches.
- **Monitor requests:** API Gateway and Lambda runtime logs are available in
  CloudWatch Logs. CloudTrail audit events are also delivered to CloudWatch
  Logs, with the existing S3 archive retained.

## Technology stack

| Area | Technology |
| --- | --- |
| UI | React 19, JSX, React Hooks |
| Frontend build and development | Vite 5, npm |
| Authentication | Amazon Cognito User Pool, AWS Amplify Auth v6 |
| GraphQL data API | AWS AppSync, Amplify GraphQL client |
| Alternative AWS REST API | Amazon API Gateway HTTP API |
| Data store | Amazon DynamoDB, on-demand billing |
| REST compute | AWS Lambda, Python 3.12 |
| Infrastructure as code | AWS CloudFormation |
| Static hosting | AWS Amplify Hosting |
| Operations and logs | Amazon CloudWatch Logs, CloudWatch Logs Insights, AWS CloudTrail |
| Sample data loading | Python 3 and AWS CLI |
| External development data source | DummyJSON |

## Architecture

### Default products path: AppSync

1. Amplify Auth signs in the user against a Cognito User Pool.
2. The React API callback uses Amplify's GraphQL client with `userPool`
   authorization.
3. AppSync validates the Cognito User Pool token.
4. The `Query.listProducts` resolver scans the products DynamoDB table and
   returns the fields requested by the GraphQL query.
5. React stores the result in the products repository and renders the list.

```text
Browser (React)
  ├── Amplify Auth ──> Cognito User Pool
  └── Amplify GraphQL client ── ID token ──> AppSync
                                             └── DynamoDB products table
```

### Alternative AWS REST path

```text
Browser (React) ── Cognito ID token ──> API Gateway HTTP API
                                          └── Lambda (Python)
                                                └── DynamoDB products table
```

The REST API is also Cognito-protected. API Gateway access logs and Lambda
runtime logs are written to CloudWatch Logs.

### Authentication, hosting, and audit

- Cognito provides email/password sign-up, email-code confirmation, sign-in,
  and sign-out. The frontend uses a public app client without a client secret.
- AWS Amplify Hosting builds the React/Vite app from its connected repository.
  `VITE_` variables are embedded during the build.
- The standard multi-region CloudTrail trail records AWS management events,
  including Cognito events. It delivers those events to CloudWatch Logs and
  retains its existing S3 log archive. CloudTrail is the audit event source;
  CloudWatch Logs is used to search and analyze them. CloudTrail Lake is not
  used.
- No Cognito Identity Pool is required for this app's User Pool and AppSync
  User Pool authorization flow.

## Project structure

```text
.
├── index.html                         # Vite HTML entry
├── index.jsx                          # React root mount
├── public/
│   └── bg_react.jpg                   # Public authentication background
├── infrastructure/
│   └── products-api.yaml              # DynamoDB, AppSync, REST API, Lambda, logs
├── scripts/
│   └── seed_products.py               # Loads the sample JSON into DynamoDB
├── src/
│   ├── App.jsx                        # Application shell and route-less view tree
│   ├── assets/json/
│   │   └── sample_products_list.json  # Sample product data
│   ├── auth/
│   │   ├── authConfig.js              # Amplify Cognito and AppSync configuration
│   │   ├── AuthForm.jsx                # Sign-in, sign-up, email confirmation
│   │   └── AuthGate.jsx                # Session check, protected content, sign-out
│   ├── components/
│   │   ├── EmptyMessage.jsx            # Empty search/list message
│   │   ├── ErrorMessage.jsx            # Data loading errors
│   │   ├── Loading.jsx                 # Loading state
│   │   ├── SearchInput.jsx             # Product search field
│   │   └── products_list/
│   │       ├── ProductsList.jsx        # Product collection
│   │       └── ProductsListItem.jsx    # Individual expandable product
│   ├── context/
│   │   └── ProductsListContext.jsx     # Selected product state
│   ├── network/
│   │   ├── ApiCallbacks.js             # AppSync, API Gateway, and REST requests
│   │   └── Constants.js                # URLs and data-source switches
│   ├── repositories/
│   │   └── ProductsListRepo.jsx        # Fetch lifecycle, filtering, UI state
│   └── views/
│       └── ProductsListView.jsx        # Products loading/error/list view
├── .env.example                        # Environment variable template
├── package.json
└── README.md
```

`node_modules/`, `dist/`, and `.env*` files are ignored by Git. Use `.env.example`
as a reference and keep real local configuration in ignored environment files.

## Application modules and logic

### Entry and app shell

- `index.html` loads `index.jsx`.
- `index.jsx` mounts the React application into `#root`.
- `App.jsx` wraps the product view in `AuthGate`, provides the product context,
  and lazy-loads `ProductsListView`.

### Authentication

- `authConfig.js` reads the Cognito User Pool ID and public app client ID and
  configures Amplify Auth. When configured, it also sets AppSync's GraphQL
  endpoint and User Pool authorization mode.
- `AuthGate.jsx` checks the existing session on startup, displays the sign-in
  form when there is no user, and only renders the product view for a signed-in
  user. It also handles sign-out.
- `AuthForm.jsx` calls Amplify Auth `signUp`, `confirmSignUp`, `signIn`, and
  `getCurrentUser`. It displays validation, confirmation, and authentication
  feedback.

### Products

- `ProductsListRepo.jsx` owns loading, error, product, search, and selected
  product state. It calls `getProductsListfromApi` on mount and filters titles
  after a 300 ms debounce.
- `ApiCallbacks.js` runs the configured data-source request, checks failures,
  and reports products or errors using the provided callbacks.
- `ProductsListContext.jsx` shares the selected product with list components.
- `ProductsListView.jsx` chooses the loading, error, search, and list UI.
- `ProductsList.jsx` renders the collection; `ProductsListItem.jsx` renders an
  item and toggles its description.

### AWS resources

- `infrastructure/products-api.yaml` defines the DynamoDB table, Cognito
  User Pool-authorized AppSync GraphQL API and DynamoDB resolver, plus the
  Cognito-protected API Gateway/Lambda alternative and CloudWatch log groups.
- `scripts/seed_products.py` validates unique product IDs and writes the JSON
  file to DynamoDB in batches of up to 25 items, retrying unprocessed writes.
- `src/assets/json/sample_products_list.json` is the canonical sample data.

## Data-source switches

Edit these constants in `src/network/Constants.js`; they are code switches,
not environment variables:

| `isAWSAppSync` | `isAWSNetworking` | Source |
| --- | --- | --- |
| `true` | Any value | Cognito-protected AppSync GraphQL backed by DynamoDB |
| `false` | `true` | Cognito-protected API Gateway HTTP API backed by Lambda and DynamoDB |
| `false` | `false` | DummyJSON REST API |

AppSync is currently the default. The callback queries `listProducts` for
`id`, `title`, `description`, `availabilityStatus`, and `thumbnail`. The REST
fallbacks use their configured URL and expect a JSON response with a
`products` array.

## Local development

Requirements: Node.js/npm, Python 3 for the seeding script, and AWS CLI only
when operating AWS resources.

1. Install frontend dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env.development` and set your Cognito User Pool ID,
   public app client ID, and API endpoints. Do not add a Cognito client secret
   or AWS credentials to frontend environment variables.
3. Start Vite:

   ```sh
   npm run dev
   ```

4. Open the local URL printed by Vite. Sign in with a confirmed Cognito account
   to access the products view.

Useful scripts:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite in development mode |
| `npm run build` | Create the production build |
| `npm run build:dev` | Create a development-mode build |
| `npm run build:prod` | Create a production-mode build |
| `npm run preview` | Preview the production build locally |
| `npm start` | Alias for the Vite preview server |

## AWS infrastructure and sample data

The deployed resources are in `ap-south-1`. The CloudFormation stack name is
`MyReactPracticeCodeBaseProducts`; the products table is
`MyReactPracticeCodeBaseProducts`. Deploy or update the stack with the existing
Cognito User Pool and public app client:

```sh
aws cloudformation deploy \
  --template-file infrastructure/products-api.yaml \
  --stack-name MyReactPracticeCodeBaseProducts \
  --parameter-overrides \
    UserPoolId=YOUR_USER_POOL_ID \
    UserPoolClientId=YOUR_USER_POOL_WEB_CLIENT_ID \
  --capabilities CAPABILITY_IAM \
  --region ap-south-1
```

Load or refresh the table from the sample JSON:

```sh
python3 scripts/seed_products.py --region ap-south-1
```

Read stack endpoints:

```sh
aws cloudformation describe-stacks \
  --stack-name MyReactPracticeCodeBaseProducts \
  --region ap-south-1 \
  --query 'Stacks[0].Outputs'
```

The table uses on-demand billing and has a CloudFormation retain policy. The
AppSync resolver returns product data directly from DynamoDB; the alternative
REST API uses Lambda to scan the same table.

## Configuration

| Variable | Purpose |
| --- | --- |
| `VITE_USER_POOL_ID` | Cognito User Pool ID; its prefix determines the region |
| `VITE_USER_POOL_WEB_CLIENT_ID` | Public Cognito app client ID; no client secret |
| `VITE_AWS_APPSYNC_GRAPHQL_URL` | AppSync GraphQL endpoint |
| `VITE_AWS_PRODUCTS_API_URL` | API Gateway REST endpoint |
| `VITE_GET_PRODUCTS_LIST` | Alternative REST products URL |
| `VITE_BASE_URL` | Base URL used to construct the default products URL |

For local development, define these in `.env.development`. Production builds
can use `.env.production`. Set the corresponding build-time variables in the
Amplify app's branch environment settings as well. After changing an
environment variable, rebuild/redeploy the frontend because Vite embeds
`VITE_` values into the generated JavaScript.

All values exposed to a Vite frontend are public. Never put passwords, AWS
access keys, Cognito app client secrets, or other server credentials in these
variables.

## Build and deploy

Build and locally preview the production frontend:

```sh
npm run build
npm run preview
```

Amplify Hosting is connected to the repository and automatically builds the
configured branch when changes are pushed. Ensure the Amplify branch has the
required `VITE_` environment variables before its build. A local build passing
does not deploy the code; push the intended commit to the connected branch to
update the hosted frontend.

## Logging and troubleshooting

Use **Asia Pacific (Mumbai) / `ap-south-1`** for the application's AWS
resources.

| CloudWatch log group | Contents |
| --- | --- |
| `/aws/apigateway/MyReactPracticeCodeBaseProductsApi` | REST API request ID, route, status, response size, source IP, Cognito subject, and integration errors |
| `/aws/lambda/MyReactPracticeCodeBaseProductsApi` | Lambda runtime and error logs |
| `aws-cloudtrail-logs-*` | CloudTrail AWS management/audit events, including Cognito events |

The API Gateway and Lambda log groups retain logs for 14 days. The API access
log format does not record authorization headers or tokens. The standard
CloudTrail trail delivers audit events to CloudWatch Logs and retains an S3
archive; it can take a few minutes for events to appear.

In **CloudWatch → Logs Insights**, select the relevant log group and run:

API Gateway requests:

```text
fields @timestamp, requestId, routeKey, status, sourceIp, authorizerSubject, integrationError
| sort @timestamp desc
| limit 100
```

Cognito audit events from the CloudTrail log group:

```text
fields @timestamp, eventSource, eventName, eventTime, errorCode, errorMessage
| filter eventSource = "cognito-idp.amazonaws.com"
| sort @timestamp desc
| limit 100
```

For frontend request failures, use the browser's Developer Tools **Network**
and **Console** panels. The products API is Cognito-protected: sign in first,
and verify the User Pool ID, public client ID, AppSync URL, and Amplify branch
environment variables if requests fail.

## Security notes

- AppSync and the REST API require a Cognito User Pool token.
- The AppSync role only has DynamoDB `Scan` permission on the products table.
- The Lambda role only has DynamoDB `Scan` on that table and permission to
  write its CloudWatch logs.
- The DynamoDB table is not exposed directly to the browser.
- The identity pool is not required for this User Pool-authenticated flow.
- Do not log or share passwords, confirmation codes, access tokens, ID tokens,
  or AWS credentials.

## Step-by-step AWS service guides

Start with the [end-to-end AWS integration runbook](./documents/aws/README.md)
for project wiring, AWS Console setup, CLI commands, and runtime requests/events.
The [AWS implementation guide index](./documents/README.md) links to detailed
walkthroughs for Amplify Hosting, Cognito, S3, DynamoDB, AppSync, Lambda,
CloudFront, CloudWatch, CloudTrail, IAM, and API Gateway. Each guide
distinguishes services used by this project from optional extensions.
