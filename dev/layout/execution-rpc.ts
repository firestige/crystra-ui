import type { ExecutionRpc } from "./components/crystra-dsh/tasks/types";
/** Dev-only transport. Production receives ctx.connection.rpc from DSH. */
export const executionRpc: ExecutionRpc = {
  async call(channel, endpoint, payload, signal) {
    if (
      !["/crystra-tasks", "/crystra-workflows"].includes(channel) ||
      !(
        channel === "/crystra-workflows"
          ? ["list", "changes", "settings/read", "settings/save"]
          : ["list", "changes"]
      ).includes(endpoint)
    )
      throw new Error("Unsupported Execution read");
    const rpcId = crypto.randomUUID();
    const response = await fetch(`${channel}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "client-request",
        rpcId,
        method: endpoint,
        payload,
      }),
      signal,
    });
    if (!response.ok) throw new Error(`Execution HTTP ${response.status}`);
    const envelope = await response.json();
    if (
      envelope.type !== "server-response" ||
      envelope.rpcId !== rpcId ||
      !("result" in envelope)
    )
      throw new Error("Invalid Execution RPC response");
    return envelope.result;
  },
};
