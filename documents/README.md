# AWS implementation guides

Step-by-step guides for building this React application with AWS services. The
guides use this repository's current React 19, Vite, and AWS Amplify JavaScript
v6 setup. Follow the links for the service or workflow you need.

## Guides

| Guide | Covers |
| --- | --- |
| [End-to-end AWS integration runbook](./aws/README.md) | Project and Console setup, CLI commands, runtime requests and verification |
| [Amplify](./aws/amplify/README.md) | Hosting, branches and multi-environment deployments, build variables, secrets |
| [Cognito](./aws/cognito/README.md) | User Pools, Identity Pools, email/password authentication and React |
| [S3](./aws/s3/README.md) | Public/private buckets, browser uploads/downloads and CloudFront delivery |
| [S3 static website deployment](./aws/s3/static-website/README.md) | Public S3 website hosting, website endpoint, policy, and 403/404 troubleshooting |
| [Private S3 + CloudFront deployment](./aws/s3/cloudfront-private/README.md) | OAC, private bucket policy, HTTPS/TLS, cache behavior, logs, and errors |
| [DynamoDB](./aws/dynamodb/README.md) | Table design, least-privilege access, sample-data import and React access patterns |
| [AppSync](./aws/appsync/README.md) | GraphQL schema, Cognito authorization, DynamoDB resolver and Amplify client |
| [Lambda](./aws/lambda/README.md) | Node.js/Python functions, IAM roles, API handlers and CloudWatch logs |
| [CloudFront, CloudWatch and CloudTrail](./aws/operations/README.md) | CDN distribution, request/runtime/audit logs and Logs Insights |
| [IAM](./aws/iam/README.md) | Users, roles, policies, temporary credentials and least privilege |
| [API Gateway](./aws/api-gateway/README.md) | Cognito-protected HTTP API, Lambda integration, CORS and request logging |

## Sticky notes

For quick service reminders, see the [AWS sticky notes](./short_notes/README.md).

## How to use these guides

1. Start with the [end-to-end AWS integration runbook](./aws/README.md) for
   project wiring, Console setup, deployment commands and runtime events.
2. Start with Cognito when creating the authentication environment, and
   Amplify when creating the frontend hosting environment.
3. Choose **AppSync** for GraphQL backed by DynamoDB, or **API Gateway and
   Lambda** for REST. You usually do not need both.
4. Use DynamoDB as a backend data store; do not connect a browser directly with
   AWS access keys.
5. Add S3 only when the app needs object/file storage. Use CloudFront when
   controlled, cached distribution is needed.
6. Apply the IAM guide to every role before deployment; log and monitor with
   CloudWatch and, for AWS account audit events, CloudTrail.

The root [project README](../README.md) describes the current app. In this
repository, AppSync and the REST alternative are defined by
[`infrastructure/products-api.yaml`](../infrastructure/products-api.yaml);
the current product callback is in
[`src/network/ApiCallbacks.js`](../src/network/ApiCallbacks.js).

## Current project AWS setup

- **Frontend:** Amplify Hosting builds the Vite app from a connected Git branch.
- **Authentication:** Cognito User Pool, public web client, email confirmation.
- **Default products source:** Cognito-authorized AppSync GraphQL resolver to
  DynamoDB.
- **Alternative products source:** Cognito-authorized API Gateway HTTP API,
  Lambda and the same DynamoDB table.
- **Logs:** AppSync X-Ray tracing, API Gateway access logs and Lambda logs in
  CloudWatch; the existing standard CloudTrail trail also delivers account
  audit events to CloudWatch Logs and S3.
- **Not currently part of the application flow:** S3 object storage,
  CloudFront, Cognito Identity Pool credentials, or Amplify Storage. Their
  guides describe how to add them safely.

## General safety rules

- Never put AWS access keys, client secrets, passwords, signing keys, or
  privileged API keys in React code or `VITE_` variables. Vite variables are
  included in the public browser bundle.
- Use Cognito User Pool tokens for signed-in API access. Add an Identity Pool
  only if the browser genuinely needs scoped AWS credentials, such as direct
  access to private S3 objects.
- Give each Lambda, deployment pipeline, and human operator a separate
  least-privilege IAM role or identity.
- Review AWS service costs, retention, data residency and public-access
  settings before creating resources.
- Run the commands in the intended AWS account and region. Review CloudFormation
  changesets before production updates.

## Official documentation

- [AWS Amplify for React](https://docs.amplify.aws/react/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [AWS CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html)
