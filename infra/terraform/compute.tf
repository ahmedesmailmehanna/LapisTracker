# The app server: one EC2 instance that runs docker-compose.prod.yml
# (nginx + gunicorn). All persistent data lives in RDS, so the instance is
# disposable: Terraform can replace it and the app comes back with its data.

# Canonical publishes the current Ubuntu AMI id as a public SSM parameter,
# so the config never hard-codes a region-specific, ageing AMI id.
data "aws_ssm_parameter" "ubuntu_ami" {
  name = "/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id"
}

# A fixed public IP that survives instance replacement.
resource "aws_eip" "web" {
  domain = "vpc"

  tags = { Name = "${var.project_name}-web" }
}

resource "aws_instance" "web" {
  # SSM parameter values are marked sensitive by default; an AMI id is not a
  # secret, so unmark it to keep "terraform plan" output readable.
  ami           = nonsensitive(data.aws_ssm_parameter.ubuntu_ami.value)
  instance_type = var.instance_type

  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile   = aws_iam_instance_profile.web.name

  # The boot script. It installs Docker, clones the repository, writes
  # .env.prod and starts the stack. Changing it replaces the instance so
  # the server always matches this configuration.
  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    aws_region                  = var.aws_region
    repo_url                    = var.repo_url
    repo_branch                 = var.repo_branch
    elastic_ip                  = aws_eip.web.public_ip
    allow_registration          = var.allow_registration ? "1" : "0"
    db_host                     = aws_db_instance.main.address
    db_password_parameter       = aws_ssm_parameter.db_password.name
    django_secret_key_parameter = aws_ssm_parameter.django_secret_key.name
  })
  user_data_replace_on_change = true

  # Require IMDSv2 (session tokens) for the instance metadata service.
  metadata_options {
    http_tokens = "required"
  }

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  tags = { Name = "${var.project_name}-web" }

  # The boot script downloads packages, so the route to the internet must
  # exist before the instance starts.
  depends_on = [aws_route_table_association.public]
}

resource "aws_eip_association" "web" {
  instance_id   = aws_instance.web.id
  allocation_id = aws_eip.web.id
}
