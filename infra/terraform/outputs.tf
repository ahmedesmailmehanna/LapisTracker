output "app_url" {
  description = "Where the app is reachable once the server has finished booting (a few minutes after apply)."
  value       = "http://${aws_eip.web.public_ip}"
}

output "instance_id" {
  description = "EC2 instance id of the app server."
  value       = aws_instance.web.id
}

output "shell_command" {
  description = "Open a shell on the server through SSM Session Manager (needs the AWS CLI and its Session Manager plugin)."
  value       = "aws ssm start-session --region ${var.aws_region} --target ${aws_instance.web.id}"
}

output "db_endpoint" {
  description = "Database host name. Only reachable from the app server."
  value       = aws_db_instance.main.address
}
