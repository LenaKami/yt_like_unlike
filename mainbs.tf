provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "app_bucket" {
  bucket = "my-app-bucket-aws-${random_id.s3_suffix.hex}"
  force_destroy = true
}


resource "random_id" "s3_suffix" {
  byte_length = 8
}

resource "aws_s3_bucket_public_access_block" "app_bucket_access" {
  bucket = aws_s3_bucket.app_bucket.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "app_bucket_policy" {
  bucket = aws_s3_bucket.app_bucket.id
  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "${aws_s3_bucket.app_bucket.arn}/*"
    }
  ]
}
POLICY
  depends_on = [aws_s3_bucket_public_access_block.app_bucket_access]
}


resource "aws_db_instance" "app_db" {
  identifier           = "database-1"
  engine              = "mysql"
  instance_class      = "db.t3.micro"
  allocated_storage   = 20
  username           = "admin"
  storage_type       = "gp2"
  password           = "admin123"
  db_name            = "app_db"
  publicly_accessible = true
  skip_final_snapshot = true
}

resource "aws_elastic_beanstalk_application" "frontend" {
  name = "frontend-app"
}

resource "aws_elastic_beanstalk_application" "backend" {
  name = "backend-app"
}

resource "aws_elastic_beanstalk_environment" "frontend_env" {
  name                = "frontend-env"
  application         = aws_elastic_beanstalk_application.frontend.name
  solution_stack_name = "64bit Amazon Linux 2023 v4.5.0 running Docker"

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = "LabInstanceProfile"
  }
  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "ServiceRole"
    value     = "LabRole"
  }
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "EC2KeyName"
    value     = "vockey"
  }
}

resource "aws_elastic_beanstalk_environment" "backend_env" {
  name                = "backend-env"
  application         = aws_elastic_beanstalk_application.backend.name
  solution_stack_name = "64bit Amazon Linux 2023 v4.5.0 running Docker"
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = "LabInstanceProfile"
  }
  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "ServiceRole"
    value     = "LabRole"
  }
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "EC2KeyName"
    value     = "vockey"
  }
}

resource "aws_cognito_user_pool" "app_user_pool" {
  name = "app-user-pool"
  auto_verified_attributes = ["email" ]

  username_configuration {
    case_sensitive = false
  }

  # Pozwala logować się za pomocą email i preferred_username (czyli "login")
  alias_attributes = ["email", "preferred_username"]

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    string_attribute_constraints {
      min_length = 5
      max_length = 50
    }
  }

}


resource "aws_cognito_user_pool_client" "app_client" {
  name         = "app-client"
  user_pool_id = aws_cognito_user_pool.app_user_pool.id
  generate_secret = false
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_USER_AUTH"
  ]
}

resource "aws_cloudwatch_log_group" "app_logs" {
  name = "YTApplicationLogs"
}