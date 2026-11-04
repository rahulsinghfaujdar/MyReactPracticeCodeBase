# Amazon API Gateway

> @sticky_notes

- **Use for:** managed REST/HTTP APIs. This app's optional REST path is
  `GET /products` through a Cognito JWT authorizer and Lambda.
- **Integration:** validate the User Pool issuer and app-client audience,
  attach authorization to protected routes, and invoke only the intended
  Lambda.
- **Remember:** CORS is not authentication. Configure access logging without
  Authorization headers or JWTs; return safe error responses.
- **Project guide:** [API Gateway setup](../aws/api-gateway/README.md).
- **AWS docs:** [HTTP APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api.html)
  · [JWT authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html)
