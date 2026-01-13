# iDempiere Resource UI - 專案說明

## 專案概述

Vue 3 + TypeScript 前端應用，用於 iDempiere ERP 的資源預約管理。透過 iDempiere REST API 進行認證和資料操作。

- **Framework**: Vue 3 (Composition API)
- **UI**: TailwindCSS + DaisyUI
- **Build**: Vite
- **Base URL**: `/emui/`

---

## 目錄結構

```
src/
├── main.ts                    # 應用入口，路由守衛
├── app/
│   ├── App.vue               # 根組件，token 過期處理
│   ├── routes.ts             # 路由定義
│   └── views/
│       ├── LoginPage.vue     # 兩階段登入頁面
│       ├── BookingPage.vue   # 資源預約（一般用戶）
│       ├── AdminCalendarPage.vue  # 管理員行事曆
│       └── BPartnerPage.vue  # 業務夥伴列表/編輯/新增
├── features/
│   ├── auth/
│   │   ├── api.ts            # 認證 API (login, getRoles, getOrganizations...)
│   │   ├── store.ts          # 認證狀態管理 (useAuth)
│   │   └── types.ts          # 認證型別定義
│   ├── resource/
│   │   └── api.ts            # 資源預約 API
│   └── window/
│       └── api.ts            # 通用 Window API（欄位元資料、CRUD、列表）
├── shared/
│   ├── api/
│   │   └── http.ts           # HTTP 封裝，token 過期檢測
│   └── labels/
│       └── columnLabels.ts   # 欄位標籤翻譯
└── components/
    ├── DynamicForm.vue       # 動態表單組件
    └── DynamicField.vue      # 動態欄位組件
```

---

## 認證流程

### 兩階段登入

```
第一階段：帳密驗證
POST /api/v1/auth/tokens
├── 輸入：userName, password
└── 輸出：臨時 token + clients 列表

第二階段：參數選擇
PUT /api/v1/auth/tokens
├── 選擇：clientId → roleId → organizationId → warehouseId (可選)
└── 輸出：正式 token + userId
```

### 認證 API (`features/auth/api.ts`)

| 函數 | 端點 | 說明 |
|------|------|------|
| `login()` | POST /api/v1/auth/tokens | 帳密驗證 |
| `setLoginParameters()` | PUT /api/v1/auth/tokens | 設定登入參數 |
| `getRoles()` | GET /api/v1/auth/roles | 取得角色列表 |
| `getOrganizations()` | GET /api/v1/auth/organizations | 取得組織列表 |
| `getWarehouses()` | GET /api/v1/auth/warehouses | 取得倉庫列表 |
| `getClientLanguage()` | GET /api/v1/auth/language | 取得租戶語系 |

### 會話狀態 (`features/auth/store.ts`)

```typescript
type Session = {
  token: string
  refreshToken?: string
  userId: number
  userName?: string      // 從 JWT 解碼
  clientId: number
  organizationId: number
  roleId?: number
  warehouseId?: number
  language?: string
}
```

- 儲存位置：`localStorage['idempiere.resource.session.v1']`
- JWT 解碼僅用於顯示 userName（不驗證）

---

## 路由與權限

### 路由定義 (`app/routes.ts`)

| 路徑 | 組件 | 說明 |
|------|------|------|
| `/login` | LoginPage | 公開，無需認證 |
| `/book` | BookingPage | 資源預約（一般用戶） |
| `/admin/calendar` | AdminCalendarPage | 管理員行事曆 |
| `/bpartner` | BPartnerPage | 建立業務夥伴 |

### 路由守衛 (`main.ts`)

```typescript
router.beforeEach((to) => {
  const publicRoutes = new Set(['/login'])
  if (publicRoutes.has(to.path)) return true
  if (!auth.isAuthenticated.value) return { path: '/login' }
  return true
})
```

**目前限制**：只檢查是否有 token，不檢查角色權限。

---

## 資源預約 API (`features/resource/api.ts`)

| 函數 | 說明 |
|------|------|
| `listResources()` | 列出可用資源 |
| `listAssignmentsForRange()` | 查詢指定時間範圍的預約 |
| `createAssignment()` | 建立預約 |
| `deleteAssignment()` | 刪除預約 |
| `setAssignmentColor()` | 設定預約顏色 |

---

## iDempiere REST API 使用方式

### Window API vs Model API

**重要**：iDempiere REST API 有兩種端點模式，用途不同：

| 操作 | 端點 | 說明 |
|------|------|------|
| **列表** | `GET /api/v1/models/{TableName}` | Model API，支援 $filter, $orderby, $top, $skip |
| **取得單筆** | `GET /api/v1/models/{TableName}/{id}` | Model API |
| **新增** | `POST /api/v1/windows/{windowSlug}` | Window API（觸發商業邏輯） |
| **更新** | `PUT /api/v1/models/{TableName}/{id}` | Model API |
| **刪除** | `DELETE /api/v1/models/{TableName}/{id}` | Model API |

**注意**：
- Window API 的 `/windows/{slug}/tabs/{tab}` 端點**不支援列表查詢**（會 404）
- 新增建議用 Window API 以觸發完整商業邏輯
- 列表/更新用 Model API 較穩定

### 範例：Business Partner

```typescript
// 列表
GET /api/v1/models/C_BPartner?$orderby=Name&$top=20

// 新增
POST /api/v1/windows/business-partner
Body: { Name: "...", Value: "...", C_BP_Group_ID: 104 }

// 更新
PUT /api/v1/models/C_BPartner/1000009
Body: { Name: "..." }
```

---

## Window API (`features/window/api.ts`)

### CRUD 操作

| 函數 | 說明 |
|------|------|
| `createWindowRecord()` | 建立記錄（透過 Window API） |
| `createChildTabRecord()` | 建立子標籤記錄 |
| `getTabFieldsWithMeta()` | 取得欄位元資料 |

### Reference Types

```typescript
ReferenceType = {
  String: 10, Integer: 11, Amount: 12, Number: 22,
  Date: 15, DateTime: 16, List: 17, Table: 18,
  TableDirect: 19, YesNo: 20, Search: 30, Text: 14,
  Memo: 34, ChosenMultipleSelectionList: 200161,  // 多選
}
```

### 多選欄位 (ChosenMultipleSelectionList)

- Reference ID: 200161
- UI: Checkbox group
- 儲存格式: 逗號分隔字串

---

## HTTP 層 (`shared/api/http.ts`)

- 所有請求自動帶 `Authorization: Bearer {token}`
- Token 過期檢測：401 + title 包含 'expired'
- 過期回調：`setTokenExpiredHandler()`

---

## 欄位權限控制

### 系統欄位（自動隱藏）

```typescript
const systemFields = ['AD_Client_ID', 'Created', 'CreatedBy', 'Updated', 'UpdatedBy', 'IsActive']
```

### 管理員欄位配置

- `getFieldVisibility()` - 取得隱藏欄位
- `setFieldVisibility()` - 設定隱藏欄位（需 Admin 權限）
- 403 錯誤時設定 `canConfigureFields = false`

---

## 待實作：權限檢查

**目前問題**：
- 前端只檢查 token 存在，不檢查角色權限
- 沒有 API 查詢特定 Role 的功能權限

**可能方案**：
1. 後端提供權限查詢 API
2. JWT 內嵌權限資訊
3. 登入時返回權限清單

---

## 開發指令

```bash
bun install      # 安裝依賴
bun run dev      # 開發模式
bun run build    # 建置
```
