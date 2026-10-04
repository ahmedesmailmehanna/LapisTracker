# Deploying LapisTracker to AWS with Terraform

This folder describes, as code, the AWS infrastructure for running LapisTracker:
one EC2 instance running the production Docker Compose stack, and a managed
PostgreSQL database on RDS.

> **Status:** this configuration has been written and statically checked
> (`terraform fmt`, tflint, a rendered-and-linted boot script) but **has not been
> applied to a real AWS account yet**. Expect to fix small things on the first
> `terraform apply`. Run `terraform validate` and read the `terraform plan`
> output before applying.

## Architecture

```
                 internet
                    │  HTTP :80
                    ▼
┌──────────────────────── VPC 10.0.0.0/16 ────────────────────────┐
│                                                                 │
│  public subnet 10.0.1.0/24                                      │
│  ┌───────────────────────────────────────────┐                  │
│  │ EC2 (Ubuntu 24.04) + Elastic IP           │                  │
│  │  docker compose -f docker-compose.prod.yml│                  │
│  │   ├─ web      nginx: React build,         │                  │
│  │   │           proxies /api and /admin     │                  │
│  │   └─ backend  gunicorn + Django           │                  │
│  └───────────────────┬───────────────────────┘                  │
│                      │ PostgreSQL :5432                         │
│  private subnets     ▼   (no route to the internet)             │
│  ┌───────────────────────────────────────────┐                  │
│  │ RDS PostgreSQL 16 (encrypted, backups)    │                  │
│  └───────────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘

SSM Parameter Store: DB password and Django secret key (encrypted)
IAM role on the EC2 instance: read those two parameters + Session Manager
```

## Files

| File | What it defines |
|---|---|
| `versions.tf` | Terraform and provider versions, the AWS provider, default tags |
| `variables.tf` | Inputs: region, instance sizes, repository, who may reach port 80 |
| `network.tf` | VPC, one public and two private subnets, internet gateway, routing |
| `security.tf` | Security groups: internet → web on 80, web → database on 5432 |
| `secrets.tf` | Generated DB password and Django secret key, stored in SSM Parameter Store |
| `iam.tf` | The instance's role: Session Manager access and read access to the two secrets |
| `database.tf` | RDS PostgreSQL instance and its subnet group |
| `compute.tf` | The EC2 instance, its Elastic IP and the boot script inputs |
| `user_data.sh.tftpl` | Boot script: install Docker, clone the repo, write `.env.prod`, start the stack |
| `outputs.tf` | App URL, instance id, shell command, database host |

## How a deployment works

1. `terraform apply` creates the network, the database, the secrets and the instance.
2. On first boot the instance runs `user_data.sh.tftpl`: it installs Docker, clones
   `repo_branch` of `repo_url`, reads the two secrets from Parameter Store using its
   IAM role, writes `.env.prod` and runs `docker compose -f docker-compose.prod.yml up -d --build`.
3. The backend container applies migrations and starts gunicorn; nginx serves the React
   build and proxies `/api` and `/admin` to it.

The branch being deployed must contain `docker-compose.prod.yml`, so merge and push the
deployment work to `main` (or set `repo_branch`) before applying.

## Usage

Prerequisites: an AWS account, [Terraform](https://developer.hashicorp.com/terraform/install)
1.10 or newer, and AWS credentials in your shell (for example `aws configure`).

```bash
cd infra/terraform
terraform init       # downloads the AWS and random providers
terraform validate   # checks the configuration against the provider schemas
terraform plan       # shows what would be created; changes nothing
terraform apply      # creates the resources (asks for confirmation)
```

After `apply`, wait a few minutes for the boot script, then open the `app_url` output.
To watch the boot script or run management commands, open a shell with the
`shell_command` output and then:

```bash
sudo tail -f /var/log/lapistracker-bootstrap.log
cd /opt/lapistracker
sudo docker compose -f docker-compose.prod.yml ps
sudo docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

To deploy new code: `cd /opt/lapistracker && sudo git pull && sudo docker compose -f docker-compose.prod.yml up -d --build`.

To remove everything: `terraform destroy`. A final database snapshot is kept unless
`db_skip_final_snapshot = true`.

## Cost

These resources are billed while they exist: the EC2 instance, the RDS instance and its
storage, the public IPv4 address and the instance's disk. At the default sizes expect
roughly a few tens of US dollars per month if left running; check the
[AWS Pricing Calculator](https://calculator.aws/) for current numbers and whether your
account's free-tier credits cover them. `terraform destroy` stops the charges.

## Design decisions

- **EC2 + Docker Compose rather than ECS/Kubernetes:** production runs the same Compose
  file that can be tested locally, and there is one server to reason about.
- **RDS rather than PostgreSQL in a container:** the data outlives the server. Backups,
  patching and storage are managed, and the instance can be replaced freely.
- **No SSH:** there is no port 22 and no key pair. Shell access uses SSM Session Manager,
  authorised through IAM.
- **Secrets in Parameter Store, not in the boot script:** user data can be read by anyone
  allowed to describe the instance, so the script only contains parameter names.
- **`user_data_replace_on_change = true`:** changing the boot script replaces the instance,
  so the server always matches the code in this folder.

## Known limitations (deliberately out of scope)

- **HTTP only.** There is no TLS, so the login password and API token travel
  unencrypted. Before using this for real data, put HTTPS in front: point a domain at
  the Elastic IP and add a certificate (for example certbot or Caddy on the instance, or
  an Application Load Balancer with an ACM certificate), open port 443, and set
  `DJANGO_HTTPS=1` and `DJANGO_CSRF_TRUSTED_ORIGINS`. Until then, restrict
  `allowed_http_cidrs` to your own IP.
- **Single instance, single AZ.** No load balancer, auto scaling or Multi-AZ database.
  A deploy or an instance failure means a short outage.
- **Images are built on the server.** A fuller pipeline would build images in CI, push
  them to a registry (ECR) and have the server pull them.
- **Local state by default.** The state file contains the generated secrets. Use the S3
  backend in `versions.tf` for anything shared.
- **No monitoring or alerting** beyond what AWS provides by default.
