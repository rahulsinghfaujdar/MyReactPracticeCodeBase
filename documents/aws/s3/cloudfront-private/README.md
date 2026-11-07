# Deploy the React app with a private S3 bucket and CloudFront

This guide serves the Vite production build through CloudFront over HTTPS while
keeping the S3 bucket private. CloudFront uses Origin Access Control (OAC) to
read the bucket. Do **not** use the S3 website endpoint for this configuration:
OAC requires the bucket's regular S3 REST endpoint.

## What this deployment does

```text
Browser -- HTTPS --> CloudFront distribution -- signed OAC request --> private S3 REST origin
```

S3's website endpoint is not the visitor URL in this setup. A 403 at that
endpoint is expected after public access is blocked.

## Current deployment details

These are the identifiers provided during the deployment walkthrough. Confirm
they still match the AWS Console before applying policy or distribution
changes.

| Resource | Current value |
| --- | --- |
| AWS region | `ap-south-1` (Mumbai) |
| S3 bucket | `test1demoapibucket` |
| AWS account ID used in the policy | `667325690783` |
| CloudFront distribution ID used in the policy | `E32ZS2KQNLSBH5` |
| CloudFront domain | `d3f1flq6bblj3v.cloudfront.net` |

The CloudFront domain returned the React app's `index.html` during the
deployment walkthrough. That verifies an HTTPS response containing the app
HTML at that time; it does not verify every CloudFront setting or the
application's runtime API configuration.

## 1. Build and upload the app

From the repository root:

```sh
npm install
npm run build
```

Vite writes `dist/`. Upload the **contents** of `dist/` to the S3 bucket root,
including `index.html` and the `assets/` directory. Do not nest the files
under a `dist/` prefix.

Console upload: **S3 → `test1demoapibucket` → Objects → Upload**.

Optional CLI upload, using credentials authorized for the intended account:

```sh
aws s3 sync dist/ s3://test1demoapibucket/ --region ap-south-1
```

## 2. Keep the bucket private

1. In **S3 → `test1demoapibucket` → Permissions**, turn **Block all public
   access** on and confirm.
2. Keep **Object Ownership** set to **Bucket owner enforced** (ACLs disabled).
3. Remove any bucket-policy statement that grants `s3:GetObject` to
   `"Principal": "*"`. Do not grant public reads or public writes.
4. In **Properties → Static website hosting**, the website endpoint is not
   used by this architecture. You may disable website hosting to avoid
   confusion; CloudFront will use the REST origin, not the website endpoint.

Block Public Access does not prevent CloudFront OAC from reading the bucket
when the bucket policy specifically authorizes the distribution.

## 3. Configure the S3 REST origin and OAC

1. Open **CloudFront → Distributions** and select the intended distribution.
   The walkthrough used distribution ID `E32ZS2KQNLSBH5`.
2. Open **Origins**, select the bucket origin, and choose **Edit** (or add an
   origin if needed).
3. Set the origin domain to the bucket's regular regional S3 endpoint, for
   example `test1demoapibucket.s3.ap-south-1.amazonaws.com`.
   **Do not select the S3 static website endpoint** (`s3-website...`).
4. Under **Origin access**, select **Origin access control settings
   (recommended)**.
5. Create or select an OAC. Choose **Sign requests (recommended)**. Save the
   origin.
6. If the Console offers to update the S3 bucket policy for this distribution,
   apply its suggested policy. Otherwise, add the statement in step 4 below.

## 4. Set the bucket policy for CloudFront

Open **S3 → `test1demoapibucket` → Permissions → Bucket policy**. Save a full
policy document, not a single statement. The example below retains the logging
statement previously supplied for this bucket and grants `GetObject` only to
the named CloudFront distribution:

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
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::test1demoapibucket/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::667325690783:distribution/E32ZS2KQNLSBH5"
        }
      }
    }
  ]
}
```

The account ID, bucket name and distribution ID must match your resources.
Replace them if they have changed. If other required statements exist, merge
them into the top-level `Statement` array instead of overwriting them.

The logging statement is separate from CloudFront access. Keep it only if it
matches a logging destination/configuration you use; do not remove or change
an AWS-created statement that is still in use without checking that feature.
The CloudFront statement allows only object reads. Do not add
`s3:ListBucket`, `s3:PutObject`, or a wildcard public principal for site
delivery.

## 5. Set the default behavior, HTTPS and HTTP protocol versions

### Distribution settings

1. In the distribution, open **General → Settings → Edit**.
2. Set **Default root object** to `index.html` (without a leading slash).
3. For **Alternate domain name (CNAME)**:
   - Leave it empty when using the default `*.cloudfront.net` domain.
   - For a custom domain, enter the domain name(s) and configure DNS to point
     to the distribution.
4. For **Custom SSL certificate**:
   - With the default CloudFront domain, use the default CloudFront
     certificate. This supports HTTPS for `d3f1flq6bblj3v.cloudfront.net`;
     no custom ACM certificate is needed.
   - For a custom domain, request or import the certificate in **AWS
     Certificate Manager (ACM), `us-east-1`**, even if the S3 bucket is in
     `ap-south-1`. The certificate must cover the custom domain.
5. Choose a minimum TLS version of **TLSv1.2_2021** if available.
6. Under **Supported HTTP versions**, enable **HTTP/2** and **HTTP/3** if
   available. These are HTTP protocol versions; they do not enable HTTPS by
   themselves.
7. Save changes.

### Default cache behavior

1. Open **Behaviors**, select the default behavior, and choose **Edit**.
2. Set **Viewer protocol policy** to **Redirect HTTP to HTTPS**.
3. Allow **GET, HEAD** for a static site. Do not enable write methods unless
   there is a specific origin use case.
4. Use the default managed cache policy **CachingOptimized** for ordinary
   static assets unless the app needs a different caching strategy.
5. Save the behavior.

With the default CloudFront domain, both HTTP and HTTPS may be accepted by
CloudFront, but HTTP is redirected to HTTPS with this viewer policy. Visitors
should use the `https://` URL.

## 6. Optional SPA route fallback

This app currently has no client-side router requirement noted for its
product-list view. If client-side routes are added and refreshing a nested URL
returns an error, configure CloudFront custom error responses:

1. Open the distribution's **Error pages** (sometimes under **Error
   responses**) and choose **Create custom error response**.
2. For HTTP error code **403**, set **Customize error response** to Yes,
   **Response page path** to `/index.html`, and **HTTP response code** to
   `200`.
3. Repeat for **404**. Set a short error-caching minimum TTL if rapid updates
   matter.
4. Save and wait for the distribution to finish deploying.

This fallback can cause missing assets to return the app HTML instead of a
useful 404. Verify static asset URLs after enabling it.

## 7. Wait, test, and publish updates

1. Wait until CloudFront reports the distribution status as **Deployed**.
2. Open the secure distribution URL:

   ```text
   https://d3f1flq6bblj3v.cloudfront.net/
   ```

3. Confirm the page loads and its JS/CSS assets succeed in the browser's
   network panel.
4. Confirm direct S3 access is denied. The old S3 website URL is not the
   expected address for this private-bucket setup.
5. For each new release, run `npm run build`, sync the new `dist/` contents
   to S3, and create a CloudFront invalidation for `/*` if cached files remain
   stale. For longer-term cache efficiency, use versioned asset names and
   avoid invalidating every file on every release.

## 8. Logs and monitoring

- **CloudFront metrics** show aggregate request counts, bytes, cache hit rate,
  and errors; metrics are not individual request records.
- To inspect requests, configure the distribution's **standard logging**
  destination (for example, CloudWatch Logs, S3, or another destination
  offered by the Console). Then open the configured log destination and
  choose an appropriate retention period. Delivery is not necessarily
  immediate and logging may incur charges.
- **S3 server access logging** is a separate setting that records requests
  arriving at S3. With OAC, it does not replace CloudFront viewer request
  logs.
- The bucket policy's `logging.s3.amazonaws.com` statement is an S3 service
  permission; it does not by itself configure CloudFront logs or prove that
  logs are being delivered to CloudWatch.

Avoid logging credentials, tokens, cookies, or sensitive query parameters.

## Troubleshooting

| Result | Likely cause and check |
| --- | --- |
| S3 website endpoint returns 403 | Expected for a private bucket. Open the HTTPS CloudFront domain instead. |
| CloudFront returns 403 | Confirm `index.html` is in the bucket root; the origin is the S3 REST endpoint; OAC signs requests; and the policy's bucket, account, and distribution IDs match the active distribution. Confirm the distribution has completed deployment. |
| CloudFront returns 404 at `/` | Check **Default root object** is exactly `index.html` and uploaded at the bucket root. |
| CloudFront returns 403/404 for nested routes | Configure the optional SPA error responses if the app uses client-side routes. |
| HTML loads but JS/CSS fails | Check that `assets/` was uploaded beside `index.html`, inspect URL casing, and rebuild/upload the complete `dist/` contents. |
| Changes do not appear | Wait for deployment and cache expiry, then invalidate the relevant path(s), such as `/*`. |
| Bucket policy says malformed JSON | Paste the complete JSON object, including `Version` and `Statement`; ensure commas and braces are valid. A statement alone is not a bucket policy document. |
| Bucket policy says public access blocked | Remove public-principal access. OAC works with Block Public Access enabled; do not disable it for this design. |
| Custom domain certificate is unavailable | Request/import the ACM certificate in `us-east-1`, include the exact domain, and wait until certificate validation completes. |

## References

- [Restrict access to an Amazon S3 origin with OAC](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [CloudFront default root object](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DefaultRootObject.html)
- [CloudFront custom error responses](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/creating-custom-error-pages.html)
- [Use an alternate domain name and HTTPS certificate](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html)
