# Terraform generates the two secrets, so nobody has to invent or type them.
# They are stored encrypted in SSM Parameter Store, and the app server reads
# them at boot using its IAM role (see iam.tf and user_data.sh.tftpl).
#
# Note: the generated values also end up in the Terraform state file. Treat
# the state as a secret (see versions.tf).

resource "random_password" "db" {
  length  = 32
  special = false # letters and digits only: nothing to escape in .env files
}

resource "random_password" "django_secret_key" {
  length  = 64
  special = false
}

resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.project_name}/db_password"
  type  = "SecureString"
  value = random_password.db.result
}

resource "aws_ssm_parameter" "django_secret_key" {
  name  = "/${var.project_name}/django_secret_key"
  type  = "SecureString"
  value = random_password.django_secret_key.result
}
