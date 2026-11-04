# AWS AppSync

> @sticky_notes

- **Use for:** managed GraphQL APIs. This project's default product query is
  protected by a Cognito User Pool and resolves to DynamoDB.
- **Integration:** configure Amplify API GraphQL endpoint/region and request
  with `authMode: 'userPool'`; give AppSync's role only required data-source
  permissions.
- **Remember:** validate auth behavior and resolver errors; use pagination and
  keyed queries rather than unbounded scans as data grows.
- **Project guide:** [AppSync setup](../aws/appsync/README.md).
- **AWS docs:** [AppSync developer guide](https://docs.aws.amazon.com/appsync/latest/devguide/what-is-appsync.html)
  · [Authorization](https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html)
