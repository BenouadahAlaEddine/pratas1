# --- Données Existantes (VPC, IGW) ---
data "aws_vpc" "existing" {
  filter {
    name   = "tag:Name"
    values = [var.vpc_name]
  }
}

data "aws_internet_gateway" "existing" {
  filter {
    name   = "attachment.vpc-id"
    values = [data.aws_vpc.existing.id]
  }
}

# --- Réseau (Subnets & Route Tables) ---
resource "aws_route_table" "public_rt" {
  vpc_id = data.aws_vpc.existing.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = data.aws_internet_gateway.existing.id
  }
  tags = { Name = "kuikvengers_alaeddine_public_rt" }
}

resource "aws_subnet" "public" {
  vpc_id                  = data.aws_vpc.existing.id
  cidr_block              = cidrsubnet(data.aws_vpc.existing.cidr_block, 8, 229)
  map_public_ip_on_launch = true
  availability_zone       = var.az

  tags = { Name = "kuikvengers_alaeddine_public_subnet" }
}

resource "aws_route_table_association" "public_association" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public_rt.id
}

# Note: Le subnet privé et sa route table sont conservés si tu en as besoin plus tard, 
# mais nos 4 EC2 seront sur le subnet public pour simplifier l'accès initial.

# --- Security Group ---
resource "aws_security_group" "devops_sg" {
  name        = "kuikvengers-devops-sg"
  description = "Security group for DevOps tools and K8s"
  vpc_id      = data.aws_vpc.existing.id

  # SSH - Accès global (À RESTREINDRE à ton IP en prod)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Jenkins
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SonarQube
  ingress {
    from_port   = 9000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Kubernetes API Server (K3s)
  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Idéalement, restreindre aux nodes et Jenkins
  }

  # Kubelet API
  ingress {
    from_port   = 10250
    to_port     = 10250
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP/HTTPS pour l'application finale (Ingress)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "kuikvengers-devops-sg" }
}

# --- Instances EC2 ---

# 1. Jenkins Server
resource "aws_instance" "jenkins_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type_jenkins # Assure-toi d'avoir cette var (ex: t3.medium)
  subnet_id              = aws_subnet.public.id
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.devops_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              sudo yum update -y
              sudo yum install -y python3 git
              EOF

  tags = { 
    Name = "jenkins-server"
    Role = "ci-cd"
  }
}

# 2. SonarQube Server
resource "aws_instance" "sonarqube_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type_sonar # Assure-toi d'avoir cette var (ex: t3.medium)
  subnet_id              = aws_subnet.public.id
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.devops_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              sudo yum update -y
              sudo yum install -y python3
              EOF

  tags = { 
    Name = "sonarqube-server"
    Role = "quality"
  }
}

# 3. K8s Master Node
resource "aws_instance" "k8s_master" {
  ami                    = var.ami_id
  instance_type          = var.instance_type_k8s # Assure-toi d'avoir cette var (ex: t3.small/medium)
  subnet_id              = aws_subnet.public.id
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.devops_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              sudo yum update -y
              sudo yum install -y python3
              EOF

  tags = { 
    Name = "k8s-master"
    Role = "kubernetes-control-plane"
  }
}

# 4. K8s Worker Node
resource "aws_instance" "k8s_worker" {
  ami                    = var.ami_id
  instance_type          = var.instance_type_k8s_worker # Assure-toi d'avoir cette var (ex: t3.large)
  subnet_id              = aws_subnet.public.id
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.devops_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              sudo yum update -y
              sudo yum install -y python3
              EOF

  tags = { 
    Name = "k8s-worker"
    Role = "kubernetes-worker"
  }
}

# --- Outputs ---
output "jenkins_public_ip" {
  value = aws_instance.jenkins_server.public_ip
}

output "sonarqube_public_ip" {
  value = aws_instance.sonarqube_server.public_ip
}

output "k8s_master_public_ip" {
  value = aws_instance.k8s_master.public_ip
}

output "k8s_worker_public_ip" {
  value = aws_instance.k8s_worker.public_ip
}