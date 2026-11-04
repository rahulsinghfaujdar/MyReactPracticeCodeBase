# AWS integration sticky notes

> @sticky_notes

Short, practical reminders for the AWS services used or discussed in this
project. These notes summarize AWS guidance; use the linked AWS documentation
and detailed project guides for full setup and configuration.

| Service | Quick note |
| --- | --- |
| [Amplify](./amplify.md) | Build and host the Vite frontend; `VITE_` values are public build-time config. |
| [Cognito](./cognito.md) | User Pool signs users in; Identity Pool is only needed for scoped AWS credentials. |
| [S3](./s3.md) | Keep buckets private by default; authorize access independently of CORS. |
| [DynamoDB](./dynamodb.md) | Design keys around queries; access through AppSync or a backend, not browser credentials. |
| [AppSync](./appsync.md) | GraphQL API with Cognito authorization and a least-privilege data source role. |
| [Lambda](./lambda.md) | Run trusted backend logic under a dedicated execution role. |
| [CloudFront](./cloudfront.md) | Cache public content; use OAC for private S3 origins. |
| [CloudWatch](./cloudwatch.md) | Centralize operational logs, metrics, alarms and Logs Insights queries. |
| [CloudTrail](./cloudtrail.md) | Audit AWS account activity; standard trails can deliver to S3 and CloudWatch Logs. |
| [IAM](./iam.md) | Prefer short-lived roles and least privilege; never ship access keys in React. |
| [API Gateway](./api-gateway.md) | Validate Cognito JWTs before routing requests to Lambda. |

## Project flow at a glance

```text
Amplify Hosting -> React/Vite -> Cognito User Pool sign-in
                                  -> AppSync -> DynamoDB (default products path)
                                  -> API Gateway -> Lambda -> DynamoDB (REST option)
CloudWatch <- API Gateway/Lambda logs
CloudTrail -> CloudWatch Logs and S3 archive
```

S3 object storage, CloudFront and Cognito Identity Pool credentials are optional
extensions, not part of the current products request flow.

## Detailed guides

See the [full AWS guide index](../README.md) for setup steps and code examples.
