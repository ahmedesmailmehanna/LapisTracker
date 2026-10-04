variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "eu-central-1" # Frankfurt
}

variable "project_name" {
  description = "Prefix for resource names and the Project tag."
  type        = string
  default     = "lapistracker"
}

variable "instance_type" {
  description = "EC2 instance type for the app server. The React build needs about 2 GB of memory, so avoid sizes with less unless the swap file is enough."
  type        = string
  default     = "t3.small"
}

variable "db_instance_class" {
  description = "RDS instance class for PostgreSQL."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Database disk size in GB."
  type        = number
  default     = 20
}

variable "db_skip_final_snapshot" {
  description = "If false, 'terraform destroy' takes a final snapshot of the database before deleting it."
  type        = bool
  default     = false
}

variable "allowed_http_cidrs" {
  description = "IP ranges allowed to reach the site on port 80. Restrict to your own IP (e.g. [\"203.0.113.10/32\"]) for a private deployment."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "repo_url" {
  description = "Git repository the server clones the application from."
  type        = string
  default     = "https://github.com/ahmedesmailmehanna/LapisTracker.git"
}

variable "repo_branch" {
  description = "Branch to deploy. It must contain docker-compose.prod.yml."
  type        = string
  default     = "main"
}

variable "allow_registration" {
  description = "Whether the API accepts new sign-ups (DJANGO_ALLOW_REGISTRATION)."
  type        = bool
  default     = true
}
