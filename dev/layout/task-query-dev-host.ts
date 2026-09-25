import type { Plugin } from "vite";
import type { IncomingMessage } from "node:http";

async function body(request: IncomingMessage): Promise<string> {
  let text = "";
  for await (const chunk of request) {
    text += chunk;
    if (text.length > 4096) throw new Error("Request too large");
  }
  return text;
}
/** Development host only: reuse the real Execution query and DSH gateway in this
 * process. The browser still sees exactly the same RPC contract as a DSH host.
 */
export function taskQueryDevHost(
  configFile: string | undefined,
  workflowBindings: string,
): Plugin {
  return {
    name: "crystra-task-query-dev-host",
    async configureServer(server) {
      const executionUrl = new URL(
        "../../../wsr-execution/dist/bootstrap/production.js",
        import.meta.url,
      ).href;
      const gatewayUrl = new URL(
        "../../../wsr-dsh/modules/execution/src/host/task-query.js",
        import.meta.url,
      ).href;
      const workflowUrl = new URL(
        "../../../wsr-dsh/modules/studio/src/workflows/gateway.js",
        import.meta.url,
      ).href;
      const { createWorkflowQueryGateway } = await import(
        /* @vite-ignore */ workflowUrl
      );
      const gateways: Record<
        string,
        {
          handle(endpoint: string, payload: unknown): Promise<unknown>;
          close(): Promise<void>;
        }
      > = {
        "crystra-workflows": createWorkflowQueryGateway(workflowBindings),
      };
      if (configFile) {
        const [{ openExecutionTaskQuery }, { createTaskQueryGateway }] =
          await Promise.all([
            import(/* @vite-ignore */ executionUrl),
            import(/* @vite-ignore */ gatewayUrl),
          ]);
        gateways["crystra-tasks"] = createTaskQueryGateway(
          await openExecutionTaskQuery(configFile),
        );
      }
      server.httpServer?.once("close", () => {
        for (const gateway of Object.values(gateways)) void gateway.close();
      });
      server.middlewares.use(async (request, response, next) => {
        const match = request.url?.match(
          /^\/(crystra-tasks|crystra-workflows)\/(list|changes|settings\/read|settings\/save)$/,
        );
        if (!match || !gateways[match[1]]) return next();
        const gateway = gateways[match[1]],
          endpoint = match[2];
        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end();
          return;
        }
        // Match the local host trust boundary; never accept cross-origin browser reads.
        const origin = request.headers.origin;
        if (origin && origin !== `http://${request.headers.host}`) {
          response.statusCode = 403;
          response.end();
          return;
        }
        try {
          const envelope = JSON.parse(await body(request));
          if (
            envelope.type !== "client-request" ||
            typeof envelope.rpcId !== "string" ||
            envelope.method !== endpoint
          )
            throw new Error("Invalid RPC envelope");
          const result = await gateway.handle(endpoint, envelope.payload);
          response.setHeader("Content-Type", "application/json");
          response.setHeader("Cache-Control", "no-store");
          response.end(
            JSON.stringify({
              type: "server-response",
              rpcId: envelope.rpcId,
              result,
            }),
          );
        } catch {
          response.statusCode = 400;
          response.end("Invalid Crystra RPC request");
        }
      });
    },
  };
}
