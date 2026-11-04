# AWS Identity and Access Management (IAM)

> @sticky_notes

- **Use for:** defining who can call which AWS actions on which resources.
- **Integration:** use separate roles for AppSync, Lambda and deployment
  pipelines; scope policies to specific tables, functions, buckets and logs.
- **Remember:** prefer federated identities and short-lived role sessions.
  Never embed IAM access keys in React, Vite variables or source control.
- **Project guide:** [IAM setup](../aws/iam/README.md).
- **AWS docs:** [IAM best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
  · [Policy evaluation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html)
