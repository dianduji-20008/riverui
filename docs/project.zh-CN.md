# 项目说明

本项目是 `dianduji-20008` 个人账号维护的 River UI fork，配套使用
`dianduji-20008/river` fork。

## 项目定位

这个 fork 的核心方向是：

> 在 River 队列系统中加入轻量、原生、可观测的全局容量控制能力。

它不是 Temporal 替代品，也不是 AI API 专用队列。它更接近 River 的一个工程化
增强：保留 River 简洁的 job queue 模型，同时补上实际生产里经常需要的跨 Pod
并发限制和启动速率限制。

## 为什么有价值

在真实业务里，任务执行方经常受到外部资源限制：

- 第三方 API 的并发限制。
- 第三方 API 的 RPS 限制。
- GPU / 推理服务资源池容量。
- 视频生成、图片生成、转码、爬虫等长耗时任务的全局排队。

如果只依赖每个 Pod 的本地 worker 数量，很容易在水平扩容后突破上游限制。本
fork 把容量控制放进 River claim 阶段，让多个 Pod 共享同一套数据库约束。

## 和 River Pro / Workflow 的关系

本项目当前不实现 River Pro 的 workflow 能力，也不试图复刻 Temporal。

当前重点是一个更小、更明确的能力：

- claim-time concurrency limit
- claim-time start-rate limit
- queue/global scope
- River UI observability

后续如果扩展 workflow 或 callback，也应保持 River-native、轻量、通用，不把系
统绑定到某个 AI 供应商。

## 仓库关系

- River core fork：`github.com/dianduji-20008/river`
- River UI fork：`github.com/dianduji-20008/riverui`

River UI 通过 `go.mod` 的 replace 指向本 fork 的 River core tag：

```go
replace github.com/riverqueue/river => github.com/dianduji-20008/river v0.39.1-limits.0
```

River 是多 module 仓库，因此 `riverdriver`、`riverpgxv5`、`rivershared`、
`rivertype` 也有对应 tag。

## 当前版本

当前配套 River core tag：

`v0.39.1-limits.0`

子 module tag：

- `riverdriver/v0.39.1-limits.0`
- `riverdriver/riverpgxv5/v0.39.1-limits.0`
- `rivershared/v0.39.1-limits.0`
- `rivertype/v0.39.1-limits.0`

## 本地验证

```powershell
E:\src2\river-limits-dev\start-postgres.ps1
E:\src2\river-limits-dev\test-riverui.ps1
```

River core 关键验证：

```powershell
$env:TEST_DATABASE_URL='postgres://river:river@localhost:54329/river_test?sslmode=disable'
cd E:\src2\river
go test ./riverdriver/riverpgxv5 -run 'TestExecutor_JobGetAvailableWithLimits' -count=1
go test ./riverdriver/riverpgxv5 -count=1
go test ./... -run '^$'
```
