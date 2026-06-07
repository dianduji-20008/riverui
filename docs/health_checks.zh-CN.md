# 健康检查中文说明

River UI 提供健康检查 API，用于部署平台或负载均衡判断服务是否可用。

## 接口

完整健康检查：

```http
GET /api/health-checks/complete
```

轻量健康检查：

```http
GET /api/health-checks/minimal
```

如果 River UI 使用了路径前缀，例如 `/ui`，则 API 路径也带上前缀：

```http
GET /ui/api/health-checks/complete
```

## complete 与 minimal

`complete` 更适合作为真实可用性检查。它会验证 River UI 关键依赖是否可用。

`minimal` 更适合作为进程存活检查。它的目标是判断 HTTP 服务本身是否还在响应。

## 认证

健康检查接口通常会被认证中间件豁免，方便 Kubernetes、负载均衡或监控系统访
问。

如果你在外层反向代理增加了认证，需要确保健康检查路径仍然能被部署系统访问。

## 与 Limits 页面的关系

Limits 页面依赖 River core 和数据库查询。如果健康检查正常但 Limits 页面无数
据，通常需要检查：

- River core 是否配置了 `LimitRules`。
- jobs 是否写入了对应 metadata。
- 当前使用的 driver 是否支持 `JobLimitStatsList`。
- River UI 是否连接到了同一个数据库/schema。
