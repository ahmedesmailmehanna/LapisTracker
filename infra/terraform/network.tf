# Network layout:
#
#   VPC 10.0.0.0/16
#   ├── public subnet   10.0.1.0/24   (AZ a)  -> app server, reachable from the internet
#   ├── private subnet  10.0.11.0/24  (AZ a)  -> database
#   └── private subnet  10.0.12.0/24  (AZ b)  -> database (RDS requires two AZs)
#
# Only the public subnet has a route to the internet gateway. The private
# subnets have no route out at all, so the database cannot be reached from
# (or reach) the internet.

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.project_name}-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "${var.project_name}-igw" }
}

resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = { Name = "${var.project_name}-public" }
}

resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${11 + count.index}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = { Name = "${var.project_name}-private-${count.index + 1}" }
}

# Route table for the public subnet: send everything that is not local
# traffic to the internet gateway.
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.project_name}-public" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
