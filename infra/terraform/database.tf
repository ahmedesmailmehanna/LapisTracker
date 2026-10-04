# Managed PostgreSQL. RDS handles backups, minor-version patching and
# storage, which is the reason to use it instead of running PostgreSQL in a
# container on the app server.

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-db"

  engine         = "postgres"
  engine_version = "16" # same major version as docker-compose.yml
  instance_class = var.db_instance_class

  allocated_storage = var.db_allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = "lapistracker"
  username = "lapistracker"
  password = random_password.db.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = false

  backup_retention_period    = 7 # daily automatic backups kept for a week
  auto_minor_version_upgrade = true
  copy_tags_to_snapshot      = true

  skip_final_snapshot       = var.db_skip_final_snapshot
  final_snapshot_identifier = "${var.project_name}-final"
}
