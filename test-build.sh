#!/bin/bash
# Test the UI build with both npm and bun in Docker containers
# This ensures the build works in a clean environment

set -euo pipefail

SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_success() { echo -e "${GREEN}✓ $1${NC}"; }
echo_error() { echo -e "${RED}✗ $1${NC}"; }
echo_info() { echo -e "${YELLOW}→ $1${NC}"; }

# Clean previous build output
clean_build() {
  rm -rf web-content/index.html web-content/assets 2>/dev/null || true
}

# Verify build output
verify_build() {
  local pkg_manager="$1"
  if [ -f "web-content/index.html" ] && [ -d "web-content/assets" ]; then
    echo_success "Build with $pkg_manager succeeded!"
    ls -la web-content/
    return 0
  else
    echo_error "Build with $pkg_manager failed - output files missing"
    return 1
  fi
}

# Test with npm
test_npm() {
  echo ""
  echo "============================================"
  echo_info "Testing build with npm..."
  echo "============================================"

  clean_build

  docker run --rm \
    -v "$SCRIPT_DIR:/workspace" \
    -w /workspace/ui \
    node:20-slim \
    sh -c "npm ci && npm run build"

  verify_build "npm"
}

# Test with bun
test_bun() {
  echo ""
  echo "============================================"
  echo_info "Testing build with bun..."
  echo "============================================"

  clean_build

  docker run --rm \
    -v "$SCRIPT_DIR:/workspace" \
    -w /workspace/ui \
    oven/bun:latest \
    sh -c "bun install && bun run build"

  verify_build "bun"
}

# Main
main() {
  local test_npm_flag=0
  local test_bun_flag=0

  # Parse arguments
  if [ $# -eq 0 ]; then
    test_npm_flag=1
    test_bun_flag=1
  else
    for arg in "$@"; do
      case "$arg" in
        --npm) test_npm_flag=1 ;;
        --bun) test_bun_flag=1 ;;
        --help|-h)
          echo "Usage: $0 [--npm] [--bun]"
          echo ""
          echo "Options:"
          echo "  --npm    Test build with npm only"
          echo "  --bun    Test build with bun only"
          echo "  (none)   Test both npm and bun"
          exit 0
          ;;
        *)
          echo "Unknown option: $arg"
          exit 1
          ;;
      esac
    done
  fi

  local failed=0

  if [ $test_npm_flag -eq 1 ]; then
    if ! test_npm; then
      failed=1
    fi
  fi

  if [ $test_bun_flag -eq 1 ]; then
    if ! test_bun; then
      failed=1
    fi
  fi

  echo ""
  echo "============================================"
  if [ $failed -eq 0 ]; then
    echo_success "All tests passed!"
  else
    echo_error "Some tests failed!"
    exit 1
  fi
}

main "$@"
