#!/bin/bash

# Create project directories
mkdir -p stockmarket-app/{frontend,backend,infrastructure,scripts,docs}

# Frontend setup with Next.js
cd stockmarket-app/frontend
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install frontend dependencies
npm install @tremor/react recharts
npm install shadcn-ui react-icons lucide-react
npm install zustand @tanstack/react-query socket.io-client
npm install next-pwa
npm install papaparse d3

# Set up Tailwind and shadcn UI
npx shadcn-ui@latest init

# Backend with Go setup
cd ../backend
mkdir -p cmd pkg internal config api docs scripts tests

# Initialize Go modules
go mod init github.com/yourusername/stockmarket-app
go mod tidy

# Install Go dependencies
go get -u github.com/gin-gonic/gin
go get -u github.com/spf13/viper
go get -u gorm.io/gorm
go get -u gorm.io/driver/postgres
go get -u github.com/golang-jwt/jwt/v5
go get -u github.com/swaggo/swag/cmd/swag
go get -u github.com/swaggo/gin-swagger
go get -u github.com/gorilla/websocket

# Create basic Go files
mkdir -p internal/{models,services,repositories,handlers,middleware}
touch cmd/server/main.go
touch internal/models/user.go
touch internal/models/market.go
touch internal/models/order.go
touch internal/models/portfolio.go
touch internal/models/payment.go

# Infrastructure setup (Docker and Kubernetes)
cd ../infrastructure
mkdir -p docker kubernetes

# Create Docker files
touch docker/Dockerfile.frontend
touch docker/Dockerfile.backend
touch docker/docker-compose.yml

# Create Kubernetes manifests
mkdir -p kubernetes/{deployments,services,ingress,secrets,configmaps}

# Setup documentation
cd ../docs
touch README.md
touch API.md
touch ARCHITECTURE.md

# Generate mock data scripts
cd ../scripts
mkdir -p mock-data
touch mock-data/generate-users.js
touch mock-data/generate-market-data.js
touch mock-data/generate-orders.js
touch mock-data/generate-portfolios.js

echo "Project structure setup complete!"
