import type { QueryFunction } from "@tanstack/react-query";

import { API } from "@utils/api";

import type { KeysToCamelCase } from "./types";

export type LimitList = {
  metadataKey: string;
  recentSeconds: number;
  rules: LimitRule[];
  stats: LimitStats[];
};

export type LimitListFromAPI = {
  metadata_key: string;
  recent_seconds: number;
  rules: LimitRuleFromAPI[];
  stats: LimitStatsFromAPI[];
};

export type LimitRule = KeysToCamelCase<LimitRuleFromAPI>;

export type LimitRuleFromAPI = {
  key: string;
  max_running: number;
  max_starts_per_period: number;
  period_seconds: number;
  scope: string;
};

export type LimitStats = KeysToCamelCase<LimitStatsFromAPI>;

export type LimitStatsFromAPI = {
  available: number;
  key: string;
  queue: string;
  recent_starts: number;
  running: number;
};

export const apiLimitStatsToLimitStats = (
  stats: LimitStatsFromAPI,
): LimitStats => ({
  available: stats.available,
  key: stats.key,
  queue: stats.queue,
  recentStarts: stats.recent_starts,
  running: stats.running,
});

export const apiLimitRuleToLimitRule = (
  rule: LimitRuleFromAPI,
): LimitRule => ({
  key: rule.key,
  maxRunning: rule.max_running,
  maxStartsPerPeriod: rule.max_starts_per_period,
  periodSeconds: rule.period_seconds,
  scope: rule.scope,
});

export const apiLimitListToLimitList = (
  response: LimitListFromAPI,
): LimitList => ({
  metadataKey: response.metadata_key,
  recentSeconds: response.recent_seconds,
  rules: response.rules.map(apiLimitRuleToLimitRule),
  stats: response.stats.map(apiLimitStatsToLimitStats),
});

type ListLimitsKey = [
  "listLimits",
  { metadataKey: string; recentSeconds: number },
];

export const listLimitsKey = ({
  metadataKey,
  recentSeconds,
}: {
  metadataKey: string;
  recentSeconds: number;
}): ListLimitsKey => {
  return ["listLimits", { metadataKey, recentSeconds }];
};

export const listLimits: QueryFunction<LimitList, ListLimitsKey> = async ({
  queryKey,
  signal,
}) => {
  const [, params] = queryKey;
  const query = new URLSearchParams({
    metadata_key: params.metadataKey,
    recent_seconds: params.recentSeconds.toString(),
  });

  return API.get<LimitListFromAPI>(
    { path: "/limits", query },
    { signal },
  ).then(apiLimitListToLimitList);
};
