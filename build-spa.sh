#!/bin/bash
# Script to build and deploy the SPA Static Plugin

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

echo "Building SPA Plugin..."
echo "Plugin Dir: $PLUGIN_DIR"
echo "Workspace Dir: $WORKSPACE_DIR"

# Clean build output to avoid stale classes (e.g. old package names)
# NOTE: build/ is often created by Docker (root), so we clean via Docker to avoid permission issues.
docker run --rm -v "$WORKSPACE_DIR/plugins:/workspace" \
  eclipse-temurin:17-jdk \
  rm -rf "/workspace/$PLUGIN_NAME/build"

# Ensure directories exist
mkdir -p "$PLUGIN_DIR/lib"
mkdir -p "$BUILD_CLASSES_DIR"
mkdir -p "$BUILD_WEBINF_DIR"
mkdir -p "$PLUGIN_DIR/web-content/dist"

ensure_servlet_api_jar() {
  if [ -f "$SERVLET_API_JAR" ]; then
    return 0
  fi

  echo "servlet-api.jar not found; copying from idempiere container..."
  local jar_path
  jar_path="$(docker exec idempiere-app sh -c 'for f in /opt/idempiere/plugins/org.eclipse.jetty.servlet-api_*.jar; do echo "$f"; break; done')"

  if [ -z "$jar_path" ]; then
    echo "ERROR: Could not locate org.eclipse.jetty.servlet-api_*.jar in idempiere-app"
    exit 1
  fi

  docker cp "idempiere-app:$jar_path" "$SERVLET_API_JAR"
}

ensure_servlet_api_jar

# 1. Compile Java Source
echo "Compiling Java sources..."
docker run --rm -v "$WORKSPACE_DIR/plugins:/workspace" -w /workspace/tw.mxp.emui \
  eclipse-temurin:17-jdk \
  javac -cp lib/servlet-api.jar -d build/classes \
    src/tw/mxp/emui/SpaFilter.java \
    src/tw/mxp/emui/SpaServlet.java

# 2. Prepare Config
echo "Preparing configuration..."
cp "$PLUGIN_DIR/WEB-INF/web.xml" "$BUILD_WEBINF_DIR/"

# 3. Create JAR
echo "Creating JAR..."
# Prefer UI build output at web-content/dist if present; otherwise fallback to web-content root.
WEB_CONTENT_SOURCE="web-content"
if [ -f "$PLUGIN_DIR/web-content/dist/index.html" ]; then
  WEB_CONTENT_SOURCE="web-content/dist"
fi

echo "Using web content from: $WEB_CONTENT_SOURCE"

# -C build/classes .  -> Puts com/... at root
# -C build WEB-INF    -> Puts WEB-INF/web.xml at WEB-INF/web.xml
# -C web-content/...  -> Puts index.html etc at root
docker run --rm -v "$WORKSPACE_DIR/plugins:/workspace" -w /workspace/tw.mxp.emui \
  eclipse-temurin:17-jdk \
  jar cvfm "../$JAR_NAME" META-INF/MANIFEST.MF -C build/classes . -C build WEB-INF -C "$WEB_CONTENT_SOURCE" .

# 4. Deploy
echo "Deploying to iDempiere..."
docker cp "$WORKSPACE_DIR/plugins/$JAR_NAME" idempiere-app:/opt/idempiere/plugins/

# 5. Restart
echo "Restarting iDempiere..."
docker restart idempiere-app

echo "Done! Access at http://localhost:8080/emui/"
