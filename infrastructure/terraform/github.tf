# GitHub repository configuration using Terraform with the GitHub provider

provider "github" {
  token = var.github_token # Set this using environment variables or Terraform Cloud variables
  owner = var.github_owner
}

# Main repository
resource "github_repository" "trading_app" {
  name        = "stock-trading-app"
  description = "Advanced Stock Market Trading Application"
  visibility  = "private"
  
  has_issues        = true
  has_projects      = true
  has_wiki          = true
  has_downloads     = true
  allow_merge_commit = true
  allow_squash_merge = true
  allow_rebase_merge = true
  
  delete_branch_on_merge = true
  vulnerability_alerts   = true
  
  topics = [
    "trading",
    "finance",
    "nextjs",
    "golang",
    "rust",
    "cpp",
    "microservices"
  ]
}

# Branch protection for main branch
resource "github_branch_protection" "main" {
  repository_id = github_repository.trading_app.node_id
  pattern       = "main"
  
  required_status_checks {
    strict   = true
    contexts = [
      "lint",
      "test-frontend",
      "test-backend",
      "test-rust",
      "test-cpp",
      "e2e-tests",
      "build-docker-images"
    ]
  }
  
  required_pull_request_reviews {
    dismiss_stale_reviews           = true
    require_code_owner_reviews      = true
    required_approving_review_count = 1
  }
  
  enforce_admins = true
  
  push_restrictions = []
}

# Branch protection for develop branch
resource "github_branch_protection" "develop" {
  repository_id = github_repository.trading_app.node_id
  pattern       = "develop"
  
  required_status_checks {
    strict   = true
    contexts = [
      "lint",
      "test-frontend",
      "test-backend",
      "test-rust",
      "test-cpp",
      "e2e-tests"
    ]
  }
  
  required_pull_request_reviews {
    dismiss_stale_reviews           = true
    require_code_owner_reviews      = false
    required_approving_review_count = 1
  }
  
  enforce_admins = false
  
  push_restrictions = []
}

# GitHub Actions secrets
resource "github_actions_secret" "aws_access_key" {
  repository      = github_repository.trading_app.name
  secret_name     = "AWS_ACCESS_KEY_ID"
  plaintext_value = var.aws_access_key_id
}

resource "github_actions_secret" "aws_secret_key" {
  repository      = github_repository.trading_app.name
  secret_name     = "AWS_SECRET_ACCESS_KEY"
  plaintext_value = var.aws_secret_access_key
}

resource "github_actions_secret" "db_username" {
  repository      = github_repository.trading_app.name
  secret_name     = "DB_USERNAME"
  plaintext_value = var.db_username
}

resource "github_actions_secret" "db_password" {
  repository      = github_repository.trading_app.name
  secret_name     = "DB_PASSWORD"
  plaintext_value = var.db_password
}

resource "github_actions_secret" "jwt_secret" {
  repository      = github_repository.trading_app.name
  secret_name     = "JWT_SECRET"
  plaintext_value = var.jwt_secret
}

resource "github_actions_secret" "slack_webhook_url" {
  repository      = github_repository.trading_app.name
  secret_name     = "SLACK_WEBHOOK_URL"
  plaintext_value = var.slack_webhook_url
}

# Environment-specific secrets
resource "github_actions_environment_secret" "staging_db_host" {
  repository       = github_repository.trading_app.name
  environment      = "staging"
  secret_name      = "DB_HOST"
  plaintext_value  = var.staging_db_host
}

resource "github_actions_environment_secret" "staging_db_port" {
  repository       = github_repository.trading_app.name
  environment      = "staging"
  secret_name      = "DB_PORT"
  plaintext_value  = "5432"
}

resource "github_actions_environment_secret" "staging_db_name" {
  repository       = github_repository.trading_app.name
  environment      = "staging"
  secret_name      = "DB_NAME"
  plaintext_value  = "trading_staging"
}

resource "github_actions_environment_secret" "staging_api_base_url" {
  repository       = github_repository.trading_app.name
  environment      = "staging"
  secret_name      = "API_BASE_URL"
  plaintext_value  = "https://api-staging.yourtradingapp.com"
}

resource "github_actions_environment_secret" "production_db_host" {
  repository       = github_repository.trading_app.name
  environment      = "production"
  secret_name      = "DB_HOST"
  plaintext_value  = var.production_db_host
}

resource "github_actions_environment_secret" "production_db_port" {
  repository       = github_repository.trading_app.name
  environment      = "production"
  secret_name      = "DB_PORT"
  plaintext_value  = "5432"
}

resource "github_actions_environment_secret" "production_db_name" {
  repository       = github_repository.trading_app.name
  environment      = "production"
  secret_name      = "DB_NAME"
  plaintext_value  = "trading_production"
}

resource "github_actions_environment_secret" "production_api_base_url" {
  repository       = github_repository.trading_app.name
  environment      = "production"
  secret_name      = "API_BASE_URL"
  plaintext_value  = "https://api.yourtradingapp.com"
}

# Variables
variable "github_token" {
  description = "GitHub personal access token"
  type        = string
  sensitive   = true
}

variable "github_owner" {
  description = "GitHub owner/organization"
  type        = string
}

variable "aws_access_key_id" {
  description = "AWS access key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS secret access key"
  type        = string
  sensitive   = true
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret"
  type        = string
  sensitive   = true
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications"
  type        = string
  sensitive   = true
}

variable "staging_db_host" {
  description = "Staging database host"
  type        = string
  sensitive   = true
}

variable "production_db_host" {
  description = "Production database host"
  type        = string
  sensitive   = true
}
