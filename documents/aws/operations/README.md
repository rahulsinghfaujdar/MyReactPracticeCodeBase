# CloudFront, CloudWatch and CloudTrail

These services address separate concerns:

- **CloudFront:** CDN and edge delivery.
- **CloudWatch:** operational metrics, alarms, logs and Logs Insights queries.
- **CloudTrail:** AWS account/API audit event source. A standard trail can
  deliver events to CloudWatch Logs and S3.

CloudTrail Lake is not used by this project.

## CloudFront: serve cached content

1. Identify the origin (Amplify Hosting, S3, API Gateway or another origin).
2. Create a distribution with HTTPS, the correct origin, cache policy and
   viewer protocol policy.
3. For a private S3 origin, use an S3 REST origin and Origin Access Control
   (OAC); keep the bucket private and allow only the distribution.
4. Decide which paths are cacheable. Do not cache authenticated or
   user-specific API responses publicly.
5. Configure domain/DNS and TLS certificate in the required AWS region.
6. Test redirects, asset paths, CORS and cache invalidation.

Amplify Hosting already distributes static app content. Add another
distribution only for a specific need, such as custom origin routing or
independently managed media.

## CloudWatch: API and runtime logs

This project uses:

- `/aws/apigateway/MyReactPracticeCodeBaseProductsApi`: request ID, route,
  status, response length, source IP and integration error.
- `/aws/lambda/MyReactPracticeCodeBaseProductsApi`: runtime and function errors.
- `aws-cloudtrail-logs-*`: delivered account audit events, including Cognito.

Select `ap-south-1` and open **CloudWatch → Logs Insights**. Example API query:

```text
fields @timestamp, requestId, routeKey, status, sourceIp, authorizerSubject, integrationError
| sort @timestamp desc
| limit 100
```

Example Cognito audit query (select the CloudTrail log group):

```text
fields @timestamp, eventSource, eventName, eventTime, errorCode, errorMessage
| filter eventSource = "cognito-idp.amazonaws.com"
| sort @timestamp desc
| limit 100
```

Set retention intentionally. Create alarms for API 5xx rates, Lambda errors,
throttles and latency when operationally useful. Avoid logging authorization
headers, passwords, confirmation codes, tokens and sensitive data.

## CloudTrail: audit AWS API activity

CloudTrail records supported AWS control-plane activity and sends events to
its configured destinations. It is not a browser network proxy and does not
log arbitrary calls from React to third-party services.

1. Choose a standard trail and required regions/event categories.
2. Deliver audit events to a protected S3 bucket; optionally configure a
   CloudWatch Logs destination for search/alerting.
3. Use a dedicated CloudTrail service role and the required destination
   resource policies.
4. Enable log-file validation and protect the destination against accidental
   deletion.
5. Review event history for recent events; use CloudWatch Logs Insights for
   delivered events.
6. Consider data events separately: they can be high-volume and billable.

This account's existing trail named `MyReactPracticeCodeBase` is multi-region,
logs to CloudWatch Logs and retains an S3 archive. Keep both destinations unless
an explicit retention/compliance decision says otherwise.

CloudTrail events may take minutes to reach a destination. Avoid copying
authentication tokens or secrets into event metadata.

## References

- [CloudFront developer guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)
- [CloudWatch Logs Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html)
- [CloudTrail logging](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html)
