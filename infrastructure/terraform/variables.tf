# Terraform Variables

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

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for the public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for the private subnets"
  type        = list(string)
  default     = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]
}

variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "trading"
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

variable "frontend_image" {
  description = "Docker image for the frontend"
  type        = string
}

variable "backend_image" {
  description = "Docker image for the backend"
  type        = string
}

variable "rust_image" {
  description = "Docker image for the Rust services"
  type        = string
}

variable "cpp_image" {
  description = "Docker image for the C++ components"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate for HTTPS"
  type        = string
}

variable "route53_zone_id" {
  description = "ID of the Route53 hosted zone"
  type        = string
}

variable "analytics_id_secret_arn" {
  description = "ARN of the secret containing the analytics ID"
  type        = string
}

variable "db_credentials_secret_arn" {
  description = "ARN of the secret containing database credentials"
  type        = string
}

variable "jwt_secret_arn" {
  description = "ARN of the secret containing the JWT secret"
  type        = string
}

variable "redis_password_secret_arn" {
  description = "ARN of the secret containing the Redis password"
  type        = string
}

variable "alert_email" {
  description = "Email address to send alerts to"
  type        = string
}
