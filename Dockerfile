FROM ubuntu:24.04

WORKDIR /app

# 安装必要的依赖
RUN apt-get update && \
    apt-get install -y curl unzip && \
    rm -rf /var/lib/apt/lists/*

# 安装 Bun
RUN curl -fsSL https://bun.sh/install | bash

# 将 Bun 添加到 PATH
ENV PATH="/root/.bun/bin:${PATH}"

# Install opencode using official install script
RUN curl -fsSL https://opencode.ai/install | bash

# Fix: use POSIX-compatible command for sourcing .bashrc
RUN . ~/.bashrc || true

# Default command (will be overridden by docker-compose)
CMD ["bun", "--version"]