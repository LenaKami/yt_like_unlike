# provider "aws" {
#   region = "us-east-1"
# }

# resource "aws_elastic_beanstalk_application" "frontend" {
#   name = "frontend"
# }

# resource "aws_elastic_beanstalk_environment" "frontend_env" {
#   name                = "frontend-env"
#   application         = aws_elastic_beanstalk_application.frontend.name
#   solution_stack_name = "64bit Amazon Linux 2023 v4.5.0 running Docker"

#   setting {
#         namespace = "aws:autoscaling:launchconfiguration"
#         name      = "IamInstanceProfile"
#         value     = "LabInstanceProfile"
#     }
#   setting {
#     namespace = "aws:elasticbeanstalk:application:environment"
#     name      = "REACT_APP_API_URL"
#     value     = var.react_app_api_url
#   }
# }

# resource "aws_elastic_beanstalk_application" "backend" {
#   name = "backend"
# }

# resource "random_id" "s3_suffix" {
#   byte_length = 8
# }

# output "beanstalk_deployments_bucket_name" {
#   value = aws_s3_bucket.beanstalk_deployments.bucket
# }


# resource "aws_s3_bucket" "beanstalk_deployments" {
#   bucket = "beanstalk-deployments-${random_id.s3_suffix.hex}"
# }

# resource "aws_s3_object" "backend_dockerrun" {
#   bucket = aws_s3_bucket.beanstalk_deployments.id
#   key    = "backend-docker-compose.zip" #widoczne w s3
#   source = "server/docker-compose.zip"
# }

# resource "aws_elastic_beanstalk_application_version" "backend_version" {
#   name        = "backend-v1"
#   application = aws_elastic_beanstalk_application.backend.name
#   bucket      = aws_s3_bucket.beanstalk_deployments.id
#   key         = aws_s3_object.backend_dockerrun.key
# }

# variable "db_password" {
#   description = "Hasło do bazy danych"
#   type        = string
#   sensitive   = true
# }

# variable "db_username" {
#   description = "Nazwa użytkownika bazy danych"
#   type        = string
# }

# resource "aws_vpc" "main_vpc" {
#   cidr_block           = "10.0.0.0/16"
#   enable_dns_support   = true
#   enable_dns_hostnames = true

#   tags = {
#     Name = "MainVPC"
#   }
# }

# resource "aws_subnet" "subnet1" {
#   vpc_id            = aws_vpc.main_vpc.id
#   cidr_block        = "10.0.1.0/24"
#   availability_zone = "us-east-1a"

#   tags = {
#     Name = "Subnet1"
#   }
# }

# resource "aws_subnet" "subnet2" {
#   vpc_id            = aws_vpc.main_vpc.id
#   cidr_block        = "10.0.2.0/24"
#   availability_zone = "us-east-1b"

#   tags = {
#     Name = "Subnet2"
#   }
# }



# resource "aws_internet_gateway" "gw" {
#   vpc_id = aws_vpc.main_vpc.id

#   tags = {
#     Name = "MainGateway"
#   }
# }

# resource "aws_route_table" "public" {
#   vpc_id = aws_vpc.main_vpc.id

#   route {
#     cidr_block = "0.0.0.0/0"
#     gateway_id = aws_internet_gateway.gw.id
#   }

#   tags = {
#     Name = "PublicRouteTable"
#   }
# }

# /*resource "aws_route_table_association" "public_assoc" {
#   subnet_id      = aws_subnet.main.id
#   route_table_id = aws_route_table.public.id
# }*/

# resource "aws_route_table_association" "public_assoc_subnet1" {
#   subnet_id      = aws_subnet.subnet1.id
#   route_table_id = aws_route_table.public.id
# }

# resource "aws_route_table_association" "public_assoc_subnet2" {
#   subnet_id      = aws_subnet.subnet2.id
#   route_table_id = aws_route_table.public.id
# }

# resource "aws_cloudwatch_log_group" "frontend_logs" {
#   name = "/aws/elasticbeanstalk/frontend"
# }

# resource "aws_cloudwatch_log_group" "backend_logs" {
#   name = "/aws/elasticbeanstalk/backend"
# }


# /*variable "vpc" {
#   description = "ID VPC, w którym będą uruchamiane instancje Elastic Beanstalk"
#   type        = string
# }

# variable "subnet1" {
#   description = "ID pierwszego subnetu VPC"
#   type        = string
# }

# # Zmienna dla Subnetu 2
# variable "subnet2" {
#   description = "ID drugiego subnetu VPC"
#   type        = string
# }*/


# resource "aws_security_group" "rds_sg" {
#   name        = "rds-security-group"
#   description = "Allow access to RDS from backend"
#   vpc_id      = aws_vpc.main_vpc.id

#   ingress {
#     from_port   = 3306
#     to_port     = 3306
#     protocol    = "tcp"
#     cidr_blocks = ["10.0.0.0/16"] # Ograniczamy do VPC
#   }

#   egress {
#     from_port   = 0
#     to_port     = 0
#     protocol    = "-1"
#     cidr_blocks = ["0.0.0.0/0"]
#   }

#   tags = {
#     Name = "RDS Security Group"
#   }
# }



# resource "aws_elastic_beanstalk_environment" "backend_env" {
#   name                = "backend-env"
#   application         = aws_elastic_beanstalk_application.backend.name
#   solution_stack_name = "64bit Amazon Linux 2023 v4.5.0 running Docker"
#   tier                = "WebServer"
#   version_label       = aws_elastic_beanstalk_application_version.backend_version.name
#   cname_prefix        = "frontend"

#   setting {
#     namespace = "aws:autoscaling:launchconfiguration"
#     name      = "InstanceType"
#     value     = "t3.small"
#   }

#   setting {
#     namespace = "aws:autoscaling:launchconfiguration"
#     name      = "EC2KeyName"
#     value     = "vockey"
#   }

#   setting {
#     namespace = "aws:autoscaling:launchconfiguration"
#     name      = "IamInstanceProfile"
#     value     = "LabInstanceProfile"
#   }

#   setting {
#     namespace = "aws:elasticbeanstalk:environment"
#     name      = "EnvironmentType"
#     value     = "SingleInstance"
#   }

#   setting {
#     namespace = "aws:ec2:vpc"
#     name      = "VPCId"
#     value     = aws_vpc.main_vpc.id
#   }

#   setting {
#     namespace = "aws:ec2:vpc"
#     name      = "Subnets"
#     value     = "${aws_subnet.subnet1.id}, ${aws_subnet.subnet2.id}"
#   }

#   setting {
#     namespace = "aws:ec2:vpc"
#     name      = "AssociatePublicIpAddress"
#     value     = "true"
#   }  

#   setting {
#     namespace = "aws:elasticbeanstalk:environment"
#     name      = "ServiceRole"
#     value     = "arn:aws:iam::055475727876:role/LabRole"
#   }

#   setting {
#     namespace = "aws:elasticbeanstalk:managedactions"
#     name      = "ManagedActionsEnabled"
#     value     = "false"
#   }
#   # Cloudwach 
#   setting {
#     namespace = "aws:cloudwatch:logs"
#     name      = "StreamLogs"
#     value     = "true"
#   }
#   setting {
#     namespace = "aws:cloudwatch:logs"
#     name      = "DeleteOnTerminate"
#     value     = "true"
#   }
# }
# # S3 do przechowywania wersji aplikacji
# resource "aws_s3_bucket" "app_bucket" {
#   bucket = "my-app-storage-bucket-${random_id.s3_suffix.hex}"
#   force_destroy = true
#   provider = aws

#   lifecycle {
#     prevent_destroy = false
#   }

#   tags = {
#     Name = "MyAppStorageBucket"
#   }
# }



# resource "aws_db_instance" "default" {
#   allocated_storage    = 20
#   storage_type         = "gp2"
#   engine               = "mysql"
#   engine_version       = "8.0.40"
#   instance_class       = "db.t3.small"
#   db_name              = "yt"
#   username             = var.db_username
#   password             = var.db_password
#   vpc_security_group_ids = [aws_security_group.rds_sg.id]
#   db_subnet_group_name = aws_db_subnet_group.default.name
#   multi_az             = false
#   publicly_accessible  = false
#   skip_final_snapshot  = true
# }

# resource "aws_db_subnet_group" "default" {
#   name        = "subnet_group"
#   subnet_ids  = [aws_subnet.subnet1.id, aws_subnet.subnet2.id]
#   description = "Database subnet group"
# }
