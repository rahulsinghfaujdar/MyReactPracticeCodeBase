# Amazon DynamoDB

> @sticky_notes

- **Use for:** managed key-value/document storage. The products table is
  accessed through AppSync by default or API Gateway/Lambda as an alternative.
- **Integration:** choose partition/sort keys for access patterns; expose only
  required fields through a resolver/API.
- **Remember:** avoid table scans for growing datasets; paginate queries and
  grant backend roles access only to required tables/actions.
- **Project guide:** [DynamoDB setup](../aws/dynamodb/README.md).
- **AWS docs:** [DynamoDB developer guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)
  · [Best practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
