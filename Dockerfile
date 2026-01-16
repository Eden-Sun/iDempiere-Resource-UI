FROM ubuntu:24.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=development

WORKDIR /app

# 安装必要的依赖和 git
RUN apt-get update && \
    apt-get install -y curl wget gnupg software-properties-common unzip git && \
    rm -rf /var/lib/apt/lists/*

# 安装 Bun
RUN curl -fsSL https://bun.sh/install | bash

# Install opencode using official install script
RUN curl -fsSL https://opencode.ai/install | bash

# Set up PATH for bun and opencode
ENV PATH="/root/.bun/bin:/root/.opencode/bin:$PATH"

SHELL ["/bin/bash", "-c"]

RUN source ~/.bashrc

# Copy package files from ui directory
COPY ui/package*.json ./

CMD ["bun", "version"]