# My React Practice Code Base

## AWS Cognito authentication

The app uses AWS Amplify Auth for email/password sign-up and sign-in. New accounts
must confirm their email with the code Cognito sends before signing in.

1. In AWS Cognito in `ap-south-1`, create a User Pool that allows self-service
   sign-up and uses email as the sign-in option. Require the email attribute and
   configure email verification with a code.
2. Create a public app client for the web app. Do not create a client secret.
   Enable the `ALLOW_USER_SRP_AUTH` sign-in flow.
3. Copy `.env.example` to `.env.development` for local work and replace
   `VITE_USER_POOL_ID` and `VITE_USER_POOL_WEB_CLIENT_ID` with the values from
   Cognito.
4. In the AWS Amplify app console, add those same two variables under the
   environment variables for the branch being deployed. Vite embeds `VITE_`
   variables at build time, so redeploy after changing them.

The User Pool ID contains its AWS region (for example,
`ap-south-1_Example123`), so no separate region variable is needed. The app
client ID is public configuration; never put AWS access keys or a Cognito app
client secret in frontend environment variables.

## Products API on AWS

The app's `isAWSNetworking` switch in `src/network/Constants.js` selects the
products data source. `true` uses the Cognito-protected API Gateway endpoint;
`false` uses the configured DummyJSON URL. The API reads all products from
DynamoDB and returns only the product fields displayed by the app.

Deploy the API and table in `ap-south-1` using the existing Cognito pool:

```sh
aws cloudformation deploy \
  --template-file infrastructure/products-api.yaml \
  --stack-name MyReactPracticeCodeBaseProducts \
  --parameter-overrides \
    UserPoolId=YOUR_USER_POOL_ID \
    UserPoolClientId=YOUR_USER_POOL_WEB_CLIENT_ID \
  --capabilities CAPABILITY_IAM \
  --region ap-south-1

python3 scripts/seed_products.py --region ap-south-1
aws cloudformation describe-stacks \
  --stack-name MyReactPracticeCodeBaseProducts \
  --region ap-south-1 \
  --query 'Stacks[0].Outputs'
```

Set `VITE_AWS_PRODUCTS_API_URL` to the `ProductsApiUrl` stack output in your
local `.env.development` and `.env.production`, and in the Amplify branch build
environment. Vite embeds this value at build time, so rebuild/redeploy the app
after changing it. The API requires a Cognito ID token; the app supplies it
from the current signed-in session. The DynamoDB table uses on-demand billing
and is retained when the stack is deleted.

## CloudWatch logging

CloudTrail Lake is not used. The existing standard CloudTrail trail delivers
AWS audit events to CloudWatch Logs and continues to archive them in S3.
CloudTrail is the event source; CloudWatch Logs is where those audit events are
stored and queried. Cognito sign-up and sign-in events can take several minutes
to arrive.

The products API stack also configures API Gateway access logs and Lambda
runtime logs in `ap-south-1`:

- `/aws/apigateway/MyReactPracticeCodeBaseProductsApi` — request ID, route,
  status, response size, source IP, Cognito subject, and integration errors.
- `/aws/lambda/MyReactPracticeCodeBaseProductsApi` — Lambda runtime/errors.
- The trail's configured `aws-cloudtrail-logs-*` group — Cognito and other AWS
  management audit events.

The API access and Lambda log groups retain logs for 14 days. The API access
format intentionally does not include request headers or authentication tokens.

Example CloudWatch Logs Insights queries:

```text
fields @timestamp, requestId, routeKey, status, sourceIp, authorizerSubject, integrationError
| sort @timestamp desc
| limit 100
```

```text
fields @timestamp, eventSource, eventName, eventTime, errorCode, errorMessage
| filter eventSource = "cognito-idp.amazonaws.com"
| sort @timestamp desc
| limit 100
```

Open **CloudWatch → Logs Insights**, select the relevant log group(s), select
region `ap-south-1`, and run the matching query.
