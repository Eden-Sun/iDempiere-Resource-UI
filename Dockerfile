FROM oven/bun:latest

WORKDIR /app

# Install opencode using official install script
RUN curl -fsSL https://opencode.ai/install | bash

# Fix: use POSIX-compatible command for sourcing .bashrc
RUN . ~/.bashrc || true

# Default command (will be overridden by docker-compose)
CMD ["bun", "--version"]