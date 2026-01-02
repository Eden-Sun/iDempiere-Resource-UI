# tw.mxp.emui（iDempiere SPA Web UI WAB）

此插件是一個 **OSGi Web Application Bundle（WAB）**，在 iDempiere 上提供一個較現代的 SPA UI，Web context path 為 **`/emui`**。

## 目錄結構

```
plugins/tw.mxp.emui/
  META-INF/MANIFEST.MF        # OSGi Bundle 設定（含 Web-ContextPath: /emui）
  WEB-INF/web.xml             # Servlet/Filter 設定（SPA fallback）
  src/                        # Java（SpaServlet / SpaFilter）
  ui/                         # 前端原始碼（Vite + Vue）
  web-content/                # 前端 build 產物（打包進 JAR 的 web root）
  build-spa.sh                # 建置 + 打包 + 部署腳本
```

## 服務路徑

- **入口**：`http://localhost:8080/emui/`
- Vite 設定與 Router base 需保持 `/emui/`（詳見 `ui/vite.config.ts`、`ui/src/main.ts`）。

## 如何建置 / 部署

### 一鍵（推薦）

在 plugin 目錄執行：

```bash
./build-spa.sh
```

此腳本會：

- build UI（`ui/` → `web-content/`）
- 編譯 Java class
- 打包成 `tw.mxp.emui-<version>.jar`
- `docker cp` 到 `idempiere-app:/opt/idempiere/plugins/`
- 重啟 `idempiere-app`

### 工具鏈選擇（native vs docker）

`build-spa.sh` 會 **優先使用原生** `java` + `mvn` + `javac` + `jar`，若缺少則 fallback 使用 `eclipse-temurin:17-jdk` 容器執行 Java 相關工作。

## 前端開發（UI）

更多 UI 架構與說明請見：`ui/README.md`

常用指令：

```bash
cd ui
npm ci
npm run dev
```

## 版本控管備註

- `web-content/` 為 build 產物，通常 **不提交**（依 `.gitignore` 設定）。
- 本目錄在主專案中是 **git submodule**：更新內容請在此 repo commit/push 後，再到主 repo commit 更新 submodule 指標。

