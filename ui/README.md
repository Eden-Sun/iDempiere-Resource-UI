## UI Build Config（Vite）

此資料夾提供 **前端 UI build 設定範本**，用於把 Vue/React/Vite 產物部署到 `tw.mxp.emui` 插件下（路徑 `/emui`）。

### Source 架構（建議分層）

目標：讓「入口/頁面」與「功能域」與「共用基礎」分離，避免 `ui/` 這種含糊命名，後續擴充（更多頁面/功能）也更好放。

```
src/
  main.ts                  # 入口：建立 Router / 掛載 App
  app/                     # App shell + routes + pages（只處理 UI/導航）
    App.vue
    routes.ts
    styles.css
    views/
      LoginPage.vue
      BookingPage.vue
      AdminCalendarPage.vue
  features/                # 依功能域分組（可被多個 page 使用）
    auth/
      api.ts
      store.ts
      types.ts
    resource/
      api.ts
  shared/                  # 跨 feature 共用的基礎設施（HTTP、utils、types）
    api/
      http.ts
  vite-env.d.ts
```

小規則：

- **app/**：只放「路由/頁面/版型/全域樣式」，不要塞 API 呼叫細節
- **features/**：以業務功能切（例如 `auth`、`resource`），對外輸出清楚的 API/型別
- **shared/**：放所有 features 都可能共用的基礎（例如 `apiFetch`）

### 重點設定

- **base**：必須是 `/emui/`
  - 否則 build 後的資源引用會是 `/assets/...`，在 iDempiere 下會 404。
- **outDir**：建議輸出到 `../web-content/dist`
  - 此目錄已在 `.gitignore` 內排除（不提交 build 產物）。

### 使用方式（範例）

在您的 Vite 專案中套用本範本設定（或複製 `vite.config.js` 的設定片段）：

- `base: '/emui/'`
- `build.outDir: '../web-content/dist'`

完成 `npm run build` 後，再執行：

```bash
../build-spa.sh
```

### Router（如果有）

- **Vue Router**：`createWebHistory('/emui/')`
- **React Router**：`<BrowserRouter basename="/emui">`

