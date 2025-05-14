# Rust Services Dockerfile
# Multi-stage build for optimal production image

# Stage 1: Build the application
FROM rust:1.70-slim-buster AS builder

# Install build dependencies
RUN apt-get update && \
    apt-get install -y pkg-config libssl-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the manifest files
COPY Cargo.toml Cargo.lock ./

# Create a dummy source file to build dependencies
RUN mkdir -p src && \
    echo "fn main() {println!(\"if you see this, the build broke\")}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy the actual source code
COPY . .

# Set build-time variables
ARG ENVIRONMENT=production
ENV RUST_ENV=${ENVIRONMENT}

# Force cargo to rebuild with actual source code
RUN touch src/main.rs

# Build the application with optimizations
RUN cargo build --release

# Stage 2: Create a minimal production image
FROM debian:buster-slim

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y ca-certificates libssl1.1 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/target/release/market-data-service .
COPY --from=builder /app/target/release/algorithmic-trading-service .

# Copy configuration files
COPY --from=builder /app/config ./config

# Create a non-root user to run the application
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

# Expose the ports the services run on
EXPOSE 8081 8082

# Use a health check to verify the services are running
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081/health || exit 1

# Define the command to run the primary service (can be overridden)
CMD ["./market-data-service"]
