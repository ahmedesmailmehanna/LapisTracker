terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # State is kept in a local file (terraform.tfstate) by default. It contains
  # the generated passwords, so it is git-ignored and must not be shared.
  # For anything beyond a personal experiment, keep state in an encrypted S3
  # bucket instead by creating the bucket and uncommenting this block:
  #
  # backend "s3" {
  #   bucket       = "my-terraform-state-bucket"
  #   key          = "lapistracker/terraform.tfstate"
  #   region       = "eu-central-1"
  #   encrypt      = true
  #   use_lockfile = true
  # }
}

provider "aws" {
  region = var.aws_region

  # Every resource gets these tags, which makes the project's resources (and
  # their cost) easy to find in the AWS console.
  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "terraform"
    }
  }
}
