# AWS Lambda

> @sticky_notes

- **Use for:** trusted server-side code, such as the REST products handler.
- **Integration:** API Gateway invokes the function; a dedicated execution role
  grants only required DynamoDB and CloudWatch Logs actions.
- **Remember:** validate input and identity, return safe errors, and do not log
  tokens, passwords, or sensitive payloads.
- **Project guide:** [Lambda setup](../aws/lambda/README.md).
- **AWS docs:** [Lambda developer guide](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
  · [Execution roles](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)
