# River UI 中文说明

本仓库是 `dianduji-20008` 维护的 River UI fork，配套
`dianduji-20008/river` 使用。

River UI 是 River 的可视化管理界面，用于查看 jobs、queues、workers、健康状
态等。本 fork 增加了 claim-time 限流的可观测能力。

## 本 fork 增加了什么

- 新增 `/limits` 页面。
- 新增 `GET /api/limits` API。
- 展示 River core 中配置的 `LimitRule`。
- 展示按 `limit_key + queue` 聚合的任务状态：
  - `available`
  - `running`
  - `recent starts`
- 支持页面手动刷新和自动刷新。

## 中文文档

- [项目说明](project.zh-CN.md)
- [River 限流扩展中文说明](limits.zh-CN.md)
- [健康检查中文说明](health_checks.zh-CN.md)
- [开发说明](development.zh-CN.md)

## 与 River core 的关系

River UI 依赖本 fork 的 River core tag：

`github.com/dianduji-20008/river v0.39.1-limits.0`

River 是多 module 仓库，因此 `go.mod` 中也包含 `riverdriver`、`riverpgxv5`、
`rivershared`、`rivertype` 的对应 replace。

## 本地启动

先准备数据库并运行 River migrations。

本项目提供的本地脚本：

```powershell
E:\src2\river-limits-dev\start-postgres.ps1
E:\src2\river-limits-dev\test-riverui.ps1
```

常规验证：

```powershell
npm run lint -- --max-warnings=0
npm run build
go test ./...
```

## 页面入口

启动 River UI 后，在左侧导航中进入：

`Limits`

对应路由：

`/limits`
