# Backend Dockerfile (Go)
# Multi-stage build for optimal production image

# Stage 1: Build the application
FROM golang:1.20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache build-base git

WORKDIR /app

# Download all dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Set build-time variables
ARG ENVIRONMENT=production
ENV GO_ENV=${ENVIRONMENT}

# Build the application with optimizations
RUN go build -ldflags="-s -w" -o trading-api ./cmd/server

# Stage 2: Create a minimal production image
FROM alpine:3.18

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/trading-api .

# Copy migrations for database setup
COPY --from=builder /app/internal/database/migrations ./migrations

# Copy configuration files
COPY --from=builder /app/configs ./configs

# Create a non-root user to run the application
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Expose the port the app runs on
EXPOSE 8080

# Use a health check to verify the application is running
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Define the command to run the application
CMD ["./trading-api"]
