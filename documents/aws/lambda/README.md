# AWS Lambda with a React application

Lambda runs trusted backend code. The React app must call Lambda through an
authorized API; never expose AWS credentials or invoke a privileged function
using credentials bundled into the browser.

## 1. Select the integration

- **AppSync:** use a DynamoDB resolver directly when the operation is a simple
  GraphQL read/write. Add Lambda only for custom business logic or integrations.
- **API Gateway:** use Lambda for a REST endpoint or server-side processing.

This repository's alternative REST endpoint uses a Python 3.12 Lambda behind
API Gateway. AppSync reads DynamoDB directly.

## 2. Write a handler

A minimal Node.js HTTP API Lambda shape:

```js
export const handler = async (event) => {
  try {
    const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (!userId) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
    }

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Authorized' }),
    };
  } catch (error) {
    console.error('Request failed', { name: error.name });
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
```

Never return stack traces, database errors, credentials, or internal
configuration to the browser. Log safe structured context; do not log tokens,
passwords, or sensitive request bodies.

## 3. Use an execution role

Give each function a dedicated execution role:

- Trust principal: `lambda.amazonaws.com`.
- Grant only the resource actions required by the handler.
- Scope DynamoDB permissions to the table ARN; scope S3 to a required bucket
  prefix.
- Grant CloudWatch Logs stream/write access only to the function's log group.
- Read backend secrets from Secrets Manager/Parameter Store through that role;
  never hard-code them.

The policy in `infrastructure/products-api.yaml` gives the products handler
table-scoped `Scan` and CloudWatch logging permissions.

## 4. Deploy and invoke through API Gateway

CloudFormation defines the Lambda, execution role, API integration, route,
JWT authorizer and log groups. Deploy with a reviewed CloudFormation changeset.
API Gateway validates Cognito tokens before invoking Lambda. The function
should still validate the claims it uses for authorization.

## 5. Configure logs and monitoring

Lambda writes stdout/stderr to CloudWatch Logs when its role permits it. Set
log retention and avoid unbounded retention. Add metrics/alarms for errors,
throttles, duration and concurrency. Use structured log records and correlation
IDs to relate a request to API Gateway logs.

For this project, inspect
`/aws/lambda/MyReactPracticeCodeBaseProductsApi` in `ap-south-1`.

## 6. Test

- Unit test handler validation and error mapping.
- Test authorization failure and success through API Gateway.
- Test invalid inputs and DynamoDB failures.
- Verify logs contain diagnostics but no tokens or personal data.
- Check function timeout, memory and concurrency for expected load.

## References

- [Lambda developer guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- [Lambda execution role](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)
- [Node.js Lambda handler](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html)
