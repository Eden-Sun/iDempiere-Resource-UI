FROM oven/bun:latest

WORKDIR /app

# Install opencode-ai globally
RUN bun add -g opencode-ai

# Default command (will be overridden by docker-compose)
CMD ["bun", "--version"]
