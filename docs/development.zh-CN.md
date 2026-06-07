# 开发说明

本文档面向维护 `dianduji-20008/riverui` fork 的开发者。

## 仓库结构

River UI 是 Go 后端 + React 前端：

- Go 负责 HTTP API、静态资源服务、River client 集成。
- React / Vite 负责浏览器端页面。
- 前端构建产物会嵌入 Go 二进制。

本 fork 新增的主要文件：

- `src/routes/limits.tsx`
- `src/services/limits.ts`
- `handler_api_endpoint.go` 中的 limits API。
- `handler_api_endpoint_test.go` 中的 limits API 测试。

## River core 依赖

River UI 依赖本 fork 的 River core：

```go
replace github.com/riverqueue/river => github.com/dianduji-20008/river v0.39.1-limits.0
```

如果 River core 后续发布新 tag，需要同步更新：

- `github.com/riverqueue/river`
- `github.com/riverqueue/river/riverdriver`
- `github.com/riverqueue/river/riverdriver/riverpgxv5`
- `github.com/riverqueue/river/rivershared`
- `github.com/riverqueue/river/rivertype`

## 本地验证

```powershell
E:\src2\river-limits-dev\start-postgres.ps1
E:\src2\river-limits-dev\test-riverui.ps1
```

或手动运行：

```powershell
$env:TEST_DATABASE_URL='postgres://river:river@localhost:54329/river_test?sslmode=disable'
$env:DATABASE_URL=$env:TEST_DATABASE_URL
npm run lint -- --max-warnings=0
npm run build
go test ./...
```

## 修改 Limits 页面时的注意事项

- 前端接口类型在 `src/services/limits.ts`。
- 路由文件是 `src/routes/limits.tsx`。
- 如果新增路由，可能需要更新或重新生成 `src/routeTree.gen.ts`。
- API 返回字段使用 snake_case，前端 service 转成 camelCase。
- 非 pgx driver 可能返回空 stats，这是兼容行为。

## 发布流程

1. River core 先合并并打 tag。
2. River core 的 root module 和子 module 都需要对应 tag。
3. River UI 更新 `go.mod` 中的 River 依赖和 replace。
4. 运行 lint/build/test。
5. 合并 River UI PR。
6. 根据需要为 River UI 打 tag / release。
