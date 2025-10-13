/*resource "aws_vpc" "tictactoe_vpc" {
  cidr_block = "10.0.0.0/16"
  enable_dns_support = true
  enable_dns_hostnames = true
  tags = {
    Name = "tictactoe_vpc"
  }
}
resource "aws_subnet" "tictactoe_subnet" {
  vpc_id = aws_vpc.tictactoe_vpc.id
  cidr_block = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  tags = {
    Name = "tictactoe_subnet"
  }
}
resource "aws_internet_gateway" "tictactoe_igw" {
  vpc_id = aws_vpc.tictactoe_vpc.id
  tags = {
    Name = "tictactoe_igw"
  }
}
resource "aws_route_table" "tictactoe_rt" {
  vpc_id = aws_vpc.tictactoe_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.tictactoe_igw.id
  }
  tags = {
    Name = "tictactoe_rt"
  }
}
resource "aws_route_table_association" "tictactoe_rta" {
  subnet_id = aws_subnet.tictactoe_subnet.id
  route_table_id = aws_route_table.tictactoe_rt.id
}
resource "aws_security_group" "tictactoe_sg" {
  name        = "tictactoe_sg"
  description = "Allow web traffic"
  vpc_id      = aws_vpc.tictactoe_vpc.id
  ingress {
    from_port = 80
    to_port = 80
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port = 443
    to_port = 443
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port = 8080
    to_port = 8080
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port = 22
    to_port = 22
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port = 3000
    to_port = 3000
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port = 0
    to_port = 0
    protocol = "-1" # all ports
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name = "tictactoe_sg"
  }
}
*/
/*aws_internet_gateway - łączenie się z rzeczami z VPC z internetu (szczególnie do apki)
aws_route_table - tablica routingu dla VPC
aws_route_table_association - asocjacja internet_gateway z route_table
aws_security_group - security grupa, gdzie definiujesz jakie za pomocą jakich reguł możesz się łączyć z zewnątrz (jakie adresy IP, czy wszystkie czy określone, z jakich portów itp.)*/