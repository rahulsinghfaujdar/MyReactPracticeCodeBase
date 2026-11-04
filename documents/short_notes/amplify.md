# AWS Amplify

> @sticky_notes

- **Use for:** building and hosting the React/Vite frontend from a connected Git
  branch.
- **Integration:** Amplify runs `npm run build` and serves Vite's `dist/`
  output. Configure the correct Cognito IDs and API endpoint for each branch.
- **Remember:** Vite substitutes `VITE_` variables into browser code at build
  time. They are public configuration, never secrets. Rebuild after changing
  them.
- **Project guide:** [Amplify setup](../aws/amplify/README.md).
- **AWS docs:** [Amplify Hosting](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html)
  · [Environment variables](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html)
