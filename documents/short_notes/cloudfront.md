# Amazon CloudFront

> @sticky_notes

- **Use for:** global content delivery, caching and TLS at the edge.
- **Integration:** configure an origin, viewer policy and cache behavior. For
  private S3 content, use Origin Access Control with a private S3 bucket.
- **Remember:** do not publicly cache user-specific or authorization-dependent
  API responses. Amplify Hosting already distributes this app's static files.
- **Project guide:** [CloudFront operations](../aws/operations/README.md).
- **AWS docs:** [CloudFront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)
  · [Restrict S3 origin access](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
