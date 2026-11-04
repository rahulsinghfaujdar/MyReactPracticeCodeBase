# AWS IAM for React and backend services

IAM controls permissions for AWS identities and services. A browser application
must not contain IAM user access keys or other long-lived AWS credentials.

## 1. Distinguish the identities

- **Human/developer:** use IAM Identity Center or an approved federated
  identity, MFA, and short-lived role sessions.
- **Deployment pipeline:** use an assumed role scoped to the deployments it
  performs.
- **Lambda:** use a per-function execution role.
- **AppSync:** use a service role scoped to its data source and table.
- **Browser user:** use a Cognito User Pool token for API authorization. Add
  Identity Pool credentials only for direct, narrowly scoped AWS access.

Do not use the AWS account root user for routine CLI or application work.
Secure root with MFA, remove root access keys, and use an administrative
federated role only when needed.

## 2. Apply least privilege

For every policy:

1. List the exact AWS API actions required.
2. Limit resource ARNs to the required table, bucket prefix, log group, or
   function.
3. Add conditions (region, tags, encryption, source ARN) where appropriate.
4. Avoid `Action: "*"`, `Resource: "*"`, wildcard administrator policies and
   shared credentials.
5. Separate read from write permissions.
6. Review role trust policies; restrict who or which service can assume them.

The products API template has distinct roles:

- AppSync's role can read the specific products table.
- Lambda's role can scan that table and write to its CloudWatch log group.
- API Gateway may invoke only the designated Lambda.

## 3. Local development credentials

Use AWS CLI profiles/SSO or another approved short-lived credential provider
for deployment and seeding. These credentials are for local AWS CLI tooling,
not the React app. Never copy `~/.aws/credentials` into the repository.

The product browser flow does not use AWS IAM user credentials: Cognito
authenticates the user, and AppSync authorizes the User Pool token.

## 4. Identity Pool permissions are optional

This project's AppSync User Pool auth does not require an Identity Pool. If
adding direct browser-to-S3 access:

1. Configure authenticated Identity Pool identities and a correct authenticated
   role trust policy.
2. Leave unauthenticated identities disabled unless explicitly required.
3. Grant the minimum S3 actions on a per-user prefix.
4. Test that one user cannot access another user's objects.

An Identity Pool without role mappings/roles can cause
`InvalidIdentityPoolConfigurationException`.

## 5. Protect secrets

- Frontend environment variables are public when bundled.
- Store backend secrets in Secrets Manager or Parameter Store.
- Let a backend execution role read only the required secret ARN.
- Rotate credentials if they were committed, exposed in logs, or embedded in a
  client bundle.

## 6. Audit and review

Use CloudTrail to audit IAM policy/role changes. Use Access Analyzer and policy
simulation to review access. Periodically remove unused users, keys, roles and
permissions; prefer short-lived roles over access keys.

## References

- [IAM best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [IAM policy evaluation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)
- [IAM Access Analyzer](https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html)
