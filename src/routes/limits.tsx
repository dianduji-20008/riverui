import TopNavTitleOnly from "@components/TopNavTitleOnly";
import { useRefreshSetting } from "@contexts/RefreshSettings.hook";
import { refreshQueryOptions } from "@contexts/RefreshSettings.query";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { listLimits, listLimitsKey } from "@services/limits";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { useMemo } from "react";

const metadataKey = "limit_key";
const recentSeconds = 60;

export const Route = createFileRoute("/limits")({
  beforeLoad: ({ abortController }) => {
    return {
      queryOptions: {
        queryKey: listLimitsKey({ metadataKey, recentSeconds }),
        queryFn: listLimits,
        signal: abortController.signal,
      },
    };
  },
  loader: async ({ context: { queryClient, queryOptions } }) => {
    await queryClient.ensureQueryData(queryOptions);
  },
  component: LimitsComponent,
});

function LimitsComponent() {
  const { queryOptions } = Route.useRouteContext();
  const refreshSettings = useRefreshSetting();
  const queryOptionsWithRefresh = useMemo(
    () => ({
      ...queryOptions,
      ...refreshQueryOptions(refreshSettings.intervalMs),
    }),
    [queryOptions, refreshSettings.intervalMs],
  );

  const limitsQuery = useQuery(queryOptionsWithRefresh);
  const limitList = limitsQuery.data;
  const rules = limitList?.rules || [];
  const stats = limitList?.stats || [];
  const loading = limitsQuery.isLoading && !limitList;
  const hasError = limitsQuery.isError;

  return (
    <div className="size-full">
      <TopNavTitleOnly title="Limits" />

      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-5 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Claim-time capacity
            </div>
            <div className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
              {limitList?.metadataKey || metadataKey}
            </div>
          </div>
          <button
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            disabled={limitsQuery.isFetching}
            onClick={() => limitsQuery.refetch()}
            title="Refresh limits"
            type="button"
          >
            <ArrowPathIcon
              aria-hidden="true"
              className={clsx("size-5", {
                "motion-safe:animate-spin": limitsQuery.isFetching,
              })}
            />
            <span className="sr-only">Refresh limits</span>
          </button>
        </div>

        {hasError ? (
          <div className="mt-5 border-l-2 border-red-500 py-2 pl-4 text-sm text-red-700 dark:text-red-300">
            Unable to load limits.
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="border-b border-slate-200 py-3 dark:border-slate-800">
            <div className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
              Metadata key
            </div>
            <div className="mt-1 font-mono text-sm text-slate-900 dark:text-slate-100">
              {limitList?.metadataKey || metadataKey}
            </div>
          </div>
          <div className="border-b border-slate-200 py-3 dark:border-slate-800">
            <div className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
              Recent window
            </div>
            <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">
              {limitList?.recentSeconds || recentSeconds}s
            </div>
          </div>
          <div className="border-b border-slate-200 py-3 dark:border-slate-800">
            <div className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
              Observed keys
            </div>
            <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">
              {stats.length}
            </div>
          </div>
        </div>

        <div className="-mx-4 mt-8 sm:-mx-0">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Rules
          </h2>
          {loading ? (
            <div className="py-4 text-sm text-slate-500 dark:text-slate-400">
              Loading...
            </div>
          ) : rules.length === 0 ? (
            <div className="py-4 text-sm text-slate-500 dark:text-slate-400">
              No configured limit rules.
            </div>
          ) : (
            <table className="min-w-full table-fixed divide-y divide-slate-300 dark:divide-slate-700">
              <thead>
                <tr>
                  <th
                    className="py-2.5 pr-3 pl-4 text-left text-sm font-semibold text-slate-900 sm:pl-0 dark:text-slate-100"
                    scope="col"
                  >
                    Key
                  </th>
                  <th
                    className="px-3 py-2.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
                    scope="col"
                  >
                    Scope
                  </th>
                  <th
                    className="px-3 py-2.5 text-right text-sm font-semibold text-slate-900 dark:text-slate-100"
                    scope="col"
                  >
                    Max running
                  </th>
                  <th
                    className="hidden px-3 py-2.5 text-right text-sm font-semibold text-slate-900 sm:table-cell dark:text-slate-100"
                    scope="col"
                  >
                    Start rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                {rules.map((rule) => (
                  <tr key={`${rule.key}:${rule.scope}`}>
                    <td className="w-full max-w-0 py-2 pr-3 pl-4 text-sm font-medium text-slate-700 sm:w-auto sm:max-w-none sm:pl-0 dark:text-slate-300">
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {rule.key}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-500 dark:text-slate-300">
                      {rule.scope}
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-slate-500 dark:text-slate-300">
                      {rule.maxRunning || "unlimited"}
                    </td>
                    <td className="hidden px-3 py-2 text-right text-sm text-slate-500 sm:table-cell dark:text-slate-300">
                      {rule.maxStartsPerPeriod
                        ? `${rule.maxStartsPerPeriod}/${rule.periodSeconds}s`
                        : "unlimited"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="-mx-4 mt-8 sm:-mx-0">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Observed keys
          </h2>
          {loading ? (
            <div className="py-8 text-sm text-slate-500 dark:text-slate-400">
              Loading...
            </div>
          ) : stats.length === 0 ? (
            <div className="py-8 text-sm text-slate-500 dark:text-slate-400">
              No jobs with limit metadata were observed.
            </div>
          ) : (
            <table className="min-w-full table-fixed divide-y divide-slate-300 dark:divide-slate-700">
              <thead>
                <tr>
                  <th
                    className="py-2.5 pr-3 pl-4 text-left text-sm font-semibold text-slate-900 sm:pl-0 dark:text-slate-100"
                    scope="col"
                  >
                    Key
                  </th>
                  <th
                    className="px-3 py-2.5 text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
                    scope="col"
                  >
                    Queue
                  </th>
                  <th
                    className="hidden px-3 py-2.5 text-right text-sm font-semibold text-slate-900 sm:table-cell dark:text-slate-100"
                    scope="col"
                  >
                    Available
                  </th>
                  <th
                    className="px-3 py-2.5 text-right text-sm font-semibold text-slate-900 dark:text-slate-100"
                    scope="col"
                  >
                    Running
                  </th>
                  <th
                    className="hidden px-3 py-2.5 text-right text-sm font-semibold text-slate-900 md:table-cell dark:text-slate-100"
                    scope="col"
                  >
                    Recent starts
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                {stats.map((limit) => (
                  <tr key={`${limit.key}:${limit.queue}`}>
                    <td className="w-full max-w-0 py-2 pr-3 pl-4 text-sm font-medium text-slate-700 sm:w-auto sm:max-w-none sm:pl-0 dark:text-slate-300">
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {limit.key}
                      </span>
                      <dl className="font-normal sm:hidden">
                        <dt className="sr-only">Available</dt>
                        <dd className="mt-1 truncate">
                          {limit.available} available
                        </dd>
                        <dt className="sr-only">Recent starts</dt>
                        <dd className="mt-1 truncate">
                          {limit.recentStarts} recent starts
                        </dd>
                      </dl>
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-500 dark:text-slate-300">
                      <span className="font-mono">{limit.queue}</span>
                    </td>
                    <td className="hidden px-3 py-2 text-right text-sm text-slate-500 sm:table-cell dark:text-slate-300">
                      {limit.available}
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-slate-500 dark:text-slate-300">
                      {limit.running}
                    </td>
                    <td className="hidden px-3 py-2 text-right text-sm text-slate-500 md:table-cell dark:text-slate-300">
                      {limit.recentStarts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
