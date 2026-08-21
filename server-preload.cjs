/**
 * Raise Node's per-request timeout for the standalone Next server.
 *
 * Loaded via `node --require ./server-preload.cjs server.js` (see Dockerfile
 * CMD). It cannot live anywhere later in the boot sequence, for two reasons
 * that were both verified empirically on node:22-slim:
 *
 *   1. Node samples `requestTimeout` ONLY at http.createServer() time. Writing
 *      `server.requestTimeout = ...` after construction updates the property
 *      but the connection-expiry checker keeps enforcing the constructor-time
 *      value — before OR after listen(). It must be a createServer option.
 *   2. Next's start-server.js creates and listens the server before it
 *      initializes request handlers ("setup server listener as fast as
 *      possible"), which is also before instrumentation.ts register() runs.
 *      By the time any app code executes, the server already exists.
 *
 * Why 900s: Node's default of 300s was resetting course-video uploads at
 * almost exactly the 5-minute mark (the enforcement sweep runs every 30s, so
 * deaths land in the 300–330s window — production logs showed 308s and 310s).
 * nginx already bounds the upload routes with client_body_timeout /
 * proxy_read_timeout 600s, so 900s keeps nginx as the single real ceiling
 * while still bounding a truly stuck connection at the Node layer. Slowloris
 * protection stays at the edge: nothing reaches this server except nginx.
 *
 * This file must not register process-level handlers — the socket-abort guard
 * in src/instrumentation.ts owns uncaughtException/unhandledRejection.
 */

const http = require("node:http");

const REQUEST_TIMEOUT_MS = 900_000; // 15 min; must stay above nginx's 600s

const originalCreateServer = http.createServer;

http.createServer = function createServer(options, requestListener) {
  // Signatures: (), (listener), (options), (options, listener)
  if (typeof options === "function") {
    requestListener = options;
    options = {};
  }
  options = { requestTimeout: REQUEST_TIMEOUT_MS, ...options };
  return originalCreateServer.call(this, options, requestListener);
};
