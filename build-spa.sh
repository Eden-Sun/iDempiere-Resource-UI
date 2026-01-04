#!/bin/bash
# Script to build and deploy the SPA Static Plugin

set -euo pipefail

# Get the directory of the script
PLUGIN_DIR="$(dirname "$(readlink -f "$0")")"
# Assume workspace root is two levels up from plugins/tw.mxp.emui
WORKSPACE_DIR="$(dirname "$(dirname "$PLUGIN_DIR")")"

PLUGIN_NAME="tw.mxp.emui"
PLUGIN_VERSION="1.0.1"
JAR_NAME="${PLUGIN_NAME}-${PLUGIN_VERSION}.jar"

SERVLET_API_JAR="$PLUGIN_DIR/lib/servlet-api.jar"
BUILD_DIR="$PLUGIN_DIR/build"
BUILD_CLASSES_DIR="$BUILD_DIR/classes"
BUILD_WEBINF_DIR="$BUILD_DIR/WEB-INF"
WEB_CONTENT_DIR="$PLUGIN_DIR/web-content"

echo "Building SPA Plugin..."
echo "Plugin Dir: $PLUGIN_DIR"
echo "Workspace Dir: $WORKSPACE_DIR"

# Prefer native toolchain when available
has_cmd() { command -v "$1" >/dev/null 2>&1; }

has_docker_container() {
  # Usage: has_docker_container <name>
  # Returns 0 when Docker is available and container exists.
  if ! has_cmd docker; then
    return 1
  fi
  docker inspect "$1" >/dev/null 2>&1
}

use_native_toolchain() {
  # User requested: if native environment has java + mvn, don't use Docker.
  # Also require javac/jar (JDK) because we compile and package.
  has_cmd java && has_cmd mvn && has_cmd javac && has_cmd jar
}

run_in_jdk() {
  # Usage: run_in_jdk <cmd...>
  if use_native_toolchain; then
    "$@"
  else
    docker run --rm -v "$WORKSPACE_DIR/plugins:/workspace" -w "/workspace/$PLUGIN_NAME" \
      eclipse-temurin:17-jdk \
      "$@"
  fi
}

# Clean build output to avoid stale classes (e.g. old package names)
if use_native_toolchain; then
  echo "Toolchain: native (java + mvn detected)"
  rm -rf "$BUILD_DIR"
else
  echo "Toolchain: docker (native java+mvn not detected)"
  # NOTE: build/ is often created by Docker (root), so we clean via Docker to avoid permission issues.
  docker run --rm -v "$WORKSPACE_DIR/plugins:/workspace" \
    eclipse-temurin:17-jdk \
    rm -rf "/workspace/$PLUGIN_NAME/build"
fi

# Ensure directories exist
mkdir -p "$PLUGIN_DIR/lib"
mkdir -p "$BUILD_CLASSES_DIR"
mkdir -p "$BUILD_WEBINF_DIR"
mkdir -p "$WEB_CONTENT_DIR"
: > "$WEB_CONTENT_DIR/.gitkeep"

build_ui_if_possible() {
  # Build UI into $WEB_CONTENT_DIR when npm exists.
  # This keeps the plugin packaging deterministic, and avoids needing committed build artifacts.
  if ! has_cmd npm; then
    echo "npm not found; skipping UI build"
    return 0
  fi

  echo "Building UI..."
  if [ ! -d "$PLUGIN_DIR/ui/node_modules" ]; then
    (cd "$PLUGIN_DIR/ui" && npm ci)
  fi
  (cd "$PLUGIN_DIR/ui" && npm run build)
  # Vite emptyOutDir may remove .gitkeep; restore it so the directory stays tracked.
  : > "$WEB_CONTENT_DIR/.gitkeep"
}

ensure_servlet_api_jar() {
  if [ -f "$SERVLET_API_JAR" ]; then
    return 0
  fi

  # 1) Non-Docker / local iDempiere: try to locate an existing servlet-api bundle in $WORKSPACE_DIR/plugins.
  local local_source=""
  for f in \
    "$WORKSPACE_DIR"/plugins/org.eclipse.jetty.servlet-api_*.jar \
    "$WORKSPACE_DIR"/plugins/*servlet-api*.jar; do
    if [ -f "$f" ]; then
      local_source="$f"
      break
    fi
  done

  if [ -n "$local_source" ]; then
    echo "servlet-api.jar not found; using local: $local_source"
    cp "$local_source" "$SERVLET_API_JAR"
    return 0
  fi

  # 2) Docker iDempiere: fallback to container copy.
  if has_docker_container idempiere-app; then
    echo "servlet-api.jar not found; copying from idempiere container..."
    local jar_path
    jar_path="$(docker exec idempiere-app sh -c 'for f in /opt/idempiere/plugins/org.eclipse.jetty.servlet-api_*.jar; do echo "$f"; break; done')"

    if [ -z "$jar_path" ]; then
      echo "ERROR: Could not locate org.eclipse.jetty.servlet-api_*.jar in idempiere-app"
      exit 1
    fi

    docker cp "idempiere-app:$jar_path" "$SERVLET_API_JAR"
    return 0
  fi

  echo "ERROR: servlet-api.jar not found and cannot use docker (idempiere-app not available)."
  echo "       Please copy a servlet-api jar into: $SERVLET_API_JAR"
  echo "       Tip: look for *servlet-api*.jar under: $WORKSPACE_DIR/plugins/"
  exit 1
}

ensure_servlet_api_jar

# 0. Build UI (if available)
build_ui_if_possible

# 1. Compile Java Source
echo "Compiling Java sources..."
if use_native_toolchain; then
  javac -cp "$SERVLET_API_JAR" -d "$BUILD_CLASSES_DIR" \
    "$PLUGIN_DIR/src/tw/mxp/emui/SpaFilter.java" \
    "$PLUGIN_DIR/src/tw/mxp/emui/SpaServlet.java"
else
  run_in_jdk javac -cp lib/servlet-api.jar -d build/classes \
    src/tw/mxp/emui/SpaFilter.java \
    src/tw/mxp/emui/SpaServlet.java
fi

# 2. Prepare Config
echo "Preparing configuration..."
cp "$PLUGIN_DIR/WEB-INF/web.xml" "$BUILD_WEBINF_DIR/"

# 3. Create JAR
echo "Creating JAR..."
# Prefer direct web root (web-content/). Keep legacy fallback to web-content/dist if present.
WEB_CONTENT_SOURCE="web-content"
if [ -f "$WEB_CONTENT_DIR/index.html" ]; then
  WEB_CONTENT_SOURCE="web-content"
elif [ -f "$WEB_CONTENT_DIR/dist/index.html" ]; then
  WEB_CONTENT_SOURCE="web-content/dist"
else
  echo "ERROR: web content not found. Expected $WEB_CONTENT_DIR/index.html (or legacy $WEB_CONTENT_DIR/dist/index.html)."
  echo "       Please run: (cd \"$PLUGIN_DIR/ui\" && npm ci && npm run build)"
  exit 1
fi

echo "Using web content from: $WEB_CONTENT_SOURCE"

# Build jar args for web content (exclude dotfiles like .gitkeep)
WEB_CONTENT_HOST_DIR="$PLUGIN_DIR/$WEB_CONTENT_SOURCE"
WEB_CONTENT_CONTAINER_DIR="$WEB_CONTENT_SOURCE"

web_content_jar_args_host=(-C "$WEB_CONTENT_HOST_DIR" index.html)
web_content_jar_args_container=(-C "$WEB_CONTENT_CONTAINER_DIR" index.html)

if [ -d "$WEB_CONTENT_HOST_DIR/assets" ]; then
  web_content_jar_args_host+=(-C "$WEB_CONTENT_HOST_DIR" assets)
  web_content_jar_args_container+=(-C "$WEB_CONTENT_CONTAINER_DIR" assets)
fi

# -C build/classes .  -> Puts com/... at root
# -C build WEB-INF    -> Puts WEB-INF/web.xml at WEB-INF/web.xml
# -C web-content/...  -> Puts index.html etc at root
if use_native_toolchain; then
  jar cvfm "$WORKSPACE_DIR/plugins/$JAR_NAME" "$PLUGIN_DIR/META-INF/MANIFEST.MF" \
    -C "$BUILD_CLASSES_DIR" . \
    -C "$BUILD_DIR" WEB-INF \
    "${web_content_jar_args_host[@]}"
else
  run_in_jdk jar cvfm "../$JAR_NAME" META-INF/MANIFEST.MF -C build/classes . -C build WEB-INF "${web_content_jar_args_container[@]}"
fi

# 4. Deploy
echo "Deploying to iDempiere..."
if has_docker_container idempiere-app; then
  docker cp "$WORKSPACE_DIR/plugins/$JAR_NAME" idempiere-app:/opt/idempiere/plugins/

  # 5. Restart
  echo "Restarting iDempiere..."
  docker restart idempiere-app

  echo "Done! Access at http://localhost:8080/emui/"
else
  echo "Docker container 'idempiere-app' not found; skipping docker deploy/restart."
  echo "Built JAR: $WORKSPACE_DIR/plugins/$JAR_NAME"
  echo "Please restart your iDempiere instance to load the plugin."
fi
