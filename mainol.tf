/*provider "aws" {
  region = "us-east-1"  # Change to your preferred AWS region
}

# -------------------------
# S3 Bucket for Beanstalk Deployment Packages
# -------------------------
resource "aws_s3_bucket" "beanstalk_deployments" {
  bucket = "beanstalk-deployments-${random_id.s3_suffix.hex}"
}

resource "random_id" "s3_suffix" {
  byte_length = 8
}

# -------------------------
# Backend: Elastic Beanstalk (Docker)
# -------------------------
resource "aws_elastic_beanstalk_application" "backend_app" {
  name        = "backend-app"
  description = "Spring Boot backend hosted on Elastic Beanstalk"
}

resource "aws_s3_object" "backend_dockerrun" {
  bucket = aws_s3_bucket.beanstalk_deployments.id
  key    = "cloud_backend-master/Dockerrun.aws.json"
  source = "cloud_backend-master/Dockerrun.aws.json"
}

resource "aws_elastic_beanstalk_application_version" "backend_version" {
  name        = "backend-v1"
  application = aws_elastic_beanstalk_application.backend_app.name
  bucket      = aws_s3_bucket.beanstalk_deployments.id
  key         = aws_s3_object.backend_dockerrun.key
}

resource "aws_elastic_beanstalk_environment" "backend_env" {
  name                = "backend-env"
  application         = aws_elastic_beanstalk_application.backend_app.name
  solution_stack_name = "64bit Amazon Linux 2 v4.0.8 running Docker"
  version_label       = aws_elastic_beanstalk_application_version.backend_version.name

    setting {
        namespace = "aws:elasticbeanstalk:environment"
        name      = "EnvironmentType"
        value     = "SingleInstance"
    }

    setting {
        namespace = "aws:autoscaling:launchconfiguration"
        name      = "IamInstanceProfile"
        value     = "LabInstanceProfile"
    }

    setting {
        namespace = "aws:autoscaling:launchconfiguration"
        name      = "EC2KeyName"
        value     = "vockey"
    }

    # Define VPC
    setting {
        namespace = "aws:ec2:vpc"
        name      = "VPCId"
        value     = aws_vpc.app_vpc.id
    }

    # Use public IP address
    setting {
        namespace = "aws:ec2:vpc"
        name      = "AssociatePublicIpAddress"
        value     = "true"
    }

    # Define Subnet
    setting {
        namespace = "aws:ec2:vpc"
        name      = "Subnets"
        value     = aws_subnet.app_subnet.id
    }

    setting {
        namespace = "aws:autoscaling:launchconfiguration"
        name = "SecurityGroups"
        value = aws_security_group.app_sg.id
    }

    setting {
        namespace = "aws:elasticbeanstalk:application:environment"
        name      = "SPRING_DATASOURCE_URL"
        value     = "jdbc:postgresql://${aws_db_instance.backend_db.endpoint}/backend"
    }

    setting {
        namespace = "aws:elasticbeanstalk:application:environment"
        name      = "SPRING_DATASOURCE_USERNAME"
        value     = aws_db_instance.backend_db.username
    }

    setting {
        namespace = "aws:elasticbeanstalk:application:environment"
        name      = "SPRING_DATASOURCE_PASSWORD"
        value     = aws_db_instance.backend_db.password
    }
}

# Create VPC for the environment
resource "aws_vpc" "app_vpc" {
    cidr_block = "10.0.0.0/16"
    enable_dns_support = true
    enable_dns_hostnames = true
}

# Create subnet for the environment
resource "aws_subnet" "app_subnet" {
    vpc_id     = aws_vpc.app_vpc.id
    cidr_block = "10.0.1.0/24"
    availability_zone = "us-east-1a"
}

# Create gateway for the environment
resource "aws_internet_gateway" "gateway" {
    vpc_id = aws_vpc.app_vpc.id
}

# Create route table for the environment
resource "aws_route_table" "route_table" {
    vpc_id = aws_vpc.app_vpc.id

    route {
        cidr_block = "0.0.0.0/0"
        gateway_id = aws_internet_gateway.gateway.id
    }
}

# Associate route table with subnet
resource "aws_route_table_association" "route_table_association" {
    subnet_id      = aws_subnet.app_subnet.id
    route_table_id = aws_route_table.route_table.id
}

resource "aws_security_group" "app_sg" {
    vpc_id = aws_vpc.app_vpc.id

    ingress {
        from_port   = 8081
        to_port     = 8081
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
    }


    ingress {
        from_port   = 8080
        to_port     = 8081
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
    }

    ingress {
        from_port   = 22
        to_port     = 22
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
    }

    egress {
        from_port   = 0
        to_port     = 0
        protocol    = "-1"
        cidr_blocks = ["0.0.0.0/0"]
    }
}

# -------------------------
# Backend RDS PostgreSQL Database
# -------------------------
resource "aws_db_instance" "backend_db" {
    identifier             = "backend-db"
    engine                 = "postgres"
    engine_version         = "17.3"
    instance_class         = "db.t3.micro"
    allocated_storage      = 20
    storage_type           = "gp2"
    username               = "postgresusername"
    password               = "postgrespassword"
    parameter_group_name   = "default.postgres17"
    publicly_accessible    = false
    skip_final_snapshot    = true

    # provisioner "local-exec" {
    #     command = <<EOT
    #         psql -h ${self.endpoint} -p 5432 -U ${self.username} -d postgres -c "CREATE DATABASE backend;"
    #     EOT

    #     environment = {
    #         PGPASSWORD = "${self.password}"
    #     }
    # }
}

# -------------------------
# Frontend: Elastic Beanstalk (Docker)
# -------------------------
resource "aws_elastic_beanstalk_application" "frontend_app" {
    name        = "frontend-app"
    description = "Frontend hosted on Elastic Beanstalk (Docker)"
}

resource "aws_elastic_beanstalk_environment" "frontend_env" {
    name                = "frontend-env"
    application         = aws_elastic_beanstalk_application.frontend_app.name
    solution_stack_name = "64bit Amazon Linux 2 v4.0.8 running Docker"

    setting {
        namespace = "aws:autoscaling:launchconfiguration"
        name      = "InstanceType"
        value     = "t2.micro"
    }

    setting {
        namespace = "aws:autoscaling:launchconfiguration"
        name      = "IamInstanceProfile"
        value     = "LabInstanceProfile"
    }


    setting {
        namespace = "aws:elasticbeanstalk:environment"
        name      = "EnvironmentType"
        value     = "SingleInstance"
    }

    # setting {
    #     namespace = "aws:autoscaling:launchconfiguration"
    #     name      = "EC2KeyName"
    #     value     = "vockey"
    # }

    setting {
        namespace = "aws:elasticbeanstalk:application:environment"
        name      = "PUBLIC_API_IP"
        value     = aws_elastic_beanstalk_environment.backend_env.endpoint_url
    }

        setting {
        namespace = "aws:elasticbeanstalk:application:environment"
        name      = "PUBLIC_API_PORT"
        value     = "8081"
    }
}

# -------------------------
# Outputs
# -------------------------
output "backend_elastic_beanstalk_url" {
  value = aws_elastic_beanstalk_environment.backend_env.endpoint_url
}

output "backend_rds_endpoint" {
  value = aws_db_instance.backend_db.endpoint
}

output "frontend_elastic_beanstalk_url" {
  value = aws_elastic_beanstalk_environment.frontend_env.endpoint_url
}*/