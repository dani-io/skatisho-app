/**
 * Process-level safety net for dropped client connections.
 *
 * A client or proxy that disappears mid-transfer destroys the underlying socket
 * with ECONNRESET/EPIPE. If that error reaches a stream nobody is listening on,
 * Node raises it as an 'uncaughtException' — a whole-process event caused by one
 * user's flaky connection. The route handlers are the real fix (see
 * app/api/upload and app/api/auth/avatar, which pipeline() their request bodies
 * so the abort is caught where it happens); this is the backstop for the paths
 * that stream bytes OUT, where the erroring stream belongs to Next or the AWS
 * SDK rather than to us.
 *
 * Why a listener is the guard: Node only applies its default behaviour — print
 * and exit(1) — when NO 'uncaughtException' listener is registered. The same
 * goes for 'unhandledRejection', fatal by default since Node 15. Registering
 * here means a socket abort can never take the server down, whatever else is or
 * isn't installed.
 *
 * Next 16 also installs its own non-fatal handlers (server/lib/router-server.js
 * and server/node-environment-extensions/process-error-handlers.js), so today
 * these errors are already logged rather than fatal. That is Next's internal
 * behaviour, not a contract — and `experimental.removeUncaughtErrorAndRejection
 * Listeners` exists to strip those handlers off. This file does not depend on
 * either one.
 *
 * Deliberately NOT done here: exiting on non-socket errors. Next chose to keep
 * the process alive for those, and re-adding a crash would be a behaviour change
 * dressed up as a fix. Anything that is not a socket abort is left untouched for
 * Next's handler to log.
 */

const SOCKET_ABORT_CODES = new Set([
  "ECONNRESET",
  "ECONNABORTED",
  "EPIPE",
  "ERR_STREAM_PREMATURE_CLOSE",
]);

function isSocketAbort(err: unknown): boolean {
  const { code, name } = (err ?? {}) as { code?: string; name?: string };
  return (code !== undefined && SOCKET_ABORT_CODES.has(code)) || name === "AbortError";
}

export function register() {
  // register() also runs for the edge runtime, which has no `process` events.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const flag = "__skatishoSocketAbortGuard";
  const g = globalThis as typeof globalThis & Record<string, boolean>;
  if (g[flag]) return;
  g[flag] = true;

  const ignore = (event: "uncaughtException" | "unhandledRejection") => {
    return (err: unknown) => {
      if (isSocketAbort(err)) {
        const { code } = (err ?? {}) as { code?: string };
        console.warn(`[net] ${event} from a dropped connection ignored (${code})`);
        return;
      }
      // Not ours. Normally Next's handler logs it and we stay quiet — but our
      // mere presence is what stops Node from printing it, so if we turn out to
      // be the only listener, staying quiet would swallow a real error in
      // silence. Checked at emit time, so it tracks whoever is actually there.
      if (process.listenerCount(event) === 1) console.error(err);
    };
  };

  process.on("uncaughtException", ignore("uncaughtException"));
  process.on("unhandledRejection", ignore("unhandledRejection"));
}
