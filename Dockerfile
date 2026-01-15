FROM oven/bun:latest

WORKDIR /app

# Install opencode using official install script
RUN curl -fsSL https://opencode.ai/install | bash

# reload source
RUN source ~/.bashrc

# Default command (will be overridden by docker-compose)
CMD ["bun", "--version"]
