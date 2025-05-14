# AWS Secrets Manager configuration for the project

provider "aws" {
  region = var.aws_region
}

# Database credentials secret
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${var.environment}/trading-app/db-credentials"
  description = "Database credentials for the Trading App"
  
  tags = {
    Environment = var.environment
    Project     = "trading-app"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id     = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
  })
}

# JWT secret
resource "aws_secretsmanager_secret" "jwt_secret" {
  name        = "${var.environment}/trading-app/jwt-secret"
  description = "JWT secret for authentication"
  
  tags = {
    Environment = var.environment
    Project     = "trading-app"
  }
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}

# Redis password
resource "aws_secretsmanager_secret" "redis_password" {
  name        = "${var.environment}/trading-app/redis-password"
  description = "Redis password for caching"
  
  tags = {
    Environment = var.environment
    Project     = "trading-app"
  }
}

resource "aws_secretsmanager_secret_version" "redis_password" {
  secret_id     = aws_secretsmanager_secret.redis_password.id
  secret_string = var.redis_password
}

# Analytics ID
resource "aws_secretsmanager_secret" "analytics_id" {
  name        = "${var.environment}/trading-app/analytics-id"
  description = "Analytics ID for tracking"
  
  tags = {
    Environment = var.environment
    Project     = "trading-app"
  }
}

resource "aws_secretsmanager_secret_version" "analytics_id" {
  secret_id     = aws_secretsmanager_secret.analytics_id.id
  secret_string = var.analytics_id
}

# Output the ARNs of the secrets for use in other modules
output "db_credentials_secret_arn" {
  value       = aws_secretsmanager_secret.db_credentials.arn
  description = "ARN of the secret containing database credentials"
}

output "jwt_secret_arn" {
  value       = aws_secretsmanager_secret.jwt_secret.arn
  description = "ARN of the secret containing the JWT secret"
}

output "redis_password_secret_arn" {
  value       = aws_secretsmanager_secret.redis_password.arn
  description = "ARN of the secret containing the Redis password"
}

output "analytics_id_secret_arn" {
  value       = aws_secretsmanager_secret.analytics_id.arn
  description = "ARN of the secret containing the analytics ID"
}

# Variables for this module
variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "The deployment environment (staging or production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "The environment must be either 'staging' or 'production'."
  }
}

variable "db_username" {
  description = "Username for the database"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Password for the database"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secret key for JWT authentication"
  type        = string
  sensitive   = true
}

variable "redis_password" {
  description = "Password for Redis"
  type        = string
  sensitive   = true
}

variable "analytics_id" {
  description = "Analytics ID for tracking"
  type        = string
  sensitive   = true
}
