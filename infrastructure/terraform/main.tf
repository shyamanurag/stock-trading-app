# Continuing from previous file...

resource "aws_cloudwatch_log_group" "rust_services" {
  name              = "/ecs/${var.environment}/rust-services"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name        = "${var.environment}-rust-services-logs"
    Environment = var.environment
    Project     = "trading-app"
  }
}

resource "aws_cloudwatch_log_group" "cpp_components" {
  name              = "/ecs/${var.environment}/cpp-components"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name        = "${var.environment}-cpp-components-logs"
    Environment = var.environment
    Project     = "trading-app"
  }
}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.environment}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.environment}-ecs-task-execution-role"
    Environment = var.environment
    Project     = "trading-app"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.environment}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.environment}-ecs-task-role"
    Environment = var.environment
    Project     = "trading-app"
  }
}

# Secret Manager policy for ECS Task Role
resource "aws_iam_policy" "secrets_manager_access" {
  name        = "${var.environment}-secrets-manager-access"
  description = "Allows access to Secrets Manager for environment variables"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetSecretValue",
          "kms:Decrypt"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "task_role_secrets_manager" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.secrets_manager_access.arn
}

# ECS Task Definitions
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.environment}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.environment == "production" ? "1024" : "512"
  memory                   = var.environment == "production" ? "2048" : "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name         = "frontend"
      image        = var.frontend_image
      essential    = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options   = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "frontend"
        }
      }
      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "NEXT_PUBLIC_API_URL"
          value = var.environment == "production" ? "https://api.yourtradingapp.com" : "https://api-staging.yourtradingapp.com"
        },
        {
          name  = "NEXT_PUBLIC_WEBSOCKET_URL"
          value = var.environment == "production" ? "wss://api.yourtradingapp.com/ws" : "wss://api-staging.yourtradingapp.com/ws"
        }
      ]
      secrets = [
        {
          name      = "NEXT_PUBLIC_ANALYTICS_ID"
          valueFrom = var.analytics_id_secret_arn
        }
      ]
      healthCheck = {
        command     = ["CMD-SHELL", "wget -q -O - http://localhost:3000/api/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "${var.environment}-frontend-task"
    Environment = var.environment
    Project     = "trading-app"
  }
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.environment}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.environment == "production" ? "1024" : "512"
  memory                   = var.environment == "production" ? "2048" : "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name         = "backend"
      image        = var.backend_image
      essential    = true
      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options   = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
      environment = [
        {
          name  = "GO_ENV"
          value = var.environment
        },
        {
          name  = "DB_HOST"
          value = aws_db_instance.main.address
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "DB_NAME"
          value = var.db_name
        },
        {
          name  = "REDIS_HOST"
          value = aws_elasticache_cluster.main.cache_nodes.0.address
        },
        {
          name  = "REDIS_PORT"
          value = "6379"
        },
        {
          name  = "MARKET_DATA_SERVICE_URL"
          value = "http://localhost:8081"
        },
        {
          name  = "ALGORITHMIC_TRADING_SERVICE_URL"
          value = "http://localhost:8082"
        },
        {
          name  = "OPTIONS_PRICING_SERVICE_URL"
          value = "http://localhost:8083"
        }
      ]
      secrets = [
        {
          name      = "DB_USER"
          valueFrom = "${var.db_credentials_secret_arn}:username::"
        },
        {
          name      = "DB_PASSWORD"
          valueFrom = "${var.db_credentials_secret_arn}:password::"
        },
        {
          name      = "JWT_SECRET"
          valueFrom = var.jwt_secret_arn
        },
        {
          name      = "REDIS_PASSWORD"
          valueFrom = var.redis_password_secret_arn
        }
      ]
      healthCheck = {
        command     = ["CMD-SHELL", "wget -q -O - http://localhost:8080/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "${var.environment}-backend-task"
    Environment = var.environment
    Project     = "trading-app"
  }
}

resource "aws_ecs_task_definition" "rust_services" {
  family                   = "${var.environment}-rust-services"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.environment == "production" ? "1024" : "512"
  memory                   = var.environment == "production" ? "2048" : "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name         = "rust-services"
      image        = var.rust_image
      essential    = true
      portMappings = [
        {
          containerPort = 8081
          hostPort      = 8081
          protocol      = "tcp"
        },
        {
          containerPort = 8082
          hostPort      = 8082
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options   = {
          "awslogs-group"         = aws_cloudwatch_log_group.rust_services.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "rust-services"
        }
      }
      environment = [
        {
          name  = "RUST_ENV"
          value = var.environment
        },
        {
          name  = "DB_HOST"
          value = aws_db_instance.main.address
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "DB_NAME"
          value = var.db_name
        },
        {
          name  = "OPTIONS_PRICING_SERVICE_URL"
          value = "http://localhost:8083"
        }
      ]
      secrets = [
        {
          name      = "DB_USER"
          valueFrom = "${var.db_credentials_secret_arn}:username::"
        },
        {
          name      = "DB_PASSWORD"
          valueFrom = "${var.db_credentials_secret_arn}:password::"
        }
      ]
      healthCheck = {
        command     = ["CMD-SHELL", "wget -q -O - http://localhost:8081/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "${var.environment}-rust-services-task"
    Environment = var.environment
    Project     = "trading-app"
  }
}

resource "aws_ecs_task_definition" "cpp_components" {
  family                   = "${var.environment}-cpp-components"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.environment == "production" ? "1024" : "512" 
  memory                   = var.environment == "production" ? "2048" : "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name         = "cpp-components"
      image        = var.cpp_image
      essential    = true
      portMappings = [
        {
          containerPort = 8083
          hostPort      = 8083
          protocol      = "tcp"
        },
        {
          containerPort = 8084
          hostPort      = 8084
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options   = {
          "awslogs-group"         = aws_cloudwatch_log_group.cpp_components.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "cpp-components"
        }
      }
      environment = [
        {
          name  = "BUILD_ENV"
          value = var.environment
        },
        {
          name  = "DB_HOST"
          value = aws_db_instance.main.address
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "DB_NAME"
          value = var.db_name
        }
      ]
      secrets = [
        {
          name      = "DB_USER"
          valueFrom = "${var.db_credentials_secret_arn}:username::"
        },
        {
          name      = "DB_PASSWORD"
          valueFrom = "${var.db_credentials_secret_arn}:password::"
        }
      ]
      healthCheck = {
        command     = ["CMD-SHELL", "./market-data-processor --health-check || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "${var.environment}-cpp-components-task"
    Environment = var.environment
    Project     = "trading-app"
  }
}

# ECS Services
resource "aws_ecs_service" "frontend" {
  name                               = "${var.environment}-frontend"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.frontend.arn
  desired_count                      = var.environment == "production" ? 3 : 1
  launch_type                        = "FARGATE"
  platform_version                   = "LATEST"
  health_check_grace_period_seconds  = 120
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 3000
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [aws_lb_listener.https]

  tags = {
    Name        = "${var.environment}-frontend-service"
    Environment = var.environment
    Project     = "trading-app"
  }
}

resource "aws_ecs_service" "backend" {
  name                               = "${var.environment}-backend"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.backend.arn
  desired_count                      = var.environment == "production" ? 3 : 1
  launch_type                        = "FARGATE"
  platform_version                   = "LATEST"
  health_check_grace_period_seconds  = 120
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 8080
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [aws_lb_listener_rule.api]

  tags = {
    Name        = "${var.environment}-backend-service"
    Environment = var.environment
    Project     = "trading-app"
  }
}

resource "aws_ecs_service" "rust_services" {
  name                               = "${var.environment}-rust-services"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.rust_services.arn
  desired_count                      = var.environment == "production" ? 2 : 1
  launch_type                        = "FARGATE"
  platform_version                   = "LATEST"
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = {
    Name        = "${var.environment}-rust-services"
    Environment = var.environment
    Project     = "trading-app"
  }
}

resource "aws_ecs_service" "cpp_components" {
  name                               = "${var.environment}-cpp-components"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.cpp_components.arn
  desired_count                      = var.environment == "production" ? 2 : 1
  launch_type                        = "FARGATE"
  platform_version                   = "LATEST"
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = {
    Name        = "${var.environment}-cpp-components"
    Environment = var.environment
    Project     = "trading-app"
  }
}

# Route53 DNS configuration
resource "aws_route53_record" "app" {
  zone_id = var.route53_zone_id
  name    = var.environment == "production" ? "yourtradingapp.com" : "staging.yourtradingapp.com"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "api" {
  zone_id = var.route53_zone_id
  name    = var.environment == "production" ? "api.yourtradingapp.com" : "api-staging.yourtradingapp.com"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.environment}-trading-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
  }
}

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "${var.environment}-trading-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS memory utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
  }
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.environment}-trading-alerts"
  
  tags = {
    Name        = "${var.environment}-trading-alerts"
    Environment = var.environment
    Project     = "trading-app"
  }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Output values
output "load_balancer_dns" {
  value       = aws_lb.main.dns_name
  description = "The DNS name of the load balancer"
}

output "app_url" {
  value       = var.environment == "production" ? "https://yourtradingapp.com" : "https://staging.yourtradingapp.com"
  description = "The URL of the application"
}

output "api_url" {
  value       = var.environment == "production" ? "https://api.yourtradingapp.com" : "https://api-staging.yourtradingapp.com"
  description = "The URL of the API"
}

output "database_endpoint" {
  value       = aws_db_instance.main.address
  description = "The connection endpoint for the database"
  sensitive   = true
}

output "redis_endpoint" {
  value       = aws_elasticache_cluster.main.cache_nodes.0.address
  description = "The connection endpoint for Redis"
  sensitive   = true
}
