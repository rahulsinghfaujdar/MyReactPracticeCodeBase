# AWS Amplify: React hosting, environments and secrets

This guide covers building and hosting this Vite application with Amplify
Hosting. Amplify Hosting deploys the frontend; it does not make frontend
environment variables private.

## 1. Connect the React repository

1. Push the project to a Git provider supported by Amplify.
2. In AWS Console, open **AWS Amplify → Create new app → Host web app**.
3. Connect the repository, select the deployment branch and confirm the build
   settings.
4. For this Vite project, the usual settings are:
   - Build command: `npm run build`
   - Artifact directory: `dist`
5. Deploy once and check the build log and hosted URL.

The repository's app is Vite-based; if Amplify does not detect it correctly,
configure the build explicitly. Keep the build specification in version control
when the team needs a reproducible build.

## 2. Configure branch environments

Vite loads mode-specific files such as `.env.development` and `.env.production`.
Amplify instead supplies environment variables to its build process. Variables
must be present **before** the build because Vite substitutes `import.meta.env`
values into the JavaScript bundle.

1. In Amplify, select the app, then **Hosting → Environment variables**.
2. Add the values needed by the branch being built, for example:
   - `VITE_USER_POOL_ID`
   - `VITE_USER_POOL_WEB_CLIENT_ID`
   - `VITE_AWS_APPSYNC_GRAPHQL_URL`
   - `VITE_AWS_PRODUCTS_API_URL` if the REST option is used.
3. Save, then start a new build/deployment.
4. Verify the app against that branch and Cognito environment.

Use separate branches (for example `develop` and `main`) for development and
production. Configure each branch with the matching Cognito pool/client and
API endpoint. Prefer separate backend resources for non-production and
production; do not point both frontend environments at production user or
product data by accident.

Amplify environment variables can be configured at the app/branch level. Avoid
assuming a value is a secret because the console masks it: `VITE_` variables
are public once built.

## 3. Manage secrets correctly

**Never place secrets in a React bundle.** Do not use frontend variables for:
AWS access keys, Cognito app client secrets, database credentials, private API
keys, or signing secrets.

- Public frontend configuration such as a Cognito User Pool ID, public app
  client ID, and API URL can use `VITE_` variables.
- Backend-only credentials belong in AWS Secrets Manager or Systems Manager
  Parameter Store and should be read by a server-side Lambda using its IAM
  execution role.
- A web app that needs per-user access should use Cognito authentication and
  service authorization (for example, AppSync User Pool auth), not embed
  privileged credentials.
- Use IAM roles for Amplify build/deploy access. Restrict them to the
  deployment operations the pipeline requires.

If a secret has ever been committed or built into the frontend, rotate it;
removing it from the latest source does not remove it from Git history or
previous bundles.

## 4. Local development

```sh
npm install
cp .env.example .env.development
npm run dev
```

Replace placeholders in the ignored local `.env.development` with the
development Cognito and endpoint values. Keep `.env.development` and
`.env.production` out of Git. `.env.example` contains placeholders only.

Build and preview:

```sh
npm run build
npm run preview
```

## 5. Deploy and troubleshoot

1. Verify the target Amplify branch and its environment variables.
2. Push the desired commit to the connected branch, or start a build from
   Amplify.
3. Open **Hosting → Build history** and inspect the build output.
4. Check the browser's Network panel for runtime API calls; Amplify build logs
   do not contain browser API responses.
5. After changing an environment variable, rebuild. A page refresh alone will
   not change the bundled value.

### This repository

The root `package.json` builds to `dist` with `npm run build`. The local
`.env.*` files are ignored. The connected Amplify branch also needs the
AppSync endpoint in its build environment when `isAWSAppSync` is enabled.

## References

- [Amplify Hosting](https://docs.amplify.aws/react/deploy-and-host/fullstack-branching/)
- [Amplify environment variables](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html)
- [Vite environment variables and modes](https://vite.dev/guide/env-and-mode)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)
