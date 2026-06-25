# GovTech Sandbox CI/CD — Design Spec (Workstream C)

**Date:** 2026-06-25
**Status:** Approved (design); proceeding to plan
**Workstream:** C of 3 (Rebrand ✓ · Repo→govtech-bb ✓ · CI/CD).

## Goal

Make `github.com/govtech-bb/barbados-weather` build and deploy into the GovTech
**sandbox** AWS account (`672203047922`) via the existing OpenTofu infra and the
`release.yml` GitHub Actions OIDC pipeline — retargeted off the original personal
account and repo.

## Context (current state)

- `infra/*.tf` provisions: ECR, a GitHub-OIDC deploy role, a Fargate service
  behind an **internal** ALB, a CloudFront distribution via VPC Origin, and a
  WAFv2 web ACL. Everything is named `hurricane-ready` and tagged
  `project=hurricane-ready` (the tag is referenced in the deploy role's IAM
  conditions).
- The OIDC trust `sub` is pinned to
  `repo:christophercorbin/hurricane-ready:ref:refs/heads/main` via `StringEquals`.
- `create_oidc_provider` defaults to `true`, but the sandbox **already has** a
  GitHub OIDC provider (`arn:aws:iam::672203047922:oidc-provider/token.actions.githubusercontent.com`).
- Terraform state is **local** (no backend block). No state currently exists.
- OpenTofu v1.12.2 is installed. The operator (RootUserChris /
  ChristopherN.Corbin@govtech.bb) has **InfrastructureAdmin** in the sandbox.
- `release.yml` always pushes to GHCR, and — when the `AWS_DEPLOY_ROLE_ARN`
  repo variable is set — assumes the role via OIDC, pushes to ECR, and
  force-redeploys the ECS service. CI does not apply infra; infra is applied
  manually and wired via GitHub repo variables.

## Decisions

- **Rename** all AWS resources and the `project` tag from `hurricane-ready` to
  `barbados-weather` (27 occurrences across `infra/`), to match the gov repo.
  Fresh deploy → no state migration cost.
- **Remote S3 state** in the sandbox account (S3 native locking via
  `use_lockfile`, encryption on, versioning on, public access blocked).

## Scope

### In scope

**1. Terraform retarget + rename (`infra/*.tf`)**
- `var.github_repo` default → `govtech-bb/barbados-weather`.
- `var.create_oidc_provider` default → `false` (reuse the existing provider; the
  `data.aws_iam_openid_connect_provider.github` path supplies `local.oidc_arn`).
- Rename `hurricane-ready` → `barbados-weather` in every occurrence: ECR repo,
  ECS cluster/service/task family, exec/task/deploy IAM roles, ALB + target
  group + SGs (and SG descriptions), CloudWatch log group, CloudFront VPC origin
  name + response-headers-policy name + distribution comment, WAF web ACL name +
  all metric names, the `default_tags` `project` value, and the two IAM
  `StringEquals` conditions referencing `project=hurricane-ready`.
- Add an S3 `backend` block to the `terraform {}` block in `main.tf`.

**2. Remote-state bootstrap**
- Check for an existing gov sandbox state bucket; if none, create
  `govtech-sandbox-tfstate-672203047922` in `us-east-1` with versioning,
  SSE (AES256), and a public-access block. This is done with the AWS CLI
  out-of-band (the backend bucket must exist before `tofu init`).

**3. Apply into the sandbox** (gated mutating step)
- `tofu init` (S3 backend) → `tofu validate` → `tofu plan` (operator reviews) →
  **`tofu apply`** run/approved by the operator. Creates ECR, deploy role, ECS,
  ALB, CloudFront, WAF.

**4. Wire GitHub repo variables** on `govtech-bb/barbados-weather` from outputs:
`AWS_DEPLOY_ROLE_ARN`, `ECR_REPOSITORY`, `ECS_CLUSTER`, `ECS_SERVICE`.

**5. Deploy + verify**
- Trigger `release.yml` (push to `main` or `workflow_dispatch`). Verify: image in
  ECR, ECS service reaches steady state, CloudFront default domain returns HTTP
  200 on `/` and `/healthz`.

### Out of scope (deferred)
- Custom domain + ACM (`aliases`/`acm_certificate_arn` stay empty →
  `*.cloudfront.net`); the page's `weather.gov.bb` canonical/OG URLs stay as
  placeholders until a domain exists.
- Turning on AI/alerts (`DISABLE_AI=1` stays; no Bedrock/SES/SNS task policy).
- SNS-backed feedback (future).
- Autoscaling, container insights, immutable ECR tags (existing follow-ups).
- Any change to `ci.yml` (PR test workflow).

## Constraints

- OIDC trust `sub` must be exactly `repo:govtech-bb/barbados-weather:ref:refs/heads/main`
  with `StringEquals` (no wildcards).
- The `project` tag value must stay identical between `default_tags` and both IAM
  `StringEquals` conditions, or the deploy role's `ecs:UpdateService` breaks.
- `create_oidc_provider = false` for the sandbox (provider already exists).
- Region stays `us-east-1` (required for CloudFront-scoped WAF and CloudFront ACM).
- Mutating cloud actions (`aws s3` bucket creation, `tofu apply`, the deploy)
  are operator-gated — prepared and planned by the assistant, executed/approved
  by the operator.

## Testing / verification

- `tofu fmt -check` and `tofu init -backend=false && tofu validate` pass after the
  edits (syntax/consistency, no cloud calls).
- `tofu plan` reviewed before apply: confirm it reuses (not creates) the OIDC
  provider, and the role trust `sub` names the gov repo.
- Post-deploy: `aws ecs describe-services` shows `runningCount == desiredCount`;
  `curl -sI https://<dist>.cloudfront.net/` returns `200`; `/healthz` returns ok.

## Open items (deferred)
- Custom gov domain + ACM cert; then set `aliases`/`acm_certificate_arn` and
  update the page canonical/OG URLs.
- Whether a shared gov state bucket / naming convention already exists (checked
  at bootstrap; falls back to the account-suffixed name).
