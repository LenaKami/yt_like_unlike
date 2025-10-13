/*provider "aws" {
  region = "us-east-1"
}

resource "aws_elastic_beanstalk_application" "frontend" {
  name = "frontend"
}

resource "aws_elastic_beanstalk_environment" "frontend_env" {
  name                = "frontend-env"
  application         = aws_elastic_beanstalk_application.frontend.name
  solution_stack_name = "64bit Amazon Linux 2 v5.8.4 running Node.js 14"
}

resource "aws_elastic_beanstalk_application" "backend" {
  name = "backend"
}

resource "aws_elastic_beanstalk_environment" "backend_env" {
  name                = "backend-env"
  application         = aws_elastic_beanstalk_application.backend.name
  solution_stack_name = "64bit Amazon Linux 2 v5.8.4 running Node.js 14"
}

resource "aws_db_instance" "rds" {
  identifier           = "database-1"
  engine              = "mysql"
  instance_class      = "db.t3.micro"
  allocated_storage   = 20
  username           = "admin"
  storage_type       = "gp2"
  password           = "admin123"
  parameter_group_name   = "default..."
  publicly_accessible = false
  skip_final_snapshot = true
}

resource "aws_s3_bucket" "app_storage" {
  bucket = "my-app-storage-bucket"
}

resource "aws_cloudwatch_log_group" "frontend_logs" {
  name = "/aws/elasticbeanstalk/frontend-env"
}

resource "aws_cloudwatch_log_group" "backend_logs" {
  name = "/aws/elasticbeanstalk/backend-env"
}
*/

