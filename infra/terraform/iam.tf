# The IAM role is the app server's identity. It grants exactly two things:
#   1. SSM Session Manager access (a shell on the server without SSH).
#   2. Read access to this project's two secrets, and nothing else.

resource "aws_iam_role" "web" {
  name = "${var.project_name}-web"

  # Trust policy: only the EC2 service may assume this role.
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_session_manager" {
  role       = aws_iam_role.web.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "read_secrets" {
  name = "read-app-secrets"
  role = aws_iam_role.web.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "ssm:GetParameter"
      Resource = [
        aws_ssm_parameter.db_password.arn,
        aws_ssm_parameter.django_secret_key.arn,
      ]
    }]
  })
}

# An instance profile is the wrapper that attaches a role to an EC2 instance.
resource "aws_iam_instance_profile" "web" {
  name = "${var.project_name}-web"
  role = aws_iam_role.web.name
}
