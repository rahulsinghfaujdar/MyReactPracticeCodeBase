# Amazon Cognito

> @sticky_notes

- **User Pool:** user directory and sign-in; issues JWTs used by AppSync/API
  authorization. This app uses email sign-up, confirmation and sign-in.
- **Identity Pool:** exchanges identities for temporary AWS credentials. Not
  required for this app's User Pool-token-to-AppSync flow.
- **Integration:** configure Amplify Auth v6 with the pool ID and public web
  client ID; create a browser client without a client secret.
- **Remember:** verify tokens at the API, handle confirmation/challenge steps,
  and never log passwords or JWTs.
- **Project guide:** [Cognito setup](../aws/cognito/README.md).
- **AWS docs:** [User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
  · [Identity Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-identity.html)
