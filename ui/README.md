## iDempiere Resource UI

診所預約管理系統前端，連接 iDempiere ERP REST API。

### 技術棧

- **Framework**: Vue 3 (Composition API + `<script setup>`)
- **Language**: TypeScript
- **Build**: Vite (base: `/emui/`)
- **UI**: daisyUI (Tailwind CSS)
- **Runtime**: Bun

---

## 快速開始

### 本地開發

```bash
# 安裝依賴
bun install

# 啟動開發伺服器
bun run dev
```

開發伺服器：http://localhost:5173/emui/

### Docker 開發

```bash
# 啟動開發環境
docker compose up -d

# 查看日誌
docker compose logs -f dev-server
```

服務端點：
- **dev-server**: http://localhost:8888/emui/ - 前端開發伺服器
- **opencode-web**: http://localhost:5555 - OpenCode Web UI

### 建置生產版本

```bash
bun run build
```

輸出目錄：`../web-content/`

---

## 功能特色

### 登入系統
- 兩步驟登入流程（帳密 → 選擇 Client/Role/Organization）
- **記住我** - 保存用戶選擇的客戶、角色、組織，下次自動填入
- Token 持久化 localStorage

### 預約行事曆
- 週行事曆（Google Calendar 風格）
- **週導航** - 可切換上週/下週/今天
- 多資源疊加顯示
- 直接點日曆新增預約
- Hover 顯示時長預覽
- 過去時段 disabled

### 響應式設計
- **Desktop**: 左側固定 Sidebar
- **Mobile**: 頂部 Header + 漢堡選單

---

## Source 架構

```
src/
  main.ts                    # 入口：建立 Router / 掛載 App
  app/                       # App shell + routes + pages
    App.vue                  # 主版型（Sidebar + Header）
    routes.ts
    styles.css
    views/
      LoginPage.vue          # 登入頁
      BookingPage.vue        # 用戶預約頁
      AdminCalendarPage.vue  # 管理員行事曆
      BPartnerPage.vue       # 業務夥伴
      RequestPage.vue        # 諮詢單
      OrderPage.vue          # 銷售/採購訂單
      ProductionPage.vue     # 療程單
      PaymentPage.vue        # 付款單
      InOutPage.vue          # 收貨單
      ReportPage.vue         # 報表
  features/                  # 依功能域分組
    auth/
      api.ts                 # 登入 API
      store.ts               # useAuth() + Remember Me
      types.ts
    resource/
      api.ts                 # 預約 CRUD
    request/
      api.ts                 # 諮詢單 API
    order/
      api.ts
    permission/
      store.ts               # 權限管理
  components/                # 共用 UI 元件
    BaseModal.vue
    EmptyState.vue           # 空狀態顯示
    LoadingButton.vue        # 載入中按鈕
    TableSkeleton.vue        # 表格骨架屏
    ToastContainer.vue       # Toast 通知容器
    ErrorMessage.vue
    SuccessMessage.vue
  composables/               # 共用 Composables
    useToast.ts              # Toast 通知 API
  shared/                    # 跨 feature 共用基礎
    api/
      http.ts                # apiFetch 封裝
    utils/
      datetime.ts            # 日期時間工具函數
```

分層原則：
- **app/**: 路由、頁面、版型、全域樣式
- **features/**: 業務功能（auth、resource、order、request）
- **components/**: 可重用 UI 元件
- **composables/**: 可重用邏輯
- **shared/**: 共用基礎設施（HTTP client、utils）

---

## Vite 設定

### 重點設定

| 設定 | 值 | 說明 |
|------|-----|------|
| `base` | `/emui/` | iDempiere 部署路徑 |
| `build.outDir` | `../web-content` | 輸出到插件 web root |

### Router 設定

- **Vue Router**: `createWebHistory('/emui/')`

---

## 環境變數

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `VITE_API_IP` | iDempiere API 伺服器 IP | `192.168.1.47` |
| `VITE_DEFAULT_USER` | 預設登入帳號 | - |
| `VITE_DEFAULT_PASS` | 預設登入密碼 | - |

---

## Docker Compose 服務

```yaml
services:
  dev-server:      # 前端開發伺服器 (port 8888)
    restart: on-failure

  opencode-web:    # OpenCode Web UI (port 5555)
    restart: on-failure
```

兩個服務皆設定 `restart: on-failure`，當程序異常退出時自動重啟。

---

## 部署

完成 build 後執行：

```bash
../build-spa.sh
```

將產物打包進 JAR 部署到 iDempiere。
