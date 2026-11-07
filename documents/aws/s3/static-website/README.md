# Deploy the React app as an S3 static website

This guide publishes this repository's Vite-built React app directly through
the S3 website endpoint. The bucket and its website files are **publicly
readable**. The S3 website endpoint supports HTTP only; use the
[private S3 + CloudFront guide](../cloudfront-private/README.md) if you need
HTTPS and a private bucket.

## What this deployment does

```text
Browser -- HTTP --> S3 static website endpoint --> index.html and Vite assets
```

This does not use CloudFront to serve the website. S3 server access logging,
CloudWatch metrics, and CloudFront request logs are separate features; none is
required to display the site.

## Note about the current deployment

The deployment walkthrough later switched `test1demoapibucket` to private S3
access through CloudFront. Therefore the S3 website endpoint may return 403;
that is expected for the current secure configuration. Use the
[private S3 + CloudFront guide](../cloudfront-private/README.md) for the
current deployment. Follow this guide only if you intentionally want to make
the bucket's website objects public and serve them directly over HTTP.

## 1. Build the production site

From the repository root, install dependencies and build:

```sh
npm install
npm run build
```

Vite writes the production site to `dist/`. Confirm that `dist/index.html`
exists. Upload the **contents** of `dist/` to the bucket root, so that
`index.html` is at the top level and `assets/` is alongside it. Do not upload
the `dist` directory as a nested folder.

## 2. Configure S3 static website hosting

1. In the AWS Console, open **S3 → Buckets → your bucket → Properties**.
2. Under **Static website hosting**, choose **Edit** and enable it.
3. Choose **Host a static website**.
4. Set **Index document** to `index.html` (case-sensitive).
5. Optionally set **Error document** to `index.html` if the app uses
   client-side routes. S3 may return an error status for a missing object even
   when it displays the error document; CloudFront custom error responses are
   a better SPA fallback.
6. Save changes. Copy the **Bucket website endpoint** shown in this section.

For the existing bucket in this walkthrough, the endpoint is:

```text
http://test1demoapibucket.s3-website.ap-south-1.amazonaws.com/
```

Website endpoints are HTTP-only. They are different from the bucket's regular
S3 REST endpoint.

## 3. Permit public website reads

Public website hosting requires both a public-read bucket policy and public
access not being blocked. This makes every object covered by the policy
readable by anyone on the internet. Use this only for content intended to be
public.

1. Open **S3 → your bucket → Permissions → Block public access (bucket
   settings) → Edit**.
2. Turn off **Block all public access** for this bucket and acknowledge the
   warning. If account-level S3 Block Public Access still blocks public
   policies, an administrator must review that account-level setting; do not
   disable it account-wide just to make this one site public.
3. Under **Permissions → Bucket policy**, save a complete JSON policy. For
   this bucket, the following preserves the logging statement previously
   present and adds public object reads:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3PolicyStmt-DO-NOT-MODIFY-1794024514785",
      "Effect": "Allow",
      "Principal": {
        "Service": "logging.s3.amazonaws.com"
      },
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::test1demoapibucket/*",
      "Condition": {
        "StringEquals": {
          "aws:SourceAccount": "667325690783"
        }
      }
    },
    {
      "Sid": "AllowPublicReadForWebsite",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::test1demoapibucket/*"
    }
  ]
}
```

This policy assumes the bucket name and account ID above are still yours.
Replace them if deploying to another bucket/account. If the bucket has
additional required statements, merge them into the top-level `Statement`
array; do not paste a single statement by itself or overwrite unrelated
required permissions. Keep ACLs disabled / **Bucket owner enforced**; the
policy is sufficient for reads.

The logging statement is not what makes the website work. Keep it only if it
matches a logging configuration you still use. Do not add a public
`s3:PutObject` permission.

## 4. Upload and verify

In the Console, choose **S3 → your bucket → Objects → Upload**, add all files
and folders inside `dist/`, then choose **Upload**. Alternatively, with
AWS CLI configured for the intended account:

```sh
aws s3 sync dist/ s3://test1demoapibucket/ --region ap-south-1
```

Open the website endpoint. Also test the entry document directly:

```text
http://test1demoapibucket.s3-website.ap-south-1.amazonaws.com/index.html
```

## 5. Troubleshooting

| Result | Check |
| --- | --- |
| `403 AccessDenied` | Confirm public-read `s3:GetObject` is present, bucket-level Block Public Access is off, and account-level block settings do not override it. Do not make the entire AWS account public. |
| `404 Not Found` at `/` | Confirm Static website hosting is enabled and **Index document** is exactly `index.html`. |
| `404` for `/index.html` | Confirm `index.html` is directly in the bucket root, not in a `dist/` folder. |
| Page loads without styling/scripts | Upload the full `dist/` contents, including `assets/`; inspect the browser network panel for missing files. |
| React deep link returns an error | S3 website hosting does not provide a clean 200 SPA fallback. Use CloudFront custom error responses as described in the private-bucket guide. |
| HTTPS is required | S3 website endpoints do not support HTTPS. Use CloudFront and its HTTPS domain. |

Do not use this public policy for the CloudFront-private deployment. To switch
to that model, remove the public-read statement, enable Block all public access,
and use the bucket's S3 REST origin with OAC as described in the
[CloudFront guide](../cloudfront-private/README.md).

## Logs and monitoring

- **CloudWatch metrics** show aggregate S3 request/error metrics when enabled;
  they are not per-visitor request logs.
- **S3 server access logging** writes detailed S3 request records to a
  configured destination bucket and may take time to deliver.
- **CloudFront logs** apply only when requests are served through CloudFront.

Choose a logging destination and retention policy deliberately; logging can
incur storage and request charges. Do not enable a logging permission without
configuring and securing its destination.

## References

- [Hosting a static website on Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [S3 Block Public Access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)
- [S3 server access logging](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ServerLogs.html)
