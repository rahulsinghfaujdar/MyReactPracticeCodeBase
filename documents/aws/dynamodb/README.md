# Amazon DynamoDB for a React application

DynamoDB is the backend data store in this project. The browser accesses it
through AppSync or API Gateway/Lambda; it does not receive DynamoDB credentials.

## 1. Design the table for access patterns

Before creating a table, list the operations the app needs. The current sample
has 30 products, each keyed by numeric `id`; the table
`MyReactPracticeCodeBaseProducts` uses `id` as its partition key and
`PAY_PER_REQUEST` billing.

Choose key attributes and any secondary indexes from query requirements. Avoid
using `Scan` for large production datasets: it reads the table broadly. Use
`Query` with partition/sort keys or an index for scalable filtering and
pagination.

## 2. Create the table

For this project, CloudFormation in
`infrastructure/products-api.yaml` defines the table and retention policy.
Deploy it through the stack rather than maintaining a conflicting hand-made
table:

```sh
aws cloudformation deploy \
  --template-file infrastructure/products-api.yaml \
  --stack-name MyReactPracticeCodeBaseProducts \
  --parameter-overrides UserPoolId=POOL_ID UserPoolClientId=CLIENT_ID \
  --capabilities CAPABILITY_IAM \
  --region ap-south-1
```

The table uses on-demand billing. Review capacity, backup, point-in-time
recovery, encryption, TTL, and retention requirements before production use.

## 3. Load sample products

The canonical seed file is `src/assets/json/sample_products_list.json`. The
Python script validates unique IDs, serializes nested JSON values, writes
batches of up to 25 and retries unprocessed items:

```sh
python3 scripts/seed_products.py --region ap-south-1
```

The caller needs temporary AWS credentials with `dynamodb:BatchWriteItem` on
the target table. Use an IAM role/profile; do not put credentials in React.
Avoid running the seed script against production if replacing sample records is
not intended.

## 4. Access the table through an API

### AppSync

The AppSync service role has `dynamodb:Scan` only on this table. The
`Query.listProducts` resolver reads the items and returns fields required by
the app. AppSync authenticates the signed-in user with the Cognito User Pool.

### API Gateway and Lambda

The alternative Lambda uses its own execution role, scoped to read this table
and write function logs. API Gateway validates the Cognito JWT before invoking
the function.

Do not grant the React client `dynamodb:*` or table access. A user signing in
does not imply permission to query DynamoDB directly.

## 5. React data flow

The products repository calls `getProductsListfromApi`. The callback chooses a
source from `isAWSAppSync` / `isAWSNetworking`, then maps the API result to the
product array. The repository stores products and applies client-side title
search. For larger datasets, move search/filter/pagination to an API query;
do not download an unbounded table into the browser.

## 6. Production data considerations

- Use stable keys and define item size and access patterns.
- Validate all writes on a trusted backend.
- Use conditional writes/version fields if concurrent updates are possible.
- Add pagination and limits before the product count grows.
- Enable backups/PITR when recovery requirements warrant them.
- Do not store unnecessary personal data in sample product records.
- Monitor consumed read/write capacity, throttling, latency and errors.

## References

- [DynamoDB developer guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)
- [DynamoDB best practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Amplify Data / DynamoDB](https://docs.amplify.aws/react/build-a-backend/data/)
