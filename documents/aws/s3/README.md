# Amazon S3 from a React application

Use S3 for files and objects such as user uploads or static media. S3 is not a
database, and a public bucket should not be used as a substitute for an
authenticated API.

## 1. Decide how the object will be accessed

- **Private user files:** prefer an authenticated upload/download mediated by a
  backend or narrowly scoped Cognito Identity Pool credentials.
- **Public static assets:** use Amplify Hosting's `public/` directory for
  bundled app assets. For larger independently updated assets, use a private S3
  origin behind CloudFront Origin Access Control (OAC).
- **Public direct S3 access:** avoid unless the objects are intentionally
  public. Block public access at the account and bucket level by default.

This app currently serves `public/bg_react.jpg` from Amplify Hosting; it does
not require S3 Storage.

## 2. Create a private bucket

1. Choose the application region and a globally unique bucket name.
2. Keep **Block all public access** enabled.
3. Keep ACLs disabled / bucket-owner-enforced object ownership.
4. Enable default encryption (SSE-S3 is suitable for many static assets; use
   SSE-KMS when key control/audit requirements require it).
5. Configure lifecycle rules and versioning only according to recovery and
   retention requirements.
6. Do not put credentials in the bucket policy.

## 3. Choose an authorization path

### Recommended server-mediated access

The React app authenticates with Cognito and calls an authenticated API. A
Lambda role with permission to a specific bucket/prefix performs S3 operations.
This avoids granting browser clients general AWS credentials.

### Direct browser access (only when required)

Amplify Storage with an S3 backend commonly uses Identity Pool credentials.
Before enabling it:

1. Create/attach an authenticated Identity Pool role and ensure the trust
   relationship is correct.
2. Grant only the required `s3:GetObject` / `s3:PutObject` actions on a
   specific user prefix, not `s3:*` on `*`.
3. Decide whether object keys are per-user and enforce that prefix in IAM.
4. Add bucket CORS only for the exact app origins and required methods/headers.
5. Keep unauthenticated/guest identities disabled unless public guest access is
   an explicit requirement.

Example Amplify v6 Storage call (after correctly configuring Amplify Storage,
Identity Pool credentials and scoped IAM access):

```js
import { uploadData, getUrl } from 'aws-amplify/storage';

const uploaded = uploadData({
  path: `protected/${userId}/profile/photo.jpg`,
  data: file,
  options: { contentType: file.type },
});
await uploaded.result;

const { url } = await getUrl({
  path: `protected/${userId}/profile/photo.jpg`,
  options: { expiresIn: 300 },
});
```

Use the current Amplify Storage `path` API and verify the configured access
level/Identity Pool role. A path string alone is not an authorization boundary;
IAM must enforce the same prefix.

## 4. Serve static S3 files with CloudFront

For private assets, configure an S3 REST origin (not the S3 website endpoint),
create a CloudFront Origin Access Control, and allow only that distribution to
read the bucket. Keep the bucket private. Add cache policies and invalidation
procedures that match update frequency. Protect uploads separately; OAC is for
CloudFront-to-S3 origin access, not user upload authorization.

## 5. Configure browser CORS only if needed

CORS controls which browser origins may read responses; it is not access
control. Authorize requests with IAM/presigned URLs/API authorization too.
Allow only known app origins and required methods/headers. Never use CORS as a
replacement for a bucket policy.

## 6. Operational checks

- Use CloudWatch metrics/alarms for request errors and volume as needed.
- Enable S3 server access logging or CloudTrail S3 data events only when
  required; both can add cost.
- Never log presigned URLs or credentials; treat presigned URLs as bearer
  tokens until expiry.
- Test unauthorized object access, user-prefix isolation, CORS and file size
  validation.

## References

- [Amplify Storage for React](https://docs.amplify.aws/react/build-a-backend/storage/)
- [S3 security best practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [CloudFront Origin Access Control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
