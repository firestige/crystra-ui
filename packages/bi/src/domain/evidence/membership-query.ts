import { createPagedQuery } from "../../support/data/paged-query";
import { QueryError } from "../../support/data/query-error";
import { bytewiseCompare, closed, record } from "./validation";
import { validTaskProvenance, type TaskListItem } from "./task-client";

export interface TaskMembership {
  task_id: string;
  delivery_id: string;
  manifest_digest: string;
  recorded_at: string;
  provenance: TaskListItem["provenance"];
}
export interface MembershipMetadata {
  contract: { name: "evidence.query"; revision: "1.0.0" };
  observation_profile: "2.0.0";
  read_model_revision: "2.0.0";
  snapshot: string;
}
export interface MembershipTransport {
  request(
    endpoint: "tasks/membership",
    payload: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<unknown>;
}
function normalizedUtc(value: unknown) {
  if (typeof value !== "string") return undefined;
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?Z$/.exec(
    value,
  );
  if (!match || !Number.isFinite(Date.parse(value))) return undefined;
  if (new Date(Date.parse(value)).toISOString().slice(0, 19) !== match[1])
    return undefined;
  return `${match[1]}.${(match[2] ?? "").padEnd(6, "0")}Z`;
}
function text(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
/** Reuses the published/candidate membership route; as_of is an acceptance cutoff, NOT execution time. */
export function createTaskMembershipQuery(
  transport: MembershipTransport,
  selection: { task_id: string; as_of: string; limit?: number },
) {
  const task_id = selection.task_id,
    as_of = normalizedUtc(selection.as_of),
    limit = selection.limit ?? 200;
  if (
    typeof task_id !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,127}$/.test(task_id) ||
    !as_of ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 200
  )
    throw new QueryError(
      "INVALID_FILTER",
      "需要精确 Task 与有效 as_of 截止时间",
    );
  return createPagedQuery<unknown, TaskMembership, string, MembershipMetadata>({
    read: ({ signal, continuation }) =>
      transport.request(
        "tasks/membership",
        {
          task_id,
          as_of,
          limit,
          ...(continuation === undefined ? {} : { cursor: continuation }),
        },
        signal,
      ),
    resolver: {
      resolve(wire) {
        const fail = () =>
          new QueryError(
            "INCOMPATIBLE",
            "Task 成员响应不符合既有契约或请求范围",
          );
        if (
          !record(wire) ||
          !closed(wire, [
            "contract",
            "observation_profile",
            "read_model_revision",
            "snapshot",
            "items",
            "next_cursor",
          ]) ||
          !record(wire.contract) ||
          !closed(wire.contract, ["name", "revision"]) ||
          wire.contract.name !== "evidence.query" ||
          wire.contract.revision !== "1.0.0" ||
          wire.observation_profile !== "2.0.0" ||
          wire.read_model_revision !== "2.0.0" ||
          !text(wire.snapshot) ||
          !Array.isArray(wire.items) ||
          wire.items.length > limit ||
          !(wire.next_cursor === null || text(wire.next_cursor))
        )
          throw fail();
        const rows: TaskMembership[] = [];
        for (const item of wire.items) {
          if (
            !record(item) ||
            !closed(item, [
              "task_id",
              "delivery_id",
              "manifest_digest",
              "recorded_at",
              "provenance",
            ]) ||
            item.task_id !== task_id ||
            !text(item.delivery_id) ||
            item.delivery_id.length > 256 ||
            !text(item.manifest_digest) ||
            !/^[a-f0-9]{64}$/.test(item.manifest_digest) ||
            !text(item.recorded_at) ||
            normalizedUtc(item.recorded_at) !== item.recorded_at ||
            item.recorded_at > as_of ||
            !validTaskProvenance(item.provenance)
          )
            throw fail();
          const previous = rows.at(-1);
          if (
            previous &&
            bytewiseCompare(previous.delivery_id, item.delivery_id) >= 0
          )
            throw fail();
          rows.push({
            task_id,
            delivery_id: item.delivery_id,
            manifest_digest: item.manifest_digest,
            recorded_at: item.recorded_at,
            provenance: item.provenance,
          });
        }
        return {
          rows,
          next: wire.next_cursor,
          meta: {
            contract: {
              name: "evidence.query" as const,
              revision: "1.0.0" as const,
            },
            observation_profile: "2.0.0" as const,
            read_model_revision: "2.0.0" as const,
            snapshot: wire.snapshot,
          },
        };
      },
    },
    mergeMeta(previous, next) {
      if (previous?.snapshot !== next?.snapshot)
        throw new QueryError("SNAPSHOT_CHANGED", "成员查询快照变化，请刷新");
      return next;
    },
  });
}
