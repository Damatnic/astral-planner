# Quantum's Bulletproof Infrastructure for Astral Planner
# Cloud-Native Architecture with Auto-Scaling and 99.99% Uptime

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.4"
    }
  }
  
  backend "s3" {
    bucket  = "astral-planner-terraform-state"
    key     = "infrastructure/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
    
    dynamodb_table = "astral-planner-terraform-locks"
  }
}

# Provider Configuration
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "astral-planner"
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = "quantum-devops"
    }
  }
}

# Local Variables
locals {
  cluster_name = "astral-planner-${var.environment}"
  
  common_tags = {
    Project     = "astral-planner"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Data Sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${local.cluster_name}-vpc"
  cidr = var.vpc_cidr

  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets = [for k, v in slice(data.aws_availability_zones.available.names, 0, 3) : cidrsubnet(var.vpc_cidr, 8, k)]
  public_subnets  = [for k, v in slice(data.aws_availability_zones.available.names, 0, 3) : cidrsubnet(var.vpc_cidr, 8, k + 10)]

  enable_nat_gateway     = true
  single_nat_gateway     = false
  enable_vpn_gateway     = false
  enable_dns_hostnames   = true
  enable_dns_support     = true

  # VPC Flow Logs
  enable_flow_log                      = true
  create_flow_log_cloudwatch_iam_role  = true
  create_flow_log_cloudwatch_log_group = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
    "kubernetes.io/cluster/${local.cluster_name}" = "owned"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
    "kubernetes.io/cluster/${local.cluster_name}" = "owned"
  }

  tags = local.common_tags
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = local.cluster_name
  cluster_version = var.kubernetes_version

  vpc_id                          = module.vpc.vpc_id
  subnet_ids                      = module.vpc.private_subnets
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  # Cluster encryption
  cluster_encryption_config = {
    provider_key_arn = aws_kms_key.eks.arn
    resources        = ["secrets"]
  }

  # CloudWatch Logging
  cluster_enabled_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  # IRSA
  enable_irsa = true

  # Managed Node Groups
  eks_managed_node_groups = {
    general = {
      name = "general"
      
      instance_types = ["c6i.large", "c6i.xlarge", "c6i.2xlarge"]
      capacity_type  = "SPOT"
      
      min_size     = 3
      max_size     = 100
      desired_size = 5

      disk_size = 50
      disk_type = "gp3"

      labels = {
        Environment = var.environment
        NodeType    = "general"
      }

      taints = []

      update_config = {
        max_unavailable_percentage = 25
      }

      # Launch template
      create_launch_template = true
      launch_template_name   = "${local.cluster_name}-general"
      
      vpc_security_group_ids = [aws_security_group.worker_group.id]
    }

    gpu = {
      name = "gpu"
      
      instance_types = ["g4dn.xlarge", "g4dn.2xlarge"]
      capacity_type  = "ON_DEMAND"
      
      min_size     = 0
      max_size     = 10
      desired_size = 0

      disk_size = 100
      disk_type = "gp3"

      labels = {
        Environment = var.environment
        NodeType    = "gpu"
        nvidia.com/gpu = "true"
      }

      taints = [
        {
          key    = "nvidia.com/gpu"
          value  = "true"
          effect = "NO_SCHEDULE"
        }
      ]

      # Launch template
      create_launch_template = true
      launch_template_name   = "${local.cluster_name}-gpu"
      
      vpc_security_group_ids = [aws_security_group.worker_group.id]
    }
  }

  # Fargate Profiles
  fargate_profiles = {
    karpenter = {
      name = "karpenter"
      selectors = [
        {
          namespace = "karpenter"
        }
      ]
    }
    
    monitoring = {
      name = "monitoring"
      selectors = [
        {
          namespace = "monitoring"
        }
      ]
    }
  }

  tags = local.common_tags
}

# KMS Key for EKS
resource "aws_kms_key" "eks" {
  description             = "EKS Secret Encryption Key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "eks" {
  name          = "alias/eks-${local.cluster_name}"
  target_key_id = aws_kms_key.eks.key_id
}

# Security Groups
resource "aws_security_group" "worker_group" {
  name_prefix = "${local.cluster_name}-worker-group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-worker-group"
  })
}

# RDS Aurora PostgreSQL
module "aurora" {
  source = "terraform-aws-modules/rds-aurora/aws"
  version = "~> 8.0"

  name              = "${local.cluster_name}-aurora"
  engine            = "aurora-postgresql"
  engine_version    = "15.3"
  instance_class    = var.db_instance_class
  instances = {
    1 = {
      instance_class = var.db_instance_class
      publicly_accessible = false
    }
    2 = {
      instance_class = var.db_instance_class
      publicly_accessible = false
    }
  }

  vpc_id               = module.vpc.vpc_id
  db_subnet_group_name = module.vpc.database_subnet_group_name
  security_group_rules = {
    vpc_ingress = {
      cidr_blocks = [module.vpc.vpc_cidr_block]
    }
  }

  # Backup Configuration
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Performance Insights
  performance_insights_enabled = true
  performance_insights_retention_period = 7

  # Monitoring
  monitoring_interval = 60
  
  # Encryption
  storage_encrypted = true
  kms_key_id       = aws_kms_key.rds.arn

  # Auto Scaling
  autoscaling_enabled      = true
  autoscaling_min_capacity = 2
  autoscaling_max_capacity = 16

  tags = local.common_tags
}

# KMS Key for RDS
resource "aws_kms_key" "rds" {
  description             = "RDS Aurora Encryption Key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "rds" {
  name          = "alias/rds-${local.cluster_name}"
  target_key_id = aws_kms_key.rds.key_id
}

# ElastiCache Redis Cluster
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.cluster_name}-redis"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id         = "${local.cluster_name}-redis"
  description                  = "Redis cluster for Astral Planner"
  
  port                         = 6379
  parameter_group_name         = "default.redis7"
  node_type                    = var.redis_node_type
  num_cache_clusters           = 3
  
  engine_version               = "7.0"
  at_rest_encryption_enabled   = true
  transit_encryption_enabled   = true
  auth_token                   = random_password.redis_auth.result
  
  subnet_group_name            = aws_elasticache_subnet_group.redis.name
  security_group_ids           = [aws_security_group.redis.id]
  
  # Backup Configuration
  snapshot_retention_limit     = 7
  snapshot_window             = "03:00-05:00"
  maintenance_window          = "sun:05:00-sun:07:00"
  
  # Auto Failover
  automatic_failover_enabled   = true
  multi_az_enabled            = true

  tags = local.common_tags
}

resource "aws_security_group" "redis" {
  name_prefix = "${local.cluster_name}-redis"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.worker_group.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-redis"
  })
}

resource "random_password" "redis_auth" {
  length  = 32
  special = true
}

# S3 Buckets for Storage
resource "aws_s3_bucket" "app_storage" {
  bucket = "${local.cluster_name}-app-storage"
  
  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.s3.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# KMS Key for S3
resource "aws_kms_key" "s3" {
  description             = "S3 Bucket Encryption Key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "s3" {
  name          = "alias/s3-${local.cluster_name}"
  target_key_id = aws_kms_key.s3.key_id
}

# Application Load Balancer
resource "aws_lb" "app" {
  name               = "${local.cluster_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = false
  enable_http2              = true
  enable_cross_zone_load_balancing = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "alb"
    enabled = true
  }

  tags = local.common_tags
}

resource "aws_security_group" "alb" {
  name_prefix = "${local.cluster_name}-alb"
  vpc_id      = module.vpc.vpc_id

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

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-alb"
  })
}

# S3 Bucket for ALB Logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "${local.cluster_name}-alb-logs"
  
  tags = local.common_tags
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "delete_old_logs"
    status = "Enabled"

    expiration {
      days = 30
    }
  }
}

# Route53 Hosted Zone (if managing DNS)
resource "aws_route53_zone" "main" {
  count = var.manage_dns ? 1 : 0
  name  = var.domain_name
  
  tags = local.common_tags
}

# ACM Certificate
resource "aws_acm_certificate" "main" {
  count           = var.manage_dns ? 1 : 0
  domain_name     = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = local.common_tags
}

# Secrets Manager for Application Secrets
resource "aws_secretsmanager_secret" "app_secrets" {
  name_prefix             = "${local.cluster_name}-app-secrets"
  description             = "Application secrets for Astral Planner"
  recovery_window_in_days = 7
  kms_key_id             = aws_kms_key.secrets.arn

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    database_url = "postgresql://${module.aurora.cluster_master_username}:${module.aurora.cluster_master_password}@${module.aurora.cluster_endpoint}:5432/${module.aurora.cluster_database_name}"
    redis_url    = "redis://:${random_password.redis_auth.result}@${aws_elasticache_replication_group.redis.primary_endpoint_address}:6379"
    clerk_secret_key = var.clerk_secret_key
    openai_api_key = var.openai_api_key
  })
}

# KMS Key for Secrets Manager
resource "aws_kms_key" "secrets" {
  description             = "Secrets Manager Encryption Key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/secrets-${local.cluster_name}"
  target_key_id = aws_kms_key.secrets.key_id
}

# IAM Roles for Kubernetes Service Accounts
module "irsa_external_secrets" {
  source = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name = "${local.cluster_name}-external-secrets"

  attach_external_secrets_policy = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["external-secrets:external-secrets"]
    }
  }

  tags = local.common_tags
}

module "irsa_alb_controller" {
  source = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name = "${local.cluster_name}-alb-controller"

  attach_load_balancer_controller_policy = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:aws-load-balancer-controller"]
    }
  }

  tags = local.common_tags
}

module "irsa_cluster_autoscaler" {
  source = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name = "${local.cluster_name}-cluster-autoscaler"

  attach_cluster_autoscaler_policy = true
  cluster_autoscaler_cluster_names = [local.cluster_name]

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:cluster-autoscaler"]
    }
  }

  tags = local.common_tags
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/eks/${local.cluster_name}/application"
  retention_in_days = 14
  kms_key_id       = aws_kms_key.logs.arn

  tags = local.common_tags
}

# KMS Key for CloudWatch Logs
resource "aws_kms_key" "logs" {
  description             = "CloudWatch Logs Encryption Key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "logs" {
  name          = "alias/logs-${local.cluster_name}"
  target_key_id = aws_kms_key.logs.key_id
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name              = "${local.cluster_name}-alerts"
  kms_master_key_id = aws_kms_key.sns.arn

  tags = local.common_tags
}

# KMS Key for SNS
resource "aws_kms_key" "sns" {
  description             = "SNS Topic Encryption Key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "sns" {
  name          = "alias/sns-${local.cluster_name}"
  target_key_id = aws_kms_key.sns.key_id
}