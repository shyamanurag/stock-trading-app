# C++ Components Dockerfile
# Multi-stage build for optimal production image

# Stage 1: Build the application
FROM gcc:11 AS builder

# Install build dependencies
RUN apt-get update && \
    apt-get install -y cmake libboost-all-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy source code
COPY . .

# Set build-time variables
ARG ENVIRONMENT=production
ENV BUILD_ENV=${ENVIRONMENT}

# Configure with CMake and build
RUN mkdir -p build && \
    cd build && \
    cmake -DCMAKE_BUILD_TYPE=Release .. && \
    cmake --build . --config Release

# Stage 2: Create a minimal production image
FROM debian:bullseye-slim

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y libboost-program-options1.74.0 \
                       libboost-system1.74.0 \
                       libboost-thread1.74.0 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binaries from the builder stage
COPY --from=builder /app/build/bin/market-data-processor .
COPY --from=builder /app/build/bin/options-pricing-engine .

# Copy configuration files
COPY --from=builder /app/config ./config

# Create a non-root user to run the application
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

# Expose the ports the services run on
EXPOSE 8083 8084

# Use a health check to verify the services are running
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD ./market-data-processor --health-check || exit 1

# Define the command to run the primary service (can be overridden)
CMD ["./market-data-processor"]
