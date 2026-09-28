import { test } from "vitest";
import assert from "node:assert/strict";
import { createPagedQuery, projectRows } from "./paged-query";
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};
const resolver = {
  resolve: (wire) => ({ rows: wire.values, next: wire.cursor }),
};

test("shared load deduplicates requests and reuses cached data; local operations do not fetch", async () => {
  let calls = 0;
  const pending = deferred();
  const resource = createPagedQuery({
    read: () => {
      calls++;
      return pending.promise;
    },
    resolver,
  });
  const a = resource.actions.load();
  const b = resource.actions.load();
  assert.equal(a, b);
  await Promise.resolve();
  assert.equal(calls, 1);
  pending.resolve({ values: [3, 1, 2], cursor: null });
  await a;
  await resource.actions.load();
  const rows = resource.getSnapshot().rows;
  assert.deepEqual(
    projectRows(rows, {
      filter: (x) => x > 1,
      sort: (a, b) => a - b,
      offset: 0,
      limit: 1,
    }),
    [2],
  );
  assert.equal(
    projectRows(rows, { filter: (x) => x > 1 }, (xs) =>
      xs.reduce((a, b) => a + b, 0),
    ),
    5,
  );
  assert.deepEqual(rows, [3, 1, 2]);
  assert.equal(calls, 1);
  assert.equal(resource.getSnapshot().hasMore, false);
});
test("opaque continuation accumulates pages, deduplicates concurrent next and stops at end", async () => {
  const calls = [];
  const resource = createPagedQuery({
    resolver,
    read: async ({ continuation }) => {
      calls.push(continuation);
      return continuation === undefined
        ? { values: [1], cursor: { token: "next", snapshot: "s" } }
        : { values: [2], cursor: null };
    },
  });
  await resource.actions.load();
  const a = resource.actions.loadMore();
  const b = resource.actions.loadMore();
  assert.equal(a, b);
  await a;
  assert.deepEqual(calls, [undefined, { token: "next", snapshot: "s" }]);
  assert.deepEqual(resource.getSnapshot().rows, [1, 2]);
  await resource.actions.loadMore();
  assert.equal(calls.length, 2);
});
test("failed next page preserves rows and continuation for explicit retry", async () => {
  let fail = true;
  const resource = createPagedQuery({
    resolver,
    read: async ({ continuation }) => {
      if (continuation !== undefined && fail) throw Error("offline");
      return continuation === undefined
        ? { values: [1], cursor: "next" }
        : { values: [2], cursor: null };
    },
  });
  await resource.actions.load();
  await resource.actions.loadMore();
  assert.deepEqual(resource.getSnapshot().rows, [1]);
  assert.equal(resource.getSnapshot().error.message, "offline");
  fail = false;
  await resource.actions.loadMore();
  assert.deepEqual(resource.getSnapshot().rows, [1, 2]);
});
test("refresh aborts and ignores stale pages, then replaces rather than appends", async () => {
  const old = deferred();
  let count = 0,
    signal;
  const resource = createPagedQuery({
    resolver,
    read: (args) => {
      if (++count === 1)
        return Promise.resolve({ values: [1], cursor: "next" });
      if (count === 2) {
        signal = args.signal;
        return old.promise;
      }
      return Promise.resolve({ values: [9], cursor: null });
    },
  });
  await resource.actions.load();
  const stale = resource.actions.loadMore();
  await Promise.resolve();
  await resource.actions.refresh();
  assert.equal(signal.aborted, true);
  old.resolve({ values: [2], cursor: null });
  await stale;
  assert.deepEqual(resource.getSnapshot().rows, [9]);
});
test("failed refresh keeps display data but cannot append the old snapshot; load retries from start", async () => {
  let count = 0;
  const calls = [];
  const resource = createPagedQuery({
    resolver,
    read: async ({ continuation }) => {
      calls.push(continuation);
      if (++count === 2) throw Error("offline");
      return { values: [count], cursor: "next" };
    },
  });
  await resource.actions.load();
  await resource.actions.refresh();
  assert.deepEqual(resource.getSnapshot().rows, [1]);
  await resource.actions.loadMore();
  assert.equal(calls.length, 2);
  await resource.actions.load();
  assert.deepEqual(resource.getSnapshot().rows, [3]);
  assert.deepEqual(calls, [undefined, undefined, undefined]);
});
test("resolver failure is a query error; dispose prevents late publication and further requests", async () => {
  const r = createPagedQuery({
    resolver: {
      resolve() {
        throw Error("invalid contract");
      },
    },
    read: async () => ({}),
  });
  await r.actions.load();
  assert.equal(r.getSnapshot().error.message, "invalid contract");
  const pending = deferred();
  let calls = 0,
    notified = 0;
  const resource = createPagedQuery({
    resolver,
    read: () => {
      calls++;
      return pending.promise;
    },
  });
  resource.subscribe(() => notified++);
  const job = resource.actions.load();
  await Promise.resolve();
  resource.dispose();
  const before = notified;
  pending.resolve({ values: [1], cursor: null });
  await job;
  await resource.actions.refresh();
  assert.equal(notified, before);
  assert.equal(calls, 1);
  assert.deepEqual(resource.getSnapshot().rows, []);
});
test("unsubscribing a consumer preserves shared cache; a new scope uses an isolated resource", async () => {
  let calls = 0;
  const adapter = {
    resolver,
    read: async () => {
      calls++;
      return { values: [calls], cursor: null };
    },
  };
  const one = createPagedQuery(adapter);
  const stop = one.subscribe(() => {});
  await one.actions.load();
  stop();
  await one.actions.load();
  assert.equal(calls, 1);
  const two = createPagedQuery(adapter);
  await two.actions.load();
  assert.deepEqual(one.getSnapshot().rows, [1]);
  assert.deepEqual(two.getSnapshot().rows, [2]);
});
test("local paging rejects invalid bounds and preserves typed projection results", () => {
  assert.throws(() => projectRows([1], { offset: -1 }), RangeError);
  assert.throws(() => projectRows([1], { limit: NaN }), RangeError);
  assert.deepEqual(projectRows([1, 2], { limit: 0 }), []);
  assert.deepEqual(
    projectRows([1, 2, 3], {}, (rows) => ({ count: rows.length })),
    { count: 3 },
  );
});

test("metadata merge is atomic with rows; failed snapshot check retains cursor for retry", async () => {
  let nextSnapshot = "other";
  const seen = [];
  const query = createPagedQuery({
    read: async ({ continuation }) => {
      seen.push(continuation);
      return continuation === undefined
        ? { rows: [1], next: "n", meta: "s" }
        : { rows: [2], next: null, meta: nextSnapshot };
    },
    resolver: { resolve: (wire) => wire },
    mergeMeta: (previous, next) => {
      if (previous !== next) throw Error("snapshot drift");
      return next;
    },
  });
  await query.actions.load();
  await query.actions.loadMore();
  assert.deepEqual(query.getSnapshot().rows, [1]);
  assert.equal(query.getSnapshot().meta, "s");
  nextSnapshot = "s";
  await query.actions.loadMore();
  assert.deepEqual(query.getSnapshot().rows, [1, 2]);
  assert.deepEqual(seen, [undefined, "n", "n"]);
});
