# AWS CloudTrail

> @sticky_notes

- **Use for:** auditing AWS account/API activity, not capturing arbitrary
  browser network traffic.
- **Integration:** a standard multi-region trail can deliver events to a
  protected S3 archive and CloudWatch Logs for searching/alerting.
- **Remember:** choose data events intentionally because high-volume logging
  can increase cost. Protect retention destinations and enable validation as
  appropriate.
- **Project guide:** [CloudTrail operations](../aws/operations/README.md).
- **AWS docs:** [CloudTrail User Guide](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html)
