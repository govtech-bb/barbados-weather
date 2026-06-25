# GovTech Sandbox CI/CD Implementation Plan (Workstream C)

> **For agentic workers:** This plan mixes a delegable file-edit task with operator-gated cloud actions. Task 1 (Terraform edits) follows the subagent-driven flow. Tasks 2–5 are operator-gated runbook steps (state bucket, apply, deploy) — the assistant prepares/plans, the operator runs or explicitly approves each mutating command. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Retarget the OpenTofu infra + `release.yml` so `govtech-bb/barbados-weather` deploys into the GovTech sandbox AWS account (`672203047922`), renamed to `barbados-weather`, with remote S3 state.

**Architecture:** Manual `tofu apply` provisions ECR + OIDC deploy role + Fargate/ALB/CloudFront/WAF in the sandbox; outputs become GitHub repo variables; `release.yml` builds, pushes to ECR via OIDC, and force-redeploys ECS on push to `main`.

**Tech Stack:** OpenTofu v1.12.2 (AWS provider ~>5.0), AWS CLI (profile `govtech-sandbox`), GitHub CLI (`gh`), GitHub Actions.

## Global Constraints

- Sandbox account: `672203047922`, region `us-east-1`, profile `govtech-sandbox` (InfrastructureAdmin).
- OIDC trust `sub` = `repo:govtech-bb/barbados-weather:ref:refs/heads/main`, `StringEquals` only.
- `create_oidc_provider = false` (sandbox already has the provider).
- `project` tag value MUST be identical in `default_tags` and both IAM `StringEquals` conditions (value: `barbados-weather`).
- Rename every `hurricane-ready` → `barbados-weather` in `infra/` (27 occurrences across main.tf, ecs.tf, cloudfront.tf, waf.tf), including comments, descriptions, and metric names.
- S3 backend: bucket in sandbox, key `barbados-weather/terraform.tfstate`, `encrypt = true`, `use_lockfile = true`.
- Mutating cloud commands (`aws s3` create, `tofu apply`, deploy trigger) are operator-gated.
- Commit after Task 1.

---

### Task 1: Retarget + rename the Terraform, add S3 backend

**Files:** Modify `infra/main.tf`, `infra/ecs.tf`, `infra/cloudfront.tf`, `infra/waf.tf`

**Interfaces:**
- Produces: renamed resources and a configured S3 backend, ready for `tofu init`.

- [ ] **Step 1: Rename across all infra files**

Replace every occurrence of `hurricane-ready` with `barbados-weather` in `infra/main.tf`, `infra/ecs.tf`, `infra/cloudfront.tf`, `infra/waf.tf` (27 occurrences: resource names, IAM role names, SG names + descriptions, log group `/ecs/barbados-weather`, ALB/TG names, ECS cluster/service/family, CloudFront VPC origin name + `barbados-weather-security-headers` policy name + distribution comment, WAF ACL name + 4 metric names, the `default_tags` `project = "barbados-weather"`, both IAM `StringEquals` `project` conditions, and code comments).

Note: `aws_lb` name max length is 32 chars — `barbados-weather-alb` (20) and `barbados-weather-tg` (19) are fine.

- [ ] **Step 2: Retarget the OIDC variables in `infra/main.tf`**

Change:
```hcl
variable "github_repo" {
  description = "GitHub org/repo allowed to assume the deploy role"
  type        = string
  default     = "christophercorbin/hurricane-ready"
}
```
to default `"govtech-bb/barbados-weather"`.

Change `variable "create_oidc_provider"` default from `true` to `false`.

- [ ] **Step 3: Add the S3 backend block**

In `infra/main.tf`, inside the existing `terraform {` block (which has `required_version` and `required_providers`), add:

```hcl
  backend "s3" {
    bucket       = "govtech-sandbox-tfstate-672203047922"
    key          = "barbados-weather/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
```

(If Task 2 discovers an existing gov state bucket with a different name, update `bucket` to match before `tofu init`.)

- [ ] **Step 4: Validate (no cloud calls)**

Run:
```bash
cd infra
tofu fmt
tofu init -backend=false
tofu validate
```
Expected: `fmt` leaves files formatted; `validate` prints "Success! The configuration is valid." Fix any errors (e.g. a missed rename causing an unknown reference).

- [ ] **Step 5: Confirm no stale references**

Run:
```bash
grep -rnE "hurricane-ready|christophercorbin" infra/
```
Expected: no output (exit 1). If anything remains, fix it.

- [ ] **Step 6: Commit**

```bash
git add infra/
git commit -m "infra: retarget deploy to govtech-bb/barbados-weather sandbox; rename + S3 backend"
```

---

### Task 2: Bootstrap remote state bucket (operator-gated)

**Steps run with `--profile govtech-sandbox`.**

- [ ] **Step 1: Check for an existing state bucket**

Run:
```bash
aws s3api list-buckets --profile govtech-sandbox --query "Buckets[?contains(Name,'tfstate') || contains(Name,'terraform')].Name" --output text
```
If a suitable shared state bucket already exists, use it (update the backend `bucket` in `infra/main.tf` and re-`fmt`/commit). Otherwise create the new one below.

- [ ] **Step 2: Create the bucket (operator-gated mutating action)**

```bash
aws s3api create-bucket --bucket govtech-sandbox-tfstate-672203047922 --region us-east-1 --profile govtech-sandbox
aws s3api put-bucket-versioning --bucket govtech-sandbox-tfstate-672203047922 --versioning-configuration Status=Enabled --profile govtech-sandbox
aws s3api put-bucket-encryption --bucket govtech-sandbox-tfstate-672203047922 --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}' --profile govtech-sandbox
aws s3api put-public-access-block --bucket govtech-sandbox-tfstate-672203047922 --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true --profile govtech-sandbox
```
Expected: bucket created and configured. (`us-east-1` needs no `LocationConstraint`.)

- [ ] **Step 3: Initialize the backend**

```bash
cd infra
AWS_PROFILE=govtech-sandbox tofu init
```
Expected: "Successfully configured the backend "s3"!" and providers installed.

---

### Task 3: Plan and apply into the sandbox (operator-gated)

- [ ] **Step 1: Plan**

```bash
cd infra
AWS_PROFILE=govtech-sandbox tofu plan -out=tfplan
```
Review the plan. CONFIRM:
- It does **not** create an `aws_iam_openid_connect_provider` (reuses the existing one via the data source).
- The deploy role trust policy `sub` reads `repo:govtech-bb/barbados-weather:ref:refs/heads/main`.
- Resource names are `barbados-weather*`.
- Roughly: ECR repo, IAM role+policy, ECS cluster/service/task, ALB/TG/listener/SGs, CloudFront distribution + VPC origin + response headers policy, WAF ACL, log group.

- [ ] **Step 2: Apply (operator runs or explicitly approves)**

```bash
cd infra
AWS_PROFILE=govtech-sandbox tofu apply tfplan
```
Note: CloudFront distribution creation can take 5–15 minutes. Expected: apply completes; outputs `github_deploy_role_arn`, `ecr_repository`, `ecs_cluster`, `ecs_service` print.

- [ ] **Step 3: Capture outputs**

```bash
cd infra
AWS_PROFILE=govtech-sandbox tofu output
```
Record `github_deploy_role_arn`, `ecr_repository`, `ecs_cluster`, `ecs_service`, and (from `cloudfront.tf` outputs) the distribution domain.

---

### Task 4: Wire GitHub repo variables

- [ ] **Step 1: Set the repo variables** (assistant can run; `gh` has admin)

```bash
gh variable set AWS_DEPLOY_ROLE_ARN --repo govtech-bb/barbados-weather --body "<github_deploy_role_arn>"
gh variable set ECR_REPOSITORY     --repo govtech-bb/barbados-weather --body "<ecr_repository>"
gh variable set ECS_CLUSTER        --repo govtech-bb/barbados-weather --body "<ecs_cluster>"
gh variable set ECS_SERVICE        --repo govtech-bb/barbados-weather --body "<ecs_service>"
```

- [ ] **Step 2: Verify**

```bash
gh variable list --repo govtech-bb/barbados-weather
```
Expected: all four variables present with the values from Task 3.

---

### Task 5: Deploy and verify

- [ ] **Step 1: Trigger the release workflow**

```bash
gh workflow run Release --repo govtech-bb/barbados-weather --ref main
```
(Or push a commit to `main`.)

- [ ] **Step 2: Watch the run**

```bash
gh run watch --repo govtech-bb/barbados-weather $(gh run list --repo govtech-bb/barbados-weather --workflow Release --limit 1 --json databaseId --jq '.[0].databaseId')
```
Expected: build → GHCR push → OIDC assume → ECR push → ECS redeploy all succeed.

- [ ] **Step 3: Verify ECS steady state**

```bash
aws ecs describe-services --cluster barbados-weather --services barbados-weather --profile govtech-sandbox --query "services[0].{desired:desiredCount,running:runningCount,deployments:length(deployments)}"
```
Expected: `running == desired` (1), a single deployment.

- [ ] **Step 4: Verify the public endpoint**

```bash
DIST=<cloudfront-domain-from-task-3>
curl -sS -o /dev/null -w "%{http_code}\n" "https://$DIST/"
curl -sS "https://$DIST/healthz"
```
Expected: `/` returns `200`; `/healthz` returns the ok JSON. The rebranded gov chrome is now live in the sandbox.

---

## Self-Review

**Spec coverage:** TF retarget+rename+backend → Task 1; state bootstrap → Task 2; plan/apply → Task 3; repo variables → Task 4; deploy+verify → Task 5. ✓
**Placeholder scan:** `<github_deploy_role_arn>` etc. are output values filled at runtime (Task 3 → Task 4), and the bucket name is concrete; the only conditional is reusing an existing state bucket if found. ✓
**Consistency:** `project=barbados-weather` tag value is set in `default_tags` and both IAM conditions (Task 1 Step 1). `create_oidc_provider=false` matches the plan's "reuse provider" verification in Task 3 Step 1. Resource names `barbados-weather` match the repo-variable outputs consumed in Task 4. ✓
