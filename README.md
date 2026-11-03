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
