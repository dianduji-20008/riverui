# River 限流扩展中文说明

这是 `dianduji-20008` 维护的 River / River UI fork，用于提供 River 原生的
claim-time 容量控制能力。

目标不是把 River 绑死到某个 AI API，而是提供通用的跨进程、跨 Pod 限流能力。
AI 视频生成、图片生成、第三方 SaaS API、GPU 资源池、付费接口额度都可以用同一
套机制表达。

## 解决的问题

River 原生的 `MaxWorkers` 是单个客户端进程内的 worker 数量限制。如果一个服务
部署了多个 Pod，每个 Pod 都有自己的 `MaxWorkers`，那么它不能表达“全局最多
同时运行 10 个 wan2.2 任务”这种约束。

本扩展新增 `river.LimitRule`：

- `MaxRunning`：限制已经 claim 且还处于 `running` 状态的任务数。
- `MaxStartsPerPeriod` + `Period`：限制一段时间内启动任务的次数，可表达 RPS
  或启动速率。
- `LimitScopeQueue`：只在当前队列内共享容量。
- `LimitScopeGlobal`：在当前 River schema 的所有队列之间共享容量。

限制发生在 claim 阶段，也就是任务从 `available` 变为 `running` 前。pgxv5
driver 会用 PostgreSQL transaction advisory lock 串行化同一个 limit rule 的
claim 操作，避免多个 Pod 同时看到相同余量而超额 claim。

## 典型配置

例如：

- `wan2.2`：跨 Pod 全局并发 10，RPS 2。
- `wan2.6`：跨 Pod 全局并发 5，RPS 1。
- `kling:image`：跨 Pod 全局并发 100，不限 RPS。
- `kling:video`：跨 Pod 全局并发 20，不限 RPS。

可以把这些资源拆成不同 River queue，并使用 queue scope：

```go
riverClient, err := river.NewClient(riverpgxv5.New(dbPool), &river.Config{
    Queues: map[string]river.QueueConfig{
        "wan2.2":      {MaxWorkers: 100},
        "wan2.6":      {MaxWorkers: 100},
        "kling:image": {MaxWorkers: 200},
        "kling:video": {MaxWorkers: 100},
    },
    LimitRules: []river.LimitRule{
        {
            Key:                "wan2.2",
            Scope:              river.LimitScopeQueue,
            MaxRunning:         10,
            MaxStartsPerPeriod: 2,
            Period:             time.Second,
        },
        {
            Key:                "wan2.6",
            Scope:              river.LimitScopeQueue,
            MaxRunning:         5,
            MaxStartsPerPeriod: 1,
            Period:             time.Second,
        },
        {
            Key:        "kling:image",
            Scope:      river.LimitScopeQueue,
            MaxRunning: 100,
        },
        {
            Key:        "kling:video",
            Scope:      river.LimitScopeQueue,
            MaxRunning: 20,
        },
    },
    Workers: workers,
})
```

插入任务时给 metadata 加上默认 key `limit_key`：

```go
_, err = riverClient.Insert(ctx, GenerateVideoArgs{}, &river.InsertOpts{
    Queue:    "wan2.2",
    Metadata: []byte(`{"limit_key":"wan2.2"}`),
})
```

没有匹配 metadata 的任务不受限制。

## 创建任务和轮询任务分开限流

有些 API 只限制创建任务的 POST 接口，不限制异步轮询接口。此时不要让创建任务
和轮询任务使用同一个 limit key。

例如：

- 创建视频任务：`{"limit_key":"qwen:video:create"}`
- 轮询视频状态：不写 `limit_key`，或写成 `{"limit_key":"qwen:video:poll"}`

然后只对 `qwen:video:create` 配置 RPS / 并发规则。

## River UI

River UI 增加了 `/limits` 页面和 `GET /api/limits` 接口。

页面展示：

- 当前配置的 limit rules。
- 按 limit key + queue 聚合的 `available` / `running` / `recent starts`。
- 手动刷新和自动刷新。

这方便观察某个资源是否已经达到容量上限。

## 当前支持范围

- claim-time enforcement：`riverpgxv5`。
- stats API：`riverpgxv5`。
- sqlite / database/sql driver 当前只保留接口兼容，stats 返回
  `riverdriver.ErrNotImplemented`。

## 发布关系

River UI 当前依赖本 fork 的 River core tag：

`github.com/dianduji-20008/river v0.39.1-limits.0`

这是为了让 River UI 可以独立构建，不再依赖本地 `../river` 路径。
