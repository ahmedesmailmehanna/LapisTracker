# Security groups are the firewalls. Two rules matter:
#   internet -> app server : port 80 only
#   app server -> database : port 5432, and nothing else may reach the database

resource "aws_security_group" "web" {
  name        = "${var.project_name}-web"
  description = "App server: HTTP in, anything out"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_http_cidrs
  }

  # No port 22: shell access goes through SSM Session Manager (see iam.tf),
  # so there is no SSH port to attack and no key pair to manage.

  egress {
    description = "Outbound: package installs, git clone, AWS APIs, the database"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-web" }
}

resource "aws_security_group" "db" {
  name        = "${var.project_name}-db"
  description = "Database: PostgreSQL from the app server only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL from the app server"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    # The source is a security group, not an IP range: whatever instance is
    # in the web group is allowed, even after it is replaced.
    security_groups = [aws_security_group.web.id]
  }

  tags = { Name = "${var.project_name}-db" }
}
